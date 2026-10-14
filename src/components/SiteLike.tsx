'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { addSiteLikes, getSiteLikeTotal } from '@/app/likes/actions';
import { bn } from '@/lib/bn';

// উপরের লাল ব্যানারে (শুধু হোমপেজে) ছোট লাইক বোতাম।
// যতবার খুশি চাপা যায়; প্রতিটি চাপে সংখ্যা সাথে সাথে বাড়ে, আর কয়েকটি চাপ একসাথে করে ডেটাবেসে পাঠানো হয়।
export default function SiteLike() {
  const pathname = usePathname();
  const [count, setCount] = useState<number | null>(null);
  const [tapped, setTapped] = useState(false);
  const base = useRef(0); // ডেটাবেসের সর্বশেষ জানা মোট
  const pending = useRef(0); // এখনো পাঠানো হয়নি এমন চাপ
  const inflight = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetched = useRef(false);

  // লাইকের সংখ্যা শুধু হোমপেজে দেখানো হয়, তাই অন্য পাতায় ঢুকলে সার্ভারে অকারণ অনুরোধ যায় না (একবারই আনা হয়)
  useEffect(() => {
    if (pathname !== '/' || fetched.current) return;
    fetched.current = true;
    getSiteLikeTotal()
      .then((r) => {
        if (!r.ok) {
          fetched.current = false;
          return;
        }
        base.current = r.count ?? 0;
        setCount(base.current + pending.current);
      })
      .catch(() => {
        fetched.current = false;
      });
  }, [pathname]);

  async function flush() {
    if (inflight.current || pending.current === 0) return;
    inflight.current = true;
    const n = Math.min(pending.current, 100);
    pending.current -= n;
    let ok = false;
    try {
      const r = await addSiteLikes(n);
      if (r.ok) {
        ok = true;
        base.current = r.count ?? base.current + n;
      } else {
        pending.current += n;
      }
    } catch {
      pending.current += n;
    }
    inflight.current = false;
    setCount(base.current + pending.current);
    if (ok && pending.current > 0) timer.current = setTimeout(() => void flush(), 300);
  }

  function tap() {
    pending.current += 1;
    setCount((c) => (c ?? 0) + 1);
    setTapped(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), 400);
  }

  // ডেটাবেস প্রস্তুত না থাকলে বা হোম ছাড়া অন্য পাতায় কিছুই দেখানো হয় না
  if (count === null || pathname !== '/') return null;

  return (
    <button
      type="button"
      onClick={tap}
      aria-label="পেজটিতে লাইক দিন"
      className="hx-like touch-manipulation select-none transition active:opacity-70"
    >
      <span aria-hidden="true" className="hx-like-heart transition-transform active:scale-125">
        {tapped ? '♥' : '♡'}
      </span>
      <span>লাইক দিন</span>
      <span className="font-semibold tabular-nums">{bn(count)}</span>
    </button>
  );
}
