import type { MetadataRoute } from 'next';

// "ইনস্টল করুন" অপশনের জন্য: ফোনের হোম স্ক্রিনে অ্যাপের মতো যুক্ত হয়
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'চট্টগ্রামের পুজো',
    short_name: 'চট্টগ্রামের পুজো',
    description: 'চট্টগ্রামের পূজামণ্ডপ, ঠিকানা, ম্যাপ ও সময়সূচি এক জায়গায়।',
    lang: 'bn',
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#34010a',
    theme_color: '#34010a',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
