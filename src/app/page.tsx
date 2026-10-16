import Link from 'next/link';
import Countdown from '@/components/Countdown';
import Lotus from '@/components/Lotus';
import Comments from '@/components/Comments';
import { hasEnv } from '@/lib/auth';
import { getPublicNotices } from '@/lib/publicData';
import { isAdminViewer } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';
import type { MandapaComment } from '@/lib/types';

// কমেন্ট সবসময় তাজা দেখাতে (ও অ্যাডমিন চিনতে) পাতাটি প্রতিবার তৈরি হয়।
export const dynamic = 'force-dynamic';

export default async function Home() {
  if (!hasEnv()) {
    return (
      <div className="wrap py-10">
        <h1 className="text-3xl text-accent">সেটআপ বাকি</h1>
        <p className="mt-3">Supabase-এর দুটি env মান (NEXT_PUBLIC_SUPABASE_URL ও NEXT_PUBLIC_SUPABASE_ANON_KEY) বসানো হয়নি।</p>
      </div>
    );
  }

  const supabase = createClient();
  const [notices, { data, error }, isAdmin] = await Promise.all([
    getPublicNotices(),
    // সাধারণ মতামত: নির্দিষ্ট কোনো মণ্ডপের নয় (mandapa_id ফাঁকা)
    supabase.from('comments').select('*').is('mandapa_id', null).order('created_at', { ascending: true }).limit(500),
    isAdminViewer(),
  ]);

  return (
    <>
      <section className="hx">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero/durga-hero.webp" alt="দুর্গা মায়ের ছবি" className="hx-bg" width={1400} height={788} fetchPriority="high" />
        <div className="hx-copy">
          <div className="hx-orn" aria-hidden="true">
            <i />
            <Lotus size={34} />
            <i />
          </div>
          <p className="hx-desc">পাহাড়, নদী আর সাগরের এই শহরে সব পূজার মণ্ডপ, ঠিকানা ও সময়সূচি এক জায়গায়।</p>
          <h1 className="hx-title">চট্টগ্রামের পুজো</h1>
          <p className="hx-sub">
            <i aria-hidden="true" />
            <span>শারদীয় দুর্গোৎসব ২০২৬</span>
            <i aria-hidden="true" />
          </p>
          <div className="hx-btns">
            <Link href="/mandapa" className="hx-btn hx-btn-gold">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4.5 4.5" />
              </svg>
              মণ্ডপ খুঁজুন
            </Link>
            <Link href="/map" className="hx-btn hx-btn-line">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
              </svg>
              ম্যাপ দেখুন
            </Link>
          </div>
        </div>
      </section>

      <Countdown />

      {notices.length > 0 && (
        <div className="wrap space-y-4 py-6">
          {notices.map((nn) => (
            <div key={nn.id} role="note" className="rounded-r-md border-l-[5px] border-herogold bg-warnbg p-3">
              <b className="text-warn">জরুরি নোটিশ: {nn.title}</b>
              {nn.body ? <p className="mt-1">{nn.body}</p> : null}
            </div>
          ))}
        </div>
      )}

      <div className="cm cm-band">
        <div className="wrap py-8">
          <Comments mandapaId={null} comments={(data ?? []) as MandapaComment[]} failed={!!error} isAdmin={isAdmin} band />
        </div>
      </div>
    </>
  );
}
