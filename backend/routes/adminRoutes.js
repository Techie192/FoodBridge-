const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");
const roleCheck = require("../middleware/roleCheck");

/*
  🔐 Verify user (admin only)
  PUT /api/admin/verify/:id
  - Only accessible by ADMIN role
*/
router.put("/verify/:id", auth, roleCheck(["admin"]), async (req, res) => {
  try {
    // 1️⃣ Find user by ID
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found ❌" });
    }

    // 2️⃣ Update verification flag
    user.isVerified = true;
    await user.save();

    // 3️⃣ Send response
    res.json({
      message: "User verified ✅",
      userId: user._id,
      role: user.role
    });

  } catch (err) {
    res.status(500).json({
      message: "Verification failed ⚠️",
      error: err.message
    });
  }
});

/*
  👥 List all users (admin only)
  GET /api/admin/users
*/
router.get("/users", auth, roleCheck(["admin"]), async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/*
  🗑️ Delete user (admin only)
  DELETE /api/admin/users/:id
*/
router.delete("/users/:id", auth, roleCheck(["admin"]), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found ❌" });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully ✅" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
