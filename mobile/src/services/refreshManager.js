/**
 * refreshManager.js — Mobile Event Bus for Global Auto Refresh
 * Centralized pub-sub manager with debouncing and in-flight deduplication.
 */

export const REFRESH_EVENTS = {
  LISTING_CREATED: 'listing_created',
  LISTING_UPDATED: 'listing_updated',
  LISTING_DELETED: 'listing_deleted',
  PROFILE_UPDATED: 'profile_updated',
  LOCATION_UPDATED: 'location_updated',
  VERIFICATION_UPDATED: 'verification_updated',
  NOTIFICATION_UPDATED: 'notification_updated',
  FAVORITE_UPDATED: 'favorite_updated',
  CHAT_UPDATED: 'chat_updated'
};

class RefreshEventManager {
  constructor() {
    this.listeners = new Map();
    this.debounceTimers = new Map();
    this.inFlightRequests = new Set();
    this.lastRunTimestamps = new Map();
  }

  /**
   * Subscribe a listener to a specific refresh event.
   * @param {string} event 
   * @param {function} listener 
   * @returns {function} Unsubscribe callback
   */
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

  /**
   * Emit a refresh event immediately.
   * @param {string} event 
   * @param {any} data 
   */
  emitImmediate(event, data = null) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners && eventListeners.size > 0) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (e) {
          console.warn(`[RefreshManager] Listener error on event '${event}':`, e);
        }
      });
    }
  }

  /**
   * Emit a refresh event with 300ms debouncing to merge rapid duplicate calls.
   * @param {string} event 
   * @param {any} data 
   * @param {number} delay 
   */
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

  /**
   * Execute an async fetch with deduplication and optional cooldown throttling.
   * @param {string} key 
   * @param {function} asyncTask 
   * @param {boolean} force Bypass cooldown throttling (default false)
   * @param {number} cooldownMs Cooldown time in milliseconds (default 15000)
   */
  async executeDeduplicated(key, asyncTask, force = false, cooldownMs = 15000) {
    if (this.inFlightRequests.has(key)) {
      return null;
    }

    if (!force) {
      const lastRun = this.lastRunTimestamps.get(key) || 0;
      const now = Date.now();
      if (now - lastRun < cooldownMs) {
        console.log(`[RefreshManager] Throttled duplicate request for '${key}' (${now - lastRun}ms < ${cooldownMs}ms)`);
        return null;
      }
    }

    this.inFlightRequests.add(key);
    try {
      const res = await asyncTask();
      this.lastRunTimestamps.set(key, Date.now());
      return res;
    } finally {
      this.inFlightRequests.delete(key);
    }
  }
}

export const refreshManager = new RefreshEventManager();
