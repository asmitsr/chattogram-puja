import Link from 'next/link';
import Countdown from '@/components/Countdown';
import MandapaCard from '@/components/MandapaCard';
import { createClient } from '@/lib/supabase/server';
import { hasEnv } from '@/lib/auth';
import { getYears, pickCurrent } from '@/lib/data';
import { bn, fmtDate } from '@/lib/bn';
import type { Mandapa, NewsItem, Notice } from '@/lib/types';
import { YEAR_STATUS } from '@/lib/types';

export const dynamic = 'force-dynamic';

const PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cg fill='none' stroke='%23F0C766' stroke-opacity='.28' stroke-width='1.2'%3E%3Cpath d='M20 4 L36 20 L20 36 L4 20 Z'/%3E%3Ccircle cx='20' cy='20' r='5'/%3E%3C/g%3E%3C/svg%3E\")";

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
  const years = await getYears(supabase);
  const year = pickCurrent(years);

  let mandapas: Mandapa[] = [];
  let count = 0;
  if (year) {
    const { data, count: c } = await supabase
      .from('mandapas')
      .select('*', { count: 'exact' })
      .eq('year_id', year.id)
      .eq('status', 'published')
      .order('name')
      .limit(6);
    mandapas = (data ?? []) as Mandapa[];
    count = c ?? mandapas.length;
  }

  const { data: n } = await supabase
    .from('news')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(3);
  const news = (n ?? []) as NewsItem[];

  const { data: nt } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
  const notices = (nt ?? []) as Notice[];

  const showCountdown = year && year.starts_on && year.status !== 'archived';

  return (
    <>
      <section className="bg-hero py-9 text-herofg" style={{ backgroundImage: PATTERN }}>
        <div className="wrap">
          <h1 className="text-[clamp(2.2rem,8vw,3.8rem)] text-herofg">চট্টগ্রামের পুজো</h1>
          <p className="mt-3 max-w-xl opacity-95">
            পাহাড়, নদী আর সাগরের এই শহরে দুর্গাপূজার সব মণ্ডপ, ঠিকানা ও সময়সূচি এক জায়গায়। অ্যাকাউন্ট ছাড়াই দেখা যায়।
          </p>
          {showCountdown ? (
            <>
              <Countdown target={year!.starts_on!} />
              <p className="mt-2 text-sm opacity-85">{fmtDate(year!.starts_on)} পর্যন্ত বাকি</p>
            </>
          ) : null}
        </div>
      </section>

      <div className="wrap space-y-6 py-6">
        {notices.map((nn) => (
          <div key={nn.id} role="note" className="rounded-r-md border-l-[5px] border-herogold bg-warnbg p-3">
            <b className="text-warn">জরুরি নোটিশ: {nn.title}</b>
            {nn.body ? <p className="mt-1">{nn.body}</p> : null}
          </div>
        ))}

        <div className="grid gap-8 md:grid-cols-[3fr_2fr]">
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

          <section>
            <h2 className="text-2xl text-accent">সাম্প্রতিক সংবাদ</h2>
            {news.length ? (
              <ul className="mt-3 space-y-3">
                {news.map((x) => (
                  <li key={x.id} className="border-b border-dashed border-line pb-3">
                    <b>{x.title}</b>
                    <div className="muted">{fmtDate(x.published_at)}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted mt-3">এখনো কোনো সংবাদ নেই।</p>
            )}
            <p className="mt-4">
              <Link href="/news" className="btn-ghost">
                সব সংবাদ
              </Link>
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
