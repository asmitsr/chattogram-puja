import Link from 'next/link';
import MandapaGrid, { type GridItem } from '@/components/MandapaGrid';
import { getPublicMandapas, getPublicYear } from '@/lib/publicData';
import { bn } from '@/lib/bn';
import { matches } from '@/lib/search';
import { REGION_LABEL, REGION_ORDER, regionOf, splitArea, type RegionKey } from '@/lib/ctgPlaces';
import type { Mandapa } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'পূজামণ্ডপ' };

const NO_THANA = '-'; // থানা জানা নেই এমন মণ্ডপের লিংক-চিহ্ন

type Row = { m: Mandapa; region: RegionKey; thana: string | null; locality: string | null };

export default async function MandapaList({
  searchParams,
}: {
  searchParams: { q?: string; area?: string; thana?: string };
}) {
  const year = await getPublicYear();

  // প্রকাশিত সবগুলো মণ্ডপই আসে (কোনো সীমা নেই); ডেটা ২ মিনিটের ক্যাশ থেকে আসে
  const all: Mandapa[] = year ? await getPublicMandapas(year.id) : [];

  const q = (searchParams.q ?? '').trim();
  const rawArea = searchParams.area ?? '';
  // পুরনো লিংকে পুরো এলাকার নাম থাকলেও অঞ্চলে রূপান্তর হয়
  const asRegion = (REGION_ORDER as string[]).includes(rawArea) ? (rawArea as RegionKey) : rawArea ? regionOf(rawArea) : null;
  const area: RegionKey | '' = asRegion ?? '';

  // খোঁজার লেখায় মেলে এমন সব মণ্ডপ, প্রতিটির অঞ্চল ও থানাসহ
  const found: Row[] = all
    .filter((m) => matches(`${m.name} ${m.area ?? ''} ${m.address ?? ''}`, q))
    .map((m) => {
      const s = splitArea(m.area);
      return { m, region: s.region, thana: s.thana, locality: s.locality };
    });

  const regionCount: Record<RegionKey, number> = { metro: 0, north: 0, south: 0, other: 0 };
  for (const r of found) regionCount[r.region]++;

  const inRegion = area ? found.filter((r) => r.region === area) : found;

  // থানা-ভিত্তিক সংখ্যা (বেশি মণ্ডপের থানা আগে; থানা জানা না থাকলে সবার শেষে)
  const thanaCount = new Map<string, number>();
  for (const r of found) {
    const k = `${r.region}|${r.thana ?? NO_THANA}`;
    thanaCount.set(k, (thanaCount.get(k) ?? 0) + 1);
  }
  const thanasOfRegion = (region: RegionKey) =>
    Array.from(thanaCount.entries())
      .filter(([k]) => k.startsWith(`${region}|`))
      .map(([k, n]) => ({ key: k.slice(region.length + 1), n }))
      .sort((a, b) => (a.key === NO_THANA ? 1 : b.key === NO_THANA ? -1 : b.n - a.n || a.key.localeCompare(b.key, 'bn')));

  const thanaChips = area ? thanasOfRegion(area) : [];
  const thana = thanaChips.some((t) => t.key === (searchParams.thana ?? '')) ? (searchParams.thana as string) : '';
  const shown = thana ? inRegion.filter((r) => (r.thana ?? NO_THANA) === thana) : inRegion;

  // অঞ্চল (মহানগর → উত্তর → দক্ষিণ), তারপর থানা (বেশি মণ্ডপের আগে), তারপর নাম (ডাটাবেস থেকেই নাম-ক্রমে আসে)
  const thanaRank = new Map<string, number>();
  for (const region of REGION_ORDER) {
    thanasOfRegion(region).forEach((t, i) => thanaRank.set(`${region}|${t.key}`, i));
  }
  const rank = (r: Row) =>
    REGION_ORDER.indexOf(r.region) * 1000 + (thanaRank.get(`${r.region}|${r.thana ?? NO_THANA}`) ?? 999);
  const ranked = shown.map((r) => ({ r, k: rank(r) })).sort((a, b) => a.k - b.k);

  // ক্লায়েন্টে শুধু যা লাগে তা পাঠানো হয় (পাতার ওজন কমে)
  const items: GridItem[] = ranked.map(({ r }) => ({
    id: r.m.id,
    name: r.m.name,
    area: r.m.area,
    address: r.m.address,
    lat: r.m.latitude === null ? null : Number(r.m.latitude),
    lng: r.m.longitude === null ? null : Number(r.m.longitude),
    region: r.region,
    thana: r.thana,
    locality: r.locality,
  }));

  const href = (o: { area?: string; thana?: string }) => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (o.area) p.set('area', o.area);
    if (o.thana) p.set('thana', o.thana);
    const s = p.toString();
    return s ? `/mandapa?${s}` : '/mandapa';
  };
  const chip = (on: boolean) =>
    `inline-flex min-h-[40px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-sm font-semibold no-underline ${
      on ? 'border-accent bg-btn text-btnfg' : 'border-line bg-surface text-fg'
    }`;
  const regionChips = REGION_ORDER.filter((k) => k !== 'other' || regionCount.other > 0);

  return (
    <div className="wrap py-6">
      <h1 className="text-3xl text-accent">পূজামণ্ডপের তালিকা</h1>
      <p className="muted mt-1">{year ? `${bn(year.year)} সাল` : ''} নাম বা এলাকা দিয়ে খুঁজুন (বাংলা বা ইংরেজিতে)।</p>

      <form className="my-4 grid gap-3 sm:grid-cols-[1fr_auto]" method="get">
        <div>
          <label className="label" htmlFor="q">
            মণ্ডপ খুঁজুন
          </label>
          <input id="q" name="q" defaultValue={q} className="input" type="search" placeholder="যেমন: চকবাজার, কালী বাড়ি, Jamalkhan" />
        </div>
        {area && <input type="hidden" name="area" value={area} />}
        {thana && <input type="hidden" name="thana" value={thana} />}
        <div className="flex items-end">
          <button className="btn w-full" type="submit">
            খুঁজুন
          </button>
        </div>
      </form>

      <nav aria-label="অঞ্চল" className="mb-2 flex flex-wrap gap-2">
        <Link href={href({})} prefetch={false} className={chip(area === '')} aria-current={area === '' ? 'page' : undefined}>
          সব ({bn(found.length)})
        </Link>
        {regionChips.map((k) => (
          <Link
            key={k}
            href={href({ area: k })}
            prefetch={false}
            className={chip(area === k)}
            aria-current={area === k ? 'page' : undefined}
          >
            {REGION_LABEL[k]} ({bn(regionCount[k])})
          </Link>
        ))}
      </nav>

      {area && thanaChips.length > 1 && (
        <nav aria-label="থানা" className="-mx-1 mb-2 flex gap-2 overflow-x-auto px-1 pb-2">
          <Link href={href({ area })} prefetch={false} className={chip(thana === '')}>
            সব থানা ({bn(inRegion.length)})
          </Link>
          {thanaChips.map((t) => (
            <Link key={t.key} href={href({ area, thana: t.key })} prefetch={false} className={chip(thana === t.key)}>
              {t.key === NO_THANA ? 'থানা উল্লেখ নেই' : t.key} ({bn(t.n)})
            </Link>
          ))}
        </nav>
      )}

      <p className="muted mb-3">{bn(items.length)}টি মণ্ডপ পাওয়া গেছে</p>
      {items.length ? (
        <MandapaGrid items={items} />
      ) : (
        <p>
          কোনো মণ্ডপ পাওয়া যায়নি। অন্য নাম বা এলাকা দিয়ে চেষ্টা করুন, অথবা{' '}
          <Link href="/submit">নতুন মণ্ডপের তথ্য জানান</Link>।
        </p>
      )}
    </div>
  );
}
