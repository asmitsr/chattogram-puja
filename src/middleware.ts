import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type CookieToSet = { name: string; value: string; options: CookieOptions };

// লগইন সেশনের কুকি নবায়ন (রিফ্রেশ)। সাধারণ দর্শকের জন্য এটি কিছুই করে না, তাই পাতা বদলাতে দেরি হয় না।
export async function middleware(request: NextRequest) {
  // লিংকের আগাম-লোড (prefetch)-এ সেশন যাচাই লাগে না
  if (request.headers.get('next-router-prefetch') || request.headers.get('purpose') === 'prefetch') {
    return NextResponse.next();
  }

  // লগইন-কুকি না থাকলে (সাধারণ দর্শক) নবায়নের কিছু নেই
  const hasAuthCookie = request.cookies.getAll().some((c) => c.name.startsWith('sb-') && c.name.includes('auth-token'));
  if (!hasAuthCookie) return NextResponse.next();

  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(list: CookieToSet[]) {
        list.forEach(({ name, value }: CookieToSet) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }: CookieToSet) => response.cookies.set(name, value, options));
      },
    },
  });

  // getSession শুধু মেয়াদ ফুরানোর কাছাকাছি হলে নেটওয়ার্কে যায় (getUser প্রতিবার যেত)।
  // অনুমতির আসল যাচাই অ্যাডমিন পাতা/অ্যাকশনে getUser দিয়েই হয়।
  await supabase.auth.getSession();
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4)$).*)'],
};
