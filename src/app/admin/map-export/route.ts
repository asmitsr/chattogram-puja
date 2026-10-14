import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { makeZip } from '@/lib/kmz';
import { OM_ICONS } from '@/lib/omIcons';

export const dynamic = 'force-dynamic';

// অ্যাডমিন সাইটের সব প্রকাশিত মণ্ডপ একটি KMZ ফাইলে নামাতে পারে।
// Google My Maps-এ "Import" করলে ৩টি আলাদা লেয়ার (মহানগর / উত্তর / দক্ষিণ চট্টগ্রাম) ও নিজস্ব ॐ পিন আসে।
// এলাকা মেলে না এমন (নতুন জমা হওয়া) মণ্ডপ চতুর্থ লেয়ার "নতুন যোগ হওয়া"-য় যায়; My Maps-এ টেনে সঠিক লেয়ারে সরানো যায়।
type Key = 'metro' | 'north' | 'south' | 'new';
const LAYERS: [Key, string][] = [
  ['metro', 'মহানগর চট্টগ্রাম'],
  ['north', 'উত্তর চট্টগ্রাম'],
  ['south', 'দক্ষিণ চট্টগ্রাম'],
  ['new', 'নতুন যোগ হওয়া'],
];

const esc = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

function layerOf(area: string | null): Key {
  const a = (area ?? '').normalize('NFC');
  if (a.includes('মেট্রোপলিটন') || a.includes('মহানগর') || a.includes('কোতোয়ালী')) return 'metro';
  if (a.includes('উত্তর চট্টগ্রাম')) return 'north';
  if (a.includes('দক্ষিণ চট্টগ্রাম')) return 'south';
  return 'new';
}

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
    .select('name,area,address,contact,description,latitude,longitude')
    .eq('status', 'published')
    .order('name')
    .limit(5000);

  const groups: Record<Key, string[]> = { metro: [], north: [], south: [], new: [] };
  for (const m of (data ?? []) as {
    name: string;
    area: string | null;
    address: string | null;
    contact: string | null;
    description: string | null;
    latitude: number | string | null;
    longitude: number | string | null;
  }[]) {
    const la = Number(m.latitude);
    const lo = Number(m.longitude);
    if (m.latitude === null || m.longitude === null || !Number.isFinite(la) || !Number.isFinite(lo)) continue;
    const key = layerOf(m.area);
    const desc = [
      key === 'new' ? m.area : '',
      m.address,
      m.description,
      m.contact ? `যোগাযোগ: ${m.contact}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    groups[key].push(
      `<Placemark><name>${esc(m.name)}</name>` +
        (desc ? `<description>${esc(desc)}</description>` : '') +
        `<styleUrl>#om-${key}</styleUrl><Point><coordinates>${lo},${la},0</coordinates></Point></Placemark>`,
    );
  }

  const styles = LAYERS.map(
    ([k]) =>
      `<Style id="om-${k}"><IconStyle><scale>1</scale><Icon><href>images/om-${k}.png</href></Icon>` +
      `<hotSpot x="0.5" y="0" xunits="fraction" yunits="fraction"/></IconStyle><LabelStyle><scale>0</scale></LabelStyle></Style>`,
  ).join('');
  const folders = LAYERS.filter(([k]) => groups[k].length > 0)
    .map(([k, label]) => `<Folder><name>${esc(label)}</name>${groups[k].join('')}</Folder>`)
    .join('');
  const kml =
    `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document>` +
    `<name>চট্টগ্রামের পুজো</name><description>চট্টগ্রামের পূজা মণ্ডপের ম্যাপ</description>${styles}${folders}</Document></kml>`;

  const enc = new TextEncoder();
  const zip = makeZip([
    { name: 'doc.kml', data: enc.encode(kml) },
    ...LAYERS.map(([k]) => ({ name: `images/om-${k}.png`, data: new Uint8Array(Buffer.from(OM_ICONS[k], 'base64')) })),
  ]);
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(zip as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.google-earth.kmz',
      'Content-Disposition': `attachment; filename="chattogram-puja-map-${stamp}.kmz"`,
      'Cache-Control': 'no-store',
    },
  });
}
