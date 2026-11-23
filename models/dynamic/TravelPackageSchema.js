const mongoose = require("mongoose");
const moods = require("../../utils/moods.json");
const CommonSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["tour", "trek"], required: true },

    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },

    price: { type: Number, required: true },

    duration: { type: String, required: true },
    discount: {
      amount: { type: Number, default: 0 },
      percentage: { type: Number, min: 0, max: 100, default: 0 },
    },
    offbeat: { type: Boolean, default: false },


    altitude: { type: String }, // trek only
    altitudeunit: { type: String, enum: ["meter", "feet"]},
    difficultyLevel: { type: String, enum: ["Easy", "Moderate", "Difficult"] }, // trek only

    season: {
      type: String,
      enum: ["summer-trips", "winter-trips", "autumn-trips", "monsoon-trips"],
      required: true,
    },

    country: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    locationAddress: { type: String, required: true },

    startLocation: { type: String },
    endLocation: { type: String },
    groupMembers: [{
      minMembers: { type: Number, required: true },
      maxMembers: { type: Number, required: true },
    }],

    itinerary: [{ day: Number, title: String, description: String }],

    inclusions: [{ type: String }],
    exclusions: [{ type: String }],

    featuredImage: {
      url: { type: String, required: true },
      alt: { type: String },
    },

    gallery: [{ url: { type: String, required: true }, alt: { type: String } }],

    moodOfJourney: {
      title: {
        type: String,
        enum: [
          "Digital Detox",
          "Exploration",
          "Peace & Calm",
          "For Adventure",
          "Curiosity",

        ],
        required: true,
      },
      description: { type: String },
      image: {
        url: { type: String },
        alt: { type: String },
      },
    },
    status: {
      type: String,
      enum: ["Draft", "Published"],
      default: "Draft",
    },
    seo: {
      metaTitle: { type: String },
      metaDescription: { type: String },
      keywords: { type: String },
    },
    batches: [
      {
        fromDate: { type: Date },
        toDate: { type: Date },
      }
    ],
    faq: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CommonSchema.pre("save", function (next) {
  const mood = moods.find((m) => m.title === this.moodOfJourney?.title);
  if (mood) {
    this.moodOfJourney.description = mood.description;
    this.moodOfJourney.image = mood.image;
  }
  next();
});


// CommonSchema.index({ season: 1 });
// CommonSchema.index({ state: 1 });
// CommonSchema.index({ city: 1 });
// CommonSchema.index({ "moodOfJourney.title": 1 });


module.exports = CommonSchema;

