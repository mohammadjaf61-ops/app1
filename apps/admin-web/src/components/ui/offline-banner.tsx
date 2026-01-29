'use client';

import { WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    // Check initial state
    setIsOffline(!navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'fixed bottom-4 left-4 right-4 z-50 flex items-center justify-center gap-3',
        'rounded-lg bg-yellow-500 px-4 py-3 text-white shadow-lg',
        'md:left-auto md:right-4 md:w-auto',
      )}
    >
      <WifiOff className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
      <span className="text-sm font-medium">لا يوجد اتصال بالإنترنت</span>
    </div>
  );
}
