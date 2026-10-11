'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function loginAdmin(formData: FormData): Promise<void> {
  // ফোনের কিবোর্ড অনেক সময় প্রথম অক্ষর বড় হাতের করে বা শেষে ফাঁকা যোগ করে; তাই ইমেইল ছোট হাতের ও ফাঁকাহীন করা হয়।
  // পাসওয়ার্ড কখনো বদলানো হয় না (হুবহু যেমন লেখা)।
  const email = String(formData.get('email') ?? '')
    .normalize('NFKC')
    .replace(/[\s​-‍﻿]/g, '')
    .toLowerCase();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) redirect('/admin/login?e=bad');

  let failure: string | null = null;
  let userId: string | null = null;
  const supabase = createClient();
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      const code = (error as { code?: string; status?: number } | null)?.code ?? '';
      const status = (error as { status?: number } | null)?.status ?? 0;
      if (code === 'email_not_confirmed') failure = 'unconfirmed';
      else if (code === 'over_request_rate_limit' || status === 429) failure = 'limit';
      else if (status >= 500 || status === 0) failure = 'server';
      else failure = 'bad';
    } else {
      userId = data.user.id;
    }
  } catch {
    // নেটওয়ার্ক বা সার্ভারের সমস্যা — "পাসওয়ার্ড ভুল" বলা ঠিক নয়
    failure = 'server';
  }
  if (failure || !userId) redirect(`/admin/login?e=${failure ?? 'bad'}`);

  // শুধু admins তালিকায় থাকা অ্যাকাউন্ট ভেতরে ঢুকতে পারবে
  const { data: row } = await supabase.from('admins').select('user_id').eq('user_id', userId).maybeSingle();
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
