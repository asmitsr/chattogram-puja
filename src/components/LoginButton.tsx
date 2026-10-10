'use client';

import { createClient } from '@/lib/supabase/client';

export default function LoginButton({ next = '/' }: { next?: string }) {
  async function go() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
  }
  return (
    <button type="button" className="btn" onClick={go}>
      Google দিয়ে লগইন করুন
    </button>
  );
}
