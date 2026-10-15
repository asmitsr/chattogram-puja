import Link from 'next/link';
import Countdown from '@/components/Countdown';
import Lotus from '@/components/Lotus';
import MandapaCard from '@/components/MandapaCard';
import { hasEnv } from '@/lib/auth';
import { getPublicMandapas, getPublicNotices, getPublicYear } from '@/lib/publicData';
import { bn } from '@/lib/bn';
import { YEAR_STATUS } from '@/lib/types';

// দর্শকদের হোম পাতা আগে থেকে তৈরি থাকে, ২ মিনিট পরপর (বা অ্যাডমিন বদলালেই) নতুন হয় — তাই খুব দ্রুত খোলে।
export const revalidate = 120;

export default async function Home() {
  if (!hasEnv()) {
    return (
      <div className="wrap py-10">
        <h1 className="text-3xl text-accent">সেটআপ বাকি</h1>
        <p className="mt-3">Supabase-এর দুটি env মান (NEXT_PUBLIC_SUPABASE_URL ও NEXT_PUBLIC_SUPABASE_ANON_KEY) বসানো হয়নি।</p>
      </div>
    );
  }

  const year = await getPublicYear();
  const all = year ? await getPublicMandapas(year.id) : [];
  const mandapas = all.slice(0, 6);
  const count = all.length;
  const notices = await getPublicNotices();

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

      <div className="wrap space-y-6 py-6">
        {notices.map((nn) => (
          <div key={nn.id} role="note" className="rounded-r-md border-l-[5px] border-herogold bg-warnbg p-3">
            <b className="text-warn">জরুরি নোটিশ: {nn.title}</b>
            {nn.body ? <p className="mt-1">{nn.body}</p> : null}
          </div>
        ))}

        <div>
          <section>
            <h2 className="text-2xl text-accent">{year ? `${bn(year.year)} সালের মণ্ডপ` : 'পূজামণ্ডপ'}</h2>
            <p className="muted mb-3 mt-1">
              {year ? `${year.title} · ${YEAR_STATUS[year.status]} · ${bn(count)}টি প্রকাশিত মণ্ডপ` : 'এখনো কোনো পূজাবর্ষ তৈরি হয়নি।'}
            </p>
            {mandapas.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {mandapas.map((m) => (
                  <MandapaCard key={m.id} m={m} />
                ))}
              </div>
            ) : (
              <p className="muted">এখনো কোনো মণ্ডপ প্রকাশ হয়নি।</p>
            )}
            <p className="mt-4">
              <Link href="/mandapa" className="btn-ghost">
                সব মণ্ডপ দেখুন
              </Link>
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
