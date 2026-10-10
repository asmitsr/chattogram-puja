import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getYears, pickCurrent } from '@/lib/data';
import { bn, dayKey, fmtDate, fmtTime } from '@/lib/bn';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'সময়সূচি' };

interface Row {
  id: string;
  title: string;
  starts_at: string | null;
  ends_at: string | null;
  details: string | null;
  mandapas: { id: string; name: string; area: string | null; year_id: string } | null;
}

export default async function SchedulePage() {
  const supabase = createClient();
  const year = pickCurrent(await getYears(supabase));

  let rows: Row[] = [];
  if (year) {
    const { data } = await supabase
      .from('schedules')
      .select('id,title,starts_at,ends_at,details,mandapas!inner(id,name,area,year_id,status)')
      .eq('mandapas.year_id', year.id)
      .eq('mandapas.status', 'published')
      .not('starts_at', 'is', null)
      .order('starts_at');
    rows = (data ?? []) as unknown as Row[];
  }

  const groups = new Map<string, Row[]>();
  rows.forEach((r) => {
    const k = dayKey(r.starts_at!);
    groups.set(k, [...(groups.get(k) ?? []), r]);
  });

  return (
    <div className="wrap py-6">
      <h1 className="text-3xl text-accent">পূজার সময়সূচি</h1>
      <p className="muted mt-1">{year ? `${bn(year.year)} সাল · দিন অনুযায়ী সব মণ্ডপের কর্মসূচি` : ''}</p>

      {rows.length === 0 ? (
        <p className="mt-6">এখনো কোনো সময়সূচি প্রকাশ হয়নি।</p>
      ) : (
        <div className="mt-5 space-y-6">
          {Array.from(groups.entries()).map(([k, items]) => (
            <section key={k}>
              <h2 className="mb-2 text-2xl text-accent">{fmtDate(items[0].starts_at)}</h2>
              <ul className="space-y-2">
                {items.map((r) => (
                  <li key={r.id} className="card grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-4">
                    <div className="font-display text-lg text-gold">
                      {fmtTime(r.starts_at)}
                      {r.ends_at ? ` – ${fmtTime(r.ends_at)}` : ''}
                    </div>
                    <div>
                      <b>{r.title}</b>
                      {r.mandapas && (
                        <div className="muted">
                          <Link href={`/mandapa/${r.mandapas.id}`}>{r.mandapas.name}</Link>
                          {r.mandapas.area ? ` · ${r.mandapas.area}` : ''}
                        </div>
                      )}
                      {r.details && <p className="mt-1">{r.details}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
