'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

const CENTER: [number, number] = [22.3569, 91.7832];

// অ্যাডমিন ম্যাপে চাপ দিয়ে বা সংখ্যা লিখে মণ্ডপের অবস্থান বসান।
// ঠিকানা থেকে অবস্থান অনুমান করা হয় না।
export default function MapPicker({ lat, lng }: { lat: number | null; lng: number | null }) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const libRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [la, setLa] = useState(lat !== null ? String(lat) : '');
  const [lo, setLo] = useState(lng !== null ? String(lng) : '');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mod: any = await import('leaflet');
      const L = mod.default ?? mod;
      if (cancelled || !el.current) return;
      libRef.current = L;
      const map = L.map(el.current, { scrollWheelZoom: false }).setView(
        lat !== null && lng !== null ? [lat, lng] : CENTER,
        lat !== null && lng !== null ? 16 : 12,
      );
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 20,
        attribution: '© OpenStreetMap contributors © CARTO',
      }).addTo(map);
      map.on('click', (e: any) => {
        setLa(e.latlng.lat.toFixed(6));
        setLo(e.latlng.lng.toFixed(6));
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

  useEffect(() => {
    if (!ready) return;
    const L = libRef.current;
    const map = mapRef.current;
    const a = Number(la);
    const b = Number(lo);
    const valid = la !== '' && lo !== '' && Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180;
    if (!valid) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }
    if (markerRef.current) markerRef.current.setLatLng([a, b]);
    else
      markerRef.current = L.circleMarker([a, b], {
        radius: 10,
        color: '#f0c766',
        weight: 3,
        fillColor: '#7a1424',
        fillOpacity: 1,
      }).addTo(map);
    map.panTo([a, b]);
  }, [la, lo, ready]);

  return (
    <div className="space-y-2">
      <div ref={el} style={{ height: 300 }} className="z-0 w-full overflow-hidden rounded-md border border-line" />
      <p className="muted">ম্যাপে সঠিক জায়গায় চাপ দিন, অথবা নিচে সংখ্যা লিখুন। অবস্থান না জানলে ঘর দুটি খালি রাখুন।</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="latitude">
            অক্ষাংশ (latitude)
          </label>
          <input id="latitude" name="latitude" inputMode="decimal" className="input" value={la} onChange={(e) => setLa(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="longitude">
            দ্রাঘিমাংশ (longitude)
          </label>
          <input id="longitude" name="longitude" inputMode="decimal" className="input" value={lo} onChange={(e) => setLo(e.target.value)} />
        </div>
      </div>
      <button
        type="button"
        className="btn-ghost"
        onClick={() => {
          setLa('');
          setLo('');
        }}
      >
        অবস্থান মুছুন
      </button>
    </div>
  );
}
