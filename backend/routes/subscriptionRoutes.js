const express = require('express');
const subscriptionPlanController = require('../controllers/subscriptionPlanController');
const subscriptionController = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Public / Mobile Route: Get active plans
router.get('/plans', subscriptionPlanController.getActivePlans);

// Razorpay Webhook (unprotected, verified via Razorpay signature)
router.post('/webhook', express.raw({ type: 'application/json' }), subscriptionController.handleWebhook);

// Protected Routes (Requires JWT auth)
router.use(protect);

router.get('/status', subscriptionController.getSubscriptionStatus);
router.post('/create-order', subscriptionController.createRazorpayOrder);
router.post('/verify-payment', subscriptionController.verifyPayment);
router.post('/cancel', subscriptionController.cancelSubscription);

module.exports = router;
