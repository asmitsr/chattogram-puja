import Link from 'next/link';
import Countdown from '@/components/Countdown';
import Lotus from '@/components/Lotus';
import Comments from '@/components/Comments';
import { hasEnv } from '@/lib/auth';
import { bn, fmtDate } from '@/lib/bn';
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

      <div className="cm hm">
        {/* সুন্দর মুহূর্ত */}
        <section className="hm-gallery wrap" aria-labelledby="gal-h">
          <div className="hm-orn" aria-hidden="true">
            <i />
            <Lotus size={30} />
            <i />
          </div>
          <h2 id="gal-h" className="hm-h">শারদীয়ার রঙে চট্টগ্রাম</h2>
          <p className="hm-sub">শহরের কিছু সুন্দর মুহূর্ত</p>
          <div className="hm-photos">
            {[
              ['/gallery/g1.webp', 1400, 1050, 'প্রতিমার মুখ ও অলংকার'],
              ['/gallery/g2.webp', 932, 581, 'আলোয় সাজানো পূজামণ্ডপ'],
              ['/gallery/g3.webp', 1400, 933, 'প্রতিমা তৈরির মুহূর্ত'],
            ].map(([src, w, h, alt]) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src as string} src={src as string} width={w as number} height={h as number} alt={alt as string} loading="lazy" decoding="async" />
            ))}
          </div>
        </section>

        <div className="wrap hm-stack">
          {/* গুরুত্বপূর্ণ ঘোষণা: অ্যাডমিন প্যানেলের "নোটিশ" থেকে আসে */}
          <section className="hm-card" aria-labelledby="notice-h">
            <div className="hm-card-head">
              <h2 id="notice-h" className="hm-card-title">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M3 10v4a1 1 0 0 0 1 1h2l5 4V5L6 9H4a1 1 0 0 0-1 1zm13.5 2a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z" />
                </svg>
                গুরুত্বপূর্ণ ঘোষণা
              </h2>
            </div>
            {notices.length === 0 ? (
              <p className="hm-empty">এখন কোনো গুরুত্বপূর্ণ ঘোষণা নেই।</p>
            ) : (
              <>
                <ul className="hm-notices">
                  {notices.slice(0, 3).map((nn) => (
                    <li key={nn.id}>
                      <b>{nn.title}</b>
                      {nn.body ? <p>{nn.body}</p> : null}
                      <time>{fmtDate(nn.created_at)}</time>
                    </li>
                  ))}
                </ul>
                {notices.length > 3 && (
                  <details className="hm-more">
                    <summary>সব দেখুন ({bn(notices.length)}টি)</summary>
                    <ul className="hm-notices">
                      {notices.slice(3).map((nn) => (
                        <li key={nn.id}>
                          <b>{nn.title}</b>
                          {nn.body ? <p>{nn.body}</p> : null}
                          <time>{fmtDate(nn.created_at)}</time>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </>
            )}
          </section>

          {/* আপনার পূজার গল্প */}
          <section className="hm-story">
            <div className="hm-story-ic" aria-hidden="true">
              <Lotus size={38} />
            </div>
            <div className="hm-story-tx">
              <h2>আপনার পূজার গল্প</h2>
              <p>আপনার অভিজ্ঞতা, ছবি ও মতামত আমাদের সাথে শেয়ার করুন।</p>
            </div>
            <a href="#comment-form" className="hm-story-btn">
              মতামত দিন
            </a>
          </section>

          <div className="hm-card">
            <Comments mandapaId={null} comments={(data ?? []) as MandapaComment[]} failed={!!error} isAdmin={isAdmin} />
          </div>

          {/* সহযোগিতার আহ্বান */}
          <section className="hm-help">
            <div className="hm-help-ic" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3h8l5 5v13H6z" />
                <path d="M14 3v5h5M12 11v6M9 14h6" />
              </svg>
            </div>
            <div className="hm-help-tx">
              <h2>আপনার সহযোগিতায় সমৃদ্ধ হোক চট্টগ্রামের পুজো</h2>
              <p>নতুন মণ্ডপের তথ্য দিন, ভুল তথ্য সংশোধনে সাহায্য করুন।</p>
            </div>
            <Link href="/submit" className="hm-help-btn">
              + মণ্ডপের তথ্য দিন
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
