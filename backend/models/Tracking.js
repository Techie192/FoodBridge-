// 📦 Import required packages
const mongoose = require('mongoose');

// 🚚 Tracking Schema Definition
const trackingSchema = new mongoose.Schema({

    // 🆔 Delivery ID (reference to food donation)
    deliveryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Food',
        required: true
    },

    // 🚗 Vehicle identifier
    vehicleId: {
        type: String,
        required: true,
        trim: true
    },

    // 👤 Driver information
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // 📍 Current location (real-time GPS)
    currentLocation: {
        lat: {
            type: Number,
            required: true
        },
        lng: {
            type: Number,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    },

    // 🏪 Pickup location (restaurant)
    pickupLocation: {
        lat: Number,
        lng: Number,
        address: String,
        name: String
    },

    // 🎯 Delivery location (NGO/Compost)
    deliveryLocation: {
        lat: Number,
        lng: Number,
        address: String,
        name: String
    },

    // 📊 Delivery status
    status: {
        type: String,
        enum: ['pending', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
        default: 'pending'
    },

    // ⏱️ Estimated arrival time
    estimatedArrival: {
        type: Date
    },

    // 📏 Distance information
    totalDistance: {
        type: Number, // in kilometers
        default: 0
    },

    distanceRemaining: {
        type: Number, // in kilometers
        default: 0
    },

    // 🗺️ Route history (breadcrumb trail)
    routeHistory: [{
        lat: Number,
        lng: Number,
        timestamp: {
            type: Date,
            default: Date.now
        },
        speed: Number, // km/h
        heading: Number // degrees
    }],

    // ⏰ Timestamps
    pickupTime: {
        type: Date
    },

    deliveryTime: {
        type: Date
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// 🔄 Update timestamp on save
trackingSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// 📤 Export the Tracking model
module.exports = mongoose.model('Tracking', trackingSchema);
