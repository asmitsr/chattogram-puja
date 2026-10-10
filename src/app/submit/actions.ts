'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const KINDS = ['new_mandapa', 'correction', 'schedule', 'news'];

function text(f: FormData, k: string, max: number): string {
  return String(f.get(k) ?? '').trim().slice(0, max);
}

function fail(msg: string): never {
  redirect(`/submit?err=${encodeURIComponent(msg)}`);
}

export async function submitInfo(formData: FormData): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/submit');

  const kind = text(formData, 'kind', 20);
  const name = text(formData, 'name', 150);
  const area = text(formData, 'area', 100);
  const address = text(formData, 'address', 300);
  const contact = text(formData, 'contact', 100);
  const detail = text(formData, 'detail', 2000);

  if (!KINDS.includes(kind)) fail('তথ্যের ধরন ঠিক নয়।');
  if (name.length < 3) fail('মণ্ডপের নাম লিখুন (কমপক্ষে ৩ অক্ষর)।');
  if (detail.length < 10) fail('বিস্তারিত অন্তত ১০ অক্ষরে লিখুন।');

  // মডারেশনের জন্য জমাদাতার নাম রাখা হয় (শুধু অ্যাডমিন দেখতে পায়)
  const fullName = (user.user_metadata?.full_name as string | undefined) ?? null;
  await supabase.from('profiles').upsert({ id: user.id, display_name: fullName });

  const { error } = await supabase.from('submissions').insert({
    user_id: user.id,
    kind,
    payload: { name, area, address, contact, detail },
  });

  if (error) {
    if (error.code === '42501') fail('আজকের জমার সীমা (১০টি) শেষ হয়েছে। আগামীকাল আবার চেষ্টা করুন।');
    fail('তথ্য জমা হয়নি। একটু পরে আবার চেষ্টা করুন।');
  }

  redirect(`/submit?ok=${encodeURIComponent('আপনার তথ্য জমা হয়েছে। অ্যাডমিনের অনুমোদনের অপেক্ষায় আছে।')}`);
}
