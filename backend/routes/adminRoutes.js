const express = require('express');
const adminController = require('../controllers/adminController');
const reviewController = require('../controllers/reviewController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(restrictTo('admin', 'super-admin'));

router.get('/dashboard-stats', adminController.getDashboardStats);
router.get('/users', adminController.getUsers);
router.patch('/verify-seller/:id', adminController.verifySeller);
router.patch('/manage-user/:id', adminController.manageUserStatus);
router.patch('/manage-premium/:id', adminController.togglePremiumStatus);

// Review Management Endpoints under /api/admin/reviews
router.get('/reviews/stats', reviewController.getAdminReviewStats);
router.get('/reviews', reviewController.getAdminReviews);
router.patch('/reviews/:id', reviewController.updateAdminReview);
router.delete('/reviews/:id', reviewController.deleteAdminReview);

module.exports = router;
