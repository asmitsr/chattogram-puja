import Link from 'next/link';
import MandapaCard from '@/components/MandapaCard';
import { createClient } from '@/lib/supabase/server';
import { getYears } from '@/lib/data';
import { bn, fmtDate } from '@/lib/bn';
import type { Mandapa, NewsItem } from '@/lib/types';
import { YEAR_STATUS } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'আর্কাইভ' };

export default async function ArchivePage({ searchParams }: { searchParams: { year?: string } }) {
  const supabase = createClient();
  const years = await getYears(supabase);
  const chosen = years.find((y) => String(y.year) === searchParams.year) ?? null;

  let mandapas: Mandapa[] = [];
  let news: NewsItem[] = [];
  if (chosen) {
    const [{ data: m }, { data: n }] = await Promise.all([
      supabase
        .from('mandapas')
        .select('*')
        .eq('year_id', chosen.id)
        .in('status', ['published', 'archived'])
        .order('name'),
      supabase.from('news').select('*').eq('year_id', chosen.id).eq('status', 'published').order('published_at', { ascending: false }),
    ]);
    mandapas = (m ?? []) as Mandapa[];
    news = (n ?? []) as NewsItem[];
  }

  return (
    <div className="wrap py-6">
      <h1 className="text-3xl text-accent">পূজাবর্ষের আর্কাইভ</h1>
      <p className="muted mt-1">প্রতি বছরের মণ্ডপ ও সংবাদ আলাদা থাকে। পুরোনো বছরের তথ্য এখানে দেখা যায়।</p>

      {years.length === 0 ? (
        <p className="mt-6">এখনো কোনো পূজাবর্ষ নেই।</p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-3">
          {years.map((y) => (
            <Link
              key={y.id}
              href={`/archive?year=${y.year}`}
              className={`card no-underline ${chosen?.id === y.id ? 'border-accent' : ''}`}
            >
              <b className="font-display text-2xl text-fg">{bn(y.year)}</b>
              <div>
                <span className={y.status === 'archived' ? 'badge' : 'badge-ok'}>{YEAR_STATUS[y.status]}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {chosen && (
        <div className="mt-8 space-y-8">
          <section>
            <h2 className="text-2xl text-accent">
              {bn(chosen.year)} · {chosen.title}
            </h2>
            <p className="muted mb-3">{chosen.starts_on ? `শুরু: ${fmtDate(chosen.starts_on)}` : ''}</p>
            {mandapas.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {mandapas.map((m) => (
                  <MandapaCard key={m.id} m={m} />
                ))}
              </div>
            ) : (
              <p className="muted">এই বছরের কোনো প্রকাশিত মণ্ডপ নেই।</p>
            )}
          </section>
          {news.length > 0 && (
            <section>
              <h2 className="mb-2 text-2xl text-accent">সংবাদ</h2>
              <div className="space-y-3">
                {news.map((n) => (
                  <article key={n.id} className="card">
                    <b>{n.title}</b>
                    <p className="muted">{fmtDate(n.published_at ?? n.created_at)}</p>
                    <p className="mt-1 whitespace-pre-line">{n.body}</p>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
