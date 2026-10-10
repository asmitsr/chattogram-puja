import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// সার্ভারে ব্যবহারের Supabase ক্লায়েন্ট। শুধু anon চাবি ব্যবহার হয়;
// আসল অনুমতি যাচাই করে ডেটাবেসের RLS নিয়ম।
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(list) {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Component থেকে কুকি লেখা যায় না; middleware এটি সামলায়।
          }
        },
      },
    },
  );
}
