import Comments from '@/components/Comments';
import MapView from '@/components/MapView';
import PujaMapEmbed from '@/components/PujaMapEmbed';
import ShareBar from '@/components/ShareBar';
import { isAdminViewer } from '@/lib/admin';
import { fetchPins } from '@/lib/pins';
import { createClient } from '@/lib/supabase/server';
import { bn } from '@/lib/bn';
import type { MandapaComment } from '@/lib/types';

export const metadata = { title: 'ম্যাপ' };
export const dynamic = 'force-dynamic';

export default async function MapPage() {
  const supabase = createClient();

  // ডাটাবেসের সব প্রকাশিত মণ্ডপ: অ্যাডমিন অনুমোদনের পর নতুন মণ্ডপও এখানে ॐ মার্কারে আসে
  const [{ pins, noLoc }, { data, error }, isAdmin] = await Promise.all([
    fetchPins(supabase),
    // ম্যাপ পাতার সাধারণ মতামত: নির্দিষ্ট কোনো মণ্ডপের নয় (mandapa_id ফাঁকা)
    supabase.from('comments').select('*').is('mandapa_id', null).order('created_at', { ascending: true }).limit(500),
    isAdminViewer(),
  ]);

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
          <MapView pins={pins} height="clamp(260px, 38vh, 420px)" wheelZoom fullscreenToggle />
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
      <Comments mandapaId={null} comments={(data ?? []) as MandapaComment[]} failed={!!error} isAdmin={isAdmin} />
    </div>
  );
}
