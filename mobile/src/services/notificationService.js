import * as Notifications from 'expo-notifications';
import * as Device from 'expo-constants';
import { Platform } from 'react-native';
import api from '../api/api';

// Configure Foreground Notification Presentation Handler
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Android Notification Channels Configuration
 */
export const NOTIFICATION_CHANNELS = {
  MARKETPLACE: 'marketplace',
  PREMIUM: 'premium',
  ORDERS: 'orders',
  ADMIN: 'admin',
  GENERAL: 'general',
  HIGH_PRIORITY: 'high_priority'
};

class MobileNotificationService {
  constructor() {
    this.token = null;
    this.responseListener = null;
    this.receivedListener = null;
    console.log('[NotificationService] Initializing...');
  }

  /**
   * Setup Android Notification Channels
   */
  async setupChannels() {
    if (Platform.OS === 'android') {
      try {
        // 1. Marketplace Channel
        await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.MARKETPLACE, {
          name: 'Marketplace Updates',
          description: 'Notifications for animal approvals, inquiries, price drops & listing status.',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#16A34A',
          sound: 'default',
          enableVibrate: true,
          showBadge: true
        });

        // 2. Premium Channel
        await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.PREMIUM, {
          name: 'PashuSetu Premium',
          description: 'Subscription status, renewal reminders, and AI advisor updates.',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#7C3AED',
          sound: 'default',
          enableVibrate: true,
          showBadge: true
        });

        // 3. Orders Channel
        await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.ORDERS, {
          name: 'Orders & Payments',
          description: 'Transaction receipts and payment status notifications.',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2563EB',
          sound: 'default',
          enableVibrate: true,
          showBadge: true
        });

        // 4. Admin Channel
        await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.ADMIN, {
          name: 'Official Announcements',
          description: 'Important updates and verification notices from PashuSetu Team.',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 500, 500],
          lightColor: '#DC2626',
          sound: 'default',
          enableVibrate: true,
          showBadge: true
        });

        // 5. General Channel
        await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.GENERAL, {
          name: 'General Notifications',
          description: 'Tips, community news and general app alerts.',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#059669',
          sound: 'default',
          enableVibrate: true,
          showBadge: true
        });

        // 6. High Priority Channel
        await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.HIGH_PRIORITY, {
          name: 'High Priority Alerts',
          description: 'Critical system and safety alerts.',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 500, 250],
          lightColor: '#EA580C',
          sound: 'default',
          enableVibrate: true,
          showBadge: true
        });

        console.log('[NotificationService] Android notification channels initialized successfully.');
      } catch (err) {
        console.warn('[NotificationService] Channel setup notice:', err.message);
      }
    }
  }

  /**
   * Request Push Permission and Register FCM/Expo Token with Backend
   */
  async registerForPushNotifications() {
    if (Platform.OS === 'web') {
      console.log('[NotificationService] Push notification token registration skipped on Web.');
      return null;
    }

    try {
      await this.setupChannels();

      // Check current permission status
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[NotificationService] Push notification permission denied by user.');
        return null;
      }

      // Generate Push Token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'ddfdd79d-6fcd-4769-bb29-54292636d827'
      });

      this.token = tokenData.data;
      console.log('[NotificationService] FCM/Expo Token generated:', this.token);

      // Send token to backend API
      await this.syncTokenWithBackend(this.token);
      return this.token;
    } catch (error) {
      console.warn('[NotificationService] Error registering for push notifications:', error.message);
      return null;
    }
  }

  /**
   * Sync Token to Backend API
   */
  async syncTokenWithBackend(token) {
    if (!token) return;
    try {
      await api.post('/notifications/fcm-token', {
        token,
        platform: Platform.OS
      });
      console.log('[NotificationService] Token synced to PashuSetu backend successfully.');
    } catch (err) {
      console.warn('[NotificationService] Failed to sync token with backend:', err.message);
    }
  }

  /**
   * Register Notification Response & Deep Linking Listener
   * @param {Object} navigation React Navigation object
   */
  attachNavigationListener(navigation) {
    if (Platform.OS === 'web') return;

    try {
      // 1. Handle notification click when app is opened / in background / killed
      this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        try {
          const data = response?.notification?.request?.content?.data || {};
          console.log('[NotificationService] Notification tapped with data:', data);

          const screen = data.screen;
          const params = data.params || {};

          if (screen && navigation) {
            if (screen === 'AnimalDetails' && params.id) {
              navigation.navigate('AnimalDetails', { id: params.id });
            } else if (screen === 'Subscription') {
              navigation.navigate('Subscription');
            } else if (screen === 'FeedPlanner') {
              navigation.navigate('MainApp', { screen: 'Post' });
            } else if (screen === 'Bid' || screen === 'MarketPrice') {
              navigation.navigate('MainApp', { screen: 'Bid' });
            } else if (screen === 'MyListings') {
              navigation.navigate('MyListings');
            } else if (screen === 'Profile') {
              navigation.navigate('Profile');
            } else if (screen === 'Verification') {
              navigation.navigate('Verification');
            } else {
              navigation.navigate('Notifications');
            }
          }
        } catch (err) {
          console.warn('[NotificationService] Deep link navigation error:', err.message);
        }
      });

      console.log('[NotificationService] Listener registered.');
    } catch (err) {
      console.warn('[NotificationService] Listener registration error:', err.message);
    }
  }

  /**
   * Cross-version and cross-platform safe helper to remove subscriptions
   */
  removeSubscription(subscription) {
    if (!subscription) return;
    try {
      if (typeof subscription.remove === 'function') {
        subscription.remove();
      } else if (typeof Notifications.removeNotificationSubscription === 'function') {
        Notifications.removeNotificationSubscription(subscription);
      }
    } catch (err) {
      console.warn('[NotificationService] Error removing notification subscription:', err.message);
    }
  }

  /**
   * Clean up listeners safely without crashing during unmount
   */
  cleanup() {
    console.log('[NotificationService] Cleaning up...');
    try {
      if (this.responseListener) {
        this.removeSubscription(this.responseListener);
        this.responseListener = null;
        console.log('[NotificationService] Listener removed successfully.');
      }
      if (this.receivedListener) {
        this.removeSubscription(this.receivedListener);
        this.receivedListener = null;
        console.log('[NotificationService] Listener removed successfully.');
      }
    } catch (err) {
      console.warn('[NotificationService] Cleanup error handled safely:', err.message);
    }
  }
}

export const mobileNotificationService = new MobileNotificationService();
export default mobileNotificationService;
