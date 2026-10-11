// গুগল ম্যাপের লিংক বা কোঅর্ডিনেট থেকে অক্ষাংশ-দ্রাঘিমাংশ বের করা (ক্লায়েন্ট ও সার্ভার দুই জায়গাতেই চলে)
const BN = '০১২৩৪৫৬৭৮৯';

export interface LatLng {
  lat: number;
  lng: number;
}

function ok(lat: number, lng: number): LatLng | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

// 22°20'18.2"N 91°49'54.1"E (গুগল ম্যাপের ডিগ্রি-মিনিট-সেকেন্ড রূপ)
function parseDms(t: string): LatLng | null {
  const s = t.replace(/[′’‘`´]/g, "'").replace(/[″”“]/g, '"').replace(/º/g, '°');
  const part = '(\\d{1,3})\\s*°\\s*(?:(\\d{1,2}(?:\\.\\d+)?)\\s*\'\\s*)?(?:(\\d{1,2}(?:\\.\\d+)?)\\s*(?:"|\'\')\\s*)?([NSEW])';
  const m = s.match(new RegExp(`${part}[\\s,]*${part}`, 'i'));
  if (!m) return null;
  const conv = (d: string, mi?: string, se?: string) => Number(d) + Number(mi ?? 0) / 60 + Number(se ?? 0) / 3600;
  let a = conv(m[1], m[2], m[3]);
  let b = conv(m[5], m[6], m[7]);
  const h1 = m[4].toUpperCase();
  const h2 = m[8].toUpperCase();
  if (h1 === 'S') a = -a;
  if (h1 === 'W') a = -a;
  if (h2 === 'S') b = -b;
  if (h2 === 'W') b = -b;
  // N/S অক্ষাংশ, E/W দ্রাঘিমাংশ; উল্টো ক্রমে লেখা থাকলে অদলবদল
  const latFirst = h1 === 'N' || h1 === 'S';
  return latFirst ? ok(a, b) : ok(b, a);
}

export function parseCoords(raw: string): LatLng | null {
  let t = raw.replace(/[০-৯]/g, (d) => String(BN.indexOf(d)));
  try {
    t = decodeURIComponent(t);
  } catch {
    /* যেমন আছে তেমনই থাক */
  }
  t = t.trim();

  const dms = parseDms(t);
  if (dms) return dms;

  const num = '(-?\\d{1,3}(?:\\.\\d+)?)';
  const pats = [
    new RegExp(`!3d${num}!4d${num}`), // গুগলের ভেতরের ডেটা: ঠিক পিনের অবস্থান
    new RegExp(`@${num},${num}`), // .../@22.33,91.83,17z
    new RegExp(`[?&](?:q|ll|query|destination|daddr|center|sll|viewpoint)=(?:loc:)?${num}\\s*,\\s*${num}`),
    new RegExp(`geo:${num},${num}`),
    new RegExp(`/(?:place|search|dir/[^/]*)/${num},\\s*${num}`),
    new RegExp(`^\\s*(?:lat(?:itude)?\\s*[:=]?\\s*)?${num}\\s*[,;\\s]\\s*(?:lo?ng(?:itude)?\\s*[:=]?\\s*)?${num}\\s*$`, 'i'), // শুধু "22.3384, 91.8317"
  ];
  for (const p of pats) {
    const m = t.match(p);
    if (m) {
      const r = ok(Number(m[1]), Number(m[2]));
      if (r) return r;
    }
  }
  return null;
}

// লেখার ভেতর থেকে প্রথম লিংকটি বের করা (শেয়ার করা লেখায় নামের সঙ্গে লিংক থাকে)
export function findUrl(raw: string): string | null {
  const m = raw.match(/https?:\/\/[^\s<>"']+/i);
  return m ? m[0].replace(/[).,;]+$/, '') : null;
}

// maps.app.goo.gl ধরনের ছোট লিংক, অথবা কোঅর্ডিনেট ছাড়া গুগল ম্যাপের লিংক; এগুলো সার্ভারে খুলে দেখতে হয়
export function findShortLink(raw: string): string | null {
  const u = findUrl(raw);
  if (!u) return null;
  return /^https?:\/\/(?:[a-z0-9-]+\.)*(?:goo\.gl|g\.co|google\.[a-z.]+|share\.google|maps\.app\.goo\.gl)\//i.test(u) ? u : null;
}

// চট্টগ্রাম অঞ্চলের ভেতরে কি না
export function inChattogram(p: LatLng): boolean {
  return p.lat >= 21 && p.lat <= 23.5 && p.lng >= 90.5 && p.lng <= 92.5;
}
