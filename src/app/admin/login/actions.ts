'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function loginAdmin(formData: FormData): Promise<void> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) redirect('/admin/login?e=bad');

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) redirect('/admin/login?e=bad');

  // শুধু admins তালিকায় থাকা অ্যাকাউন্ট ভেতরে ঢুকতে পারবে
  const { data: row } = await supabase.from('admins').select('user_id').eq('user_id', data.user.id).maybeSingle();
  if (!row) {
    await supabase.auth.signOut();
    redirect('/admin/login?e=notadmin');
  }
  redirect('/admin');
}

export async function logoutAdmin(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
