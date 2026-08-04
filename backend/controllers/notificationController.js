const Notification = require('../models/Notification');
const fcmService = require('../services/fcmService');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middleware/errorHandler');

/**
 * Register FCM / Push Token for current user
 * POST /api/notifications/fcm-token
 */
exports.registerFCMToken = asyncHandler(async (req, res, next) => {
  const { token, platform = 'android' } = req.body;

  if (!token) {
    return next(new AppError('FCM token is required', 400));
  }

  await fcmService.registerToken(req.user.id, token, platform);

  res.status(200).json({
    status: 'success',
    message: 'FCM Token registered successfully'
  });
});

/**
 * Get notifications for current user with filters, pagination, and unread count
 * GET /api/notifications
 */
exports.getMyNotifications = asyncHandler(async (req, res, next) => {
  const { category, search, unreadOnly, page = 1, limit = 20 } = req.query;

  const query = { recipient: req.user.id };

  if (unreadOnly === 'true') {
    query.isRead = false;
  }

  if (category && category !== 'all') {
    query.channelId = category;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { message: { $regex: search, $options: 'i' } }
    ];
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ recipient: req.user.id, isRead: false })
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      notifications,
      unreadCount,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum)
      }
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
 * Mark all notifications as read for current user
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
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipient: req.user.id
  });

  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: null
  });
});

const mongoose = require('mongoose');

/**
 * Clear all notifications for current user
 * DELETE /api/notifications/clear-all
 */
exports.clearAllNotifications = asyncHandler(async (req, res, next) => {
  const userId = req.user.id || req.user._id;
  const userObjectId = new mongoose.Types.ObjectId(userId);

  console.log('[CLEAR ALL NOTIFICATIONS] Starting deletion for user ID:', userId);

  const beforeCount = await Notification.countDocuments({
    $or: [{ recipient: userObjectId }, { recipient: userId }, { recipient: null }]
  });

  console.log('[CLEAR ALL NOTIFICATIONS] Documents count BEFORE deletion:', beforeCount);

  const result = await Notification.deleteMany({
    $or: [{ recipient: userObjectId }, { recipient: userId }, { recipient: null }]
  });

  const afterCount = await Notification.countDocuments({
    $or: [{ recipient: userObjectId }, { recipient: userId }, { recipient: null }]
  });

  console.log('[CLEAR ALL NOTIFICATIONS] Documents count AFTER deletion:', afterCount, '| Total Deleted:', result.deletedCount);

  res.status(200).json({
    status: 'success',
    message: 'All notifications cleared',
    deletedCount: result.deletedCount,
    data: {
      deletedCount: result.deletedCount
    }
  });
});

// =========================================================
// ADMIN NOTIFICATION API HANDLERS
// =========================================================

/**
 * Send notification to a specific user (Admin)
 * POST /api/notifications/send
 */
exports.sendToUser = asyncHandler(async (req, res, next) => {
  const { userId, title, message, imageUrl, channelId, priority, deepLink, notificationType } = req.body;

  if (!userId || !title || !message) {
    return next(new AppError('userId, title, and message are required', 400));
  }

  console.log('[NOTIFICATION CONTROLLER sendToUser] Received req.body.imageUrl:', imageUrl);

  const notification = await fcmService.sendToUser(userId, {
    title,
    message,
    imageUrl,
    channelId,
    priority,
    deepLink,
    notificationType: notificationType || Notification.NOTIFICATION_TYPES.ADMIN_BROADCAST
  });

  res.status(201).json({
    status: 'success',
    message: 'Notification sent successfully',
    data: { notification }
  });
});

/**
 * Broadcast notification to targeted audience (Admin)
 * POST /api/notifications/broadcast
 */
exports.broadcast = asyncHandler(async (req, res, next) => {
  const { title, message, imageUrl, channelId, priority, deepLink, targetAudience, userIds, notificationType } = req.body;

  if (!title || !message) {
    return next(new AppError('title and message are required', 400));
  }

  console.log('[NOTIFICATION CONTROLLER broadcast] Received req.body.imageUrl:', imageUrl);

  const result = await fcmService.broadcast({
    title,
    message,
    imageUrl,
    channelId,
    priority,
    deepLink,
    targetAudience: targetAudience || 'everyone',
    userIds: userIds || [],
    notificationType: notificationType || Notification.NOTIFICATION_TYPES.ADMIN_BROADCAST
  });

  res.status(200).json({
    status: 'success',
    message: `Broadcast completed. Sent to ${result.sentCount} devices (${result.totalRecipients} database records created).`,
    data: result
  });
});

/**
 * Get admin notification history / sent logs
 * GET /api/notifications/admin/list
 */
exports.getAdminNotificationsList = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20, search } = req.query;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const query = {};
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { message: { $regex: search, $options: 'i' } }
    ];
  }

  const [notifications, total] = await Promise.all([
    Notification.find(query)
      .populate('recipient', 'fullName mobile email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Notification.countDocuments(query)
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      notifications,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum)
      }
    }
  });
});
