import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import { logoutAdmin } from '../login/actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'অ্যাডমিন', robots: { index: false, follow: false } };

const LINKS: [string, string][] = [
  ['/admin', 'ড্যাশবোর্ড'],
  ['/admin/submissions', 'অপেক্ষমাণ জমা'],
  ['/admin/mandapas', 'মণ্ডপ'],
  ['/admin/years', 'পূজাবর্ষ'],
  ['/admin/comments', 'মন্তব্য'],
  ['/admin/notices', 'নোটিশ'],
  ['/admin/log', 'Activity Log'],
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="wrap py-5">
      <nav aria-label="অ্যাডমিন মেনু" className="mb-5 flex flex-wrap items-center gap-2 border-b border-line pb-3">
        {LINKS.map(([href, label]) => (
          <Link key={href} href={href} className="rounded-full border border-line px-3 py-1 text-sm no-underline">
            {label}
          </Link>
        ))}
        <a href="/admin/backup" className="rounded-full border border-line px-3 py-1 text-sm no-underline">
          ব্যাকআপ (JSON)
        </a>
        <a href="/admin/map-export" className="rounded-full border border-line px-3 py-1 text-sm no-underline">
          Google My Maps-এর জন্য KMZ (৩ লেয়ার)
        </a>
        <form action={logoutAdmin} className="ml-auto">
          <button type="submit" className="btn-ghost !min-h-0 !px-3 !py-1 text-sm">
            লগআউট
          </button>
        </form>
      </nav>
      {children}
    </div>
  );
}
