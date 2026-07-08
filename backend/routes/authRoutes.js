const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Rate limiter for OTP requests (max 5 requests per 15 minutes per IP)
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    status: 'fail',
    message: 'Too many OTP requests from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/send-otp', otpLimiter, authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.get('/me', protect, authController.getMe);

module.exports = router;
