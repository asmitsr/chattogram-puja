import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// লগইন-ছাড়া ক্লায়েন্ট: কোনো কুকি বা সেশন নেই, তাই ডেটাবেসে সবসময় "anon" ভূমিকায় যায়।
// লগইন ছাড়া জমার নিয়ম (RLS) শুধু এই ভূমিকাকেই অনুমতি দেয়।
export function createAnonClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  );
}
