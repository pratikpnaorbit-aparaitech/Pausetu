const User = require('../models/User');
const Animal = require('../models/Animal');
const Category = require('../models/Category');
const Seller = require('../models/Seller');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middleware/errorHandler');

/**
 * Get dashboard stats
 */
exports.getDashboardStats = asyncHandler(async (req, res, next) => {
  const totalSellers = await User.countDocuments({ role: 'seller' });
  const totalBuyers = await User.countDocuments({ role: 'buyer' });
  const totalAnimals = await Animal.countDocuments({ isDeleted: false });
  const pendingApprovals = await Animal.countDocuments({ status: 'pending', isDeleted: false });
  const approvedListings = await Animal.countDocuments({ status: 'approved', isDeleted: false });
  const rejectedListings = await Animal.countDocuments({ status: 'rejected', isDeleted: false });
  const soldAnimals = await Animal.countDocuments({ status: 'sold', isDeleted: false });
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayRegistrations = await User.countDocuments({ createdAt: { $gte: today } });

  // Weekly stats: counts of animals added per day for last 7 days
  const weeklyStats = [];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const nextD = new Date(d);
    nextD.setDate(nextD.getDate() + 1);
    
    const value = await Animal.countDocuments({
      createdAt: { $gte: d, $lt: nextD },
      isDeleted: false
    });
    weeklyStats.push({
      day: daysOfWeek[d.getDay()],
      value
    });
  }

  // Category distribution
  const categories = await Category.find();
  const distribution = {};
  for (const cat of categories) {
    distribution[cat.name] = await Animal.countDocuments({
      categoryId: cat._id,
      isDeleted: false
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      kpis: {
        totalSellers,
        totalBuyers,
        totalAnimals,
        pendingApprovals,
        approvedListings,
        rejectedListings,
        soldAnimals,
        todayRegistrations
      },
      weeklyStats,
      categoryDistribution: distribution
    }
  });
});

/**
 * Get all users filtered by role
 */
exports.getUsers = asyncHandler(async (req, res, next) => {
  const { role } = req.query;
  const filter = {};
  if (role) filter.role = role;
  
  const users = await User.find(filter).sort({ createdAt: -1 });
  
  res.status(200).json({
    status: 'success',
    data: {
      users
    }
  });
});

/**
 * Verify a seller profile
 */
exports.verifySeller = asyncHandler(async (req, res, next) => {
  const seller = await Seller.findOne({ user: req.params.id });
  if (!seller) {
    return next(new AppError('Seller profile not found', 404));
  }
  
  seller.verificationStatus = 'verified';
  await seller.save();
  
  res.status(200).json({
    status: 'success',
    data: {
      seller
    }
  });
});

/**
 * Suspend/Activate a User
 */
exports.manageUserStatus = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  user.isBlocked = !user.isBlocked;
  await user.save();
  
  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

/**
 * Toggle Premium status for a user
 */
exports.togglePremiumStatus = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  user.isPremium = !user.isPremium;
  if (user.isPremium) {
    user.premiumExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year expiration
  } else {
    user.premiumExpiresAt = undefined;
  }
  
  await user.save();
  
  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});
