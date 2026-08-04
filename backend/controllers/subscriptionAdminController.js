const SubscriptionPlan = require('../models/SubscriptionPlan');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middleware/errorHandler');

/**
 * Get Subscription Dashboard statistics & KPIs
 * GET /api/admin/subscriptions/dashboard
 */
exports.getSubscriptionDashboard = asyncHandler(async (req, res, next) => {
  const now = new Date();

  // 1. KPI Counts
  const totalSubscribersCount = await Subscription.distinct('userId').then(u => u.length);
  const activeSubscribersCount = await User.countDocuments({ isPremium: true, premiumExpiresAt: { $gt: now } });
  const expiredSubscribersCount = await User.countDocuments({
    $or: [
      { isPremium: false, currentSubscription: { $exists: true } },
      { premiumExpiresAt: { $lte: now } }
    ]
  });

  // 2. Total Revenue calculated from captured transactions
  const revenueAgg = await Transaction.aggregate([
    { $match: { status: 'captured' } },
    { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
  ]);
  const totalRevenue = revenueAgg[0] ? revenueAgg[0].totalRevenue : 0;

  // 3. Plan Distribution Count
  const planDistribution = await Subscription.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$planId', count: { $sum: 1 } } },
    { $lookup: { from: 'subscription_plans', localField: '_id', foreignField: '_id', as: 'plan' } },
    { $unwind: '$plan' },
    { $project: { _id: 0, planName: '$plan.name', planType: '$plan.planType', count: 1 } }
  ]);

  // 4. Recent Transactions
  const recentTransactions = await Transaction.find({ status: 'captured' })
    .populate('userId', 'name email mobile')
    .sort({ createdAt: -1 })
    .limit(10);

  res.status(200).json({
    status: 'success',
    data: {
      kpis: {
        totalRevenue,
        activeSubscribers: activeSubscribersCount,
        expiredSubscribers: expiredSubscribersCount,
        totalSubscribers: totalSubscribersCount
      },
      planDistribution,
      recentTransactions
    }
  });
});

/**
 * Get all plans (admin)
 * GET /api/admin/subscriptions/plans
 */
exports.getAllPlans = asyncHandler(async (req, res, next) => {
  const plans = await SubscriptionPlan.find().sort({ displayOrder: 1, createdAt: -1 });

  res.status(200).json({
    status: 'success',
    data: { plans }
  });
});

/**
 * Create a new subscription plan (admin)
 * POST /api/admin/subscriptions/plans
 */
exports.createPlan = asyncHandler(async (req, res, next) => {
  const { name, planType, durationDays, price, originalPrice, badge, displayOrder, features, isActive } = req.body;

  if (!name || !planType || !durationDays || price === undefined) {
    return next(new AppError('Plan name, type, duration in days, and price are required', 400));
  }

  const plan = await SubscriptionPlan.create({
    name,
    planType,
    durationDays: Number(durationDays),
    price: Number(price),
    originalPrice: originalPrice ? Number(originalPrice) : undefined,
    badge: badge || '',
    displayOrder: displayOrder ? Number(displayOrder) : 0,
    features: Array.isArray(features) ? features : [],
    isActive: isActive !== false
  });

  res.status(201).json({
    status: 'success',
    message: 'Subscription plan created successfully',
    data: { plan }
  });
});

/**
 * Update an existing subscription plan (admin)
 * PUT /api/admin/subscriptions/plans/:id
 */
exports.updatePlan = asyncHandler(async (req, res, next) => {
  const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!plan) {
    return next(new AppError('Subscription plan not found', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Subscription plan updated successfully',
    data: { plan }
  });
});

/**
 * Delete subscription plan (admin)
 * DELETE /api/admin/subscriptions/plans/:id
 */
exports.deletePlan = asyncHandler(async (req, res, next) => {
  const plan = await SubscriptionPlan.findByIdAndDelete(req.params.id);

  if (!plan) {
    return next(new AppError('Subscription plan not found', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Subscription plan deleted successfully'
  });
});

/**
 * Toggle plan active status (admin)
 * PATCH /api/admin/subscriptions/plans/:id/toggle
 */
exports.togglePlanStatus = asyncHandler(async (req, res, next) => {
  const plan = await SubscriptionPlan.findById(req.params.id);

  if (!plan) {
    return next(new AppError('Subscription plan not found', 404));
  }

  plan.isActive = !plan.isActive;
  await plan.save();

  res.status(200).json({
    status: 'success',
    message: `Plan ${plan.isActive ? 'activated' : 'deactivated'} successfully`,
    data: { plan }
  });
});

/**
 * Get all subscribers (admin) with search, filter, and pagination
 * GET /api/admin/subscriptions/subscribers
 */
exports.getSubscribers = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 15;
  const skip = (page - 1) * limit;

  const { status, search } = req.query;
  const filter = {};

  if (status && status !== 'all') {
    filter.status = status;
  }

  const subscriptions = await Subscription.find(filter)
    .populate('userId', 'name fullName email mobile phoneNumber profilePhoto')
    .populate('planId', 'name planType durationDays price badge')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalCount = await Subscription.countDocuments(filter);
  const now = new Date();

  // Attach dynamic fields (days remaining, active status calculation)
  const subscribers = subscriptions.map(sub => {
    const obj = sub.toObject();
    const isExpired = new Date(sub.endDate) < now;
    const diffTime = new Date(sub.endDate).getTime() - now.getTime();
    obj.daysRemaining = isExpired ? 0 : Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    obj.computedStatus = isExpired ? 'expired' : sub.status;
    return obj;
  });

  // Client-side search filter if query provided
  let filteredSubscribers = subscribers;
  if (search && search.trim() !== '') {
    const q = search.toLowerCase();
    filteredSubscribers = subscribers.filter(s => {
      const u = s.userId || {};
      return (
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.fullName && u.fullName.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.mobile && u.mobile.includes(q)) ||
        (u.phoneNumber && u.phoneNumber.includes(q))
      );
    });
  }

  res.status(200).json({
    status: 'success',
    pagination: {
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      limit
    },
    data: {
      subscribers: filteredSubscribers
    }
  });
});

/**
 * Get all financial transactions log (admin)
 * GET /api/admin/subscriptions/transactions
 */
exports.getTransactions = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const transactions = await Transaction.find()
    .populate('userId', 'name email mobile')
    .populate({
      path: 'subscriptionId',
      populate: { path: 'planId', select: 'name planType' }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalCount = await Transaction.countDocuments();

  res.status(200).json({
    status: 'success',
    pagination: {
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      limit
    },
    data: { transactions }
  });
});
