import Flash from '@/components/Flash';
import { requireAdmin } from '@/lib/admin';
import { getYears, pickCurrent } from '@/lib/data';
import { fmtDate } from '@/lib/bn';
import type { NewsItem } from '@/lib/types';
import { deleteNews, saveNews } from '../../actions';

export default async function AdminNews({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const { supabase } = await requireAdmin();
  const years = await getYears(supabase);
  const current = pickCurrent(years);
  const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false }).limit(50);
  const list = (data ?? []) as NewsItem[];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl text-accent">সংবাদ ব্যবস্থাপনা</h1>
      <Flash ok={searchParams.ok} err={searchParams.err} />

      <form action={saveNews} className="card space-y-3">
        <h2 className="text-xl text-accent">নতুন সংবাদ</h2>
        <div>
          <label className="label" htmlFor="n-title">
            শিরোনাম
          </label>
          <input id="n-title" name="title" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="n-body">
            লেখা
          </label>
          <textarea id="n-body" name="body" className="input min-h-[120px]" required />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="n-year">
              পূজাবর্ষ
            </label>
            <select id="n-year" name="year_id" className="input" defaultValue={current?.id ?? ''}>
              <option value="">কোনো বছরের নয়</option>
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="n-status">
              অবস্থা
            </label>
            <select id="n-status" name="status" className="input" defaultValue="published">
              <option value="published">প্রকাশিত</option>
              <option value="draft">খসড়া</option>
            </select>
          </div>
        </div>
        <button className="btn" type="submit">
          সংরক্ষণ
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="text-xl text-accent">সব সংবাদ</h2>
        {list.length === 0 && <p className="muted">এখনো কোনো সংবাদ নেই।</p>}
        {list.map((n) => (
          <div key={n.id} className="card space-y-3">
            <form action={saveNews} className="space-y-3">
              <input type="hidden" name="id" value={n.id} />
              <div className="muted">{fmtDate(n.published_at ?? n.created_at)}</div>
              <div>
                <label className="label" htmlFor={`t-${n.id}`}>
                  শিরোনাম
                </label>
                <input id={`t-${n.id}`} name="title" className="input" defaultValue={n.title} required />
              </div>
              <div>
                <label className="label" htmlFor={`b-${n.id}`}>
                  লেখা
                </label>
                <textarea id={`b-${n.id}`} name="body" className="input min-h-[90px]" defaultValue={n.body} required />
              </div>
              <div>
                <label className="label" htmlFor={`s-${n.id}`}>
                  অবস্থা
                </label>
                <select id={`s-${n.id}`} name="status" className="input" defaultValue={n.status}>
                  <option value="published">প্রকাশিত</option>
                  <option value="draft">খসড়া</option>
                </select>
              </div>
              <button className="btn" type="submit">
                আপডেট
              </button>
            </form>
            <form action={deleteNews} className="flex flex-wrap items-center gap-3 border-t border-line pt-3">
              <input type="hidden" name="id" value={n.id} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="confirm" value="yes" />
                স্থায়ীভাবে মুছতে চাই
              </label>
              <button className="btn-danger !min-h-0 !py-1" type="submit">
                মুছুন
              </button>
            </form>
          </div>
        ))}
      </section>
    </div>
  );
}
