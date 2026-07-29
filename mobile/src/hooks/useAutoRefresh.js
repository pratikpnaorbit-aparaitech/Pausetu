/**
 * useAutoRefresh.js — Mobile Hook for Silent Global Auto Refresh
 * Handles Screen Focus, App Background-to-Foreground (AppState), and RefreshManager events.
 */

import { useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { refreshManager } from '../services/refreshManager';

/**
 * Reusable Mobile Auto Refresh Hook
 * 
 * @param {function} refreshCallback Async function to refetch data for active screen
 * @param {object} options Options object
 * @param {Array<string>} options.events Array of REFRESH_EVENTS to subscribe to
 * @param {string} options.screenKey Unique key for deduplication
 * @param {boolean} options.enabled Enable/disable hook (default true)
 */
export function useAutoRefresh(refreshCallback, options = {}) {
  const { events = [], screenKey = 'GlobalScreen', enabled = true } = options;

  const callbackRef = useRef(refreshCallback);
  const isFocusedRef = useRef(false);

  useEffect(() => {
    callbackRef.current = refreshCallback;
  }, [refreshCallback]);

  // Stabilize events array dependency across parent component re-renders
  const eventsSerialized = JSON.stringify(events);
  const memoizedEvents = useMemo(() => {
    try {
      return JSON.parse(eventsSerialized);
    } catch (_) {
      return events;
    }
  }, [eventsSerialized]);

  // Execute refetch safely with deduplication
  const safeRefetch = useCallback((force = false) => {
    if (!enabled || !callbackRef.current) return;
    refreshManager.executeDeduplicated(screenKey, async () => {
      try {
        await callbackRef.current();
      } catch (err) {
        console.warn(`[useAutoRefresh] Refetch failed for ${screenKey}:`, err.message);
      }
    }, force);
  }, [enabled, screenKey]);

  // 1. Navigation Focus Effect (Triggered when screen becomes active or user returns)
  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;
      safeRefetch(false); // Do not force, respect focus throttle cooldown

      return () => {
        isFocusedRef.current = false;
      };
    }, [safeRefetch])
  );

  // 2. AppState Transition (Triggered when app comes back from background to foreground)
  useEffect(() => {
    if (!enabled) return;

    const handleAppStateChange = (nextState) => {
      if (nextState === 'active' && isFocusedRef.current) {
        safeRefetch(false); // Do not force, respect AppState throttle cooldown
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [enabled, safeRefetch]);

  // 3. Subscriptions to Centralized Refresh Events
  useEffect(() => {
    if (!enabled || !memoizedEvents || memoizedEvents.length === 0) return;

    const unsubscribes = memoizedEvents.map(event => {
      return refreshManager.subscribe(event, () => {
        if (isFocusedRef.current) {
          safeRefetch(true); // Force refetch because explicit centralized data event was received
        }
      });
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [enabled, memoizedEvents, safeRefetch]);
}
