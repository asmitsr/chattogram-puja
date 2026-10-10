import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import { getYears, pickCurrent } from '@/lib/data';
import { bn } from '@/lib/bn';
import { YEAR_STATUS } from '@/lib/types';

export default async function Dashboard() {
  const { supabase } = await requireAdmin();
  const years = await getYears(supabase);
  const year = pickCurrent(years);

  const { count: pending } = await supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending');

  const counts: Record<string, number> = { draft: 0, published: 0, archived: 0 };
  if (year) {
    for (const s of Object.keys(counts)) {
      const { count } = await supabase
        .from('mandapas')
        .select('id', { count: 'exact', head: true })
        .eq('year_id', year.id)
        .eq('status', s);
      counts[s] = count ?? 0;
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl text-accent">অ্যাডমিন ড্যাশবোর্ড</h1>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/submissions" className="card no-underline">
          <div className="muted">অপেক্ষমাণ জমা</div>
          <b className="font-display text-4xl text-fg">{bn(pending ?? 0)}</b>
        </Link>
        <div className="card">
          <div className="muted">বর্তমান বছর</div>
          <b className="font-display text-4xl text-fg">{year ? bn(year.year) : '—'}</b>
          {year && <div className="mt-1 text-sm">{YEAR_STATUS[year.status]}</div>}
        </div>
        <div className="card">
          <div className="muted">প্রকাশিত মণ্ডপ</div>
          <b className="font-display text-4xl text-fg">{bn(counts.published)}</b>
        </div>
        <div className="card">
          <div className="muted">খসড়া মণ্ডপ</div>
          <b className="font-display text-4xl text-fg">{bn(counts.draft)}</b>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-2 text-xl text-accent">দ্রুত কাজ</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/mandapas/new" className="btn">
            নতুন মণ্ডপ যোগ করুন
          </Link>
          <Link href="/admin/years" className="btn-ghost">
            নতুন পূজাবর্ষ
          </Link>
          <Link href="/admin/notices" className="btn-ghost">
            জরুরি নোটিশ
          </Link>
          <a href="/admin/backup" className="btn-ghost">
            ব্যাকআপ নামান
          </a>
        </div>
        <p className="muted mt-3">ফ্রি Supabase প্ল্যানে স্বয়ংক্রিয় ব্যাকআপ নেই। পূজার আগে ও পরে এবং মাসে অন্তত একবার ব্যাকআপ নামিয়ে রাখুন।</p>
      </div>
    </div>
  );
}
