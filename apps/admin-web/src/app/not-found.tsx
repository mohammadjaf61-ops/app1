import Link from 'next/link';

/**
 * 404 Not Found page.
 * Displayed when a page is not found.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
        <span className="text-4xl">🔍</span>
      </div>

      <h2 className="mb-2 text-xl font-bold text-gray-900">
        الصفحة غير موجودة
      </h2>

      <p className="mb-6 text-center text-gray-600">
        عذرًا، لم نتمكن من العثور على الصفحة المطلوبة.
      </p>

      <Link
        href="/dashboard"
        className="min-h-[48px] rounded-xl bg-primary px-6 py-3 font-bold text-white transition-opacity hover:opacity-90"
      >
        العودة للوحة التحكم
      </Link>
    </div>
  );
}
