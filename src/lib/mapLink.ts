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

export function parseCoords(raw: string): LatLng | null {
  let t = raw.replace(/[০-৯]/g, (d) => String(BN.indexOf(d)));
  try {
    t = decodeURIComponent(t);
  } catch {
    /* যেমন আছে তেমনই থাক */
  }
  t = t.trim();
  const num = '(-?\\d{1,3}(?:\\.\\d+)?)';
  const pats = [
    new RegExp(`!3d${num}!4d${num}`), // গুগলের ভেতরের ডেটা: ঠিক পিনের অবস্থান
    new RegExp(`@${num},${num}`), // .../@22.33,91.83,17z
    new RegExp(`[?&](?:q|ll|query|destination|center)=${num}\\s*,\\s*${num}`),
    new RegExp(`/place/${num},${num}`),
    new RegExp(`^\\s*${num}\\s*[,\\s]\\s*${num}\\s*$`), // শুধু "22.3384, 91.8317"
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

// maps.app.goo.gl ধরনের ছোট লিংক; এগুলোর কোঅর্ডিনেট সার্ভারে খুলে দেখতে হয়
export function findShortLink(raw: string): string | null {
  const m = raw.match(/https?:\/\/(?:maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/kgs|share\.google)\/[^\s]+/i);
  return m ? m[0] : null;
}

// চট্টগ্রাম অঞ্চলের ভেতরে কি না
export function inChattogram(p: LatLng): boolean {
  return p.lat >= 21 && p.lat <= 23.5 && p.lng >= 90.5 && p.lng <= 92.5;
}
