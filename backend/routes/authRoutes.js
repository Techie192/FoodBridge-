const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const User = require("../models/User");

const router = express.Router();

/* =========================
   📝 REGISTER
   ========================= */
router.post("/register", [
  check("name", "Name is required").not().isEmpty(),
  check("email", "Please include a valid email").isEmail(),
  check("password", "Please enter a password with 6 or more characters").isLength({ min: 6 })
], async (req, res) => {
  // 🔹 Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, password, role, gstNumber, adminSecret } = req.body;

    // 🛡️ SECURITY: Prevent unauthorized admin creation
    if (role === "admin") {
      // Check for a secret key (in a real app, use an env variable)
      const ADMIN_SECRET = process.env.ADMIN_SECRET || "secureAdminKey123";
      if (adminSecret !== ADMIN_SECRET) {
        return res.status(403).json({ message: "Unauthorized to create admin account 🚫" });
      }
    }

    // 🔹 Check existing user
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists ❌" });

    // 🔹 Create user
    await User.create({
      name,
      email,
      password,
      role: role || "user", // Default to user if role is missing
      gstNumber: role === "restaurant" ? gstNumber : undefined,
      isVerified: role === "admin" ? true : false // Auto-verify admin if secret is correct
    });

    res.status(201).json({
      message: "Registered successfully ✅"
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

    // 1️⃣ Check user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials ❌" });

    // 2️⃣ Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials ❌" });

    // 🔹 Admin verification check (DISABLED for demo)
    // if (!user.verified && user.role !== "admin") {
    //   return res.status(403).json({ message: "Account not verified by admin ⚠️" });
    // }

    // 3️⃣ Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, role: user.role, message: "Login successful ✅" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
