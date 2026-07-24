const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification must belong to a recipient']
    },
    title: {
      type: String,
      required: [true, 'Notification must have a title']
    },
    message: {
      type: String,
      required: [true, 'Notification must have a message']
    },
    type: {
      type: String,
      enum: ['info', 'alert', 'success', 'chat', 'warning', 'error'],
      default: 'info'
    },
    isRead: {
      type: Boolean,
      default: false
    },
    relatedId: {
      type: String,
      default: null
    },
    targetScreen: {
      type: String,
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
