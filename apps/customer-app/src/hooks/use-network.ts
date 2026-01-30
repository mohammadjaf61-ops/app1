/**
 * React hook for network status
 */

import { useState, useEffect } from 'react';

import { subscribeNetworkStatus, isOnline as getIsOnline } from '@/lib/network';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(getIsOnline());

  useEffect(() => {
    const unsubscribe = subscribeNetworkStatus((online) => {
      setIsOnline(online);
    });

    return unsubscribe;
  }, []);

  return { isOnline };
}
