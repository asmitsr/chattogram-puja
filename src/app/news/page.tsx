import { createClient } from '@/lib/supabase/server';
import { fmtDate } from '@/lib/bn';
import type { NewsItem } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'সংবাদ' };

export default async function NewsPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from('news')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50);
  const news = (data ?? []) as NewsItem[];

  return (
    <div className="wrap py-6">
      <h1 className="text-3xl text-accent">সংবাদ ও নোটিশ</h1>
      {news.length === 0 ? (
        <p className="mt-6">এখনো কোনো সংবাদ প্রকাশ হয়নি।</p>
      ) : (
        <div className="mt-5 space-y-4">
          {news.map((n) => (
            <article key={n.id} className="card">
              <h2 className="text-xl text-accent">{n.title}</h2>
              <p className="muted">{fmtDate(n.published_at ?? n.created_at)}</p>
              <p className="mt-2 whitespace-pre-line">{n.body}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
