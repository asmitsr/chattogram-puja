'use client';

import { useEffect, useState } from 'react';
import { bn } from '@/lib/bn';
import { PUJA_DATES } from '@/lib/pujaDates';

// সবসময় চলমান দুর্গাপূজার লাইভ কাউন্টডাউন:
// আসন্ন পূজা শুরু হতে বাকি → পূজা চলাকালে দশমী শেষ হতে বাকি → শেষ হলে পরের বছরের পূজা
export default function Countdown() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  let title = 'দুর্গাপূজা';
  let caption = '';
  let left: number | null = null;

  if (now !== null) {
    const t = now;
    const cur = PUJA_DATES.find((p) => t < new Date(p.end).getTime()) ?? PUJA_DATES[PUJA_DATES.length - 1];
    const start = new Date(cur.start).getTime();
    const end = new Date(cur.end).getTime();
    title = cur.label;
    if (t < start) {
      caption = 'শুরু হতে বাকি';
      left = start - t;
    } else {
      caption = 'চলছে, দশমী শেষ হতে বাকি। শুভ পূজা!';
      left = Math.max(0, end - t);
    }
  }

  const s = left === null ? 0 : Math.floor(left / 1000);
  const dash = left === null;
  const cells: [string, string][] = [
    [dash ? '—' : bn(Math.floor(s / 86400)), 'দিন'],
    [dash ? '—' : bn(Math.floor((s % 86400) / 3600)), 'ঘণ্টা'],
    [dash ? '—' : bn(Math.floor((s % 3600) / 60)), 'মিনিট'],
    [dash ? '—' : bn(s % 60), 'সেকেন্ড'],
  ];

  return (
    <div className="mt-5 max-w-md rounded-xl border border-herogold bg-black/20 p-3">
      <p className="text-sm opacity-90">
        <b>{title}</b> {caption}
      </p>
      <div className="mt-2 grid grid-cols-4 gap-2" aria-live="off">
        {cells.map(([n, label]) => (
          <div key={label} className="rounded-md border border-herogold bg-black/20 px-1 py-2 text-center">
            <b className="block font-display text-3xl font-normal leading-tight text-herogold tabular-nums">{n}</b>
            <span className="text-xs tracking-wide">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
