import type { Sb } from '@/lib/supabase/server';
import type { Pin } from '@/components/MapView';

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
