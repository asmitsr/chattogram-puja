'use client';

import { useEffect, useState } from 'react';
import { getSiteLikes, setSiteLike } from '@/app/likes/actions';
import { bn } from '@/lib/bn';
import { voterId } from '@/lib/voter';

// পুরো ওয়েবসাইটকে লাভ/লাইক দেওয়ার বোতাম ও মোট সংখ্যা
export default function SiteLike() {
  const [count, setCount] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    getSiteLikes(voterId())
      .then((r) => {
        if (!alive || !r.ok) return;
        setCount(r.count ?? 0);
        setLiked(!!r.liked);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // ডেটাবেস প্রস্তুত না থাকলে (SQL চালানো না হলে) বা লোড না হলে কিছুই দেখানো হয় না
  if (count === null) return null;

  async function toggle() {
    if (busy) return;
    const was = liked;
    const prev = count ?? 0;
    setBusy(true);
    setLiked(!was);
    setCount(Math.max(prev + (was ? -1 : 1), 0));
    const r = await setSiteLike(voterId(), !was);
    setBusy(false);
    if (!r.ok) {
      setLiked(was);
      setCount(prev);
      return;
    }
    setLiked(!!r.liked);
    setCount(r.count ?? prev);
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => void toggle()}
        aria-pressed={liked}
        disabled={busy}
        className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border px-5 py-2 font-semibold transition active:scale-95 disabled:opacity-70 ${
          liked ? 'border-herogold bg-herogold text-hero' : 'border-herogold bg-transparent text-herofg'
        }`}
      >
        <span aria-hidden="true" className="text-xl leading-none">
          {liked ? '❤️' : '🤍'}
        </span>
        {liked ? 'আপনি লাভ দিয়েছেন' : 'ওয়েবসাইটকে লাভ দিন'}
      </button>
      <span className="text-sm opacity-95" aria-live="polite">
        মোট লাভ: <b>{bn(count)}</b>
      </span>
    </div>
  );
}
