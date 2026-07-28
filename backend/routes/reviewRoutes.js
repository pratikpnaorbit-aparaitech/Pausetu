const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Protect all review routes (must be logged in)
router.use(protect);

// Mobile user routes
router.get('/my', reviewController.getUserReview);
router.post('/', reviewController.createOrUpdateReview);
router.put('/:id', reviewController.createOrUpdateReview);

// Admin only routes
router.use(restrictTo('admin', 'super-admin'));

router.get('/admin/stats', reviewController.getAdminReviewStats);
router.get('/admin', reviewController.getAdminReviews);
router.patch('/admin/:id', reviewController.updateAdminReview);
router.delete('/admin/:id', reviewController.deleteAdminReview);

module.exports = router;
