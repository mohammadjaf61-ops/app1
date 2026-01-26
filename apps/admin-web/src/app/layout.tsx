import type { Metadata } from 'next';
import { Noto_Kufi_Arabic } from 'next/font/google';

import { Providers } from '@/components/providers';

import '@/styles/globals.css';

const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  variable: '--font-noto-kufi',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'لوحة تحكم الهايبرماركت',
  description: 'نظام إدارة الهايبرماركت - لوحة تحكم المسؤول',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={notoKufiArabic.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
