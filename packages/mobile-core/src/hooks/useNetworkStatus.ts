/**
 * useNetworkStatus Hook
 *
 * React hook for monitoring network connectivity status.
 * Provides real-time updates when network state changes.
 */

import { useState, useEffect, useCallback } from 'react';

import { networkService, type NetworkStatus } from '../services/network';

export interface UseNetworkStatusResult {
  /** Whether device is currently online */
  isOnline: boolean;
  /** Whether device is currently offline */
  isOffline: boolean;
  /** Detailed network status */
  status: NetworkStatus;
  /** Force refresh network status */
  refresh: () => Promise<void>;
}

/**
 * Hook to monitor network connectivity
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
  const [status, setStatus] = useState<NetworkStatus>(() => networkService.getStatus());

  useEffect(() => {
    // Initialize and subscribe
    networkService.initialize();

    const unsubscribe = networkService.subscribe((newStatus) => {
      setStatus(newStatus);
    });

    // Get initial status
    setStatus(networkService.getStatus());

    return unsubscribe;
  }, []);

  const refresh = useCallback(async () => {
    const newStatus = await networkService.refresh();
    setStatus(newStatus);
  }, []);

  const isOnline = status.isConnected && status.isInternetReachable !== false;

  return {
    isOnline,
    isOffline: !isOnline,
    status,
    refresh,
  };
}
