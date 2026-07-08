const express = require('express');
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.route('/').get(notificationController.getMyNotifications);
router.route('/:id/read').patch(notificationController.markAsRead);
router.route('/:id').delete(notificationController.deleteNotification);

module.exports = router;
