import type { SupabaseClient } from '@supabase/supabase-js';
import type { Year } from './types';

export async function getYears(supabase: SupabaseClient): Promise<Year[]> {
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
