'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { findShortLink, inChattogram, parseCoords } from '@/lib/mapLink';
import { MAP_BG, MAP_CENTER, MAP_HEIGHT, MapFullscreenButton, MapLegend, addPins, createBaseMap, mapBoxClass, shellClass, type Pin } from '@/components/mapKit';

type LL = { lat: number; lng: number };

const FAB =
  'flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl font-bold text-neutral-800 shadow-lg ring-1 ring-black/10 active:bg-neutral-100 disabled:opacity-60';

// লোকেশন বাছাই: /map পাতার একই ম্যাপ (একই টাইল, জুম বোতাম, ॐ মার্কার ও ফুল-স্ক্রিন বোতাম)।
// এতে ট্যাপ করে পিন বসানো, পিন টানা, GPS ও লিংক পেস্ট করা যায়।
// অক্ষাংশ-দ্রাঘিমাংশ ব্যবহারকারীকে দেখানো হয় না; লুকানো ঘরে ফর্মের সঙ্গে যায়।
export default function LocationPicker({ pins = [] }: { pins?: Pin[] }) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const meRef = useRef<any[]>([]);
  const libRef = useRef<any>(null);
  const posRef = useRef<LL | null>(null);
  // ফুল-স্ক্রিন বদলালে ম্যাপ নতুন করে তৈরি হয় (এতে টাইল সাদা হওয়ার সমস্যা হয় না); আগের জায়গা ও জুম মনে রাখা হয়
  const viewRef = useRef<{ lat: number; lng: number; zoom: number } | null>(null);
  const restoreRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [paste, setPaste] = useState('');
  const [resolving, setResolving] = useState(false);
  const [full, setFull] = useState(false);

  function makeIcon(L: any) {
    // বড় ধরার জায়গা (৪৪×৫২) যাতে ফোনে আঙুলে সহজে ধরে টানা যায়
    return L.divIcon({
      className: '',
      html:
        '<div style="width:44px;height:52px;display:flex;align-items:flex-start;justify-content:center;touch-action:none">' +
        '<div style="width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#d93025;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.6);margin-top:2px"><div style="width:10px;height:10px;border-radius:50%;background:#fff;margin:8px"></div></div></div>',
      iconSize: [44, 52],
      iconAnchor: [22, 46],
    });
  }

  // মার্কার বসানো/সরানো (ম্যাপের দেখার জায়গা বদলায় না)
  function putMarker(lat: number, lng: number) {
    const L = libRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
    else {
      const m = L.marker([lat, lng], { icon: makeIcon(L), draggable: true, autoPan: true, keyboard: false, bubblingMouseEvents: false, zIndexOffset: 1000 }).addTo(map);
      m.on('dragend', () => {
        const p = m.getLatLng();
        if (!inChattogram({ lat: p.lat, lng: p.lng })) {
          const back = posRef.current;
          if (back) m.setLatLng([back.lat, back.lng]);
          setMsg('জায়গাটি চট্টগ্রাম অঞ্চলের বাইরে মনে হচ্ছে। পিনটি চট্টগ্রামের ভেতরে রাখুন।');
          return;
        }
        posRef.current = { lat: p.lat, lng: p.lng };
        setPos({ lat: p.lat, lng: p.lng });
        setMsg('অবস্থান বদলানো হয়েছে।');
      });
      markerRef.current = m;
    }
  }

  function place(lat: number, lng: number, zoom?: number) {
    // অবস্থান সবসময় আগে মনে রাখা হয়, ম্যাপ তৈরি না থাকলেও ফর্মের সঙ্গে যাবে
    posRef.current = { lat, lng };
    setPos({ lat, lng });
    const map = mapRef.current;
    if (!libRef.current || !map) return;
    putMarker(lat, lng);
    if (zoom) map.setView([lat, lng], zoom);
    else map.panTo([lat, lng]);
  }

  useEffect(() => {
    let cancelled = false;
    let map: any = null;
    let ro: ResizeObserver | null = null;
    (async () => {
      const mod: any = await import('leaflet');
      const L = mod.default ?? mod;
      const node = el.current;
      if (cancelled || !node) return;
      libRef.current = L;

      // /map পাতার মতোই একই ম্যাপ, একই টাইল ও জুম বোতাম, একই ॐ মার্কার
      map = createBaseMap(L, node, { wheelZoom: true });
      mapRef.current = map;
      const bounds = addPins(L, map, pins, { newTab: true });

      map.on('click', (e: any) => {
        const p = { lat: e.latlng.lat, lng: e.latlng.lng };
        if (!inChattogram(p)) {
          setMsg('জায়গাটি চট্টগ্রাম অঞ্চলের বাইরে মনে হচ্ছে। চট্টগ্রামের ভেতরের জায়গা বেছে নিন।');
          return;
        }
        place(p.lat, p.lng);
        setMsg('পিন বসানো হয়েছে। ঠিক জায়গায় না হলে পিনটি টেনে সরান।');
      });

      // আগে বসানো অবস্থান থাকলে (ফুল-স্ক্রিন বদলের পরে বা পেস্ট করা) পিন আবার দেখানো
      const cur = posRef.current;
      if (cur) putMarker(cur.lat, cur.lng);

      const saved = restoreRef.current ? viewRef.current : null;
      restoreRef.current = false;
      if (saved) map.setView([saved.lat, saved.lng], saved.zoom, { animate: false });
      else if (cur) map.setView([cur.lat, cur.lng], 17);
      else if (bounds.length > 1) map.fitBounds(bounds, { padding: [30, 30] });

      setReady(true);
      setTimeout(() => map && map.invalidateSize(), 200);
      if (typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(() => {
          if (map) map.invalidateSize({ animate: false, pan: false });
        });
        ro.observe(node);
      }
    })().catch(() => setMsg('ম্যাপ লোড হয়নি। পাতাটি রিফ্রেশ করুন। পিন না বসলেও নিচের ঘরে লিংক বা কোঅর্ডিনেট বসালে অবস্থান জমা যাবে।'));
    return () => {
      cancelled = true;
      if (ro) ro.disconnect();
      if (map) {
        const c = map.getCenter();
        viewRef.current = { lat: c.lat, lng: c.lng, zoom: map.getZoom() };
        map.remove();
      }
      mapRef.current = null;
      markerRef.current = null;
      meRef.current = [];
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [full]);

  // ফুল-স্ক্রিন টগলের সঙ্গে সঙ্গে ম্যাপের মাপ আবার হিসাব; পেছনের পাতার স্ক্রল বন্ধ; Esc চাপলে বের হওয়া
  useLayoutEffect(() => {
    const fix = () => mapRef.current && mapRef.current.invalidateSize({ animate: false, pan: false });
    fix();
    const raf = requestAnimationFrame(fix);
    const timers = [60, 200, 500].map((ms) => setTimeout(fix, ms));
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, [full]);

  useEffect(() => {
    document.body.style.overflow = full ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') toggleFull(false);
    };
    if (full) window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [full]);

  function toggleFull(v?: boolean) {
    restoreRef.current = true;
    setFull((x) => (typeof v === 'boolean' ? v : !x));
  }

  function showMe(lat: number, lng: number, acc: number) {
    const L = libRef.current;
    const map = mapRef.current;
    meRef.current.forEach((x) => x.remove());
    meRef.current = [
      L.circle([lat, lng], { radius: Math.min(acc, 300), color: '#1a73e8', weight: 1, fillColor: '#1a73e8', fillOpacity: 0.15, interactive: false }).addTo(map),
      L.circleMarker([lat, lng], { radius: 8, color: '#fff', weight: 3, fillColor: '#1a73e8', fillOpacity: 1, interactive: false }).addTo(map),
    ];
  }

  function useMyLocation() {
    if (!ready) return;
    if (!('geolocation' in navigator)) {
      setMsg('আপনার ব্রাউজারে লোকেশন সুবিধা নেই। ম্যাপে ট্যাপ করে জায়গা বেছে নিন।');
      return;
    }
    setBusy(true);
    setMsg('আপনার লোকেশন খোঁজা হচ্ছে… ফোন অনুমতি চাইলে "অনুমতি দিন" চাপুন।');
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setBusy(false);
        showMe(p.coords.latitude, p.coords.longitude, p.coords.accuracy || 50);
        place(p.coords.latitude, p.coords.longitude, 17);
        setMsg('আপনার বর্তমান লোকেশনে পিন বসেছে। মণ্ডপ অন্য জায়গায় হলে ম্যাপে ট্যাপ করুন বা পিন টেনে নিন।');
      },
      (err) => {
        setBusy(false);
        if (err.code === 1) {
          setMsg('লোকেশনের অনুমতি দেওয়া হয়নি। ফোনের সেটিংসে ব্রাউজারের লোকেশন চালু করুন, অথবা ম্যাপে ট্যাপ করে জায়গা বেছে নিন।');
        } else if (err.code === 3) {
          setMsg('লোকেশন পেতে বেশি সময় লাগছে। ফোনের GPS (Location) চালু আছে কি দেখুন, তারপর আবার চাপুন।');
        } else {
          setMsg('লোকেশন পাওয়া যায়নি। ফোনের Location চালু করে আবার চেষ্টা করুন, অথবা ম্যাপে ট্যাপ করুন।');
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  }

  function pinAtCenter() {
    const map = mapRef.current;
    if (!map) return;
    const c = map.getCenter();
    place(c.lat, c.lng);
    setMsg('ম্যাপের মাঝখানে পিন বসেছে। ঠিক জায়গায় না হলে পিনটি টেনে সরান।');
  }

  function clear() {
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    posRef.current = null;
    setPos(null);
    setMsg('অবস্থান মুছে ফেলা হয়েছে।');
  }


  // গুগল ম্যাপ অ্যাপ থেকে কপি করা লিংক বা কোঅর্ডিনেট বসানো
  async function applyText(raw: string) {
    const text = raw.trim();
    if (!text) {
      setMsg('আগে গুগল ম্যাপ থেকে কপি করা লিংক বা কোঅর্ডিনেট পেস্ট করুন।');
      return;
    }
    let p: LL | null = parseCoords(text);
    if (!p) {
      const short = findShortLink(text);
      if (short) {
        setResolving(true);
        setMsg('গুগল ম্যাপের লিংক থেকে জায়গা খোঁজা হচ্ছে…');
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), 12000);
        try {
          const res = await fetch('/api/resolve-map?u=' + encodeURIComponent(short), { signal: ctl.signal });
          if (res.ok) {
            const d = await res.json();
            if (typeof d.lat === 'number' && typeof d.lng === 'number') p = { lat: d.lat, lng: d.lng };
          }
        } catch {
          /* নিচের বার্তা দেখাবে */
        }
        clearTimeout(timer);
        setResolving(false);
      }
    }
    if (!p) {
      setMsg('লিংক থেকে জায়গা বোঝা যায়নি। গুগল ম্যাপে জায়গাটি ধরে রেখে পিন বসান, তারপর নিচের কোঅর্ডিনেট (যেমন 22.3384, 91.8317) কপি করে এখানে পেস্ট করুন।');
      return;
    }
    if (!inChattogram(p)) {
      setMsg('জায়গাটি চট্টগ্রাম অঞ্চলের বাইরে মনে হচ্ছে। চট্টগ্রামের ভেতরের জায়গা বেছে নিন।');
      return;
    }
    place(p.lat, p.lng, 17);
    setPaste('');
    setMsg(`অবস্থান বসেছে (${p.lat.toFixed(5)}, ${p.lng.toFixed(5)})। ঠিক জায়গায় না হলে পিনটি টেনে সরান।`);
  }

  async function pasteClipboard() {
    try {
      const t = await navigator.clipboard.readText();
      setPaste(t);
      await applyText(t);
    } catch {
      setMsg('কপি করা লেখা পড়া যায়নি। নিচের ঘরে আঙুল চেপে ধরে "পেস্ট" দিন, তারপর "বসান" চাপুন।');
    }
  }

  const gmapsHref = pos
    ? `https://www.google.com/maps/search/?api=1&query=${pos.lat.toFixed(6)},${pos.lng.toFixed(6)}`
    : `https://www.google.com/maps/@${MAP_CENTER[0]},${MAP_CENTER[1]},15z`;

  const status = msg || (pos ? 'পিন বসানো আছে।' : 'এখনো পিন বসানো হয়নি (ঐচ্ছিক)।');

  return (
    <div className="space-y-2">
      <div className={shellClass(full)} style={{ backgroundColor: MAP_BG }}>
        <div
          key={full ? 'full' : 'small'}
          ref={el}
          style={{ height: full ? '100dvh' : MAP_HEIGHT, backgroundColor: MAP_BG }}
          className={mapBoxClass(full)}
          role="application"
          aria-label="লোকেশন বাছাইয়ের ম্যাপ"
        />

        {/* ওপরের ডান: /map পাতার একই ফুল-স্ক্রিন বোতাম */}
        <MapFullscreenButton full={full} onToggle={() => toggleFull()} />

        {/* ডান নিচে: আমার লোকেশন */}
        <div className="absolute right-2.5" style={{ zIndex: 1000, bottom: full ? 110 : 32 }}>
          <button type="button" className={`${FAB} text-blue-600`} aria-label="আমার লোকেশন" onClick={useMyLocation} disabled={busy || !ready}>
            {busy ? '…' : '◎'}
          </button>
        </div>

        {/* নিচে বাঁয়ে: মাঝখানে পিন বসান */}
        <div className="absolute left-2.5 flex items-center gap-2" style={{ zIndex: 1000, bottom: full ? 110 : 32 }}>
          <button
            type="button"
            className="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 shadow-lg ring-1 ring-black/10 active:bg-neutral-100 disabled:opacity-60"
            onClick={pinAtCenter}
            disabled={!ready}
          >
            📍 মাঝখানে পিন বসান
          </button>
        </div>

        {full && (
          <div className="absolute inset-x-0 bottom-0 space-y-2 bg-white p-3 text-neutral-800 shadow-[0_-4px_12px_rgba(0,0,0,.15)]" style={{ zIndex: 1000 }}>
            <p aria-live="polite" className="text-sm">
              {status}
            </p>
            <button type="button" className="btn w-full" onClick={() => toggleFull(false)}>
              ঠিক আছে, ফর্মে ফিরুন
            </button>
          </div>
        )}
      </div>

      {!full && (
        <>
          <MapLegend />
          <p className="muted">ম্যাপে মণ্ডপের জায়গায় ট্যাপ করে লাল পিন বসান, পিনটি টেনে সরানো যায়। ॐ চিহ্নগুলো আগে থেকে ম্যাপে থাকা মণ্ডপ; চাপলে নাম দেখা যাবে। বড় করে দেখতে ওপরের ডানের ⛶ বোতাম চাপুন।</p>
          <div className="space-y-3 rounded-md border border-line bg-surface p-3">
            <a href={gmapsHref} target="_blank" rel="noopener noreferrer" className="btn w-full justify-center no-underline">
              🗺 গুগল ম্যাপ অ্যাপে খুলে লোকেশন বেছে নিন
            </a>
            <ol className="muted list-decimal space-y-1 pl-5">
              <li>বোতাম চাপলে ফোনের গুগল ম্যাপ খুলবে। মণ্ডপের জায়গায় আঙুল চেপে ধরে লাল পিন বসান।</li>
              <li>নিচে আসা তালিকা থেকে "শেয়ার" চেপে "কপি" দিন (বা পিনের কোঅর্ডিনেট কপি করুন)।</li>
              <li>এই সাইটে ফিরে এসে "📋 কপি করা লিংক বসান" চাপুন।</li>
            </ol>
            <button type="button" className="btn-ghost w-full" onClick={() => void pasteClipboard()} disabled={resolving}>
              {resolving ? 'খোঁজা হচ্ছে…' : '📋 কপি করা লিংক বসান'}
            </button>
            <div className="flex gap-2">
              <input
                className="input"
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
                onPaste={(e) => {
                  const t = e.clipboardData.getData('text');
                  if (t) {
                    e.preventDefault();
                    setPaste(t);
                    void applyText(t);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void applyText(paste);
                  }
                }}
                placeholder="অথবা এখানে লিংক বা 22.3384, 91.8317 পেস্ট করুন"
                aria-label="গুগল ম্যাপের লিংক বা কোঅর্ডিনেট"
                maxLength={500}
              />
              <button type="button" className="btn shrink-0" onClick={() => void applyText(paste)} disabled={resolving}>
                বসান
              </button>
            </div>
          </div>

          <p aria-live="polite" className={pos ? 'text-sm font-medium' : 'muted'}>
            {status}
          </p>
          {pos && (
            <button type="button" className="btn-ghost" onClick={clear}>
              পিন মুছুন
            </button>
          )}
        </>
      )}
      <input type="hidden" name="latitude" value={pos ? pos.lat.toFixed(6) : ''} />
      <input type="hidden" name="longitude" value={pos ? pos.lng.toFixed(6) : ''} />
    </div>
  );
}
