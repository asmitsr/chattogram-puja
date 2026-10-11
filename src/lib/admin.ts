import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient, type Sb } from '@/lib/supabase/server';

// প্রতিটি অ্যাডমিন পাতা ও অ্যাকশনের শুরুতে এটি চলে।
// এটি সুবিধার জন্য; আসল সুরক্ষা ডেটাবেসের RLS নিয়ম (is_admin)।
export async function requireAdmin(): Promise<{ supabase: Sb; user: User }> {
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
  supabase: Sb,
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

// লগইন করা ব্যক্তি অ্যাডমিন হলে তার তথ্য দেয়, না হলে null (রিডাইরেক্ট করে না)।
// সাধারণ পাতায় অ্যাডমিন বোতাম দেখানো ও সার্ভার অ্যাকশনে অনুমতি যাচাইয়ে ব্যবহার হয়।
export async function getAdminContext(): Promise<{ supabase: Sb; user: User } | null> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
    return data ? { supabase, user } : null;
  } catch {
    return null;
  }
}

export async function isAdminViewer(): Promise<boolean> {
  return (await getAdminContext()) !== null;
}
