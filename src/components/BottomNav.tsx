'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// স্ক্রিনের নিচে অ্যাপের মতো স্থায়ী মেনু (ফোন ও বড় পর্দা দুই জায়গাতেই; উপরের বারে আর মেনু নেই)।
const ITEMS: { href: string; label: string; icon: React.ReactNode }[] = [
  {
    href: '/',
    label: 'হোম',
    icon: <path d="M12 3 3 10.5V21h6v-6h6v6h6V10.5L12 3z" />,
  },
  {
    href: '/mandapa',
    label: 'মণ্ডপ',
    icon: <path d="M12 2 4 7v2h16V7l-8-5zM6 11v8H4v2h16v-2h-2v-8h-2v8h-3v-8h-2v8H8v-8H6z" />,
  },
  {
    href: '/map',
    label: 'ম্যাপ',
    icon: <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />,
  },
  {
    href: '/schedule',
    label: 'সময়সূচি',
    icon: <path d="M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm-2 8h14v10H5V10z" />,
  },
  {
    href: '/submit',
    label: 'তথ্য দিন',
    icon: <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />,
  },
];

export default function BottomNav() {
  const pathname = usePathname() ?? '/';
  if (pathname.startsWith('/admin')) return null;

  return (
    <nav
      aria-label="নিচের মেনু"
      className="hx-bottom fixed inset-x-0 bottom-0 z-30"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ul className="mx-auto flex max-w-5xl items-stretch justify-around">
        {ITEMS.map((it) => {
          const active = it.href === '/' ? pathname === '/' : pathname.startsWith(it.href);
          return (
            <li key={it.href} className="flex-1">
              <Link
                href={it.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium no-underline ${
                  active ? 'text-herogold' : 'text-herofg opacity-90'
                }`}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  {it.icon}
                </svg>
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
