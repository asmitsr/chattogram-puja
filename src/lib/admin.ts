import { redirect } from 'next/navigation';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

// প্রতিটি অ্যাডমিন পাতা ও অ্যাকশনের শুরুতে এটি চলে।
// এটি সুবিধার জন্য; আসল সুরক্ষা ডেটাবেসের RLS নিয়ম (is_admin)।
export async function requireAdmin(): Promise<{ supabase: SupabaseClient; user: User }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data } = await supabase.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
  if (!data) redirect('/admin/login?e=notadmin');

  return { supabase, user };
}

export async function logActivity(
  supabase: SupabaseClient,
  user: User,
  action: string,
  table: string,
  recordId: string | null,
  details?: Record<string, unknown>,
) {
  await supabase.from('activity_log').insert({
    admin_id: user.id,
    action,
    table_name: table,
    record_id: recordId,
    details: details ?? null,
  });
}
