import Link from 'next/link';
import Flash from '@/components/Flash';
import { requireAdmin } from '@/lib/admin';
import { getYears, pickCurrent } from '@/lib/data';
import { bn } from '@/lib/bn';
import { REGION_LABEL, regionOf, type RegionKey } from '@/lib/ctgPlaces';
import { matches } from '@/lib/search';
import type { Mandapa } from '@/lib/types';
import { MANDAPA_STATUS } from '@/lib/types';

type SP = { year?: string; status?: string; region?: string; q?: string; ok?: string; err?: string };

const REGION_ORDER: RegionKey[] = ['metro', 'north', 'south', 'other'];

export default async function AdminMandapas({ searchParams }: { searchParams: SP }) {
  const { supabase } = await requireAdmin();
  const years = await getYears(supabase);
  const current = pickCurrent(years);
  const year = years.find((y) => y.id === searchParams.year) ?? current;
  const status = searchParams.status ?? '';
  const q = (searchParams.q ?? '').trim();
  const region = (REGION_ORDER as string[]).includes(searchParams.region ?? '') ? (searchParams.region as RegionKey) : '';

  // বছর ও অবস্থা অনুযায়ী সব মণ্ডপ আনা হয় (১০০০-এর বেশি হলেও পাতা পাতা করে)
  const base: Mandapa[] = [];
  if (year) {
    const size = 1000;
    for (let from = 0; from < 20000; from += size) {
      let query = supabase.from('mandapas').select('*').eq('year_id', year.id).order('name').order('id').range(from, from + size - 1);
      if (status) query = query.eq('status', status);
      const { data } = await query;
      if (!data) break;
      base.push(...(data as Mandapa[]));
      if (data.length < size) break;
    }
  }

  // অঞ্চলভিত্তিক সংখ্যা (বছর ও অবস্থার ফিল্টারের পর, অঞ্চল ফিল্টারের আগে)
  const counts: Record<RegionKey, number> = { metro: 0, north: 0, south: 0, other: 0 };
  for (const m of base) counts[regionOf(m.area)]++;

  const list = base.filter((m) => (!region || regionOf(m.area) === region) && matches(`${m.name} ${m.area ?? ''} ${m.address ?? ''}`, q));

  // অঞ্চল-বোতামের লিংক: বছর, অবস্থা ও খোঁজার লেখা ঠিক রেখে শুধু অঞ্চল বদলায়
  const hrefFor = (r: RegionKey | '') => {
    const p = new URLSearchParams();
    if (year) p.set('year', year.id);
    if (status) p.set('status', status);
    if (q) p.set('q', q);
    if (r) p.set('region', r);
    const s = p.toString();
    return `/admin/mandapas${s ? `?${s}` : ''}`;
  };
  const tab = (active: boolean) =>
    `rounded-full border px-4 py-2 text-sm font-semibold no-underline ${active ? 'border-accent bg-btn text-btnfg' : 'border-line text-fg'}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl text-accent">মণ্ডপ ব্যবস্থাপনা</h1>
        <Link href="/admin/mandapas/new" className="btn">
          নতুন মণ্ডপ
        </Link>
      </div>
      <Flash ok={searchParams.ok} err={searchParams.err} />

      <form method="get" className="grid gap-3 sm:grid-cols-[1fr_1fr_2fr_auto]">
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
        <div>
          <label className="label" htmlFor="q">
            নাম দিয়ে খুঁজুন
          </label>
          <input id="q" name="q" defaultValue={q} className="input" type="search" placeholder="যেমন: চকবাজার, Jamalkhan" />
        </div>
        {region && <input type="hidden" name="region" value={region} />}
        <div className="flex items-end">
          <button className="btn w-full" type="submit">
            দেখুন
          </button>
        </div>
      </form>

      <nav aria-label="অঞ্চল" className="flex flex-wrap gap-2">
        <Link href={hrefFor('')} className={tab(region === '')}>
          সব ({bn(base.length)})
        </Link>
        {REGION_ORDER.filter((r) => r !== 'other' || counts.other > 0).map((r) => (
          <Link key={r} href={hrefFor(r)} className={tab(region === r)}>
            {REGION_LABEL[r]} ({bn(counts[r])})
          </Link>
        ))}
      </nav>

      {years.length === 0 && <p>আগে <Link href="/admin/years">একটি পূজাবর্ষ তৈরি করুন</Link>।</p>}
      <p className="muted">
        {region ? `${REGION_LABEL[region]}: ` : ''}
        {bn(list.length)}টি মণ্ডপ
      </p>
      {list.length === 0 && <p className="muted">এই ফিল্টারে কোনো মণ্ডপ নেই।</p>}
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
