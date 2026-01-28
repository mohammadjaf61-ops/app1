/**
 * Network State Service
 *
 * Provides network connectivity detection and state management
 * for offline-first functionality in mobile apps.
 */

import NetInfo, {
  type NetInfoState,
  type NetInfoSubscription,
} from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
}

type NetworkListener = (status: NetworkStatus) => void;

class NetworkService {
  private listeners: Set<NetworkListener> = new Set();
  private currentStatus: NetworkStatus = {
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
  };
  private subscription: NetInfoSubscription | null = null;
  private initialized = false;

  /**
   * Initialize network monitoring
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Get initial state
    const state = await NetInfo.fetch();
    this.updateStatus(state);

    // Subscribe to changes
    this.subscription = NetInfo.addEventListener((state) => {
      this.updateStatus(state);
    });

    this.initialized = true;
  }

  /**
   * Stop network monitoring
   */
  destroy(): void {
    if (this.subscription) {
      this.subscription();
      this.subscription = null;
    }
    this.listeners.clear();
    this.initialized = false;
  }

  /**
   * Get current network status
   */
  getStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return this.currentStatus.isConnected && this.currentStatus.isInternetReachable !== false;
  }

  /**
   * Subscribe to network status changes
   */
  subscribe(listener: NetworkListener): () => void {
    this.listeners.add(listener);

    // Initialize if not already done
    if (!this.initialized) {
      this.initialize();
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Force refresh network status
   */
  async refresh(): Promise<NetworkStatus> {
    const state = await NetInfo.fetch();
    this.updateStatus(state);
    return this.getStatus();
  }

  private updateStatus(state: NetInfoState): void {
    const newStatus: NetworkStatus = {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
    };

    // Only notify if status actually changed
    const hasChanged =
      this.currentStatus.isConnected !== newStatus.isConnected ||
      this.currentStatus.isInternetReachable !== newStatus.isInternetReachable;

    this.currentStatus = newStatus;

    if (hasChanged) {
      this.notifyListeners();
    }
  }

  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach((listener) => {
      try {
        listener(status);
      } catch (error) {
        console.error('[NetworkService] Listener error:', error);
      }
    });
  }
}

// Singleton instance
export const networkService = new NetworkService();
