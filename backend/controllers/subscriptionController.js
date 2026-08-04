const User = require('../models/User');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const razorpayService = require('../services/razorpayService');
const fcmService = require('../services/fcmService');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middleware/errorHandler');

/**
 * Get current user's subscription status
 * GET /api/subscriptions/status
 */
exports.getSubscriptionStatus = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate({
    path: 'currentSubscription',
    populate: { path: 'planId' }
  });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Auto expiry check
  const now = new Date();
  if (user.isPremium && user.premiumExpiresAt && now > new Date(user.premiumExpiresAt)) {
    user.isPremium = false;
    user.premiumExpiresAt = undefined;
    if (user.currentSubscription) {
      await Subscription.findByIdAndUpdate(user.currentSubscription._id, { status: 'expired' });
    }
    await user.save();
  }

  let daysRemaining = 0;
  if (user.isPremium && user.premiumExpiresAt) {
    const diffTime = new Date(user.premiumExpiresAt).getTime() - now.getTime();
    daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  res.status(200).json({
    status: 'success',
    data: {
      isPremium: user.isPremium || false,
      premiumExpiresAt: user.premiumExpiresAt || null,
      daysRemaining,
      subscription: user.currentSubscription || null
    }
  });
});

/**
 * Create Razorpay Order for purchasing a plan
 * POST /api/subscriptions/create-order
 */
exports.createRazorpayOrder = asyncHandler(async (req, res, next) => {
  const { planId } = req.body;

  if (!planId) {
    return next(new AppError('Please select a plan to purchase', 400));
  }

  const plan = await SubscriptionPlan.findById(planId);
  if (!plan || !plan.isActive) {
    return next(new AppError('Selected plan is inactive or not found', 404));
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // 1. Create Order via Razorpay Service
  const orderReceipt = `sub_${user._id.toString().slice(-6)}_${Date.now()}`;
  const razorpayOrder = await razorpayService.createOrder({
    amount: plan.price,
    currency: 'INR',
    receipt: orderReceipt,
    notes: {
      userId: user._id.toString(),
      userName: user.name || user.fullName || 'User',
      planId: plan._id.toString(),
      planName: plan.name,
      planType: plan.planType,
      durationDays: plan.durationDays
    }
  });

  // 2. Log transaction in DB
  await Transaction.create({
    userId: user._id,
    razorpayOrderId: razorpayOrder.id,
    amount: plan.price,
    currency: 'INR',
    status: 'created'
  });

  res.status(200).json({
    status: 'success',
    data: {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount, // in paise
      amountInINR: plan.price,
      currency: razorpayOrder.currency,
      keyId: razorpayService.keyId,
      plan: {
        id: plan._id,
        name: plan.name,
        durationDays: plan.durationDays,
        price: plan.price
      },
      user: {
        name: user.name || user.fullName,
        email: user.email,
        mobile: user.mobile || user.phoneNumber
      }
    }
  });
});

/**
 * Verify Razorpay Signature and activate subscription
 * POST /api/subscriptions/verify-payment
 */
exports.verifyPayment = asyncHandler(async (req, res, next) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, planId } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !planId) {
    return next(new AppError('Razorpay order ID, payment ID, signature and plan ID are required', 400));
  }

  // 1. Verify HMAC SHA256 Signature
  const isValid = razorpayService.verifySignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature
  });

  if (!isValid) {
    // Record failed transaction
    await Transaction.findOneAndUpdate(
      { razorpayOrderId },
      {
        razorpayPaymentId,
        razorpaySignature,
        status: 'failed'
      }
    );
    return next(new AppError('Invalid Razorpay signature. Payment verification failed.', 400));
  }

  // 2. Fetch Plan & User
  const plan = await SubscriptionPlan.findById(planId);
  if (!plan) {
    return next(new AppError('Plan not found', 404));
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // 3. Compute Subscription Dates
  const startDate = new Date();
  // If user already has active subscription, stack duration onto existing expiry date
  let baseDate = new Date();
  if (user.isPremium && user.premiumExpiresAt && new Date(user.premiumExpiresAt) > baseDate) {
    baseDate = new Date(user.premiumExpiresAt);
  }

  const endDate = new Date(baseDate);
  endDate.setDate(endDate.getDate() + plan.durationDays);

  // 4. Create Subscription Record
  const subscription = await Subscription.create({
    userId: user._id,
    planId: plan._id,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    startDate,
    endDate,
    amount: plan.price,
    status: 'active'
  });

  // 5. Update Transaction Record
  await Transaction.findOneAndUpdate(
    { razorpayOrderId },
    {
      subscriptionId: subscription._id,
      razorpayPaymentId,
      razorpaySignature,
      status: 'captured',
      amount: plan.price
    },
    { upsert: true }
  );

  // 6. Activate Premium on User
  user.isPremium = true;
  user.premiumExpiresAt = endDate;
  user.currentSubscription = subscription._id;
  await user.save();

  // Send Push Notification
  try {
    await fcmService.sendSubscriptionActivated(user._id, plan.name, endDate);
  } catch (pushErr) {
    console.warn('[SubscriptionController] FCM push warning:', pushErr.message);
  }

  res.status(200).json({
    status: 'success',
    message: 'Subscription activated successfully!',
    data: {
      isPremium: true,
      premiumExpiresAt: endDate,
      subscription
    }
  });
});

/**
 * Handle Razorpay Webhook Events
 * POST /api/subscriptions/webhook
 */
exports.handleWebhook = asyncHandler(async (req, res, next) => {
  const signature = req.headers['x-razorpay-signature'];
  const isValid = razorpayService.verifyWebhookSignature(req.body, signature);

  if (!isValid) {
    return res.status(400).json({ status: 'error', message: 'Invalid webhook signature' });
  }

  const event = req.body.event;
  const payload = req.body.payload;

  if (event === 'payment.captured' || event === 'order.paid') {
    const paymentEntity = payload.payment ? payload.payment.entity : null;
    const orderEntity = payload.order ? payload.order.entity : null;

    const orderId = paymentEntity ? paymentEntity.order_id : (orderEntity ? orderEntity.id : null);
    const paymentId = paymentEntity ? paymentEntity.id : null;

    if (orderId) {
      await Transaction.findOneAndUpdate(
        { razorpayOrderId: orderId },
        {
          razorpayPaymentId: paymentId,
          status: 'captured',
          rawWebhookPayload: req.body
        }
      );
    }
  }

  res.status(200).json({ status: 'ok', received: true });
});

/**
 * Cancel user subscription
 * POST /api/subscriptions/cancel
 */
exports.cancelSubscription = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user || !user.isPremium) {
    return next(new AppError('No active subscription found to cancel', 400));
  }

  if (user.currentSubscription) {
    await Subscription.findByIdAndUpdate(user.currentSubscription, { status: 'cancelled' });
  }

  user.isPremium = false;
  user.premiumExpiresAt = undefined;
  user.currentSubscription = undefined;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Subscription cancelled successfully'
  });
});
