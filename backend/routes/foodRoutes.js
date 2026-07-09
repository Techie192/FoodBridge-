const express = require("express");
const router = express.Router();
const Food = require("../models/Food");
const auth = require("../middleware/authMiddleware");
const roleCheck = require("../middleware/roleCheck");

/*
  📌 Roles used:
  - restaurant
  - ngo
  - compost
*/

// ===================================================
// 🍱 RESTAURANT: Donate food
// POST /api/food
// ===================================================
router.post("/", auth, roleCheck("restaurant"), async (req, res) => {
  try {
    const { foodName, quantity, location, gst, condition } = req.body;

    // 🔹 Minimum quantity check (jury requirement)
    if (quantity < 3) {
      return res.status(400).json({ message: "Minimum quantity should be 3 🍱" });
    }

    const food = new Food({
      foodName,
      quantity,
      location,
      gstNumber: gst, // 🧾 Save GST number from request
      condition: condition || "edible", // Default to edible if missing
      donor: req.user.id, // restaurant id
      status: "available"
    });

    await food.save();

    // 📡 Socket.io emissions for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('foodAdded');
      io.emit('newDonation', food);
    }

    res.status(201).json({ message: "Food donated successfully ✅", food });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===================================================
// 🍱 RESTAURANT: View MY donations
// GET /api/food/my-donations
// ===================================================
router.get("/my-donations", auth, roleCheck(["restaurant"]), async (req, res) => {
  try {
    const foods = await Food.find({ donor: req.user.id }).sort({ createdAt: -1 });
    res.json(foods);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===================================================
// 🏢 GENERAL/ADMIN/NGO: View all available NGO-edible food donations
// GET /api/food/ngo
// ===================================================
router.get("/ngo", auth, roleCheck(["ngo", "admin"]), async (req, res) => {
  try {
    const foods = await Food.find({
      condition: { $in: ["cooked", "raw", "packaged", "edible"] }
    }).populate("donor", "name").sort({ createdAt: -1 });
    res.json(foods);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===================================================
// 🏢 GENERAL/ADMIN/COMPOST: View all available compost/non-edible food donations
// GET /api/food/compost
// ===================================================
router.get("/compost", auth, roleCheck(["compost", "admin"]), async (req, res) => {
  try {
    const foods = await Food.find({
      condition: { $in: ["compost", "feed", "non-edible"] }
    }).populate("donor", "name").sort({ createdAt: -1 });
    res.json(foods);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===================================================
// 🏢 NGO: View available food by location
// GET /api/food/ngo/:location
// ===================================================
router.get("/ngo/:location", auth, roleCheck("ngo"), async (req, res) => {
  try {
    const { location } = req.params;
    let query = { status: "available" };

    // 🌍 If location is NOT 'all', filter by it, otherwise return all available food
    if (location && location !== "all") {
      query.location = { $regex: new RegExp(location, "i") }; // Case-insensitive partial match
    }

    const foods = await Food.find(query).populate("donor", "name");
    res.json(foods);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===================================================
// 🤝 NGO: Accept / Claim food
// PUT /api/food/claim/:id
// ===================================================
router.put("/claim/:id", auth, roleCheck("ngo"), async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) return res.status(404).json({ message: "Food not found ❌" });
    if (food.status !== "available") return res.status(400).json({ message: "Food already claimed ⚠️" });

    // 🔹 Jury addition: government tracking + claimedBy
    food.status = "claimed";
    food.claimedBy = "ngo";
    food.governmentLog = "Tracked by admin";
    await food.save();

    // 📡 Socket.io emissions for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('foodUpdated', food);
    }

    res.json({ success: true, message: "Food accepted successfully 🤝" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===================================================
// ♻️ COMPOST: Collect claimed food
// PUT /api/food/collect/:id
// ===================================================
router.put("/collect/:id", auth, roleCheck("compost"), async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) return res.status(404).json({ message: "Food not found ❌" });
    if (food.status !== "claimed") return res.status(400).json({ message: "Food not ready for compost ⚠️" });

    food.status = "collected";
    await food.save();

    // 📡 Socket.io emissions for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('foodUpdated', food);
    }

    res.json({ message: "Food sent to compost successfully ♻️" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===================================================
// 🗑️ ADMIN: Delete a donation
// DELETE /api/food/:id
// ===================================================
router.delete("/:id", auth, roleCheck("admin"), async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ message: "Donation not found ❌" });
    }
    await Food.findByIdAndDelete(req.params.id);

    // 📡 Emit update to real-time clients
    const io = req.app.get('io');
    if (io) {
      io.emit('foodUpdated');
    }

    res.json({ message: "Donation deleted successfully ✅" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===================================================
// 📤 EXPORT ROUTER
// ===================================================
module.exports = router;
