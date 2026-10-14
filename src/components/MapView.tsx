'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { MAP_BG, MapFullscreenButton, MapLegend, addPins, createBaseMap, mapBoxClass, shellClass, type Pin } from '@/components/mapKit';

export type { Pin };

export default function MapView({
  pins,
  height = 420,
  wheelZoom = false,
  fitAll = true,
  fullscreenToggle = false,
  focusId,
  focusZoom = 15,
}: {
  pins: Pin[];
  height?: number | string;
  wheelZoom?: boolean;
  fitAll?: boolean;
  fullscreenToggle?: boolean;
  focusId?: string; // দিলে ম্যাপ এই মণ্ডপকে কেন্দ্রে রেখে খোলে; আশেপাশের পিন ম্যাপেই থাকে (জুম আউট করলে দেখা যায়)
  focusZoom?: number;
}) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  // ফুল-স্ক্রিন বদলালে ম্যাপ নতুন করে তৈরি হয়; আগের দেখা জায়গা ও জুম মনে রাখার জন্য
  const viewRef = useRef<{ lat: number; lng: number; zoom: number } | null>(null);
  const restoreRef = useRef(false);
  const [full, setFull] = useState(false);

  useEffect(() => {
    let map: any = null;
    let ro: ResizeObserver | null = null;
    let cancelled = false;

    (async () => {
      const mod: any = await import('leaflet');
      const L = mod.default ?? mod;
      const node = el.current;
      if (cancelled || !node) return;

      map = createBaseMap(L, node, { wheelZoom });
      mapRef.current = map;

      const markers: Record<string, any> = {};
      const bounds = addPins(L, map, pins, { markersOut: markers });
      const focusPin = focusId ? pins.find((p) => p.id === focusId) : undefined;

      const saved = restoreRef.current ? viewRef.current : null;
      restoreRef.current = false;
      if (saved) map.setView([saved.lat, saved.lng], saved.zoom, { animate: false });
      else if (focusPin) map.setView([focusPin.lat, focusPin.lng], focusZoom, { animate: false });
      else if (bounds.length === 1) map.setView(bounds[0], 16);
      else if (bounds.length > 1 && fitAll) map.fitBounds(bounds, { padding: [30, 30] });
      setTimeout(() => map && map.invalidateSize(), 200);

      // কন্টেইনারের মাপ যেভাবেই বদলাক (ফুল-স্ক্রিন, ফোন ঘোরানো, ব্রাউজারের বার ওঠানামা) ম্যাপ নিজে থেকে মাপ ধরে নেবে
      if (typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(() => {
          if (map) map.invalidateSize({ animate: false, pan: false });
        });
        ro.observe(node);
      }
    })();

    return () => {
      cancelled = true;
      if (ro) ro.disconnect();
      if (map) {
        const c = map.getCenter();
        viewRef.current = { lat: c.lat, lng: c.lng, zoom: map.getZoom() };
        map.remove();
      }
      mapRef.current = null;
    };
    // ফুল-স্ক্রিন বদলালেও ম্যাপ নতুন করে তৈরি হয়: কিছু ফোনে আগের ম্যাপ বড় করলে টাইল সাদা থেকে যেত
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins, full]);

  // ফুল-স্ক্রিন টগল হওয়ার সঙ্গে সঙ্গেই (পেইন্টের আগে) ম্যাপের মাপ আবার হিসাব করা,
  // পরে কয়েকবার আবার করা যাতে ব্রাউজারের বার/অ্যানিমেশন শেষ হওয়ার পরও টাইল পুরো ভরে যায়
  useLayoutEffect(() => {
    if (!fullscreenToggle) return;
    const fix = () => {
      const m = mapRef.current;
      if (!m) return;
      m.invalidateSize({ animate: false, pan: false });
    };
    fix();
    const raf = requestAnimationFrame(fix);
    const timers = [60, 200, 500].map((ms) => setTimeout(fix, ms));
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, [full, fullscreenToggle]);

  // পেছনের পাতার স্ক্রল বন্ধ রাখা ও Esc চাপলে বের হওয়া
  useEffect(() => {
    if (!fullscreenToggle) return;
    document.body.style.overflow = full ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        restoreRef.current = true;
        setFull(false);
      }
    };
    if (full) window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [full, fullscreenToggle]);

  return (
    <div className={shellClass(full)} style={{ backgroundColor: MAP_BG }}>
      <div
        key={full ? 'full' : 'small'}
        ref={el}
        style={{ height: full ? '100dvh' : height, backgroundColor: MAP_BG }}
        className={mapBoxClass(full)}
        role="application"
        aria-label="ম্যাপ"
      />
      {!full && pins.length > 1 && <MapLegend />}
      {fullscreenToggle && (
        <MapFullscreenButton
          full={full}
          onToggle={() => {
            restoreRef.current = true;
            setFull((v) => !v);
          }}
        />
      )}
    </div>
  );
}
