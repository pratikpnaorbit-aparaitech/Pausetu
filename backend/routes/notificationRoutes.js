const express = require('express');
const notificationController = require('../controllers/notificationController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// Protected Routes (Require Authentication)
router.use(protect);

// Mobile Client Routes
router.post('/fcm-token', notificationController.registerFCMToken);
router.get('/', notificationController.getMyNotifications);
router.patch('/read-all', notificationController.markAllRead);
router.delete('/clear-all', notificationController.clearAllNotifications);
router.patch('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

// Admin Only Routes
router.post('/send', restrictTo('admin'), notificationController.sendToUser);
router.post('/broadcast', restrictTo('admin'), notificationController.broadcast);
router.get('/admin/list', restrictTo('admin'), notificationController.getAdminNotificationsList);

module.exports = router;
