import { NextResponse } from 'next/server';
import { parseCoords } from '@/lib/mapLink';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

// শুধু গুগলের পরিচিত ঠিকানাগুলো খোলা হয় (অন্য কোনো সাইটে নয়)
const ALLOWED = [
  /^maps\.app\.goo\.gl$/,
  /^goo\.gl$/,
  /^g\.co$/,
  /^share\.google$/,
  /^(www\.)?google\.[a-z.]+$/,
  /^maps\.google\.[a-z.]+$/,
  /^consent\.google\.[a-z.]+$/,
];

function allowed(u: URL): boolean {
  return u.protocol === 'https:' && ALLOWED.some((r) => r.test(u.hostname));
}

// পাতার লেখার ভেতর থেকে অবস্থান খোঁজা (গুগল নানা রূপে বসিয়ে রাখে)
function fromBody(body: string): { lat: number; lng: number } | null {
  const tries: Array<[RegExp, boolean]> = [
    [/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, false],
    [/staticmap\?center=(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/, false],
    [/[?&;]center=(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/, false],
    [/@(-?\d+\.\d+),(-?\d+\.\d+)/, false],
    [/\[null,null,(-?\d+\.\d+),(-?\d+\.\d+)\]/, false],
    [/APP_INITIALIZATION_STATE=\[\[\[[\d.]+,(-?\d+\.\d+),(-?\d+\.\d+)/, true], // এখানে আগে দ্রাঘিমাংশ
  ];
  for (const [re, lngFirst] of tries) {
    const m = body.match(re);
    if (!m) continue;
    const a = Number(m[1]);
    const b = Number(m[2]);
    const p = lngFirst ? { lat: b, lng: a } : { lat: a, lng: b };
    if (Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180) return p;
  }
  return null;
}

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get('u') ?? '';
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return NextResponse.json({ error: 'bad' }, { status: 400 });
  }
  if (!allowed(url)) return NextResponse.json({ error: 'bad' }, { status: 400 });

  // Vercel Hobby-তে ফাংশন ১০ সেকেন্ডের বেশি চলে না, তাই মোট সময় ৮ সেকেন্ডে বাঁধা
  const deadline = Date.now() + 8000;
  try {
    for (let i = 0; i < 6 && Date.now() < deadline; i++) {
      const direct = parseCoords(url.toString());
      if (direct) return NextResponse.json(direct);

      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), Math.max(1500, Math.min(4000, deadline - Date.now())));
      let res: Response;
      try {
        res = await fetch(url.toString(), {
          redirect: 'manual',
          signal: ctl.signal,
          cache: 'no-store',
          headers: {
            'user-agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36',
            'accept-language': 'en',
          },
        });
      } finally {
        clearTimeout(timer);
      }

      const loc = res.headers.get('location');
      if (res.status >= 300 && res.status < 400 && loc) {
        let next = new URL(loc, url);
        // consent পাতায় গেলে আসল গন্তব্য "continue" ঘরে থাকে
        const cont = next.searchParams.get('continue');
        if (/^consent\.google\./.test(next.hostname) && cont) {
          try {
            next = new URL(cont);
          } catch {
            break;
          }
        }
        if (!allowed(next)) break;
        url = next;
        continue;
      }
      // সরাসরি পাতা এলে তার লেখা থেকে খোঁজা
      const body = (await res.text()).slice(0, 800000);
      const found = fromBody(body);
      if (found) return NextResponse.json(found);
      break;
    }
  } catch {
    /* নিচে না-পাওয়ার উত্তর */
  }
  return NextResponse.json({ error: 'notfound' }, { status: 404 });
}
