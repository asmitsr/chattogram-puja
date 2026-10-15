import Link from 'next/link';
import MandapaGrid, { type GridItem } from '@/components/MandapaGrid';
import { getPublicMandapas, getPublicYear } from '@/lib/publicData';
import { bn } from '@/lib/bn';
import { matches } from '@/lib/search';
import { regionOf } from '@/lib/ctgPlaces';
import type { Mandapa } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'পূজামণ্ডপ' };

export default async function MandapaList({ searchParams }: { searchParams: { q?: string; area?: string } }) {
  const year = await getPublicYear();

  // প্রকাশিত সবগুলো মণ্ডপই আসে (কোনো সীমা নেই); ডেটা ২ মিনিটের ক্যাশ থেকে আসে
  const all: Mandapa[] = year ? await getPublicMandapas(year.id) : [];

  // এলাকার ফিল্টারে শুধু তিনটি অঞ্চল
  const AREAS: { key: 'metro' | 'north' | 'south'; label: string }[] = [
    { key: 'south', label: 'দক্ষিণ চট্টগ্রাম' },
    { key: 'north', label: 'উত্তর চট্টগ্রাম' },
    { key: 'metro', label: 'মহানগর' },
  ];
  const q = (searchParams.q ?? '').trim();
  const rawArea = searchParams.area ?? '';
  // পুরনো লিংকে পুরো এলাকার নাম থাকলেও অঞ্চলে রূপান্তর হয়
  const area = AREAS.some((a) => a.key === rawArea) ? rawArea : rawArea ? regionOf(rawArea) : '';
  const list = all.filter(
    (m) => (!area || regionOf(m.area) === area) && matches(`${m.name} ${m.area ?? ''} ${m.address ?? ''}`, q),
  );

  // ক্লায়েন্টে শুধু যা লাগে তা পাঠানো হয় (পাতার ওজন কমে)
  const items: GridItem[] = list.map((m) => ({
    id: m.id,
    name: m.name,
    area: m.area,
    address: m.address,
    lat: m.latitude === null ? null : Number(m.latitude),
    lng: m.longitude === null ? null : Number(m.longitude),
  }));

  return (
    <div className="wrap py-6">
      <h1 className="text-3xl text-accent">পূজামণ্ডপের তালিকা</h1>
      <p className="muted mt-1">{year ? `${bn(year.year)} সাল` : ''} নাম বা এলাকা দিয়ে খুঁজুন (বাংলা বা ইংরেজিতে)।</p>

      <form className="my-4 grid gap-3 sm:grid-cols-[2fr_1fr_auto]" method="get">
        <div>
          <label className="label" htmlFor="q">
            মণ্ডপ খুঁজুন
          </label>
          <input id="q" name="q" defaultValue={q} className="input" type="search" placeholder="যেমন: চকবাজার, কালী বাড়ি, Jamalkhan" />
        </div>
        <div>
          <label className="label" htmlFor="area">
            এলাকা
          </label>
          <select id="area" name="area" defaultValue={area} className="input">
            <option value="">সব এলাকা</option>
            {AREAS.map((a) => (
              <option key={a.key} value={a.key}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button className="btn w-full" type="submit">
            খুঁজুন
          </button>
        </div>
      </form>

      <p className="muted mb-3">{bn(list.length)}টি মণ্ডপ পাওয়া গেছে</p>
      {list.length ? (
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
