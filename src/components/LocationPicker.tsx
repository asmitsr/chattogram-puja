'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

// চট্টগ্রাম শহরের কেন্দ্র (নিউমার্কেট/আন্দরকিল্লা এলাকা)
const CENTER: [number, number] = [22.3384, 91.8317];
// চট্টগ্রাম জেলা ঘিরে সীমা: দক্ষিণ-পশ্চিম, উত্তর-পূর্ব
const BOUNDS: [[number, number], [number, number]] = [
  [21.8, 91.2],
  [23.2, 92.4],
];

interface Hit {
  name: string;
  lat: number;
  lng: number;
}

// ফোনের GPS, ম্যাপে চাপ, পিন টানা বা এলাকার নাম খুঁজে অবস্থান নির্ধারণ।
// অক্ষাংশ-দ্রাঘিমাংশ ব্যবহারকারীকে দেখানো হয় না; লুকানো ঘরে ফর্মের সঙ্গে যায়।
export default function LocationPicker() {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const libRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [q, setQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [hits, setHits] = useState<Hit[]>([]);

  function place(lat: number, lng: number, zoom?: number) {
    const L = libRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
    else {
      const icon = L.divIcon({
        className: '',
        html: '<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#7a1424;border:3px solid #f0c766;box-shadow:0 2px 6px rgba(0,0,0,.55)"></div>',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
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
    else map.panTo([lat, lng]);
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
        scrollWheelZoom: false,
        minZoom: 9,
        maxBounds: BOUNDS,
        maxBoundsViscosity: 0.9,
        zoomControl: true,
      }).setView(CENTER, 13);

      const street = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      });
      const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles © Esri',
      });
      street.addTo(map);
      L.control.layers({ 'মানচিত্র': street, 'স্যাটেলাইট': sat }, {}, { position: 'topright', collapsed: true }).addTo(map);
      L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

      map.on('click', (e: any) => {
        place(e.latlng.lat, e.latlng.lng);
        setHits([]);
        setMsg('ম্যাপে অবস্থান বসানো হয়েছে। দরকারে পিনটি টেনে ঠিক করুন।');
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

  function useMyLocation() {
    if (!ready) return;
    if (!('geolocation' in navigator)) {
      setMsg('আপনার ব্রাউজারে লোকেশন সুবিধা নেই। ম্যাপে চাপ দিয়ে বা নাম খুঁজে জায়গা বেছে নিন।');
      return;
    }
    setBusy(true);
    setMsg('আপনার লোকেশন খোঁজা হচ্ছে… ফোন অনুমতি চাইলে "অনুমতি দিন" চাপুন।');
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setBusy(false);
        place(p.coords.latitude, p.coords.longitude, 17);
        setHits([]);
        setMsg('আপনার বর্তমান লোকেশন বসানো হয়েছে। মণ্ডপ অন্য জায়গায় হলে ম্যাপে চাপ দিন বা পিন টেনে নিন।');
      },
      (err) => {
        setBusy(false);
        if (err.code === 1) {
          setMsg('লোকেশনের অনুমতি দেওয়া হয়নি। ফোনের সেটিংসে ব্রাউজারের লোকেশন চালু করুন, অথবা ম্যাপে চাপ দিয়ে জায়গা বেছে নিন।');
        } else if (err.code === 3) {
          setMsg('লোকেশন পেতে বেশি সময় লাগছে। ফোনের GPS (Location) চালু আছে কি দেখুন, তারপর আবার চাপুন।');
        } else {
          setMsg('লোকেশন পাওয়া যায়নি। ফোনের Location চালু করে আবার চেষ্টা করুন, অথবা ম্যাপে চাপ দিন।');
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  }

  // এলাকার নাম খোঁজা (OpenStreetMap Nominatim, শুধু চট্টগ্রাম অঞ্চলে)
  async function search() {
    const term = q.trim();
    if (term.length < 2) {
      setMsg('খুঁজতে এলাকা বা জায়গার নাম লিখুন।');
      return;
    }
    setSearching(true);
    setHits([]);
    setMsg('খোঁজা হচ্ছে…');
    try {
      const url =
        'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=bd&accept-language=bn,en' +
        '&viewbox=91.3,23.0,92.3,21.8&bounded=1&q=' +
        encodeURIComponent(term);
      const res = await fetch(url);
      if (!res.ok) throw new Error('bad');
      const data: { display_name: string; lat: string; lon: string }[] = await res.json();
      const list: Hit[] = data
        .map((d) => ({ name: d.display_name, lat: Number(d.lat), lng: Number(d.lon) }))
        .filter((d) => Number.isFinite(d.lat) && Number.isFinite(d.lng));
      if (list.length === 0) {
        setMsg('চট্টগ্রামে এই নামে কিছু পাওয়া যায়নি। অন্য বানানে বা কাছের পরিচিত জায়গার নামে খুঁজুন, অথবা ম্যাপে চাপ দিন।');
      } else if (list.length === 1) {
        place(list[0].lat, list[0].lng, 17);
        setMsg('জায়গাটি পাওয়া গেছে। ঠিক জায়গায় না হলে পিনটি টেনে সরান।');
      } else {
        setHits(list);
        setMsg('নিচের তালিকা থেকে সঠিক জায়গাটি বেছে নিন।');
      }
    } catch {
      setMsg('খোঁজা যায়নি। ইন্টারনেট দেখে আবার চেষ্টা করুন, অথবা ম্যাপে চাপ দিন।');
    } finally {
      setSearching(false);
    }
  }

  function clear() {
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    setPos(null);
    setMsg('অবস্থান মুছে ফেলা হয়েছে।');
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="search"
          className="input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            // Enter চাপলে যেন পুরো ফর্ম জমা না হয়ে যায়
            if (e.key === 'Enter') {
              e.preventDefault();
              void search();
            }
          }}
          placeholder="এলাকার নাম লিখে খুঁজুন, যেমন: আন্দরকিল্লা"
          aria-label="ম্যাপে জায়গা খুঁজুন"
          maxLength={100}
        />
        <button type="button" className="btn shrink-0" onClick={() => void search()} disabled={searching || !ready}>
          {searching ? '…' : 'খুঁজুন'}
        </button>
      </div>
      {hits.length > 0 && (
        <ul className="max-h-48 overflow-y-auto rounded-md border border-line bg-surface text-sm">
          {hits.map((h, i) => (
            <li key={`${h.lat}-${h.lng}-${i}`}>
              <button
                type="button"
                className="block w-full border-b border-line px-3 py-2 text-left last:border-b-0"
                onClick={() => {
                  place(h.lat, h.lng, 17);
                  setHits([]);
                  setMsg('জায়গাটি বসানো হয়েছে। ঠিক জায়গায় না হলে পিনটি টেনে সরান।');
                }}
              >
                {h.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      <button type="button" className="btn-ghost w-full" onClick={useMyLocation} disabled={busy || !ready}>
        {busy ? 'লোকেশন খোঁজা হচ্ছে…' : '📍 আমার লোকেশন চালু করে বসান'}
      </button>

      <div ref={el} style={{ height: 360 }} className="z-0 w-full overflow-hidden rounded-md border border-line" />
      <p className="muted">ম্যাপের ডান কোণার বোতামে "স্যাটেলাইট" দৃশ্যও বেছে নিতে পারেন। মণ্ডপের জায়গায় চাপ দিন, পিনটি টেনেও সরানো যায়।</p>
      <p aria-live="polite" className={pos ? 'text-sm font-medium' : 'muted'}>
        {msg || (pos ? 'অবস্থান বসানো হয়েছে।' : 'এখনো অবস্থান বসানো হয়নি (ঐচ্ছিক)।')}
      </p>
      <input type="hidden" name="latitude" value={pos ? pos.lat.toFixed(6) : ''} />
      <input type="hidden" name="longitude" value={pos ? pos.lng.toFixed(6) : ''} />
      {pos && (
        <button type="button" className="btn-ghost" onClick={clear}>
          অবস্থান মুছুন
        </button>
      )}
    </div>
  );
}
