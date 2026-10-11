import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// অ্যাডমিন সব টেবিলের ডেটা একটি JSON ফাইলে নামাতে পারে।
// অনুমতি যাচাই করে ডেটাবেসের RLS; অ্যাডমিন ছাড়া অন্যরা অসম্পূর্ণ/খালি ডেটা পাবে, তাই আগে অ্যাডমিন যাচাই।
const TABLES = ['puja_years', 'mandapas', 'schedules', 'comments', 'notices', 'submissions', 'profiles', 'admins', 'activity_log'];

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse('অনুমতি নেই', { status: 401 });

  const { data: admin } = await supabase.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
  if (!admin) return new NextResponse('অনুমতি নেই', { status: 403 });

  const out: Record<string, unknown> = { exported_at: new Date().toISOString(), tables: {} };
  const tables = out.tables as Record<string, unknown>;
  for (const t of TABLES) {
    const { data, error } = await supabase.from(t).select('*').limit(50000);
    tables[t] = error ? { error: error.message } : data;
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(out, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="chattogram-puja-backup-${stamp}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}
