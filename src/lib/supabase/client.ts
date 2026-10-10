import { createBrowserClient } from '@supabase/ssr';

// ব্রাউজারে ব্যবহারের ক্লায়েন্ট (শুধু Google লগইন শুরু করতে)।
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
