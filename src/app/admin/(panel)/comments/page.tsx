import Link from 'next/link';
import Flash from '@/components/Flash';
import { requireAdmin } from '@/lib/admin';
import { fmtDateTime } from '@/lib/bn';
import type { MandapaComment } from '@/lib/types';
import { deleteComment, replyComment } from '../../actions';

export default async function AdminComments({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const { supabase } = await requireAdmin();

  const { data } = await supabase.from('comments').select('*').order('created_at', { ascending: false }).limit(150);
  const list = (data ?? []) as MandapaComment[];

  const ids = Array.from(new Set(list.map((c) => c.mandapa_id).filter((x): x is string => !!x)));
  const names = new Map<string, string>();
  if (ids.length) {
    const { data: ms } = await supabase.from('mandapas').select('id,name').in('id', ids);
    (ms ?? []).forEach((m: { id: string; name: string }) => names.set(m.id, m.name));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl text-accent">মন্তব্য ব্যবস্থাপনা</h1>
      <p className="muted">
        মন্তব্য সঙ্গে সঙ্গে সাইটে দেখা যায়। আপত্তিকর বা স্প্যাম মন্তব্য এখান থেকে মুছতে পারবেন, অথবা অ্যাডমিন হিসেবে রিপ্লাই দিতে পারবেন। সর্বশেষ ১৫০টি দেখানো হচ্ছে।
      </p>
      <Flash ok={searchParams.ok} err={searchParams.err} />

      {list.length === 0 && <p className="muted">এখনো কোনো মন্তব্য নেই।</p>}

      {list.map((c) => (
        <article key={c.id} className="card space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <b>{c.author_name}</b>
            {c.by_admin && <span className="badge">অ্যাডমিন</span>}
            {c.parent_id && <span className="badge">রিপ্লাই</span>}
            <span className="muted text-sm">{fmtDateTime(c.created_at)}</span>
            <span className="muted text-sm">· ❤ {c.like_count}</span>
          </div>
          <p className="muted text-sm">
            মণ্ডপ:{' '}
            <Link href={c.mandapa_id ? `/mandapa/${c.mandapa_id}` : '/map'} target="_blank">
              {c.mandapa_id ? (names.get(c.mandapa_id) ?? 'অজানা মণ্ডপ') : 'ম্যাপ পাতা (সাধারণ মতামত)'}
            </Link>
          </p>
          <p className="whitespace-pre-line break-words">{c.body}</p>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <form action={replyComment} className="flex gap-2">
              <input type="hidden" name="parent_id" value={c.id} />
              <input name="body" className="input" placeholder="অ্যাডমিন হিসেবে রিপ্লাই লিখুন" maxLength={1000} aria-label="রিপ্লাই" required />
              <button type="submit" className="btn shrink-0">
                রিপ্লাই
              </button>
            </form>
            <form action={deleteComment}>
              <input type="hidden" name="id" value={c.id} />
              <button type="submit" className="btn-danger w-full">
                মুছুন
              </button>
            </form>
          </div>
        </article>
      ))}
    </div>
  );
}
