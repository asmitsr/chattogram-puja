'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

const CENTER: [number, number] = [22.3569, 91.7832];

// জমা ফর্মের জন্য: ফোনের GPS বা ম্যাপে চাপ/পিন টেনে অবস্থান নির্ধারণ।
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

  function place(lat: number, lng: number, zoom?: number) {
    const L = libRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
    else {
      const icon = L.divIcon({
        className: '',
        html: '<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#7a1424;border:3px solid #f0c766;box-shadow:0 1px 4px rgba(0,0,0,.5)"></div>',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
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
      const map = L.map(el.current, { scrollWheelZoom: false }).setView(CENTER, 12);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);
      map.on('click', (e: any) => {
        place(e.latlng.lat, e.latlng.lng);
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
      setMsg('আপনার ব্রাউজারে লোকেশন সুবিধা নেই। ম্যাপে চাপ দিয়ে জায়গা বেছে নিন।');
      return;
    }
    setBusy(true);
    setMsg('আপনার লোকেশন খোঁজা হচ্ছে… ফোন অনুমতি চাইলে "অনুমতি দিন" চাপুন।');
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setBusy(false);
        place(p.coords.latitude, p.coords.longitude, 17);
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
      <button type="button" className="btn w-full" onClick={useMyLocation} disabled={busy || !ready}>
        {busy ? 'লোকেশন খোঁজা হচ্ছে…' : '📍 আমার লোকেশন চালু করে বসান'}
      </button>
      <p className="muted">আপনি যদি এখন মণ্ডপের কাছে থাকেন, উপরের বাটন চাপুন। নইলে ম্যাপে মণ্ডপের জায়গায় চাপ দিন, পিনটি টেনেও সরাতে পারবেন।</p>
      <div ref={el} style={{ height: 320 }} className="z-0 w-full overflow-hidden rounded-md border border-line" />
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
