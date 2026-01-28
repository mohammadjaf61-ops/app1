import type { Metadata } from 'next';

import { Providers } from '@/components/providers';

import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'لوحة تحكم الهايبرماركت',
  description: 'نظام إدارة الهايبرماركت - لوحة تحكم المسؤول',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
