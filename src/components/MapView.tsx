'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

export interface Pin {
  id: string;
  name: string;
  area: string | null;
  address?: string | null;
  contact?: string | null;
  description?: string | null;
  link?: boolean; // false হলে "বিস্তারিত" লিংক দেখানো হয় না
  lat: number;
  lng: number;
}

// চট্টগ্রাম শহরের মোটামুটি কেন্দ্র: শুধু ম্যাপ প্রথমে কোথায় খুলবে তার জন্য।
// কোনো মণ্ডপের অবস্থান নয়।
const CENTER: [number, number] = [22.3569, 91.7832];

// সব মণ্ডপের জন্য একই ॐ মার্কার: মেরুন বৃত্ত, সোনালি কিনারা, ভেতরে ॐ
function omIcon(L: any, size: number) {
  return L.divIcon({
    className: '',
    html:
      `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#7a1424;border:3px solid #f0c766;` +
      `box-shadow:0 2px 6px rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;` +
      `color:#f0c766;font-weight:700;font-size:${Math.round(size * 0.55)}px;line-height:1;font-family:'Noto Sans Devanagari','Noto Sans Bengali',sans-serif">ॐ</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export default function MapView({ pins, height = 420, wheelZoom = false, fitAll = true }: { pins: Pin[]; height?: number | string; wheelZoom?: boolean; fitAll?: boolean }) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: any = null;
    let cancelled = false;

    (async () => {
      const mod: any = await import('leaflet');
      const L = mod.default ?? mod;
      if (cancelled || !el.current) return;

      map = L.map(el.current, { scrollWheelZoom: wheelZoom, tap: true }).setView(CENTER, 12);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      const bounds: [number, number][] = [];
      pins.forEach((p) => {
        const box = document.createElement('div');
        box.style.maxWidth = '240px';
        const line = (text: string, style?: Partial<CSSStyleDeclaration>) => {
          const d = document.createElement('div');
          d.textContent = text;
          if (style) Object.assign(d.style, style);
          box.appendChild(d);
        };
        const title = document.createElement('b');
        title.textContent = p.name;
        title.style.fontSize = '15px';
        box.appendChild(title);
        if (p.area) line(p.area, { marginTop: '2px' });
        if (p.address) line('ঠিকানা: ' + p.address, { marginTop: '4px' });
        if (p.contact) line('যোগাযোগ: ' + p.contact, { marginTop: '4px' });
        if (p.description) {
          const t = p.description.length > 160 ? p.description.slice(0, 160).trimEnd() + '…' : p.description;
          line(t, { marginTop: '4px', whiteSpace: 'pre-line', opacity: '0.85' });
        }
        const actions = document.createElement('div');
        actions.style.marginTop = '6px';
        actions.style.display = 'flex';
        actions.style.gap = '12px';
        actions.style.flexWrap = 'wrap';
        if (p.link !== false) {
          const link = document.createElement('a');
          link.href = `/mandapa/${p.id}`;
          link.textContent = 'বিস্তারিত দেখুন';
          actions.appendChild(link);
        }
        const dir = document.createElement('a');
        dir.href = `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
        dir.target = '_blank';
        dir.rel = 'noopener noreferrer';
        dir.textContent = 'দিকনির্দেশ';
        actions.appendChild(dir);
        box.appendChild(actions);

        L.marker([p.lat, p.lng], { icon: omIcon(L, pins.length === 1 ? 40 : 34), title: p.name, riseOnHover: true })
          .addTo(map)
          .bindPopup(box);
        bounds.push([p.lat, p.lng]);
      });

      if (bounds.length === 1) map.setView(bounds[0], 16);
      else if (bounds.length > 1 && fitAll) map.fitBounds(bounds, { padding: [30, 30] });
      setTimeout(() => map && map.invalidateSize(), 200);
    })();

    return () => {
      cancelled = true;
      if (map) map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins]);

  return (
    <div
      ref={el}
      style={{ height }}
      className="z-0 w-full overflow-hidden rounded-md border border-line"
      role="application"
      aria-label="ম্যাপ"
    />
  );
}
