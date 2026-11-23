const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 80,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i, 
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    // match: /^[0-9]{15}$/,
  },
  password: { 
    type: String, 
    minlength: 8,
    select: false, 
    // Password required only if Google login not used
    required: function() { return !this.googleId; }
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // allows users without googleId
  },
  profilePic: {
    type: String
  },
  agreedToTerms: {
    type: Boolean,
    required: true,
    default: false,
  },
  bio:{
    type:String,
    default:''
  },
  travelStyle:{
    type: [String],
    default: []
  },

  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
  },
  otpCode: {
    type: String,
  },
  otpExpiry: {
    type: Date,
  },
}, {
  timestamps: true, 
});

module.exports = userSchema
