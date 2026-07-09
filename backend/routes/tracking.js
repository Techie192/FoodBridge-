// 📦 Imports
const express = require('express');
const router = express.Router();
const Tracking = require('../models/Tracking');

/* =========================
   📍 GET ALL ACTIVE DELIVERIES
   ========================= */
router.get('/active', async (req, res) => {
    try {
        const activeDeliveries = await Tracking.find({
            status: { $in: ['picked_up', 'in_transit'] }
        })
            .populate('driverId', 'name email')
            .populate('deliveryId')
            .sort({ updatedAt: -1 });

        res.json(activeDeliveries);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   🔍 GET SPECIFIC DELIVERY TRACKING
   ========================= */
router.get('/:id', async (req, res) => {
    try {
        const tracking = await Tracking.findById(req.params.id)
            .populate('driverId', 'name email')
            .populate('deliveryId');

        if (!tracking) {
            return res.status(404).json({ message: 'Tracking not found' });
        }

        res.json(tracking);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   📲 UPDATE DELIVERY LOCATION
   ========================= */
router.post('/update', async (req, res) => {
    try {
        const { trackingId, lat, lng, speed, heading } = req.body;

        const tracking = await Tracking.findById(trackingId);

        if (!tracking) {
            return res.status(404).json({ message: 'Tracking not found' });
        }

        // Update current location
        tracking.currentLocation = {
            lat,
            lng,
            timestamp: new Date()
        };

        // Add to route history
        tracking.routeHistory.push({
            lat,
            lng,
            timestamp: new Date(),
            speed: speed || 0,
            heading: heading || 0
        });

        // Calculate distance remaining
        if (tracking.deliveryLocation) {
            const distance = calculateDistance(
                lat, lng,
                tracking.deliveryLocation.lat,
                tracking.deliveryLocation.lng
            );
            tracking.distanceRemaining = distance;

            // Update ETA (assuming average speed of 30 km/h)
            const avgSpeed = 30;
            const hoursRemaining = distance / avgSpeed;
            tracking.estimatedArrival = new Date(Date.now() + hoursRemaining * 60 * 60 * 1000);
        }

        await tracking.save();

        // Emit Socket.io event (handled in server.js)
        if (req.app.get('io')) {
            req.app.get('io').emit('location:update', {
                trackingId: tracking._id,
                location: tracking.currentLocation,
                status: tracking.status,
                distanceRemaining: tracking.distanceRemaining,
                estimatedArrival: tracking.estimatedArrival
            });
        }

        res.json({ message: 'Location updated', tracking });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   📜 GET DELIVERY HISTORY
   ========================= */
router.get('/history/all', async (req, res) => {
    try {
        const history = await Tracking.find({
            status: { $in: ['delivered', 'cancelled'] }
        })
            .populate('driverId', 'name email')
            .populate('deliveryId')
            .sort({ deliveryTime: -1 })
            .limit(50);

        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   🆕 CREATE NEW TRACKING
   ========================= */
router.post('/create', async (req, res) => {
    try {
        const {
            deliveryId,
            vehicleId,
            pickupLocation,
            deliveryLocation
        } = req.body;

        // Calculate total distance
        const totalDistance = calculateDistance(
            pickupLocation.lat, pickupLocation.lng,
            deliveryLocation.lat, deliveryLocation.lng
        );

        const tracking = await Tracking.create({
            deliveryId,
            vehicleId,
            driverId: new require('mongoose').Types.ObjectId(),
            currentLocation: {
                lat: pickupLocation.lat,
                lng: pickupLocation.lng
            },
            pickupLocation,
            deliveryLocation,
            totalDistance,
            distanceRemaining: totalDistance,
            status: 'pending'
        });

        res.status(201).json({ message: 'Tracking created', tracking });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   🔧 HELPER: Calculate Distance
   ========================= */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

module.exports = router;
