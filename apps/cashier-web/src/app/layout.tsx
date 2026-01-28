import type { Metadata } from 'next';

import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'POS - نقطة البيع',
  description: 'نظام نقطة البيع للهايبر ماركت',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
