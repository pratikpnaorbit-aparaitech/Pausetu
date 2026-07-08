const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name']
    },
    fullName: {
      type: String
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      select: false
    },
    role: {
      type: String,
      enum: ['buyer', 'seller', 'admin'],
      default: 'buyer'
    },
    phoneNumber: {
      type: String
    },
    mobile: {
      type: String
    },
    profilePhoto: {
      type: String
    },
    village: {
      type: String
    },
    taluka: {
      type: String
    },
    district: {
      type: String
    },
    state: {
      type: String
    },
    preferredLanguage: {
      type: String,
      enum: ['en', 'hi', 'mr'],
      default: 'mr'
    },
    isProfileCompleted: {
      type: Boolean,
      default: false
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
