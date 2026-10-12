'use server';

import { createAnonClient } from '@/lib/supabase/anon';

export interface LikeTotal {
  ok: boolean;
  count?: number;
}

// ওয়েবসাইটের মোট লাইক
export async function getSiteLikeTotal(): Promise<LikeTotal> {
  const { data, error } = await createAnonClient().rpc('site_like_total');
  if (error || typeof data !== 'number') return { ok: false };
  return { ok: true, count: data };
}

// n সংখ্যক লাইক যোগ করা (একসাথে সর্বোচ্চ ১০০); নতুন মোট ফেরত দেয়
export async function addSiteLikes(n: number): Promise<LikeTotal> {
  const k = Math.min(Math.max(Math.floor(Number(n) || 0), 1), 100);
  const { data, error } = await createAnonClient().rpc('add_site_likes', { p_n: k });
  if (error || typeof data !== 'number') return { ok: false };
  return { ok: true, count: data };
}
