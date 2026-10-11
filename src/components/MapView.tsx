'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

export interface Pin {
  id: string;
  name: string;
  area: string | null;
  lat: number;
  lng: number;
}

// চট্টগ্রাম শহরের মোটামুটি কেন্দ্র: শুধু ম্যাপ প্রথমে কোথায় খুলবে তার জন্য।
// কোনো মণ্ডপের অবস্থান নয়।
const CENTER: [number, number] = [22.3569, 91.7832];

export default function MapView({ pins, height = 420 }: { pins: Pin[]; height?: number }) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: any = null;
    let cancelled = false;

    (async () => {
      const mod: any = await import('leaflet');
      const L = mod.default ?? mod;
      if (cancelled || !el.current) return;

      map = L.map(el.current, { scrollWheelZoom: false }).setView(CENTER, 12);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 20,
        attribution: '© OpenStreetMap contributors © CARTO',
      }).addTo(map);

      const bounds: [number, number][] = [];
      pins.forEach((p) => {
        const box = document.createElement('div');
        const title = document.createElement('b');
        title.textContent = p.name;
        box.appendChild(title);
        if (p.area) {
          const area = document.createElement('div');
          area.textContent = p.area;
          box.appendChild(area);
        }
        const link = document.createElement('a');
        link.href = `/mandapa/${p.id}`;
        link.textContent = 'বিস্তারিত দেখুন';
        box.appendChild(link);

        L.circleMarker([p.lat, p.lng], {
          radius: 10,
          color: '#f0c766',
          weight: 3,
          fillColor: '#7a1424',
          fillOpacity: 1,
        })
          .addTo(map)
          .bindPopup(box);
        bounds.push([p.lat, p.lng]);
      });

      if (bounds.length === 1) map.setView(bounds[0], 16);
      else if (bounds.length > 1) map.fitBounds(bounds, { padding: [30, 30] });
    })();

    return () => {
      cancelled = true;
      if (map) map.remove();
    };
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
