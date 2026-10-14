import './globals.css';
import type { Metadata, Viewport } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';

export const metadata: Metadata = {
  title: { default: 'চট্টগ্রামের পুজো', template: '%s · চট্টগ্রামের পুজো' },
  description: 'চট্টগ্রামের পূজামণ্ডপ, ঠিকানা, ম্যাপ ও সময়সূচি এক জায়গায়।',
  applicationName: 'চট্টগ্রামের পুজো',
  icons: { icon: '/icons/icon-192.png', apple: '/icons/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'চট্টগ্রামের পুজো', statusBarStyle: 'black-translucent' },
};

// ফোনের ব্রাউজার/অ্যাপের ওপরের বারের রং
export const viewport: Viewport = { themeColor: '#34010a' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Serif+Bengali:wght@400;500;600;700&family=Tiro+Bangla&display=swap"
        />
        {/* শুধু বাংলা সংখ্যা (০–৯) পরিষ্কার দেখানোর জন্য: ১ যাতে ভেঙে না যায় */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&text=%E0%A7%A6%E0%A7%A7%E0%A7%A8%E0%A7%A9%E0%A7%AA%E0%A7%AB%E0%A7%AC%E0%A7%AD%E0%A7%AE%E0%A7%AF&display=swap"
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        {/* ফোনে নিচের মেনুর জায়গা ফাঁকা রাখে, যাতে ফুটার ঢেকে না যায় */}
        <div aria-hidden="true" className="h-16" />
        <BottomNav />
      </body>
    </html>
  );
}
