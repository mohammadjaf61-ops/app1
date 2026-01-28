/**
 * useNetworkStatus Hook
 *
 * React hook for monitoring network connectivity status.
 * Provides real-time updates when network state changes.
 */

import { useState, useEffect, useCallback } from 'react';

import { networkService } from './network-service';
import type { NetworkState, NetworkStatus } from './network-service';

export interface UseNetworkStatusResult {
  /** Current network status: 'online' | 'offline' | 'unknown' */
  status: NetworkStatus;
  /** Whether device is connected to a network */
  isConnected: boolean;
  /** Whether internet is actually reachable */
  isInternetReachable: boolean | null;
  /** Whether currently online and can make requests */
  isOnline: boolean;
  /** Whether currently offline */
  isOffline: boolean;
  /** Force refresh network state */
  refresh: () => Promise<void>;
}

/**
 * Hook to monitor network connectivity status.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isOnline, isOffline } = useNetworkStatus();
 *
 *   if (isOffline) {
 *     return <OfflineBanner />;
 *   }
 *
 *   return <OnlineContent />;
 * }
 * ```
 */
export function useNetworkStatus(): UseNetworkStatusResult {
  const [state, setState] = useState<NetworkState>(() => networkService.getState());

  useEffect(() => {
    // Subscribe to network changes
    const unsubscribe = networkService.subscribe((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, []);

  const refresh = useCallback(async () => {
    await networkService.refresh();
  }, []);

  return {
    status: state.status,
    isConnected: state.isConnected,
    isInternetReachable: state.isInternetReachable,
    isOnline: state.status === 'online',
    isOffline: state.status === 'offline',
    refresh,
  };
}
