'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminDeleteComment, adminReply, postComment, toggleLike } from '@/app/mandapa/[id]/actions';
import { bn, fmtDateTime } from '@/lib/bn';
import type { MandapaComment } from '@/lib/types';

const NAME_KEY = 'cp_comment_name';
const VOTER_KEY = 'cp_voter';
const LIKED_KEY = 'cp_liked';

function readLS(k: string): string | null {
  try {
    return window.localStorage.getItem(k);
  } catch {
    return null;
  }
}
function writeLS(k: string, v: string) {
  try {
    window.localStorage.setItem(k, v);
  } catch {
    /* ব্রাউজার সংরক্ষণ বন্ধ থাকলে চলবে, শুধু মনে থাকবে না */
  }
}
function voterId(): string {
  let v = readLS(VOTER_KEY);
  if (!v || !/^[A-Za-z0-9-]{16,64}$/.test(v)) {
    v = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}-xxxxxxxx`;
    writeLS(VOTER_KEY, v);
  }
  return v;
}

function CommentForm({
  mandapaId,
  parentId,
  compact,
  onDone,
}: {
  mandapaId: string | null;
  parentId: string | null;
  compact?: boolean;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [body, setBody] = useState('');
  const [website, setWebsite] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const started = useRef(Date.now());
  const uid = useRef(`c${Math.random().toString(36).slice(2, 8)}`).current;

  useEffect(() => {
    setName(readLS(NAME_KEY) ?? '');
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr('');
    const r = await postComment({ mandapaId, parentId, name, anonymous, body, website, started: started.current });
    setBusy(false);
    if (!r.ok) {
      setErr(r.error ?? 'মন্তব্য জমা হয়নি।');
      return;
    }
    if (!anonymous && name.trim()) writeLS(NAME_KEY, name.trim());
    setBody('');
    started.current = Date.now();
    router.refresh();
    onDone?.();
  }

  return (
    <form onSubmit={submit} className={`space-y-3 rounded-md border border-line bg-surface ${compact ? 'p-3' : 'p-4'}`}>
      <div>
        <label className="label" htmlFor={`${uid}-name`}>
          আপনার নাম:
        </label>
        <input
          id={`${uid}-name`}
          className="input"
          value={anonymous ? '' : name}
          onChange={(e) => setName(e.target.value)}
          disabled={anonymous}
          maxLength={60}
          placeholder="আপনার নাম লিখুন..."
          autoComplete="name"
        />
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="h-4 w-4" />
        নাম হাইড করে কমেন্ট করুন (অজ্ঞাতনাম)
      </label>
      <div>
        <label className="label" htmlFor={`${uid}-body`}>
          {parentId ? 'আপনার রিপ্লাই' : 'আপনার মন্তব্য'}
        </label>
        <textarea
          id={`${uid}-body`}
          className="input min-h-[90px]"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={1000}
          placeholder="আপনার মন্তব্য এখানে লিখুন..."
          required
        />
      </div>
      {/* স্প্যাম বটের ফাঁদ: মানুষের চোখে পড়ে না */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
        <label htmlFor={`${uid}-web`}>এই ঘরটি ফাঁকা রাখুন</label>
        <input id={`${uid}-web`} tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
      {err && (
        <p role="alert" className="rounded-md bg-warnbg p-2 text-sm font-semibold text-err">
          {err}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn" disabled={busy}>
          ➤ {busy ? 'পাঠানো হচ্ছে…' : parentId ? 'রিপ্লাই করুন' : 'কমেন্ট করুন'}
        </button>
        {onDone && (
          <button type="button" className="btn-ghost" onClick={onDone}>
            বাতিল
          </button>
        )}
      </div>
    </form>
  );
}

function LikeButton({ c, liked, count, onToggle }: { c: MandapaComment; liked: boolean; count: number; onToggle: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(c.id)}
      aria-pressed={liked}
      className={`inline-flex items-center gap-1 text-sm font-semibold ${liked ? 'text-err' : 'text-muted'}`}
    >
      <span aria-hidden="true">{liked ? '❤️' : '🤍'}</span> লাভ ({bn(count)})
    </button>
  );
}

function Author({ c }: { c: MandapaComment }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3">
      <b className="inline-flex items-center gap-1.5">
        <span aria-hidden="true">👤</span>
        {c.author_name}
        {c.by_admin && !c.parent_id && <span className="badge">অ্যাডমিন</span>}
      </b>
      <span className="muted text-xs">{fmtDateTime(c.created_at)}</span>
    </div>
  );
}

// অ্যাডমিনের রিপ্লাইয়ে আলাদা, পরিষ্কার লেবেল
function AdminReplyBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-btn px-2.5 py-0.5 text-xs font-bold text-btnfg">
      <span aria-hidden="true">🛡</span> এডমিন রিপ্লাই
    </span>
  );
}

// শুধু অ্যাডমিনকে দেখানো হয়: এক চাপে মন্তব্য/রিপ্লাই মোছা (নিশ্চিত করার প্রশ্নসহ)
function DeleteButton({ c }: { c: MandapaComment }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function del() {
    const msg = c.parent_id ? 'এই রিপ্লাইটি মুছে ফেলবেন?' : 'এই মন্তব্যটি ও এর সব রিপ্লাই মুছে ফেলবেন?';
    if (!window.confirm(msg)) return;
    setBusy(true);
    const r = await adminDeleteComment(c.id);
    setBusy(false);
    if (!r.ok) {
      alert(r.error ?? 'মোছা যায়নি।');
      return;
    }
    router.refresh();
  }
  return (
    <button type="button" onClick={() => void del()} disabled={busy} className="text-sm font-semibold text-err disabled:opacity-60">
      🗑 {busy ? 'মোছা হচ্ছে…' : 'মুছুন'}
    </button>
  );
}

// শুধু অ্যাডমিনের রিপ্লাই ফর্ম (নাম বা অজ্ঞাতনামের দরকার নেই)
function AdminReplyForm({ parentId, onDone }: { parentId: string; onDone: () => void }) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr('');
    const r = await adminReply(parentId, body);
    setBusy(false);
    if (!r.ok) {
      setErr(r.error ?? 'রিপ্লাই দেওয়া যায়নি।');
      return;
    }
    setBody('');
    router.refresh();
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-md border border-line bg-surface p-3">
      <div className="flex items-center gap-2">
        <AdminReplyBadge />
      </div>
      <textarea
        className="input min-h-[80px]"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={1000}
        placeholder="অ্যাডমিন হিসেবে রিপ্লাই লিখুন..."
        aria-label="অ্যাডমিন রিপ্লাই"
        required
      />
      {err && (
        <p role="alert" className="rounded-md bg-warnbg p-2 text-sm font-semibold text-err">
          {err}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn" disabled={busy}>
          ➤ {busy ? 'পাঠানো হচ্ছে…' : 'রিপ্লাই করুন'}
        </button>
        <button type="button" className="btn-ghost" onClick={onDone}>
          বাতিল
        </button>
      </div>
    </form>
  );
}

// মণ্ডপের পাতার "মতামত ও কমেন্টস": মন্তব্য, রিপ্লাই ও লাইক
export default function Comments({
  mandapaId,
  comments,
  failed,
  isAdmin = false,
}: {
  mandapaId: string | null;
  comments: MandapaComment[];
  failed?: boolean;
  isAdmin?: boolean;
}) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [replyTo, setReplyTo] = useState<string | null>(null);

  useEffect(() => {
    try {
      const arr = JSON.parse(readLS(LIKED_KEY) ?? '[]');
      if (Array.isArray(arr)) setLiked(Object.fromEntries(arr.filter((x) => typeof x === 'string').map((x: string) => [x, true])));
    } catch {
      /* ফাঁকা থাকবে */
    }
  }, []);

  const { tops, repliesOf } = useMemo(() => {
    const t = comments.filter((c) => !c.parent_id).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    const map = new Map<string, MandapaComment[]>();
    comments
      .filter((c) => c.parent_id)
      .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
      .forEach((r) => map.set(r.parent_id!, [...(map.get(r.parent_id!) ?? []), r]));
    return { tops: t, repliesOf: map };
  }, [comments]);

  async function onToggle(id: string) {
    const was = !!liked[id];
    setLiked((l) => ({ ...l, [id]: !was }));
    const r = await toggleLike(id, voterId());
    if (!r.ok) {
      setLiked((l) => ({ ...l, [id]: was }));
      return;
    }
    setCounts((c) => ({ ...c, [id]: r.count ?? 0 }));
    const now = { ...liked, [id]: !was };
    writeLS(LIKED_KEY, JSON.stringify(Object.keys(now).filter((k) => now[k])));
  }

  async function shareComment(c: MandapaComment) {
    const u = `${window.location.href.split('#')[0]}#comments-h`;
    const text = `${c.author_name}: ${c.body.slice(0, 120)}`;
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: 'চট্টগ্রামের পুজো', text, url: u });
        return;
      }
      await navigator.clipboard.writeText(u);
      alert('লিংক কপি হয়েছে।');
    } catch {
      /* বাতিল করলে কিছু হয় না */
    }
  }

  const total = comments.length;
  const countOf = (c: MandapaComment) => counts[c.id] ?? c.like_count;

  return (
    <section aria-labelledby="comments-h" className="space-y-4">
      <h2 id="comments-h" className="text-2xl text-accent">
        <span aria-hidden="true">💬</span> মতামত ও কমেন্টস {total > 0 && <span className="muted text-base">({bn(total)})</span>}
      </h2>
      <p className="muted">মণ্ডপ সম্পর্কে আপনার মতামত, অভিযোগ বা পরামর্শ জানান। ভদ্র ভাষায় লিখুন; অন্যের ব্যক্তিগত তথ্য দেবেন না। মন্তব্যের উত্তর শুধু অ্যাডমিন দিতে পারেন।</p>

      {failed && (
        <p role="alert" className="rounded-md bg-warnbg p-2 text-sm font-semibold text-err">
          মন্তব্য লোড করা যায়নি। অ্যাডমিন: Supabase-এ sql/08 ও sql/09 ফাইল দুটি Run করুন।
        </p>
      )}
      <CommentForm mandapaId={mandapaId} parentId={null} />

      {tops.length === 0 && <p className="muted">এখনো কোনো মন্তব্য নেই। প্রথম মন্তব্যটি আপনিই করুন।</p>}

      <div className="space-y-3">
        {tops.map((c) => (
          <article key={c.id} className="card space-y-2">
            <Author c={c} />
            <p className="whitespace-pre-line break-words">{c.body}</p>
            <div className="flex flex-wrap items-center gap-4">
              <LikeButton c={c} liked={!!liked[c.id]} count={countOf(c)} onToggle={onToggle} />
              {isAdmin && (
                <button type="button" className="text-sm font-semibold text-accent" onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}>
                  ↩ অ্যাডমিন রিপ্লাই
                </button>
              )}
              <button type="button" className="text-sm font-semibold text-muted" onClick={() => void shareComment(c)}>
                ⤴ শেয়ার
              </button>
              {isAdmin && <DeleteButton c={c} />}
            </div>

            {(repliesOf.get(c.id) ?? []).map((r) => (
              <div
                key={r.id}
                className={`ml-3 space-y-2 rounded-md border border-line p-3 sm:ml-6 ${
                  r.by_admin ? 'border-l-4 border-l-accent bg-goldsoft' : 'bg-bg'
                }`}
              >
                {r.by_admin && <AdminReplyBadge />}
                <Author c={r} />
                <p className="whitespace-pre-line break-words">{r.body}</p>
                <div className="flex flex-wrap items-center gap-4">
                  <LikeButton c={r} liked={!!liked[r.id]} count={countOf(r)} onToggle={onToggle} />
                  {isAdmin && <DeleteButton c={r} />}
                </div>
              </div>
            ))}

            {isAdmin && replyTo === c.id && (
              <div className="ml-3 sm:ml-6">
                <AdminReplyForm parentId={c.id} onDone={() => setReplyTo(null)} />
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
