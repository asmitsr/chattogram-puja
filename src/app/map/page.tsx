import Comments from '@/components/Comments';
import PujaMapEmbed from '@/components/PujaMapEmbed';
import ShareBar from '@/components/ShareBar';
import { createClient } from '@/lib/supabase/server';
import type { MandapaComment } from '@/lib/types';

export const metadata = { title: 'ম্যাপ' };
export const dynamic = 'force-dynamic';

export default async function MapPage() {
  const supabase = createClient();
  // ম্যাপ পাতার সাধারণ মতামত: নির্দিষ্ট কোনো মণ্ডপের নয় (mandapa_id ফাঁকা)
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .is('mandapa_id', null)
    .order('created_at', { ascending: true })
    .limit(500);

  return (
    <div className="wrap space-y-6 py-6">
      <div className="space-y-2">
        <h1 className="text-3xl text-accent">ম্যাপে মণ্ডপ</h1>
        <p className="muted">পিনে চাপ দিলে মণ্ডপের নাম ও বিস্তারিত দেখা যাবে।</p>
        <PujaMapEmbed ratio={110} />
      </div>
      <ShareBar title="চট্টগ্রামের পুজো — মণ্ডপের ম্যাপ" what="এই ম্যাপ" />
      <Comments mandapaId={null} comments={(data ?? []) as MandapaComment[]} failed={!!error} />
    </div>
  );
}
