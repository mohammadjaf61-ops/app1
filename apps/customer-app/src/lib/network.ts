/**
 * Network awareness utilities
 * Provides online/offline detection and subscription
 */

import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';

type NetworkCallback = (isOnline: boolean) => void;

let currentState: boolean = true;
let subscription: NetInfoSubscription | null = null;
const listeners: Set<NetworkCallback> = new Set();

/**
 * Initialize network monitoring
 * Call this once at app startup
 */
export function initNetworkMonitoring(): void {
  if (subscription) return;

  subscription = NetInfo.addEventListener((state: NetInfoState) => {
    const isOnline = !!(state.isConnected && state.isInternetReachable !== false);

    if (currentState !== isOnline) {
      currentState = isOnline;

      if (__DEV__) {
        console.debug(`[Network] Status changed: ${isOnline ? 'online' : 'offline'}`);
      }

      listeners.forEach((cb) => cb(isOnline));
    }
  });

  // Get initial state
  NetInfo.fetch().then((state: NetInfoState) => {
    currentState = !!(state.isConnected && state.isInternetReachable !== false);
  });
}

/**
 * Check if device is currently online
 */
export function isOnline(): boolean {
  return currentState;
}

/**
 * Check network status asynchronously (fresh check)
 */
export async function checkNetworkStatus(): Promise<boolean> {
  const state = await NetInfo.fetch();
  currentState = !!(state.isConnected && state.isInternetReachable !== false);
  return currentState;
}

/**
 * Subscribe to network status changes
 * @returns Unsubscribe function
 */
export function subscribeNetworkStatus(callback: NetworkCallback): () => void {
  listeners.add(callback);

  // Immediately call with current state
  callback(currentState);

  return () => {
    listeners.delete(callback);
  };
}

/**
 * React hook for network status
 */
export function useNetworkStatus(): { isOnline: boolean } {
  // This is a simple implementation - for React, use useState + useEffect
  // The actual hook implementation is in hooks/use-network.ts
  return { isOnline: currentState };
}
