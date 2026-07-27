const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middleware/errorHandler');

/**
 * Get all notifications for the current user
 * Returns unread first, then newest first
 */
exports.getMyNotifications = asyncHandler(async (req, res, next) => {
  const notifications = await Notification.find({ recipient: req.user.id })
    .sort({ isRead: 1, createdAt: -1 }) // unread first (false < true), then newest first
    .lean();

  res.status(200).json({
    status: 'success',
    data: {
      notifications
    }
  });
});

/**
 * Mark a single notification as read
 * PATCH /api/notifications/:id/read
 */
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user.id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      notification
    }
  });
});

/**
 * Mark all notifications as read for the current user
 * PATCH /api/notifications/read-all
 */
exports.markAllRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany(
    { recipient: req.user.id, isRead: false },
    { isRead: true }
  );

  res.status(200).json({
    status: 'success',
    message: 'All notifications marked as read'
  });
});

/**
 * Delete a single notification
 * DELETE /api/notifications/:id
 */
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  if (notification.recipient.toString() !== req.user.id.toString()) {
    return next(new AppError('You do not have permission to delete this notification', 403));
  }

  await Notification.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: 'success',
    data: null
  });
});

/**
 * Clear all notifications for the current user
 * DELETE /api/notifications/clear-all
 */
exports.clearAllNotifications = asyncHandler(async (req, res, next) => {
  await Notification.deleteMany({ recipient: req.user.id });

  res.status(200).json({
    status: 'success',
    message: 'All notifications cleared'
  });
});
