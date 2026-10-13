import type { Sb } from '@/lib/supabase/server';
import type { Pin } from '@/components/MapView';
import { distanceM } from '@/lib/myMaps';

// ডাটাবেসের সব প্রকাশিত (published) মণ্ডপ থেকে ম্যাপের পিন তৈরি।
// অবস্থান নেই এমন মণ্ডপ পিনে আসে না, শুধু সংখ্যায় গোনা হয়।
export async function fetchPins(supabase: Sb): Promise<{ pins: Pin[]; noLoc: number }> {
  const { data } = await supabase
    .from('mandapas')
    .select('id,name,area,address,contact,description,latitude,longitude')
    .eq('status', 'published')
    .limit(3000);
  const all = (data ?? []) as {
    id: string;
    name: string;
    area: string | null;
    address: string | null;
    contact: string | null;
    description: string | null;
    latitude: number | string | null;
    longitude: number | string | null;
  }[];
  const pins: Pin[] = [];
  for (const m of all) {
    if (m.latitude === null || m.longitude === null) continue;
    const lat = Number(m.latitude);
    const lng = Number(m.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    pins.push({ id: m.id, name: m.name, area: m.area, address: m.address, contact: m.contact, description: m.description, lat, lng });
  }
  return { pins, noLoc: all.length - pins.length };
}

export interface NearbyPin extends Pin {
  dist: number; // মিটার
}

// একটি অবস্থানের আশেপাশের প্রকাশিত মণ্ডপ (কাছেরটি আগে)। radiusM মিটারের মধ্যে, সর্বোচ্চ limit টি।
export async function fetchNearby(
  supabase: Sb,
  lat: number,
  lng: number,
  excludeId: string,
  radiusM = 3000,
  limit = 40,
): Promise<NearbyPin[]> {
  // আগে মোটামুটি বাক্স (১ ডিগ্রি অক্ষাংশ ≈ ১১১ কিমি) দিয়ে ছেঁকে নেওয়া, তারপর সঠিক দূরত্ব
  const dLat = radiusM / 111000;
  const dLng = radiusM / (111000 * Math.max(Math.cos((lat * Math.PI) / 180), 0.2));
  const { data } = await supabase
    .from('mandapas')
    .select('id,name,area,address,contact,description,latitude,longitude')
    .eq('status', 'published')
    .neq('id', excludeId)
    .gte('latitude', lat - dLat)
    .lte('latitude', lat + dLat)
    .gte('longitude', lng - dLng)
    .lte('longitude', lng + dLng)
    .limit(500);
  const out: NearbyPin[] = [];
  for (const m of (data ?? []) as {
    id: string;
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
    const dist = distanceM(lat, lng, la, lo);
    if (dist > radiusM) continue;
    out.push({ id: m.id, name: m.name, area: m.area, address: m.address, contact: m.contact, description: m.description, lat: la, lng: lo, dist });
  }
  return out.sort((a, b) => a.dist - b.dist).slice(0, limit);
}
