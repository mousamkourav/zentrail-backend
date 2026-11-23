const mongoose = require("mongoose");

const Service = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },

    image: {
      url: { type: String, default: "", trim: true },
      altText: { type: String, default: "", trim: true },
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Service;
