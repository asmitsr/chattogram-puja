import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  let next = searchParams.get('next') ?? '/';
  if (!next.startsWith('/') || next.startsWith('//')) next = '/';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  const msg = encodeURIComponent('লগইন সম্পন্ন হয়নি। আবার চেষ্টা করুন।');
  return NextResponse.redirect(`${origin}/login?err=${msg}`);
}
