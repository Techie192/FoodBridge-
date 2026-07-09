// 📦 Import mongoose for schema & model creation
const mongoose = require("mongoose");

// 🍱 Food Schema
// This file should ONLY define data structure (NO middleware, NO auth)
const foodSchema = new mongoose.Schema(
  {
    // 🍽️ Name of the food item
    foodName: {
      type: String,
      required: true
    },

    // 🔢 Quantity of food packets
    quantity: {
      type: Number,
      required: true
    },

    // 🧾 GST Number (for restaurants)
    gstNumber: {
      type: String
    },

    // 📍 Location where food is available
    location: {
      type: String,
      required: true
    },

    // 🏪 Donor (restaurant user ID)
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // 🔗 Reference to User model
      required: true
    },

    // 🔄 Current status of food
    status: {
      type: String,
      enum: ["available", "claimed", "collected"], // ✅ allowed states
      default: "available"
    },

    // 🍎 Food Condition (Expanded)
    condition: {
      type: String,
      enum: ["cooked", "raw", "packaged", "compost", "feed", "edible", "non-edible"], // Added legacy support
      default: "cooked"
    },

    // 🤝 Who claimed the food (NGO / compost)
    claimedBy: {
      type: String
    },

    // 🏛️ Government tracking log (jury feature)
    governmentLog: {
      type: String
    }
  },
  {
    // ⏱️ Automatically adds createdAt & updatedAt
    timestamps: true
  }
);

// 📤 Export Food model
module.exports = mongoose.model("Food", foodSchema);
