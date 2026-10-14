'use client';

import { useEffect, useState } from 'react';
import Lotus from '@/components/Lotus';
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
  const two = (n: number) => bn(String(n).padStart(2, '0'));
  const cells: [string, string][] = [
    [dash ? '০০' : two(Math.floor(s / 86400)), 'দিন'],
    [dash ? '০০' : two(Math.floor((s % 86400) / 3600)), 'ঘণ্টা'],
    [dash ? '০০' : two(Math.floor((s % 3600) / 60)), 'মিনিট'],
    [dash ? '০০' : two(s % 60), 'সেকেন্ড'],
  ];

  return (
    <section className="hx-count" aria-label="কাউন্টডাউন">
      <div className="hx-count-in">
        <h2 className="hx-count-title">
          <Lotus size={22} className="hx-count-lotus" />
          <span>{title}</span>
          <Lotus size={22} className="hx-count-lotus" />
        </h2>
        <p className="hx-count-sub">কাউন্টডাউন • মণ্ডপ • পূজার সময়সূচি</p>
        <div className="hx-cards" aria-live="off">
          {cells.map(([n, label]) => (
            <div key={label} className="hx-card">
              <b>{n}</b>
              <span>{label}</span>
            </div>
          ))}
        </div>
        {caption && <p className="hx-count-cap">{caption}</p>}
      </div>
    </section>
  );
}
