const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middleware/errorHandler');

/**
 * Get all notifications for current user
 */
exports.getMyNotifications = asyncHandler(async (req, res, next) => {
  let notifications = await Notification.find({ recipient: req.user.id }).sort({ createdAt: -1 });
  
  if (notifications.length === 0) {
    await Notification.create([
      {
        recipient: req.user.id,
        title: 'सदस्यता संपण्याची आठवण / Membership Expiry Reminder',
        message: 'तुमचे सत्यापित सदस्यत्व ७ दिवसांत संपणार आहे. कृपया तुमचे तपशील अद्ययावत ठेवा. / Your verified membership will expire in 7 days. Please keep your details updated.',
        type: 'alert'
      },
      {
        recipient: req.user.id,
        title: 'सदस्यत्व सक्रिय झाले / Membership Activated',
        message: 'तुमचे सत्यापित सदस्यत्व यशस्वीरित्या सक्रिय झाले आहे. / Your verified membership has been successfully activated.',
        type: 'success'
      },
      {
        recipient: req.user.id,
        title: 'पशुसेतू मध्ये आपले स्वागत आहे / Welcome to PashuSetu',
        message: 'पशुसेतू मध्ये आपले स्वागत आहे! खरेदी, विक्री आणि बिडिंग सुरू करा. / Welcome to PashuSetu! Start buying, selling, and bidding.',
        type: 'info'
      }
    ]);
    notifications = await Notification.find({ recipient: req.user.id }).sort({ createdAt: -1 });
  }

  res.status(200).json({
    status: 'success',
    data: {
      notifications
    }
  });
});

/**
 * Mark notification as read
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
 * Delete a notification
 */
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipient: req.user.id
  });

  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

/**
 * Mark all notifications as read for current user
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
