import Link from 'next/link';
import MapView, { type Pin } from '@/components/MapView';
import { createClient } from '@/lib/supabase/server';
import { getYears, pickCurrent } from '@/lib/data';
import { bn } from '@/lib/bn';
import type { Mandapa } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'ম্যাপ' };

export default async function MapPage() {
  const supabase = createClient();
  const year = pickCurrent(await getYears(supabase));

  let list: Mandapa[] = [];
  if (year) {
    const { data } = await supabase
      .from('mandapas')
      .select('*')
      .eq('year_id', year.id)
      .eq('status', 'published')
      .order('name');
    list = (data ?? []) as Mandapa[];
  }

  const pins: Pin[] = list
    .filter((m) => m.latitude !== null && m.longitude !== null)
    .map((m) => ({ id: m.id, name: m.name, area: m.area, lat: m.latitude!, lng: m.longitude! }));
  const without = list.filter((m) => m.latitude === null || m.longitude === null);

  return (
    <div className="wrap space-y-4 py-6">
      <h1 className="text-3xl text-accent">ম্যাপে মণ্ডপ</h1>
      <p className="muted">
        {year ? `${bn(year.year)} সাল · ` : ''}
        {bn(pins.length)}টি মণ্ডপের অবস্থান ম্যাপে আছে। পিনে চাপ দিলে বিস্তারিত দেখা যাবে।
      </p>
      <MapView pins={pins} height={460} />
      {without.length > 0 && (
        <details className="card">
          <summary className="cursor-pointer font-semibold">{bn(without.length)}টি মণ্ডপের অবস্থান এখনো যোগ হয়নি</summary>
          <ul className="mt-2 list-disc pl-5">
            {without.map((m) => (
              <li key={m.id}>
                <Link href={`/mandapa/${m.id}`}>{m.name}</Link>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
