const User = require('../models/User');
const Animal = require('../models/Animal');
const Setting = require('../models/Setting');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('./errorHandler');

/**
 * Middleware to verify user has an active premium subscription
 */
const requireSubscription = asyncHandler(async (req, res, next) => {
  if (!req.user || !req.user.id) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Check auto-expiration
  if (user.isPremium && user.premiumExpiresAt && new Date() > new Date(user.premiumExpiresAt)) {
    user.isPremium = false;
    user.premiumExpiresAt = undefined;
    await user.save();
  }

  if (!user.isPremium) {
    return res.status(403).json({
      status: 'fail',
      code: 'SUBSCRIPTION_REQUIRED',
      message: 'Access Denied: Premium subscription required to access this feature.',
      data: {
        isPremium: false,
        requiresUpgrade: true
      }
    });
  }

  next();
});

/**
 * Middleware to enforce active listing limits for free users
 */
const checkListingLimit = asyncHandler(async (req, res, next) => {
  if (!req.user || !req.user.id) {
    return next(new AppError('You are not logged in!', 401));
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Auto-expire subscription check
  if (user.isPremium && user.premiumExpiresAt && new Date() > new Date(user.premiumExpiresAt)) {
    user.isPremium = false;
    user.premiumExpiresAt = undefined;
    await user.save();
  }

  // Premium users have unlimited listings
  if (user.isPremium) {
    return next();
  }

  // Fetch free user limit setting or default to 5
  let freeLimit = 5;
  try {
    const setting = await Setting.findOne({ key: 'freeUserListingLimit' });
    if (setting && setting.value) {
      freeLimit = Number(setting.value) || 5;
    }
  } catch (err) {
    freeLimit = 5;
  }

  // Count active listings created by this user
  const activeCount = await Animal.countDocuments({
    sellerId: req.user.id,
    isDeleted: false,
    status: { $in: ['pending', 'approved'] }
  });

  if (activeCount >= freeLimit) {
    return res.status(403).json({
      status: 'fail',
      code: 'LISTING_LIMIT_EXCEEDED',
      message: `You have reached the free limit of ${freeLimit} active animal listings. Upgrade to Premium for Unlimited Listings.`,
      data: {
        activeCount,
        limit: freeLimit,
        requiresUpgrade: true
      }
    });
  }

  next();
});

module.exports = {
  requireSubscription,
  checkListingLimit
};
