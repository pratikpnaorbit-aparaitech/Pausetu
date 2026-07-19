/**
 * useWebAutoRefresh.js — Web Hook for Silent Global Auto Refresh
 * Handles Page Visibility API (visibilitychange), Window Focus, and RefreshManager events.
 */

import { useEffect, useRef, useCallback } from 'react';
import { refreshManager } from '../services/refreshManager';

/**
 * Reusable Web Auto Refresh Hook
 * 
 * @param {function} refreshCallback Async function to refetch data for active page
 * @param {object} options Options object
 * @param {Array<string>} options.events Array of REFRESH_EVENTS to subscribe to
 * @param {string} options.pageKey Unique key for deduplication
 * @param {boolean} options.enabled Enable/disable hook (default true)
 */
export function useWebAutoRefresh(refreshCallback, options = {}) {
  const { events = [], pageKey = 'GlobalPage', enabled = true } = options;

  const callbackRef = useRef(refreshCallback);

  useEffect(() => {
    callbackRef.current = refreshCallback;
  }, [refreshCallback]);

  // Execute refetch safely with deduplication
  const safeRefetch = useCallback(() => {
    if (!enabled || !callbackRef.current || document.hidden || !navigator.onLine) return;

    refreshManager.executeDeduplicated(pageKey, async () => {
      try {
        await callbackRef.current();
      } catch (err) {
        console.warn(`[useWebAutoRefresh] Refetch failed for ${pageKey}:`, err.message);
      }
    });
  }, [enabled, pageKey]);

  // 1. Page Visibility API & Window Focus Events
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        safeRefetch();
      }
    };

    const handleWindowFocus = () => {
      safeRefetch();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [enabled, safeRefetch]);

  // 2. Subscriptions to Centralized Refresh Events
  useEffect(() => {
    if (!enabled || !events || events.length === 0) return;

    const unsubscribes = events.map(event => {
      return refreshManager.subscribe(event, () => {
        if (!document.hidden) {
          safeRefetch();
        }
      });
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [enabled, events, safeRefetch]);
}
