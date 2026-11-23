const mongoose = require("mongoose");
const { Schema } = mongoose;

const inquirySchema = new Schema(
  {

    fullName: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
      // unique: true, 
      index: true,
    },
    phoneNo: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      enum: ["meta", "google", "website", "whatsapp", "manual"],
      default: "website",
    },
    campaign: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["New", "Contacted", "In Progress", "Converted", "Lost"],
      default: "New",
    },

    tag: {
      type: String,
      enum: ["Hot", "Interested", "Irrelevant", "Converted", "Follow-up"],
      default: "Interested",
    },

    remarks: {
      type: String,
      trim: true,
    },
    assigned_to: {
      type: String,
      trim: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    message: {
      type: String,
      trim: true,
    },

    extraFields: {
      type: Map,
      of: Schema.Types.Mixed,
    },

    sourcePage: {
      type: String,
      trim: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

module.exports = inquirySchema
