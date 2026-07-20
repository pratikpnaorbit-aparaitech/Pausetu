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

  // Execute refetch safely with deduplication
  const safeRefetch = useCallback(() => {
    if (!enabled || !callbackRef.current) return;
    refreshManager.executeDeduplicated(screenKey, async () => {
      try {
        await callbackRef.current();
      } catch (err) {
        console.warn(`[useAutoRefresh] Refetch failed for ${screenKey}:`, err.message);
      }
    });
  }, [enabled, screenKey]);

  // 1. Navigation Focus Effect (Triggered when screen becomes active or user returns)
  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;
      safeRefetch();

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
        safeRefetch();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [enabled, safeRefetch]);

  // 3. Subscriptions to Centralized Refresh Events
  useEffect(() => {
    if (!enabled || !events || events.length === 0) return;

    const unsubscribes = events.map(event => {
      return refreshManager.subscribe(event, () => {
        if (isFocusedRef.current) {
          safeRefetch();
        }
      });
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [enabled, events, safeRefetch]);
}
