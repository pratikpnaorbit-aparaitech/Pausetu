const express = require('express');
const subscriptionAdminController = require('../controllers/subscriptionAdminController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// Admin-only protection
router.use(protect);
router.use(restrictTo('admin'));

// Dashboard Stats & Metrics
router.get('/dashboard', subscriptionAdminController.getSubscriptionDashboard);

// Plan Management CRUD
router.get('/plans', subscriptionAdminController.getAllPlans);
router.post('/plans', subscriptionAdminController.createPlan);
router.put('/plans/:id', subscriptionAdminController.updatePlan);
router.delete('/plans/:id', subscriptionAdminController.deletePlan);
router.patch('/plans/:id/toggle', subscriptionAdminController.togglePlanStatus);

// Subscribers Directory & Transactions Log
router.get('/subscribers', subscriptionAdminController.getSubscribers);
router.get('/transactions', subscriptionAdminController.getTransactions);

module.exports = router;
