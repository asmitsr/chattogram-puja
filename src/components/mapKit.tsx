'use client';

// সাইটের সব ম্যাপের একই চেহারা এক জায়গায়: /map পাতা ও "তথ্য জমা দিন" পাতার ম্যাপ দুটোই এটি ব্যবহার করে।
// টাইল, জুম বোতাম, ॐ মার্কার, পপআপ, ব্যাকগ্রাউন্ড রং ও ফুল-স্ক্রিন বোতাম এখানেই ঠিক করা।

import { myMapsUrl } from '@/lib/myMaps';

export interface Pin {
  id: string;
  name: string;
  area: string | null;
  address?: string | null;
  contact?: string | null;
  description?: string | null;
  link?: boolean; // false হলে "বিস্তারিত" লিংক দেখানো হয় না
  focus?: boolean; // true হলে এই পিনটি বড় ও আলাদা রঙে দেখানো হয় (বিস্তারিত পাতার নিজের মণ্ডপ)
  lat: number;
  lng: number;
}

// চট্টগ্রাম শহরের মোটামুটি কেন্দ্র: শুধু ম্যাপ প্রথমে কোথায় খুলবে তার জন্য।
// কোনো মণ্ডপের অবস্থান নয়।
export const MAP_CENTER: [number, number] = [22.3569, 91.7832];
export const MAP_ZOOM = 12;

// টাইল আসতে দেরি হলেও সাদা ফাঁকা না দেখিয়ে OpenStreetMap-এর মতো হালকা মাটি-রঙ দেখানো হয়
export const MAP_BG = '#f2efe9';

// ছোট অবস্থায় ম্যাপের উচ্চতা (দুই পাতাতেই একই)
export const MAP_HEIGHT = 'clamp(260px, 38vh, 420px)';

// এলাকা অনুযায়ী ॐ পিনের রং (Google My Maps-এর সঙ্গে হুবহু এক):
// মহানগর = কমলা, উত্তর চট্টগ্রাম = টিল (সবুজাভ নীল), দক্ষিণ চট্টগ্রাম = নীলচে বেগুনি, এলাকা মেলে না = গোলাপি
export type AreaKey = 'metro' | 'north' | 'south' | 'new';

export const AREA_LABEL: Record<AreaKey, string> = {
  metro: 'মহানগর চট্টগ্রাম',
  north: 'উত্তর চট্টগ্রাম',
  south: 'দক্ষিণ চট্টগ্রাম',
  new: 'নতুন যোগ হওয়া',
};
export const AREA_COLOR: Record<AreaKey, string> = {
  metro: '#d15e08',
  north: '#0f8a86',
  south: '#2e2d8d',
  new: '#a7214f',
};

export function areaKey(area: string | null | undefined): AreaKey {
  const a = (area ?? '').normalize('NFC');
  if (a.includes('মেট্রোপলিটন') || a.includes('মহানগর') || a.includes('কোতোয়ালী')) return 'metro';
  if (a.includes('উত্তর চট্টগ্রাম')) return 'north';
  if (a.includes('দক্ষিণ চট্টগ্রাম')) return 'south';
  return 'new';
}

// ছোট ও পরিষ্কার ॐ পিন (৬৪×৮০ ছবির ছোট রূপ); নিচের সূচালো মাথা ঠিক জায়গাটি দেখায়।
// focus = true হলে (বিস্তারিত পাতার নিজের মণ্ডপ) পিনটি বড় দেখানো হয়।
export function omIcon(L: any, key: AreaKey, focus = false) {
  const w = focus ? 42 : 26;
  const h = Math.round((w * 80) / 64);
  return L.icon({
    iconUrl: `/pins/om-${key}.png`,
    iconSize: [w, h],
    iconAnchor: [w / 2, h - 1],
    popupAnchor: [0, -h + 4],
    className: focus ? 'om-pin om-pin-focus' : 'om-pin',
  });
}

// ম্যাপের নিচে রঙের পরিচয়
export function MapLegend() {
  const keys: AreaKey[] = ['metro', 'north', 'south'];
  return (
    <ul className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" aria-label="পিনের রঙের পরিচয়">
      {keys.map((k) => (
        <li key={k} className="flex items-center gap-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/pins/om-${k}.png`} alt="" width={16} height={20} />
          <span>{AREA_LABEL[k]}</span>
        </li>
      ))}
    </ul>
  );
}

// একই ধরনের ম্যাপ তৈরি: একই টাইল, একই জুম বোতাম (বাঁ ওপরে), একই ভাষা
export function createBaseMap(L: any, node: HTMLElement, opts: { wheelZoom?: boolean } = {}) {
  const map = L.map(node, { scrollWheelZoom: !!opts.wheelZoom, tap: true }).setView(MAP_CENTER, MAP_ZOOM);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    keepBuffer: 4,
    attribution: '© OpenStreetMap contributors',
  }).addTo(map);
  return map;
}

// সব মণ্ডপের ॐ মার্কার ও পপআপ বসানো; মার্কারগুলোর অবস্থান ফেরত দেয়।
// newTab = true হলে "বিস্তারিত" লিংক নতুন ট্যাবে খোলে (ফর্ম পাতায় লেখা হারিয়ে না যাওয়ার জন্য)
export function addPins(
  L: any,
  map: any,
  pins: Pin[],
  opts: { newTab?: boolean; markersOut?: Record<string, any> } = {},
): [number, number][] {
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
      if (opts.newTab) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
      actions.appendChild(link);
    }
    const dir = document.createElement('a');
    dir.href = `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
    dir.target = '_blank';
    dir.rel = 'noopener noreferrer';
    dir.textContent = 'দিকনির্দেশ';
    actions.appendChild(dir);
    // গুগল My Maps খোলে: সেখানে এই মণ্ডপের আশেপাশের সব পূজার ॐ চিহ্নও দেখা যায়
    const near = document.createElement('a');
    near.href = myMapsUrl(p.lat, p.lng);
    near.target = '_blank';
    near.rel = 'noopener noreferrer';
    near.textContent = 'আশেপাশের পূজা (Google Maps)';
    actions.appendChild(near);
    box.appendChild(actions);

    const marker = L.marker([p.lat, p.lng], {
      icon: omIcon(L, areaKey(p.area), !!p.focus),
      title: p.name,
      riseOnHover: true,
      zIndexOffset: p.focus ? 1000 : 0,
    })
      .addTo(map)
      .bindPopup(box);
    if (opts.markersOut) opts.markersOut[p.id] = marker;
    bounds.push([p.lat, p.lng]);
  });
  return bounds;
}

// সব ম্যাপের একই ফুল-স্ক্রিন বোতাম। ফুল-স্ক্রিনে এটি স্ক্রিনে স্থির থাকে।
export function MapFullscreenButton({ full, onToggle }: { full: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={full ? 'ফুল-স্ক্রিন বন্ধ করুন' : 'ফুল-স্ক্রিনে দেখুন'}
      aria-pressed={full}
      className={`${full ? 'fixed' : 'absolute'} flex h-11 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold text-neutral-800 shadow-lg ring-1 ring-black/10 active:bg-neutral-100`}
      style={
        full
          ? { zIndex: 2100, top: 'max(10px, env(safe-area-inset-top))', right: 'max(10px, env(safe-area-inset-right))' }
          : { zIndex: 1000, top: 10, right: 10 }
      }
    >
      <span aria-hidden="true" className="text-lg leading-none">
        {full ? '✕' : '⛶'}
      </span>
      {full ? 'বন্ধ করুন' : 'ফুল-স্ক্রিন'}
    </button>
  );
}

// ম্যাপের বাইরের ঘেরের ক্লাস (ছোট অবস্থায় ও ফুল-স্ক্রিনে)
export const shellClass = (full: boolean) => (full ? 'fixed inset-0 z-[2000]' : 'relative isolate');
export const mapBoxClass = (full: boolean) => `z-0 w-full overflow-hidden border-line ${full ? '' : 'rounded-md border'}`;
