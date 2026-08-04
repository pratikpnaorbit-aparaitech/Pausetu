const mongoose = require('mongoose');

const NOTIFICATION_TYPES = {
  LISTING_APPROVED: 'LISTING_APPROVED',
  LISTING_REJECTED: 'LISTING_REJECTED',
  LISTING_SOLD: 'LISTING_SOLD',
  LISTING_EXPIRING: 'LISTING_EXPIRING',
  BUYER_INQUIRY: 'BUYER_INQUIRY',
  PRICE_DROP: 'PRICE_DROP',
  SUBSCRIPTION_ACTIVATED: 'SUBSCRIPTION_ACTIVATED',
  SUBSCRIPTION_EXPIRING: 'SUBSCRIPTION_EXPIRING',
  SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED',
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  VERIFICATION_APPROVED: 'VERIFICATION_APPROVED',
  VERIFICATION_REJECTED: 'VERIFICATION_REJECTED',
  AI_FEED_REMINDER: 'AI_FEED_REMINDER',
  AI_VACCINATION_REMINDER: 'AI_VACCINATION_REMINDER',
  AI_HEALTH_TIP: 'AI_HEALTH_TIP',
  ADMIN_BROADCAST: 'ADMIN_BROADCAST',
  SYSTEM: 'SYSTEM'
};

const NOTIFICATION_CHANNELS = {
  MARKETPLACE: 'marketplace',
  PREMIUM: 'premium',
  ORDERS: 'orders',
  ADMIN: 'admin',
  GENERAL: 'general',
  HIGH_PRIORITY: 'high_priority'
};

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
    imageUrl: {
      type: String,
      default: null
    },
    notificationType: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      default: NOTIFICATION_TYPES.SYSTEM,
      index: true
    },
    channelId: {
      type: String,
      enum: Object.values(NOTIFICATION_CHANNELS),
      default: NOTIFICATION_CHANNELS.GENERAL
    },
    priority: {
      type: String,
      enum: ['high', 'default', 'low'],
      default: 'high'
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
    deepLink: {
      screen: { type: String, default: null },
      params: { type: mongoose.Schema.Types.Mixed, default: {} }
    },
    targetAudience: {
      type: String,
      enum: ['everyone', 'premium', 'free', 'sellers', 'buyers', 'verified', 'specific'],
      default: 'specific'
    },
    status: {
      type: String,
      enum: ['sent', 'scheduled', 'draft', 'failed'],
      default: 'sent',
      index: true
    },
    scheduledFor: {
      type: Date,
      default: null
    },
    sentAt: {
      type: Date,
      default: Date.now
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
Notification.NOTIFICATION_CHANNELS = NOTIFICATION_CHANNELS;

module.exports = Notification;
