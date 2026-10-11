import { NextResponse } from 'next/server';
import { parseCoords } from '@/lib/mapLink';

export const dynamic = 'force-dynamic';

// শুধু গুগল ম্যাপের পরিচিত ঠিকানাগুলো খোলা হয় (অন্য কোনো সাইটে নয়)
const ALLOWED = [/^maps\.app\.goo\.gl$/, /^goo\.gl$/, /^g\.co$/, /^share\.google$/, /^(www\.)?google\.[a-z.]+$/, /^maps\.google\.[a-z.]+$/];

function allowed(u: URL): boolean {
  return u.protocol === 'https:' && ALLOWED.some((r) => r.test(u.hostname));
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

  try {
    for (let i = 0; i < 6; i++) {
      const direct = parseCoords(url.toString());
      if (direct) return NextResponse.json(direct);

      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 6000);
      const res = await fetch(url.toString(), {
        redirect: 'manual',
        signal: ctl.signal,
        headers: { 'user-agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36', 'accept-language': 'en' },
      });
      clearTimeout(timer);

      const loc = res.headers.get('location');
      if (res.status >= 300 && res.status < 400 && loc) {
        const next = new URL(loc, url);
        if (!allowed(next)) break;
        url = next;
        continue;
      }
      // সরাসরি পাতা এলে তার লেখা থেকে খোঁজা
      const body = (await res.text()).slice(0, 600000);
      const found = parseCoords(body.match(/!3d-?\d+\.\d+!4d-?\d+\.\d+/)?.[0] ?? '') ?? parseCoords(body.match(/@-?\d+\.\d+,-?\d+\.\d+/)?.[0] ?? '');
      if (found) return NextResponse.json(found);
      break;
    }
  } catch {
    /* নিচে না-পাওয়ার উত্তর */
  }
  return NextResponse.json({ error: 'notfound' }, { status: 404 });
}
