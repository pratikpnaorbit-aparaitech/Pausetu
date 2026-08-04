import { useEffect, useRef, useCallback } from 'react';
import { refreshManager, REFRESH_EVENTS } from '../services/refreshManager';

/**
 * Custom Auto Refresh Hook for Subscription Module
 * @param {Function} fetchFn Function to execute on refresh (receives isBackground = true)
 * @param {Object} options Options object
 * @param {string} options.pageKey Key for in-flight request deduplication
 * @param {boolean} options.isEditing Active form/modal edit state (pauses polling if true)
 * @param {number} options.intervalMs Interval in milliseconds (default 30000 = 30 seconds)
 */
export function useSubscriptionAutoRefresh(fetchFn, options = {}) {
  const { pageKey = 'SubscriptionPage', isEditing = false, intervalMs = 30000 } = options;
  const fetchRef = useRef(fetchFn);

  useEffect(() => {
    fetchRef.current = fetchFn;
  }, [fetchFn]);

  const executeRefresh = useCallback((isBackground = true) => {
    if (document.hidden || !navigator.onLine || isEditing) return;

    refreshManager.executeDeduplicated(pageKey, async () => {
      try {
        if (fetchRef.current) {
          await fetchRef.current(isBackground);
        }
      } catch (err) {
        console.warn(`[SubscriptionAutoRefresh] Refetch error for ${pageKey}:`, err?.message);
      }
    });
  }, [pageKey, isEditing]);

  // 1. Listen to Subscription & Plan events
  useEffect(() => {
    const unsub1 = refreshManager.subscribe(REFRESH_EVENTS.SUBSCRIPTION_UPDATED, () => executeRefresh(true));
    const unsub2 = refreshManager.subscribe(REFRESH_EVENTS.PLAN_UPDATED, () => executeRefresh(true));

    return () => {
      unsub1();
      unsub2();
    };
  }, [executeRefresh]);

  // 2. 30-Second Background Polling Timer
  useEffect(() => {
    if (isEditing) return;

    const timer = setInterval(() => {
      executeRefresh(true);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs, isEditing, executeRefresh]);

  // 3. Tab Visibility & Focus Listeners
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        executeRefresh(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [executeRefresh]);
}

export default useSubscriptionAutoRefresh;
