'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { findShortLink, inChattogram, parseCoords } from '@/lib/mapLink';

// চট্টগ্রাম শহরের কেন্দ্র (আন্দরকিল্লা/নিউমার্কেট এলাকা)
const CENTER: [number, number] = [22.3384, 91.8317];
// চট্টগ্রাম জেলা ঘিরে সীমা
const BOUNDS: [[number, number], [number, number]] = [
  [21.8, 91.2],
  [23.2, 92.4],
];

const FAB =
  'flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl font-bold text-neutral-800 shadow-lg ring-1 ring-black/10 active:bg-neutral-100 disabled:opacity-60';

// মোবাইল ম্যাপ অ্যাপের মতো লোকেশন বাছাই: জুম, ট্যাপ করে পিন, পিন টানা, GPS, স্যাটেলাইট, ফুল-স্ক্রিন।
// অক্ষাংশ-দ্রাঘিমাংশ ব্যবহারকারীকে দেখানো হয় না; লুকানো ঘরে ফর্মের সঙ্গে যায়।
export default function LocationPicker() {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const meRef = useRef<any[]>([]);
  const libRef = useRef<any>(null);

  const [ready, setReady] = useState(false);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [paste, setPaste] = useState('');
  const [resolving, setResolving] = useState(false);
  const [full, setFull] = useState(false);

  function place(lat: number, lng: number, zoom?: number) {
    const L = libRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
    else {
      const icon = L.divIcon({
        className: '',
        html: '<div style="width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#d93025;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.6)"><div style="width:10px;height:10px;border-radius:50%;background:#fff;margin:8px"></div></div>',
        iconSize: [34, 34],
        iconAnchor: [17, 34],
      });
      const m = L.marker([lat, lng], { icon, draggable: true }).addTo(map);
      m.on('dragend', () => {
        const p = m.getLatLng();
        setPos({ lat: p.lat, lng: p.lng });
        setMsg('অবস্থান বদলানো হয়েছে।');
      });
      markerRef.current = m;
    }
    if (zoom) map.setView([lat, lng], zoom);
    setPos({ lat, lng });
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mod: any = await import('leaflet');
      const L = mod.default ?? mod;
      if (cancelled || !el.current) return;
      libRef.current = L;
      const map = L.map(el.current, {
        scrollWheelZoom: true,
        minZoom: 9,
        maxZoom: 20,
        maxBounds: BOUNDS,
        maxBoundsViscosity: 0.9,
        zoomControl: false,
        attributionControl: true,
      }).setView(CENTER, 14);
      map.attributionControl.setPrefix(false);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);
      L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

      map.on('click', (e: any) => {
        place(e.latlng.lat, e.latlng.lng);
        setMsg('পিন বসানো হয়েছে। ঠিক জায়গায় না হলে পিনটি টেনে সরান।');
      });
      mapRef.current = map;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) mapRef.current.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ফুল-স্ক্রিন বদলালে ম্যাপের মাপ ঠিক করা
  useEffect(() => {
    if (!ready) return;
    document.body.style.overflow = full ? 'hidden' : '';
    const t = setTimeout(() => mapRef.current && mapRef.current.invalidateSize(), 60);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = '';
    };
  }, [full, ready]);

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
    let p = parseCoords(text);
    if (!p) {
      const short = findShortLink(text);
      if (short) {
        setResolving(true);
        setMsg('গুগল ম্যাপের লিংক থেকে জায়গা খোঁজা হচ্ছে…');
        try {
          const res = await fetch('/api/resolve-map?u=' + encodeURIComponent(short));
          if (res.ok) {
            const d = await res.json();
            if (typeof d.lat === 'number' && typeof d.lng === 'number') p = { lat: d.lat, lng: d.lng };
          }
        } catch {
          /* নিচের বার্তা দেখাবে */
        }
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
    setMsg('গুগল ম্যাপের জায়গাটি পিন হিসেবে বসেছে। ঠিক জায়গায় না হলে পিনটি টেনে সরান।');
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
    : `https://www.google.com/maps/@${CENTER[0]},${CENTER[1]},15z`;

  const status = msg || (pos ? 'পিন বসানো আছে।' : 'এখনো পিন বসানো হয়নি (ঐচ্ছিক)।');

  return (
    <div className="space-y-2">
      <div className={full ? 'fixed inset-0 z-[2000] bg-neutral-100' : 'relative'}>
        <div
          ref={el}
          style={{ height: full ? '100dvh' : 400 }}
          className="z-0 w-full overflow-hidden rounded-md border border-line"
        />

        {/* ওপরের ডান: ফুল-স্ক্রিন */}
        <div className="absolute right-2.5 top-2.5 flex flex-col items-end gap-2" style={{ zIndex: 1000 }}>
          <button type="button" className={FAB} aria-label={full ? 'ফুল-স্ক্রিন বন্ধ করুন' : 'ফুল-স্ক্রিনে দেখুন'} onClick={() => setFull((v) => !v)}>
            {full ? '✕' : '⛶'}
          </button>
        </div>

        {/* ডান নিচে: জুম ও আমার লোকেশন */}
        <div className="absolute right-2.5 flex flex-col gap-2" style={{ zIndex: 1000, bottom: full ? 150 : 54 }}>
          <button type="button" className={FAB} aria-label="জুম ইন" onClick={() => mapRef.current && mapRef.current.zoomIn()}>
            +
          </button>
          <button type="button" className={FAB} aria-label="জুম আউট" onClick={() => mapRef.current && mapRef.current.zoomOut()}>
            −
          </button>
          <button type="button" className={`${FAB} text-blue-600`} aria-label="আমার লোকেশন" onClick={useMyLocation} disabled={busy || !ready}>
            {busy ? '…' : '◎'}
          </button>
        </div>

        {/* নিচে: মাঝখানে পিন বসান */}
        <div className="absolute left-2.5 flex items-center gap-2" style={{ zIndex: 1000, bottom: full ? 96 : 10 }}>
          <button
            type="button"
            className="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 shadow-lg ring-1 ring-black/10 active:bg-neutral-100"
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
            <button type="button" className="btn w-full" onClick={() => setFull(false)}>
              ঠিক আছে, ফর্মে ফিরুন
            </button>
          </div>
        )}
      </div>

      {!full && (
        <>
          <p className="muted">ম্যাপে মণ্ডপের জায়গায় ট্যাপ করে পিন বসান, পিনটি টেনে সরানো যায়। বড় করে দেখতে ওপরের ডানের ⛶ বোতাম চাপুন।</p>
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
