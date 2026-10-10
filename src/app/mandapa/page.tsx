import Link from 'next/link';
import MandapaCard from '@/components/MandapaCard';
import { createClient } from '@/lib/supabase/server';
import { getYears, pickCurrent } from '@/lib/data';
import { bn } from '@/lib/bn';
import type { Mandapa } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'পূজামণ্ডপ' };

export default async function MandapaList({ searchParams }: { searchParams: { q?: string; area?: string } }) {
  const supabase = createClient();
  const year = pickCurrent(await getYears(supabase));

  let all: Mandapa[] = [];
  if (year) {
    const { data } = await supabase
      .from('mandapas')
      .select('*')
      .eq('year_id', year.id)
      .eq('status', 'published')
      .order('name');
    all = (data ?? []) as Mandapa[];
  }

  const areas = Array.from(new Set(all.map((m) => m.area).filter(Boolean) as string[])).sort();
  const q = (searchParams.q ?? '').trim();
  const area = searchParams.area ?? '';
  const list = all.filter(
    (m) => (!area || m.area === area) && (!q || `${m.name} ${m.area ?? ''} ${m.address ?? ''}`.includes(q)),
  );

  return (
    <div className="wrap py-6">
      <h1 className="text-3xl text-accent">পূজামণ্ডপের তালিকা</h1>
      <p className="muted mt-1">{year ? `${bn(year.year)} সাল` : ''} নাম বা এলাকা দিয়ে খুঁজুন।</p>

      <form className="my-4 grid gap-3 sm:grid-cols-[2fr_1fr_auto]" method="get">
        <div>
          <label className="label" htmlFor="q">
            মণ্ডপ খুঁজুন
          </label>
          <input id="q" name="q" defaultValue={q} className="input" type="search" />
        </div>
        <div>
          <label className="label" htmlFor="area">
            এলাকা
          </label>
          <select id="area" name="area" defaultValue={area} className="input">
            <option value="">সব এলাকা</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((m) => (
            <MandapaCard key={m.id} m={m} />
          ))}
        </div>
      ) : (
        <p>
          কোনো মণ্ডপ পাওয়া যায়নি। অন্য নাম বা এলাকা দিয়ে চেষ্টা করুন, অথবা{' '}
          <Link href="/submit">নতুন মণ্ডপের তথ্য জানান</Link>।
        </p>
      )}
    </div>
  );
}
