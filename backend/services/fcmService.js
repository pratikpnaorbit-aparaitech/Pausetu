const { Expo } = require('expo-server-sdk');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Initialize Expo SDK Client
const expo = new Expo();

/**
 * Send push notification to a user or multiple users via Expo / FCM Push Gateway
 */
class FCMService {
  /**
   * Register or update FCM / Push Token for a user
   */
  async registerToken(userId, token, platform = 'android') {
    if (!token) return null;

    const user = await User.findById(userId);
    if (!user) return null;

    user.fcmToken = token;
    
    // Add token to fcmTokens array if not already present
    const existingIndex = user.fcmTokens.findIndex(t => t.token === token);
    if (existingIndex >= 0) {
      user.fcmTokens[existingIndex].updatedAt = new Date();
      user.fcmTokens[existingIndex].platform = platform;
    } else {
      user.fcmTokens.push({ token, platform, updatedAt: new Date() });
    }

    await user.save();
    console.log(`[FCMService] Token registered for user ${user._id}: ${token.substring(0, 20)}...`);
    return user;
  }

  /**
   * Send notification to a single user
   */
  async sendToUser(userId, payload) {
    const user = await User.findById(userId);
    if (!user || !user.pushNotificationEnabled) return null;

    const tokens = [];
    if (user.fcmToken && Expo.isExpoPushToken(user.fcmToken)) {
      tokens.push(user.fcmToken);
    }
    (user.fcmTokens || []).forEach(t => {
      if (Expo.isExpoPushToken(t.token) && !tokens.includes(t.token)) {
        tokens.push(t.token);
      }
    });

    // 1. Save Notification Record in DB
    const dbNotif = await Notification.create({
      recipient: user._id,
      title: payload.title,
      message: payload.message || payload.body,
      imageUrl: payload.imageUrl || null,
      notificationType: payload.notificationType || Notification.NOTIFICATION_TYPES.SYSTEM,
      channelId: payload.channelId || Notification.NOTIFICATION_CHANNELS.GENERAL,
      priority: payload.priority || 'high',
      deepLink: payload.deepLink || { screen: payload.screen || null, params: payload.params || {} },
      targetAudience: 'specific',
      status: 'sent',
      sentAt: new Date()
    });

    // 2. Dispatch Push Notification if valid tokens exist
    if (tokens.length > 0) {
      await this.dispatchPushMessages(tokens, payload, dbNotif._id);
    }

    return dbNotif;
  }

  /**
   * Broadcast notification to a targeted audience
   */
  async broadcast(payload) {
    const { targetAudience = 'everyone', userIds = [] } = payload;
    let query = { pushNotificationEnabled: { $ne: false } };

    if (targetAudience === 'premium') {
      query.isPremium = true;
    } else if (targetAudience === 'free') {
      query.isPremium = false;
    } else if (targetAudience === 'sellers') {
      query.role = 'seller';
    } else if (targetAudience === 'buyers') {
      query.role = 'buyer';
    } else if (targetAudience === 'verified') {
      query['verification.status'] = 'approved';
    } else if (targetAudience === 'specific' && userIds.length > 0) {
      query._id = { $in: userIds };
    }

    const users = await User.find(query).select('_id fcmToken fcmTokens').lean();
    if (users.length === 0) {
      console.log(`[FCMService] No target users found for audience: ${targetAudience}`);
      return { totalRecipients: 0, sentCount: 0 };
    }

    // Prepare DB Records & Tokens
    const dbRecords = [];
    const pushMessages = [];

    for (const u of users) {
      dbRecords.push({
        recipient: u._id,
        title: payload.title,
        message: payload.message || payload.body,
        imageUrl: payload.imageUrl || null,
        notificationType: payload.notificationType || Notification.NOTIFICATION_TYPES.ADMIN_BROADCAST,
        channelId: payload.channelId || Notification.NOTIFICATION_CHANNELS.ADMIN,
        priority: payload.priority || 'high',
        deepLink: payload.deepLink || { screen: payload.screen || null, params: payload.params || {} },
        targetAudience,
        status: 'sent',
        sentAt: new Date()
      });

      const userTokens = [];
      if (u.fcmToken && Expo.isExpoPushToken(u.fcmToken)) userTokens.push(u.fcmToken);
      (u.fcmTokens || []).forEach(t => {
        if (Expo.isExpoPushToken(t.token) && !userTokens.includes(t.token)) userTokens.push(t.token);
      });

      userTokens.forEach(token => {
        pushMessages.push({
          to: token,
          sound: payload.channelId === 'marketplace' || payload.channelId === 'premium' ? 'default' : 'default',
          title: payload.title,
          body: payload.message || payload.body,
          data: {
            screen: payload.deepLink?.screen || payload.screen || 'Notifications',
            params: payload.deepLink?.params || payload.params || {},
            type: payload.notificationType || 'ADMIN_BROADCAST',
            channelId: payload.channelId || 'admin',
            imageUrl: payload.imageUrl || null
          },
          channelId: payload.channelId || 'admin',
          priority: payload.priority === 'high' ? 'high' : 'default',
          badge: 1
        });
      });
    }

    // Save DB Notifications in bulk
    await Notification.insertMany(dbRecords);

    // Batch send via Expo / FCM Push Gateway
    let sentCount = 0;
    if (pushMessages.length > 0) {
      const chunks = expo.chunkPushNotifications(pushMessages);
      for (const chunk of chunks) {
        try {
          const receipts = await expo.sendPushNotificationsAsync(chunk);
          sentCount += receipts.length;
        } catch (error) {
          console.error('[FCMService] Error sending push chunk:', error);
        }
      }
    }

    console.log(`[FCMService] Broadcast complete. DB Records: ${dbRecords.length}, Push Sent: ${sentCount}`);
    return { totalRecipients: dbRecords.length, sentCount };
  }

  /**
   * Internal helper to dispatch push messages chunk by chunk
   */
  async dispatchPushMessages(tokens, payload, notificationId) {
    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title: payload.title,
      body: payload.message || payload.body,
      data: {
        notificationId: notificationId.toString(),
        screen: payload.deepLink?.screen || payload.screen || 'Notifications',
        params: payload.deepLink?.params || payload.params || {},
        type: payload.notificationType || 'SYSTEM',
        channelId: payload.channelId || 'general',
        imageUrl: payload.imageUrl || null
      },
      channelId: payload.channelId || 'general',
      priority: payload.priority === 'high' ? 'high' : 'default',
      badge: 1
    }));

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (err) {
        console.error('[FCMService] Dispatch push error:', err);
      }
    }
  }

  // =========================================================
  // AUTOMATIC EVENT NOTIFICATIONS HELPERS
  // =========================================================

  async sendListingApproved(userId, animal) {
    return this.sendToUser(userId, {
      title: '🎉 Listing Approved!',
      message: `Great news! Your ${animal.title || animal.breed || 'animal'} listing has been approved and is now live on PashuSetu Marketplace.`,
      notificationType: Notification.NOTIFICATION_TYPES.LISTING_APPROVED,
      channelId: Notification.NOTIFICATION_CHANNELS.MARKETPLACE,
      priority: 'high',
      deepLink: { screen: 'AnimalDetails', params: { id: animal._id } }
    });
  }

  async sendListingRejected(userId, animal, reason = '') {
    return this.sendToUser(userId, {
      title: '⚠️ Listing Update Required',
      message: `Your listing for ${animal.title || animal.breed || 'animal'} was not approved.${reason ? ` Reason: ${reason}` : ' Please check details and re-submit.'}`,
      notificationType: Notification.NOTIFICATION_TYPES.LISTING_REJECTED,
      channelId: Notification.NOTIFICATION_CHANNELS.MARKETPLACE,
      priority: 'high',
      deepLink: { screen: 'MyListings', params: {} }
    });
  }

  async sendSubscriptionActivated(userId, planName, expiresAt) {
    const formattedDate = new Date(expiresAt).toLocaleDateString();
    return this.sendToUser(userId, {
      title: '👑 Premium Activated!',
      message: `Congratulations! Your ${planName} is active until ${formattedDate}. All premium tools, AI Feed Planner & Price Estimator are unlocked!`,
      notificationType: Notification.NOTIFICATION_TYPES.SUBSCRIPTION_ACTIVATED,
      channelId: Notification.NOTIFICATION_CHANNELS.PREMIUM,
      priority: 'high',
      deepLink: { screen: 'Subscription', params: {} }
    });
  }

  async sendSubscriptionExpiring(userId, daysLeft) {
    return this.sendToUser(userId, {
      title: `⏳ Premium Expiring in ${daysLeft} ${daysLeft === 1 ? 'Day' : 'Days'}`,
      message: `Your PashuSetu Premium membership expires in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}. Renew now to maintain uninterrupted access.`,
      notificationType: Notification.NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRING,
      channelId: Notification.NOTIFICATION_CHANNELS.PREMIUM,
      priority: 'high',
      deepLink: { screen: 'Subscription', params: {} }
    });
  }

  async sendVerificationApproved(userId) {
    return this.sendToUser(userId, {
      title: '✅ Farmer Verification Approved!',
      message: 'Congratulations! Your farmer identity has been verified. A Verified Badge is now displayed on all your animal listings.',
      notificationType: Notification.NOTIFICATION_TYPES.VERIFICATION_APPROVED,
      channelId: Notification.NOTIFICATION_CHANNELS.ADMIN,
      priority: 'high',
      deepLink: { screen: 'Profile', params: {} }
    });
  }

  async sendVerificationRejected(userId, reason = '') {
    return this.sendToUser(userId, {
      title: '❌ Verification Not Approved',
      message: `Your farmer verification submission was rejected.${reason ? ` Reason: ${reason}` : ''} Please submit a valid receipt to re-verify.`,
      notificationType: Notification.NOTIFICATION_TYPES.VERIFICATION_REJECTED,
      channelId: Notification.NOTIFICATION_CHANNELS.ADMIN,
      priority: 'high',
      deepLink: { screen: 'Verification', params: {} }
    });
  }
}

module.exports = new FCMService();
