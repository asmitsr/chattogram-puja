import type { Sb } from '@/lib/supabase/server';
import type { Mandapa, Year } from './types';

export async function getYears(supabase: Sb): Promise<Year[]> {
  const { data } = await supabase.from('puja_years').select('*').order('year', { ascending: false });
  return (data ?? []) as Year[];
}

// বর্তমান বছর: সক্রিয় থাকলে সেটি, না হলে সবচেয়ে কাছের আসন্ন, না হলে সর্বশেষ।
export function pickCurrent(years: Year[]): Year | null {
  const active = years.find((y) => y.status === 'active');
  if (active) return active;
  const upcoming = [...years].reverse().find((y) => y.status === 'upcoming');
  return upcoming ?? years[0] ?? null;
}

// প্রকাশিত সব মণ্ডপ। Supabase একবারে সর্বোচ্চ ১০০০টি দেয়, তাই পাতা পাতা করে এনে সবগুলোই জোড়া হয়
// (মণ্ডপ যত বেশিই হোক, কোনোটি বাদ পড়বে না)।
export async function fetchAllPublished(supabase: Sb, yearId: string): Promise<Mandapa[]> {
  const out: Mandapa[] = [];
  const size = 1000;
  for (let from = 0; from < 20000; from += size) {
    const { data, error } = await supabase
      .from('mandapas')
      .select('*')
      .eq('year_id', yearId)
      .eq('status', 'published')
      .order('name')
      .order('id')
      .range(from, from + size - 1);
    if (error || !data) break;
    out.push(...(data as Mandapa[]));
    if (data.length < size) break;
  }
  return out;
}
