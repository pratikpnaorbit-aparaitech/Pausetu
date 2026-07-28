const mongoose = require('mongoose');

const NOTIFICATION_TYPES = {
  LISTING_APPROVED: 'LISTING_APPROVED',
  LISTING_REJECTED: 'LISTING_REJECTED',
  BUYER_INQUIRY: 'BUYER_INQUIRY',
  SUBSCRIPTION_EXPIRY: 'SUBSCRIPTION_EXPIRY'
};

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification must belong to a recipient'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Notification must have a title']
    },
    message: {
      type: String,
      required: [true, 'Notification must have a message']
    },
    notificationType: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: [true, 'Notification must have a type']
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    relatedAnimal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Animal',
      default: null
    },
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
Notification.NOTIFICATION_TYPES = NOTIFICATION_TYPES;

module.exports = Notification;
