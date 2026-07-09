// controllers/authController.js
// 📦 Imports
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

/* =========================
   📝 REGISTER
   ========================= */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, gstNumber } = req.body;

    // 🔒 Block fake / invalid emails
    if (!email || !email.includes("@")) {
      return res.status(400).json({ message: "Invalid email ❌" });
    }

    // 2️⃣ Check existing user
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists ❌" });
    }

    // 🧾 GST validation REMOVED to allow simplified signup
    // GST will be collected during food donation instead

    // 🔐 Hash password
    const hashed = await bcrypt.hash(password, 10);

    // 👤 Create user
    await User.create({
      name,
      email,
      password: hashed,
      role,
      gstNumber: role === "restaurant" ? gstNumber : undefined,
      verified: role === "admin" ? true : false // admin auto-verified
    });

    res.status(201).json({
      message: "Registered successfully ✅ (await admin verification if required)"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   🔐 LOGIN
   ========================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials ❌" });
    }

    // 2️⃣ Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials ❌" });
    }

    // 🔒 Admin verification check (non-admins must be verified)
    if (user.role !== "admin" && !user.verified) {
      return res
        .status(403)
        .json({ message: "Account not verified by admin ⚠️" });
    }

    // 3️⃣ Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 4️⃣ Send response
    res.json({
      token,
      role: user.role,
      message: "Login successful ✅"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
