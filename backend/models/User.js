// 📦 Import required packages
const mongoose = require('mongoose');  // 🍃 MongoDB object modeling
const bcrypt = require('bcryptjs');    // 🔒 Password hashing library

// 👤 User Schema Definition
const userSchema = new mongoose.Schema({

  // 📝 User's full name
  name: {
    type: String,
    required: [true, 'Name is required'],  // ✅ This field is mandatory
    trim: true  // ✂️ Remove whitespace from both ends
  },

  // 📧 User's email address
  email: {
    type: String,
    required: [true, 'Email is required'],  // ✅ This field is mandatory
    unique: true,  // 🔑 Must be unique across all users
    lowercase: true,  // 🔡 Convert to lowercase automatically
    trim: true,  // ✂️ Remove whitespace
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,  // 🎯 Regex pattern for email validation
      'Please enter a valid email'  // ❌ Error message if pattern doesn't match
    ]
  },

  // 🔐 User's password (will be hashed before saving)
  password: {
    type: String,
    required: [true, 'Password is required'],  // ✅ This field is mandatory
    minlength: 6  // 🔢 Minimum 6 characters required
  },

  // 🎭 User's role in the system
  role: {
    type: String,
    enum: ['restaurant', 'ngo', 'compost', 'admin'],  // 🎯 Only these 4 values are allowed
    required: [true, 'Role is required']  // ✅ This field is mandatory
  },

  // 🏢 GST Number (OPTIONAL: Collected during donation)
  gstNumber: {
    type: String,
    // Validation removed to allow simplified signup
  },

  // ✅ Account verification status (Auto-verified for demo)
  verified: {
    type: Boolean,
    default: true  // ✅ Auto-verify all users for smoother testing
  },

  // 📅 Account creation timestamp
  createdAt: {
    type: Date,
    default: Date.now  // ⏰ Automatically set to current time when user is created
  }
});

// 🔒 MIDDLEWARE: Hash password before saving to database
userSchema.pre('save', async function (next) {
  // 🛑 Skip hashing if password hasn't been modified
  if (!this.isModified('password')) return next();

  try {
    // 🧂 Generate salt (random data for hashing)
    const salt = await bcrypt.genSalt(10);  // 🔢 Salt rounds = 10 (higher = more secure but slower)

    // 🔐 Hash the password with the salt
    this.password = await bcrypt.hash(this.password, salt);

    // ✅ Continue with save operation
    next();
  } catch (error) {
    // ❌ Pass error to next middleware
    next(error);
  }
});

// 🔍 METHOD: Compare entered password with hashed password in database
userSchema.methods.comparePassword = async function (candidatePassword) {
  // 🔐 Returns true if passwords match, false otherwise
  return await bcrypt.compare(candidatePassword, this.password);
};

// 📤 Export the User model
module.exports = mongoose.model('User', userSchema);

// 📚 USAGE EXAMPLES:
// ==================
// 
// 1️⃣ CREATE NEW USER:
// const user = new User({
//   name: "John Doe",
//   email: "john@example.com",
//   password: "password123",  // 🔒 Will be automatically hashed
//   role: "restaurant",
//   gstNumber: "12ABCDE3456F1Z5"
// });
// await user.save();
//
// 2️⃣ LOGIN / VERIFY PASSWORD:
// const user = await User.findOne({ email: "john@example.com" });
// const isMatch = await user.comparePassword("password123");  // ✅ true or ❌ false
//
// 3️⃣ FIND VERIFIED RESTAURANTS:
// const restaurants = await User.find({ role: "restaurant", verified: true });