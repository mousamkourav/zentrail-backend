const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
});

const subCategorySchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    uid: {
      type: String,
      unique: true,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    bannertitle : {type: String, trim : true},
    description: {
      type: String,
    },
    imageAlt: {
      type: String,
    },
    image: {
      type: String,
    },
    faq: [faqSchema],
    status: {
      type: String,
      enum: ["Draft", "Published"],
      default: "Draft",
    },
    metaTitle: {
      type: String,
    },
    metaDescription: {
      type: String,
    },
    metaKeyword: {
      type: String, 
    },
     isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports =  subCategorySchema;
