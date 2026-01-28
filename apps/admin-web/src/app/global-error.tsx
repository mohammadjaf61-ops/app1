'use client';

import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error page for root layout errors.
 * This is a fallback when errors occur in the root layout.
 * Must include its own <html> and <body> tags.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log error - using console directly since this is outside normal app context
    console.error(
      JSON.stringify({
        level: 'error',
        scope: 'GlobalError',
        message: 'Global error occurred',
        timestamp: new Date().toISOString(),
        error: {
          name: error.name,
          message: error.message,
          digest: error.digest,
        },
      }),
    );
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-white">
        <div className="flex min-h-screen flex-col items-center justify-center p-8">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <span className="text-4xl">⚠️</span>
          </div>

          <h2 className="mb-2 text-xl font-bold text-gray-900">
            حدث خطأ في النظام
          </h2>

          <p className="mb-6 text-center text-gray-600">
            نعتذر عن هذا الخطأ. يرجى تحديث الصفحة أو المحاولة لاحقًا.
          </p>

          <button
            onClick={reset}
            className="min-h-[48px] rounded-xl bg-green-600 px-6 py-3 font-bold text-white transition-opacity hover:opacity-90"
          >
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  );
}
