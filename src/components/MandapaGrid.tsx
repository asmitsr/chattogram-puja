'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { bn } from '@/lib/bn';

export interface GridItem {
  id: string;
  name: string;
  area: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
}

const FAV_KEY = 'ctg-puja-favs';
const STEP = 24; // একবারে এতগুলো কার্ড আঁকা হয়; নিচে নামলে বাকিগুলো আসে

function readFavs(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function writeFavs(list: string[]) {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(list));
  } catch {
    // ব্রাউজার সংরক্ষণ বন্ধ থাকলে বাছাই শুধু এই পাতার জন্য থাকবে
  }
}

export default function MandapaGrid({ items }: { items: GridItem[] }) {
  const [favs, setFavs] = useState<string[]>([]);
  const [onlyFav, setOnlyFav] = useState(false);
  const [shown, setShown] = useState(STEP);
  const sentinel = useRef<HTMLDivElement>(null);

  // বাছাইয়ের তালিকা ফোনেই (ব্রাউজারে) থাকে; কোনো সার্ভারে যায় না
  useEffect(() => {
    setFavs(readFavs());
  }, []);

  const toggle = useCallback((id: string) => {
    setFavs((cur) => {
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      writeFavs(next);
      return next;
    });
  }, []);

  const favSet = new Set(favs);
  const list = onlyFav ? items.filter((i) => favSet.has(i.id)) : items;
  const visible = list.slice(0, shown);
  const rest = list.length - visible.length;

  // নিচে নামলে বাকি কার্ড আসে
  useEffect(() => {
    const el = sentinel.current;
    if (!el || rest <= 0 || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setShown((n) => n + STEP);
      },
      { rootMargin: '400px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rest, shown]);

  const favCount = items.filter((i) => favSet.has(i.id)).length;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setOnlyFav((v) => !v);
            setShown(STEP);
          }}
          aria-pressed={onlyFav}
          className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold ${
            onlyFav ? 'border-accent bg-btn text-btnfg' : 'border-line bg-surface text-fg'
          }`}
        >
          <span aria-hidden="true">{onlyFav ? '❤️' : '🤍'}</span>
          আমার বাছাই ({bn(favCount)})
        </button>
        {onlyFav && <span className="muted">কার্ডের ♡ চেপে মণ্ডপ বাছাই করুন</span>}
      </div>

      {list.length === 0 ? (
        <p className="muted">এখনো কোনো মণ্ডপ বাছাই করা হয়নি। কার্ডের ♡ চাপলে এখানে জমা হবে।</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((m) => {
            const fav = favSet.has(m.id);
            const hasPos = m.lat !== null && m.lng !== null && Number.isFinite(m.lat) && Number.isFinite(m.lng);
            return (
              <article key={m.id} className="card flex flex-col">
                <Link href={`/mandapa/${m.id}`} prefetch={false} className="block flex-1 text-fg no-underline">
                  {m.area && <span className="badge">{m.area}</span>}
                  <h3 className="mt-1.5 text-xl text-accent">{m.name}</h3>
                  {m.address && <p className="muted mt-1">{m.address}</p>}
                </Link>
                <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
                  {hasPos ? (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost !min-h-[38px] !px-3 text-sm"
                    >
                      📍 ম্যাপে যান
                    </a>
                  ) : (
                    <span className="muted">অবস্থান এখনো যোগ হয়নি</span>
                  )}
                  <button
                    type="button"
                    onClick={() => toggle(m.id)}
                    aria-pressed={fav}
                    aria-label={fav ? 'বাছাই থেকে সরান' : 'বাছাইয়ে রাখুন'}
                    className="ml-auto inline-flex h-[38px] w-[38px] items-center justify-center rounded-full border border-line bg-surface text-lg"
                  >
                    <span aria-hidden="true">{fav ? '❤️' : '🤍'}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {rest > 0 && (
        <div ref={sentinel} className="mt-4 text-center">
          <button type="button" className="btn-ghost" onClick={() => setShown((n) => n + STEP)}>
            আরও দেখান (বাকি {bn(rest)}টি)
          </button>
        </div>
      )}
    </div>
  );
}
