import Link from 'next/link';
import Comments from '@/components/Comments';
import PujaMapEmbed from '@/components/PujaMapEmbed';
import ShareBar from '@/components/ShareBar';
import { isAdminViewer } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';
import type { MandapaComment } from '@/lib/types';

export const metadata = { title: 'ম্যাপ' };
export const dynamic = 'force-dynamic';

export default async function MapPage() {
  const supabase = createClient();

  const [{ data, error }, isAdmin] = await Promise.all([
    // ম্যাপ পাতার সাধারণ মতামত: নির্দিষ্ট কোনো মণ্ডপের নয় (mandapa_id ফাঁকা)
    supabase.from('comments').select('*').is('mandapa_id', null).order('created_at', { ascending: true }).limit(500),
    isAdminViewer(),
  ]);

  return (
    <div className="wrap space-y-6 py-6">
      <div className="space-y-2">
        <h1 className="text-3xl text-accent">ম্যাপে মণ্ডপ</h1>
        <p className="muted">
          ॐ চিহ্নে চাপ দিলে মণ্ডপের নাম ও বিস্তারিত দেখা যাবে। ম্যাপে মহানগর, উত্তর ও দক্ষিণ চট্টগ্রাম আলাদা স্তরে (লেয়ারে) সাজানো।
          &quot;গুগল ম্যাপে খুলুন&quot; বোতাম চাপলে আপনার ফোনের গুগল ম্যাপে সব পূজার ॐ চিহ্ন একসঙ্গে দেখা যায়।
        </p>
        <PujaMapEmbed />
        <div className="card flex flex-wrap items-center justify-between gap-3">
          <p className="muted">
            আপনার এলাকার কোনো পূজা ম্যাপে নেই, বা কোনো তথ্য ভুল? জানান। যাচাইয়ের পর ম্যাপ হালনাগাদ করা হয়।
          </p>
          <Link href="/submit" className="btn">
            নতুন তথ্য যুক্ত করুন
          </Link>
        </div>
      </div>

      <ShareBar title="চট্টগ্রামের পুজো — মণ্ডপের ম্যাপ" what="এই ম্যাপ" />
      <Comments mandapaId={null} comments={(data ?? []) as MandapaComment[]} failed={!!error} isAdmin={isAdmin} />
    </div>
  );
}
