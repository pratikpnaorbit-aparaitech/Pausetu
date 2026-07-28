const Review = require('../models/Review');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middleware/errorHandler');

// GET /api/reviews/my — Get current logged-in user's review
exports.getUserReview = asyncHandler(async (req, res, next) => {
  const userId = req.user.id || req.user._id;
  const review = await Review.findOne({ userId });

  res.status(200).json({
    status: 'success',
    data: { review: review || null },
  });
});

// POST /api/reviews — Create or edit user review
exports.createOrUpdateReview = asyncHandler(async (req, res, next) => {
  const userId = req.user.id || req.user._id;
  const { rating, feedback, appVersion, deviceInfo, platform } = req.body;

  const numRating = Number(rating);
  if (!numRating || numRating < 1 || numRating > 5) {
    return next(new AppError('Rating must be a number between 1 and 5.', 400));
  }

  // Requirement: Feedback required for ratings 1, 2, or 3
  if (numRating <= 3 && (!feedback || !feedback.trim())) {
    return next(new AppError('Feedback is required for ratings of 3 stars or lower.', 400));
  }

  // Check if review already exists for user
  let review = await Review.findOne({ userId });

  // Retrieve user details for metadata
  const user = await User.findById(userId);
  const userName = user ? (user.fullName || user.name) : (req.user.fullName || req.user.name || 'Anonymous User');
  const email = user ? (user.email || user.mobile) : (req.user.email || req.user.mobile || '');

  let isUpdate = false;

  if (review) {
    // Update existing review
    isUpdate = true;
    review.rating = numRating;
    review.feedback = (feedback || '').trim();
    if (userName) review.userName = userName;
    if (email) review.email = email;
    if (appVersion) review.appVersion = appVersion;
    if (deviceInfo) review.deviceInfo = deviceInfo;
    if (platform) review.platform = platform;
    await review.save();
  } else {
    // Create new review
    review = await Review.create({
      userId,
      userName,
      email,
      rating: numRating,
      feedback: (feedback || '').trim(),
      appVersion: appVersion || '1.0.0',
      deviceInfo: deviceInfo || '',
      platform: platform || 'android',
    });
  }

  res.status(200).json({
    status: 'success',
    message: isUpdate ? 'Review updated successfully' : 'Review saved successfully',
    data: { review },
  });
});

// GET /api/reviews/admin — Get all reviews (Admin only)
exports.getAdminReviews = asyncHandler(async (req, res, next) => {
  const { search, rating, page = 1, limit = 20 } = req.query;

  const query = {};

  if (rating && rating !== 'all') {
    query.rating = Number(rating);
  }

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    query.$or = [
      { userName: searchRegex },
      { email: searchRegex },
      { feedback: searchRegex },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, parseInt(limit, 10));
  const skip = (pageNum - 1) * limitNum;

  const [reviews, totalCount] = await Promise.all([
    Review.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Review.countDocuments(query),
  ]);

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    totalCount,
    totalPages: Math.ceil(totalCount / limitNum),
    currentPage: pageNum,
    data: { reviews },
  });
});

// GET /api/reviews/admin/stats — Get review statistics & analytics (Admin only)
exports.getAdminReviewStats = asyncHandler(async (req, res, next) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalReviews,
    avgRatingResult,
    distributionResult,
    reviewsToday,
    reviewsThisWeek,
    reviewsThisMonth,
  ] = await Promise.all([
    Review.countDocuments(),
    Review.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating' } } },
    ]),
    Review.aggregate([
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]),
    Review.countDocuments({ createdAt: { $gte: startOfDay } }),
    Review.countDocuments({ createdAt: { $gte: startOfWeek } }),
    Review.countDocuments({ createdAt: { $gte: startOfMonth } }),
  ]);

  const rawAvg = avgRatingResult.length > 0 ? avgRatingResult[0].avgRating : 0;
  const averageRating = Math.round(rawAvg * 10) / 10;

  const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  distributionResult.forEach((item) => {
    if (item._id >= 1 && item._id <= 5) {
      ratingDistribution[item._id] = item.count;
    }
  });

  res.status(200).json({
    status: 'success',
    data: {
      stats: {
        totalReviews,
        averageRating,
        ratingDistribution,
        reviewsToday,
        reviewsThisWeek,
        reviewsThisMonth,
      },
    },
  });
});

// PATCH /api/reviews/admin/:id — Update review status or admin reply (Admin only)
exports.updateAdminReview = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status, adminReply } = req.body;

  const review = await Review.findById(id);
  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    review.status = status;
  }

  if (typeof adminReply === 'string') {
    review.adminReply = adminReply.trim();
  }

  await review.save();

  res.status(200).json({
    status: 'success',
    message: 'Review updated successfully',
    data: { review },
  });
});

// DELETE /api/reviews/admin/:id — Delete a review (Admin only)
exports.deleteAdminReview = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const review = await Review.findByIdAndDelete(id);
  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Review deleted successfully',
  });
});
