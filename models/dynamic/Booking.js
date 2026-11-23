const mongoose = require('mongoose');

const personSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  }
});

const bookingSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  billing_address: {
    type: String,
    required: true
  },
  tour_id: {
    type: String, 
    required: true
  },
  number_of_people: {
    type: Number,
    required: true
  },
  peoplelist: {
    type: [personSchema],
    required: false
  },
  booking_date: {
    type: Date,
    default: Date.now
  },
  preference: {
    type: String
  },
  travel_date_start: {
    type: Date,
    required: true
  },
  travel_date_end: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'canceled'],
    default: 'pending'
  },
  paymentmethod: {
    type: String,
    enum: ['cash', 'online'],
    required: true
  },
  payment: {
    type: String,
    enum: ['success', 'failed'],
  },
},{ timestamps: true });

module.exports = bookingSchema;
