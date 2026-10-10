import { createClient } from '@/lib/supabase/server';

export function hasEnv(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function getUser() {
  if (!hasEnv()) return null;
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch {
    return null;
  }
}
