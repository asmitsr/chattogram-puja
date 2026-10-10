import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

type CookieToSet = { name: string; value: string; options: CookieOptions };

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
        setAll(list: CookieToSet[]) {
          try {
            list.forEach(({ name, value, options }: CookieToSet) => cookieStore.set(name, value, options));
          } catch {
            // Server Component থেকে কুকি লেখা যায় না; middleware এটি সামলায়।
          }
        },
      },
    },
  );
}

// ক্লায়েন্টের টাইপ এক জায়গায়, যাতে অন্য ফাইলে টাইপ না মেলার ঝামেলা না হয়।
export type Sb = ReturnType<typeof createClient>;
