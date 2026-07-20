const express = require('express');
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(restrictTo('admin'));

router.get('/dashboard-stats', adminController.getDashboardStats);
router.get('/users', adminController.getUsers);
router.patch('/verify-seller/:id', adminController.verifySeller);
router.patch('/manage-user/:id', adminController.manageUserStatus);
router.patch('/manage-premium/:id', adminController.togglePremiumStatus);

module.exports = router;
