const express = require('express');
const verificationController = require('../controllers/verificationController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes (accessible by guest, buyer, seller, admin)
router.get('/settings', verificationController.getSettings);

// Authenticated user routes
router.post('/submit', protect, verificationController.submitVerification);
router.post('/extract', protect, verificationController.extractReceiptDetails);
router.get('/status', protect, verificationController.getVerificationStatus);

// Admin-only routes
router.put('/settings', protect, restrictTo('admin'), verificationController.updateSettings);
router.get('/pending-count', protect, restrictTo('admin'), verificationController.getPendingVerificationsCount);
router.get('/pending', protect, restrictTo('admin'), verificationController.getPendingVerifications);
router.get('/requests', protect, restrictTo('admin'), verificationController.getVerificationsByStatus);
router.patch('/update/:id', protect, restrictTo('admin'), verificationController.updateVerificationStatus);

module.exports = router;
