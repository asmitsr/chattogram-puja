import { unstable_cache } from 'next/cache';
import { createAnonClient } from '@/lib/supabase/anon';
import { pickCurrent } from '@/lib/data';
import type { Mandapa, Notice, Year } from '@/lib/types';

// দর্শকদের পাতার ডেটা: লগইন-ছাড়া (anon) ক্লায়েন্টে আনা ও ২ মিনিটের জন্য মনে রাখা (ক্যাশ)।
// অ্যাডমিন কিছু বদলালে revalidateTag('mandapas') চলে (src/app/admin/actions.ts) এবং সাথে সাথে নতুন ডেটা আসে।
// ডেটাবেসে সরাসরি (SQL দিয়ে) বদলালে সর্বোচ্চ ২ মিনিটে সাইটে দেখা যায়।
const OPTS = { revalidate: 120, tags: ['mandapas'] };

const loadYears = unstable_cache(
  async (): Promise<Year[]> => {
    const { data, error } = await createAnonClient().from('puja_years').select('*').order('year', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Year[];
  },
  ['public-years'],
  OPTS,
);

const loadPublished = unstable_cache(
  async (yearId: string): Promise<Mandapa[]> => {
    const sb = createAnonClient();
    const out: Mandapa[] = [];
    const size = 1000;
    for (let from = 0; from < 20000; from += size) {
      const { data, error } = await sb
        .from('mandapas')
        .select('*')
        .eq('year_id', yearId)
        .eq('status', 'published')
        .order('name')
        .order('id')
        .range(from, from + size - 1);
      if (error) throw new Error(error.message);
      if (!data) break;
      out.push(...(data as Mandapa[]));
      if (data.length < size) break;
    }
    return out;
  },
  ['public-published'],
  OPTS,
);

const loadNotices = unstable_cache(
  async (): Promise<Notice[]> => {
    const { data, error } = await createAnonClient().from('notices').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Notice[];
  },
  ['public-notices'],
  OPTS,
);

// ত্রুটি হলে ক্যাশে কিছু রাখা হয় না (throw করলে unstable_cache সংরক্ষণ করে না); পরের অনুরোধে আবার চেষ্টা হয়।
export async function getPublicYear(): Promise<Year | null> {
  try {
    return pickCurrent(await loadYears());
  } catch {
    return null;
  }
}

export async function getPublicMandapas(yearId: string): Promise<Mandapa[]> {
  try {
    return await loadPublished(yearId);
  } catch {
    return [];
  }
}

export async function getPublicNotices(): Promise<Notice[]> {
  try {
    return await loadNotices();
  } catch {
    return [];
  }
}
