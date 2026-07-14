const User = require('../models/User');
const PremiumChat = require('../models/PremiumChat');
const aiAdvisorService = require('../services/aiAdvisorService');
const paymentConfig = require('../config/paymentConfig');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middleware/errorHandler');

/**
 * Fetch premium status of logged-in user
 */
exports.getPremiumStatus = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  // Check if subscription has expired
  if (user.isPremium && user.premiumExpiresAt && new Date() > new Date(user.premiumExpiresAt)) {
    user.isPremium = false;
    user.premiumExpiresAt = undefined;
    await user.save();
  }

  res.status(200).json({
    status: 'success',
    data: {
      isPremium: user.isPremium || false,
      premiumExpiresAt: user.premiumExpiresAt || null,
      marketPriceAccess: user.marketPriceAccess || { hasAccess: false },
      feedPlannerAccess: user.feedPlannerAccess || { hasAccess: false }
    }
  });
});

/**
 * Process mock ₹1 payment and activate subscription
 */
exports.subscribePremium = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const { planType, amount, paymentMethod } = req.body;

  if (!planType || !amount) {
    return next(new AppError('Plan type and amount are required', 400));
  }

  // Simulate verification of the configurable provider
  const isDummy = paymentConfig.provider === 'dummy';
  if (!isDummy) {
    // If not dummy, perform live gateway flow (mocked logic or check credentials)
    console.log(`[Payment Gateway] Processing with real provider settings: ${paymentConfig.provider}`);
  }

  // Mock processing delay (1.5 seconds)
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Determine expiration date (1 month or 1 year)
  const expiration = new Date();
  if (planType === 'monthly') {
    expiration.setDate(expiration.getDate() + 30);
  } else if (planType === 'yearly') {
    expiration.setFullYear(expiration.getFullYear() + 1);
  } else {
    expiration.setDate(expiration.getDate() + 30); // fallback
  }

  // Activate premium status
  user.isPremium = true;
  user.premiumExpiresAt = expiration;
  await user.save();

  // Save successful mock payment transaction ID
  const transactionId = `TXN_MOCK_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

  res.status(200).json({
    status: 'success',
    message: 'Subscription activated successfully',
    data: {
      transactionId,
      amount,
      planType,
      isPremium: user.isPremium,
      premiumExpiresAt: user.premiumExpiresAt
    }
  });
});

/**
 * Get conversation messages grouped by session or flat
 */
exports.getChatHistory = asyncHandler(async (req, res, next) => {
  const { sessionId } = req.query;
  const filter = { userId: req.user.id };
  
  if (sessionId) {
    filter.sessionId = sessionId;
  }

  const messages = await PremiumChat.find(filter).sort({ timestamp: 1 });

  // Get distinct sessions list to return
  const sessions = await PremiumChat.aggregate([
    { $match: { userId: req.user.id } },
    { $group: {
        _id: '$sessionId',
        title: { $first: '$sessionTitle' },
        lastMessageAt: { $max: '$timestamp' }
      }
    },
    { $sort: { lastMessageAt: -1 } }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      sessions,
      messages
    }
  });
});

/**
 * Send chat message to AI Advisor and get generated response
 */
exports.sendChatMessage = asyncHandler(async (req, res, next) => {
  const { message, sessionId, sessionTitle, imageUrl } = req.body;

  if (!message) {
    return next(new AppError('Message is required', 400));
  }

  // Verify premium membership first
  const user = await User.findById(req.user.id);
  if (!user || !user.isPremium) {
    return next(new AppError('Access Denied: Premium subscription required.', 403));
  }

  const activeSessionId = sessionId || `session_${Date.now()}`;
  const activeSessionTitle = sessionTitle || message.substring(0, 25) + '...';

  // 1. Save User's message
  const userChat = await PremiumChat.create({
    userId: req.user.id,
    sessionId: activeSessionId,
    sessionTitle: activeSessionTitle,
    role: 'user',
    message,
    imageUrl: imageUrl || null
  });

  // 2. Generate simulated AI answer
  const lang = req.user.preferredLanguage || 'en';
  const aiAnswerText = aiAdvisorService.getMockResponse(message, lang);

  // Simulate typing latency
  await new Promise((resolve) => setTimeout(resolve, 800));

  // 3. Save AI's response
  const aiChat = await PremiumChat.create({
    userId: req.user.id,
    sessionId: activeSessionId,
    sessionTitle: activeSessionTitle,
    role: 'assistant',
    message: aiAnswerText
  });

  res.status(200).json({
    status: 'success',
    data: {
      sessionId: activeSessionId,
      sessionTitle: activeSessionTitle,
      userMessage: userChat,
      aiMessage: aiChat
    }
  });
});

/**
 * Clear chat history
 */
exports.clearChatHistory = asyncHandler(async (req, res, next) => {
  const { sessionId } = req.body;
  const filter = { userId: req.user.id };
  
  if (sessionId) {
    filter.sessionId = sessionId;
  }

  await PremiumChat.deleteMany(filter);

  res.status(200).json({
    status: 'success',
    message: 'Chat history cleared successfully'
  });
});

/**
 * Process mock ₹1 payment and activate lifetime Market Price access
 */
exports.unlockMarketPrice = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Mock processing delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const transactionId = `TXN_MP_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

  user.marketPriceAccess = {
    hasAccess: true,
    source: 'payment',
    unlockedAt: new Date(),
    paymentId: transactionId
  };

  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Market Price access unlocked successfully',
    data: {
      marketPriceAccess: user.marketPriceAccess
    }
  });
});

/**
 * Process mock ₹1 payment and activate lifetime Feed Planner access
 */
exports.unlockFeedPlanner = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Mock processing delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const transactionId = `TXN_FP_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

  user.feedPlannerAccess = {
    hasAccess: true,
    source: 'payment',
    unlockedAt: new Date(),
    paymentId: transactionId
  };

  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Feed Planner access unlocked successfully',
    data: {
      feedPlannerAccess: user.feedPlannerAccess
    }
  });
});
