import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// অ্যাডমিন সাইটের সব প্রকাশিত মণ্ডপ একটি KML ফাইলে নামাতে পারে।
// এই ফাইল Google My Maps-এ "Import" করলে সেখানেও সব ॐ চিহ্ন সাইটের সঙ্গে মিলে থাকে।
const esc = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse('অনুমতি নেই', { status: 401 });
  const { data: admin } = await supabase.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
  if (!admin) return new NextResponse('অনুমতি নেই', { status: 403 });

  const { data } = await supabase
    .from('mandapas')
    .select('name,area,address,contact,latitude,longitude')
    .eq('status', 'published')
    .order('name')
    .limit(5000);

  const marks: string[] = [];
  for (const m of (data ?? []) as {
    name: string;
    area: string | null;
    address: string | null;
    contact: string | null;
    latitude: number | string | null;
    longitude: number | string | null;
  }[]) {
    const la = Number(m.latitude);
    const lo = Number(m.longitude);
    if (m.latitude === null || m.longitude === null || !Number.isFinite(la) || !Number.isFinite(lo)) continue;
    const desc = [m.area, m.address, m.contact ? `যোগাযোগ: ${m.contact}` : ''].filter(Boolean).join('\n');
    marks.push(
      `<Placemark><name>${esc(m.name)}</name><description>${esc(desc)}</description><Point><coordinates>${lo},${la},0</coordinates></Point></Placemark>`,
    );
  }

  const kml =
    `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document>` +
    `<name>চট্টগ্রামের পুজো</name>${marks.join('')}</Document></kml>`;
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(kml, {
    headers: {
      'Content-Type': 'application/vnd.google-earth.kml+xml; charset=utf-8',
      'Content-Disposition': `attachment; filename="chattogram-puja-map-${stamp}.kml"`,
      'Cache-Control': 'no-store',
    },
  });
}
