import Comments from '@/components/Comments';
import MapView, { type Pin } from '@/components/MapView';
import PujaMapEmbed from '@/components/PujaMapEmbed';
import ShareBar from '@/components/ShareBar';
import { createClient } from '@/lib/supabase/server';
import { bn } from '@/lib/bn';
import type { MandapaComment } from '@/lib/types';

export const metadata = { title: 'ম্যাপ' };
export const dynamic = 'force-dynamic';

export default async function MapPage() {
  const supabase = createClient();

  // ডাটাবেসের সব প্রকাশিত মণ্ডপ: অ্যাডমিন অনুমোদনের পর নতুন মণ্ডপও এখানে ॐ মার্কারে আসে
  const [{ data: ms }, { data, error }] = await Promise.all([
    supabase.from('mandapas').select('id,name,area,latitude,longitude').eq('status', 'published').limit(3000),
    // ম্যাপ পাতার সাধারণ মতামত: নির্দিষ্ট কোনো মণ্ডপের নয় (mandapa_id ফাঁকা)
    supabase.from('comments').select('*').is('mandapa_id', null).order('created_at', { ascending: true }).limit(500),
  ]);

  const all = (ms ?? []) as { id: string; name: string; area: string | null; latitude: number | null; longitude: number | null }[];
  const pins: Pin[] = all
    .filter((m) => m.latitude !== null && m.longitude !== null && Number.isFinite(Number(m.latitude)) && Number.isFinite(Number(m.longitude)))
    .map((m) => ({ id: m.id, name: m.name, area: m.area, lat: Number(m.latitude), lng: Number(m.longitude) }));
  const noLoc = all.length - pins.length;

  return (
    <div className="wrap space-y-6 py-6">
      <div className="space-y-2">
        <h1 className="text-3xl text-accent">ম্যাপে মণ্ডপ</h1>
        <p className="muted">
          ॐ চিহ্নে চাপ দিলে মণ্ডপের নাম ও বিস্তারিত দেখা যাবে। এখানে অনুমোদিত সব মণ্ডপ দেখানো হয়।
          {pins.length > 0 && <> ম্যাপে এখন {bn(pins.length)}টি মণ্ডপ আছে।</>}
          {noLoc > 0 && <> আরও {bn(noLoc)}টি মণ্ডপের সঠিক অবস্থান এখনো যোগ হয়নি।</>}
        </p>
        {pins.length > 0 ? (
          <MapView pins={pins} height="75vh" wheelZoom />
        ) : (
          <p className="card">এখনো ম্যাপে দেখানোর মতো অবস্থানসহ কোনো মণ্ডপ নেই।</p>
        )}
      </div>

      <details className="rounded-md border border-line p-3">
        <summary className="cursor-pointer font-semibold">গুগল ম্যাপের পূজা মানচিত্রও দেখুন</summary>
        <div className="mt-3">
          <PujaMapEmbed ratio={110} />
        </div>
      </details>

      <ShareBar title="চট্টগ্রামের পুজো — মণ্ডপের ম্যাপ" what="এই ম্যাপ" />
      <Comments mandapaId={null} comments={(data ?? []) as MandapaComment[]} failed={!!error} />
    </div>
  );
}
