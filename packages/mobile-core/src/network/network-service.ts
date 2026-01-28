/**
 * Network Service for Hypermarket Mobile Apps
 *
 * Provides network connectivity detection and state management.
 * Uses @react-native-community/netinfo for reliable network detection.
 */

import NetInfo, { NetInfoStateType } from '@react-native-community/netinfo';
import type { NetInfoState } from '@react-native-community/netinfo';

export type NetworkStatus = 'online' | 'offline' | 'unknown';

export interface NetworkState {
  status: NetworkStatus;
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: NetInfoStateType;
}

type NetworkListener = (state: NetworkState) => void;

class NetworkService {
  private listeners: Set<NetworkListener> = new Set();
  private currentState: NetworkState = {
    status: 'unknown',
    isConnected: true,
    isInternetReachable: null,
    type: NetInfoStateType.unknown,
  };
  private unsubscribe: (() => void) | null = null;

  /**
   * Initialize network monitoring.
   * Call this once when the app starts.
   */
  initialize(): void {
    if (this.unsubscribe) {
      return; // Already initialized
    }

    this.unsubscribe = NetInfo.addEventListener((state) => {
      this.handleNetInfoState(state);
    });

    // Get initial state
    NetInfo.fetch().then((state) => {
      this.handleNetInfoState(state);
    });
  }

  /**
   * Stop network monitoring.
   * Call this when the app is unmounting.
   */
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.listeners.clear();
  }

  /**
   * Get current network state.
   */
  getState(): NetworkState {
    return { ...this.currentState };
  }

  /**
   * Check if currently online.
   */
  isOnline(): boolean {
    return this.currentState.status === 'online';
  }

  /**
   * Subscribe to network state changes.
   * Returns unsubscribe function.
   */
  subscribe(listener: NetworkListener): () => void {
    this.listeners.add(listener);

    // Immediately call with current state
    listener(this.getState());

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Force refresh network state.
   */
  async refresh(): Promise<NetworkState> {
    const state = await NetInfo.fetch();
    this.handleNetInfoState(state);
    return this.getState();
  }

  private handleNetInfoState(netInfoState: NetInfoState): void {
    const isConnected = netInfoState.isConnected ?? false;
    const isInternetReachable = netInfoState.isInternetReachable;

    // Determine status based on connectivity and reachability
    let status: NetworkStatus;
    if (!isConnected) {
      status = 'offline';
    } else if (isInternetReachable === false) {
      status = 'offline';
    } else if (isInternetReachable === true) {
      status = 'online';
    } else {
      // isInternetReachable is null (unknown) - assume online if connected
      status = isConnected ? 'online' : 'offline';
    }

    const newState: NetworkState = {
      status,
      isConnected,
      isInternetReachable,
      type: netInfoState.type,
    };

    // Only notify if state actually changed
    if (
      this.currentState.status !== newState.status ||
      this.currentState.isConnected !== newState.isConnected
    ) {
      this.currentState = newState;
      this.notifyListeners();
    }
  }

  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (error) {
        console.error('Network listener error:', error);
      }
    });
  }
}

// Singleton instance
export const networkService = new NetworkService();
