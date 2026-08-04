/**
 * refreshManager.js — Web Event Bus for Global Auto Refresh
 * Centralized pub-sub manager with debouncing and in-flight deduplication.
 */

export const REFRESH_EVENTS = {
  LISTING_CREATED: 'listing_created',
  LISTING_UPDATED: 'listing_updated',
  LISTING_DELETED: 'listing_deleted',
  PROFILE_UPDATED: 'profile_updated',
  VERIFICATION_CREATED: 'verification_created',
  VERIFICATION_APPROVED: 'verification_approved',
  VERIFICATION_REJECTED: 'verification_rejected',
  VERIFICATION_UPDATED: 'verification_updated',
  NOTIFICATION_UPDATED: 'notification_updated',
  NOTIFICATION_SENT: 'notification_sent',
  FAVORITE_UPDATED: 'favorite_updated',
  CHAT_UPDATED: 'chat_updated',
  SUBSCRIPTION_UPDATED: 'subscription_updated',
  PLAN_UPDATED: 'plan_updated'
};

class RefreshEventManager {
  constructor() {
    this.listeners = new Map();
    this.debounceTimers = new Map();
    this.inFlightRequests = new Set();
  }

  subscribe(event, listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(listener);

    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(listener);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  emitImmediate(event, data = null) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners && eventListeners.size > 0) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (e) {
          console.warn(`[WebRefreshManager] Listener error on event '${event}':`, e);
        }
      });
    }
  }

  emit(event, data = null, delay = 300) {
    if (this.debounceTimers.has(event)) {
      clearTimeout(this.debounceTimers.get(event));
    }

    const timer = setTimeout(() => {
      this.debounceTimers.delete(event);
      this.emitImmediate(event, data);
    }, delay);

    this.debounceTimers.set(event, timer);
  }

  async executeDeduplicated(key, asyncTask) {
    if (this.inFlightRequests.has(key)) {
      return null;
    }
    this.inFlightRequests.add(key);
    try {
      return await asyncTask();
    } finally {
      this.inFlightRequests.delete(key);
    }
  }
}

export const refreshManager = new RefreshEventManager();
