'use server';

import { createAnonClient } from '@/lib/supabase/anon';

export interface SiteLikeState {
  ok: boolean;
  count?: number;
  liked?: boolean;
}

const VOTER = /^[A-Za-z0-9-]{16,64}$/;

function parse(data: unknown): SiteLikeState {
  const d = data as { count?: unknown; liked?: unknown } | null;
  if (!d || typeof d.count !== 'number') return { ok: false };
  return { ok: true, count: d.count, liked: Boolean(d.liked) };
}

// ওয়েবসাইটের মোট লাইক ও এই ব্রাউজার লাইক দিয়েছে কি না
export async function getSiteLikes(voter: string): Promise<SiteLikeState> {
  if (!VOTER.test(voter)) return { ok: false };
  const { data, error } = await createAnonClient().rpc('site_like_state', { p_voter: voter });
  if (error) return { ok: false };
  return parse(data);
}

// লাইক দেওয়া বা তুলে নেওয়া (বারবার চাপলেও একজন ব্রাউজার একটির বেশি লাইক দিতে পারে না)
export async function setSiteLike(voter: string, like: boolean): Promise<SiteLikeState> {
  if (!VOTER.test(voter)) return { ok: false };
  const { data, error } = await createAnonClient().rpc('set_site_like', { p_voter: voter, p_like: Boolean(like) });
  if (error) return { ok: false };
  return parse(data);
}
