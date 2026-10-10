'use client';

import { useEffect, useState } from 'react';
import { bn } from '@/lib/bn';

// target: "YYYY-MM-DD" (ঢাকার সময়ে সেই দিনের শুরু পর্যন্ত গণনা)
export default function Countdown({ target }: { target: string }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const end = new Date(`${target}T00:00:00+06:00`).getTime();
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  const s = left === null ? 0 : Math.floor(left / 1000);
  const cells: [string, string][] = [
    [left === null ? '—' : bn(Math.floor(s / 86400)), 'দিন'],
    [left === null ? '—' : bn(Math.floor((s % 86400) / 3600)), 'ঘণ্টা'],
    [left === null ? '—' : bn(Math.floor((s % 3600) / 60)), 'মিনিট'],
    [left === null ? '—' : bn(s % 60), 'সেকেন্ড'],
  ];

  return (
    <div className="mt-2 grid grid-cols-4 gap-2">
      {cells.map(([n, label]) => (
        <div key={label} className="rounded-md border border-herogold bg-black/20 px-1 py-2 text-center">
          <b className="block font-display text-3xl font-normal leading-tight text-herogold tabular-nums">{n}</b>
          <span className="text-xs tracking-wide">{label}</span>
        </div>
      ))}
    </div>
  );
}
