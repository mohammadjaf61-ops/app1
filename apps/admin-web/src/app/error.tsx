'use client';

import { useEffect } from 'react';

import { appLogger } from '@/lib/logger';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error page for route segment errors.
 * Displayed when an error occurs within a route segment.
 */
export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    appLogger.error('Route error occurred', error, {
      scope: 'ErrorPage',
      errorCode: error.digest,
    });
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
        <span className="text-4xl">⚠️</span>
      </div>

      <h2 className="mb-2 text-xl font-bold text-gray-900">حدث خطأ غير متوقع</h2>

      <p className="mb-6 text-center text-gray-600">نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى.</p>

      {process.env.NODE_ENV === 'development' && (
        <div className="mb-6 w-full max-w-lg rounded-lg bg-gray-100 p-4">
          <p className="text-xs text-gray-500 break-all">{error.message}</p>
          {error.digest && <p className="mt-2 text-xs text-gray-400">Digest: {error.digest}</p>}
        </div>
      )}

      <button
        onClick={reset}
        className="min-h-[48px] rounded-xl bg-primary px-6 py-3 font-bold text-white transition-opacity hover:opacity-90"
      >
        إعادة المحاولة
      </button>
    </div>
  );
}
