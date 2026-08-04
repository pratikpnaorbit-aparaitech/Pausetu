const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true
    },
    planType: {
      type: String,
      enum: ['1_month', '3_months', '6_months', '12_months'],
      required: [true, 'Plan type is required']
    },
    durationDays: {
      type: Number,
      required: [true, 'Duration in days is required']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative']
    },
    badge: {
      type: String,
      default: ''
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    features: [
      {
        type: String,
        enum: [
          'unlimited_listings',
          'ai_feed_planner',
          'cow_estimator',
          'featured_listings',
          'premium_badge',
          'priority_support',
          'future_premium_features'
        ]
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

subscriptionPlanSchema.index({ isActive: 1, displayOrder: 1 });

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

module.exports = SubscriptionPlan;
