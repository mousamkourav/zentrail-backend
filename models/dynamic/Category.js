const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      // unique: true,
      trim: true,
      lowercase: true,
    },
    bannertitle: { type: String, trim : true },
    uid: {
      type: String,
      unique: true,
      required: true,
    },
    isblog: {
      type: Boolean,
      default: false,
      // required: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    metaTitle: {
      type: String,
      default: "",
      trim: true,
    },
    metaDescription: {
      type: String,
      default: "",
      trim: true,
    },
    metaKeyword: {
      type: String,
    },
    image: {
      type: String,
      default: "",
      trim: true,
    },
    imageAlt: {
      type: String,
    },
    faq: [
      {
        question: { type: String },
        answer: { type: String },
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = categorySchema;
