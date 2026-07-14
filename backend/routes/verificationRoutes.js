const express = require('express');
const verificationController = require('../controllers/verificationController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/submit', verificationController.submitVerification);
router.post('/extract', verificationController.extractReceiptDetails);
router.get('/status', verificationController.getVerificationStatus);
router.get('/settings', verificationController.getSettings);

// Admin-only routes
router.put('/settings', restrictTo('admin'), verificationController.updateSettings);
router.get('/pending-count', restrictTo('admin'), verificationController.getPendingVerificationsCount);
router.get('/pending', restrictTo('admin'), verificationController.getPendingVerifications);
router.get('/requests', restrictTo('admin'), verificationController.getVerificationsByStatus);
router.patch('/update/:id', restrictTo('admin'), verificationController.updateVerificationStatus);

module.exports = router;
