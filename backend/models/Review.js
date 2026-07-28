const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One review per user
    },
    userName: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    feedback: {
      type: String,
      default: '',
    },
    appVersion: {
      type: String,
      default: '1.0.0',
    },
    deviceInfo: {
      type: String,
      default: '',
    },
    platform: {
      type: String,
      enum: ['android', 'ios', 'web'],
      default: 'android',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminReply: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient admin sorting and filtering
reviewSchema.index({ status: 1, rating: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
