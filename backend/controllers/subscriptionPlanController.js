const SubscriptionPlan = require('../models/SubscriptionPlan');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middleware/errorHandler');

/**
 * Get active subscription plans for users/mobile
 * GET /api/subscriptions/plans
 */
exports.getActivePlans = asyncHandler(async (req, res, next) => {
  let plans = await SubscriptionPlan.find({ isActive: true }).sort({ displayOrder: 1, price: 1 });

  // If no plans exist in DB, return default plans
  if (plans.length === 0) {
    const defaultPlans = [
      {
        name: '1 Month Starter',
        planType: '1_month',
        durationDays: 30,
        price: 199,
        originalPrice: 299,
        badge: 'Starter',
        displayOrder: 1,
        features: ['unlimited_listings', 'ai_feed_planner', 'cow_estimator', 'premium_badge'],
        isActive: true
      },
      {
        name: '3 Months Gold',
        planType: '3_months',
        durationDays: 90,
        price: 499,
        originalPrice: 899,
        badge: 'Popular',
        displayOrder: 2,
        features: ['unlimited_listings', 'ai_feed_planner', 'cow_estimator', 'featured_listings', 'premium_badge', 'priority_support'],
        isActive: true
      },
      {
        name: '6 Months Premium',
        planType: '6_months',
        durationDays: 180,
        price: 899,
        originalPrice: 1799,
        badge: 'Best Value',
        displayOrder: 3,
        features: ['unlimited_listings', 'ai_feed_planner', 'cow_estimator', 'featured_listings', 'premium_badge', 'priority_support', 'future_premium_features'],
        isActive: true
      },
      {
        name: '12 Months Platinum',
        planType: '12_months',
        durationDays: 365,
        price: 1499,
        originalPrice: 3599,
        badge: 'RECOMMENDED',
        displayOrder: 4,
        features: ['unlimited_listings', 'ai_feed_planner', 'cow_estimator', 'featured_listings', 'premium_badge', 'priority_support', 'future_premium_features'],
        isActive: true
      }
    ];

    plans = await SubscriptionPlan.insertMany(defaultPlans);
  }

  res.status(200).json({
    status: 'success',
    data: {
      plans
    }
  });
});
