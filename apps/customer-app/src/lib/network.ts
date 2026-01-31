import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

type NetworkCallback = (isOnline: boolean) => void;

let currentState = true;
let subscription: ReturnType<typeof NetInfo.addEventListener> | null = null;
const listeners = new Set<NetworkCallback>();

export function initNetworkMonitoring(): void {
  if (subscription) return;

  subscription = NetInfo.addEventListener((state: NetInfoState) => {
    const isOnline = !!(state.isConnected && state.isInternetReachable !== false);

    if (currentState !== isOnline) {
      currentState = isOnline;
      listeners.forEach((cb) => cb(isOnline));
    }
  });

  NetInfo.fetch().then((state: NetInfoState) => {
    currentState = !!(state.isConnected && state.isInternetReachable !== false);
  });
}

export function isOnline(): boolean {
  return currentState;
}

export async function checkNetworkStatus(): Promise<boolean> {
  const state = await NetInfo.fetch();
  currentState = !!(state.isConnected && state.isInternetReachable !== false);
  return currentState;
}

export function subscribeNetworkStatus(callback: NetworkCallback): () => void {
  listeners.add(callback);
  callback(currentState);

  return () => {
    listeners.delete(callback);
  };
}
