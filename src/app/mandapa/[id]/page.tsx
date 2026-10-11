import Link from 'next/link';
import { notFound } from 'next/navigation';
import Comments from '@/components/Comments';
import MapView from '@/components/MapView';
import ShareBar from '@/components/ShareBar';
import { createClient } from '@/lib/supabase/server';
import { bn, dayKey, fmtDate, fmtTime } from '@/lib/bn';
import type { Mandapa, MandapaComment, Schedule } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function MandapaDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase.from('mandapas').select('*').eq('id', params.id).maybeSingle();
  if (!data) notFound();
  const m = data as Mandapa;

  const [{ data: y }, { data: s }, { data: cm, error: cmErr }] = await Promise.all([
    supabase.from('puja_years').select('year,title').eq('id', m.year_id).maybeSingle(),
    supabase.from('schedules').select('*').eq('mandapa_id', m.id).order('starts_at'),
    supabase.from('comments').select('*').eq('mandapa_id', m.id).order('created_at', { ascending: true }).limit(500),
  ]);
  const comments = (cm ?? []) as MandapaComment[];
  const schedules = (s ?? []) as Schedule[];

  const groups = new Map<string, Schedule[]>();
  schedules.forEach((x) => {
    const k = x.starts_at ? dayKey(x.starts_at) : 'unknown';
    groups.set(k, [...(groups.get(k) ?? []), x]);
  });

  const hasLoc = m.latitude !== null && m.longitude !== null;

  return (
    <div className="wrap space-y-6 py-6">
      <p>
        <Link href="/mandapa">← সব মণ্ডপ</Link>
      </p>
      <div>
        {m.area && <span className="badge">{m.area}</span>}
        {y && <span className="badge ml-2">{bn(y.year)}</span>}
        {m.status === 'archived' && <span className="badge-warn ml-2">আর্কাইভ</span>}
        <h1 className="mt-2 text-3xl text-accent">{m.name}</h1>
        {m.address && <p className="mt-2">{m.address}</p>}
        {m.contact && <p className="muted mt-1">যোগাযোগ (কমিটির): {m.contact}</p>}
        {m.description && <p className="mt-3 max-w-2xl">{m.description}</p>}
      </div>

      <section>
        <h2 className="mb-2 text-2xl text-accent">অবস্থান</h2>
        {hasLoc ? (
          <>
            <MapView pins={[{ id: m.id, name: m.name, area: m.area, lat: m.latitude!, lng: m.longitude! }]} height={300} />
            <p className="mt-3">
              <a
                className="btn-ghost"
                href={`https://www.google.com/maps/dir/?api=1&destination=${m.latitude},${m.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Maps-এ দিকনির্দেশ
              </a>
            </p>
          </>
        ) : (
          <p className="muted">এই মণ্ডপের সঠিক অবস্থান এখনো ম্যাপে যোগ হয়নি।</p>
        )}
      </section>

      <ShareBar title={m.name} />
      <Comments mandapaId={m.id} comments={comments} failed={!!cmErr} />

      <section>
        <h2 className="mb-2 text-2xl text-accent">সময়সূচি</h2>
        {schedules.length ? (
          <div className="space-y-4">
            {Array.from(groups.entries()).map(([k, items]) => (
              <div key={k}>
                <h3 className="mb-1 text-lg">{k === 'unknown' ? 'সময় নির্ধারিত নয়' : fmtDate(items[0].starts_at)}</h3>
                <ul className="space-y-2">
                  {items.map((x) => (
                    <li key={x.id} className="card">
                      <b>{x.title}</b>
                      {x.starts_at && (
                        <span className="muted ml-2">
                          {fmtTime(x.starts_at)}
                          {x.ends_at ? ` – ${fmtTime(x.ends_at)}` : ''}
                        </span>
                      )}
                      {x.details && <p className="mt-1">{x.details}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">এখনো কোনো সময়সূচি দেওয়া হয়নি।</p>
        )}
      </section>

      <p className="muted">
        তথ্যে ভুল আছে? <Link href="/submit">সংশোধনের অনুরোধ জানান</Link>।
      </p>
    </div>
  );
}
