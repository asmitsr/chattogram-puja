import Link from 'next/link';
import Flash from '@/components/Flash';
import { requireAdmin } from '@/lib/admin';
import { getYears, pickCurrent } from '@/lib/data';
import { bn } from '@/lib/bn';
import type { Mandapa } from '@/lib/types';
import { MANDAPA_STATUS } from '@/lib/types';

export default async function AdminMandapas({ searchParams }: { searchParams: { year?: string; status?: string; ok?: string; err?: string } }) {
  const { supabase } = await requireAdmin();
  const years = await getYears(supabase);
  const current = pickCurrent(years);
  const year = years.find((y) => y.id === searchParams.year) ?? current;
  const status = searchParams.status ?? '';

  let list: Mandapa[] = [];
  if (year) {
    let q = supabase.from('mandapas').select('*').eq('year_id', year.id).order('name');
    if (status) q = q.eq('status', status);
    const { data } = await q;
    list = (data ?? []) as Mandapa[];
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl text-accent">মণ্ডপ ব্যবস্থাপনা</h1>
        <Link href="/admin/mandapas/new" className="btn">
          নতুন মণ্ডপ
        </Link>
      </div>
      <Flash ok={searchParams.ok} err={searchParams.err} />

      <form method="get" className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <label className="label" htmlFor="year">
            বছর
          </label>
          <select id="year" name="year" defaultValue={year?.id ?? ''} className="input">
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {bn(y.year)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="status">
            অবস্থা
          </label>
          <select id="status" name="status" defaultValue={status} className="input">
            <option value="">সব</option>
            {Object.entries(MANDAPA_STATUS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button className="btn w-full" type="submit">
            দেখুন
          </button>
        </div>
      </form>

      {years.length === 0 && <p>আগে <Link href="/admin/years">একটি পূজাবর্ষ তৈরি করুন</Link>।</p>}
      <p className="muted">{bn(list.length)}টি মণ্ডপ</p>
      <ul className="space-y-2">
        {list.map((m) => (
          <li key={m.id}>
            <Link href={`/admin/mandapas/${m.id}`} className="card flex flex-wrap items-center justify-between gap-2 no-underline">
              <span>
                <b className="text-fg">{m.name}</b>
                <span className="muted ml-2">{m.area}</span>
              </span>
              <span className="flex gap-2">
                {m.latitude === null && <span className="badge-warn">অবস্থান নেই</span>}
                <span className={m.status === 'published' ? 'badge-ok' : 'badge'}>{MANDAPA_STATUS[m.status]}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
