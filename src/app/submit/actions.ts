'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAnonClient } from '@/lib/supabase/anon';

const KINDS = ['new_mandapa', 'correction', 'schedule', 'news'];
const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const OK_MSG = 'আপনার তথ্য জমা হয়েছে। অ্যাডমিন দেখে অনুমোদন দিলে সাইটে প্রকাশ হবে। ধন্যবাদ।';

function text(f: FormData, k: string, max: number): string {
  return String(f.get(k) ?? '').trim().slice(0, max);
}

function fail(msg: string): never {
  redirect(`/submit?err=${encodeURIComponent(msg)}`);
}

function done(): never {
  redirect(`/submit?ok=${encodeURIComponent(OK_MSG)}`);
}

// বাংলা অঙ্ক ও +88 সহ লিখলেও 01XXXXXXXXX রূপে আনে। ঠিক না হলে null।
function normalizePhone(raw: string): string | null {
  let p = raw.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d))).replace(/[\s\-()]/g, '');
  if (p.startsWith('+88')) p = p.slice(3);
  else if (p.startsWith('88') && p.length === 13) p = p.slice(2);
  return /^01[3-9]\d{8}$/.test(p) ? p : null;
}

function readInfo(formData: FormData) {
  const kind = text(formData, 'kind', 20);
  const name = text(formData, 'name', 150);
  const area = text(formData, 'area', 100);
  const address = text(formData, 'address', 300);
  const contact = text(formData, 'contact', 100);
  const detail = text(formData, 'detail', 2000);

  if (!KINDS.includes(kind)) fail('তথ্যের ধরন ঠিক নয়।');
  if (name.length < 3) fail('মণ্ডপের নাম লিখুন (কমপক্ষে ৩ অক্ষর)।');
  if (detail.length < 10) fail('বিস্তারিত অন্তত ১০ অক্ষরে লিখুন।');

  return { kind, payload: { name, area, address, contact, detail } };
}

// Google দিয়ে লগইন করা ব্যবহারকারীর জমা
export async function submitInfo(formData: FormData): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/submit');

  const { kind, payload } = readInfo(formData);

  // মডারেশনের জন্য জমাদাতার নাম রাখা হয় (শুধু অ্যাডমিন দেখতে পায়)
  const fullName = (user.user_metadata?.full_name as string | undefined) ?? null;
  await supabase.from('profiles').upsert({ id: user.id, display_name: fullName });

  const { error } = await supabase.from('submissions').insert({ user_id: user.id, kind, payload });

  if (error) {
    if (error.code === '42501') fail('আজকের জমার সীমা (১০টি) শেষ হয়েছে। আগামীকাল আবার চেষ্টা করুন।');
    fail('তথ্য জমা হয়নি। একটু পরে আবার চেষ্টা করুন।');
  }
  done();
}

// লগইন ছাড়া জমা: নাম ও মোবাইল নম্বর দিয়ে
export async function submitAnonymous(formData: FormData): Promise<void> {
  // লুকানো ফাঁদ-ঘর: মানুষ এটি দেখে না, স্প্যাম বট ভরে ফেলে। ভরা থাকলে চুপচাপ বাদ।
  if (text(formData, 'website', 200) !== '') done();

  // ফর্ম খোলার ৪ সেকেন্ডের মধ্যে জমা দিলে বট ধরে নেওয়া হয়
  const started = Number(formData.get('started'));
  if (!Number.isFinite(started) || Date.now() - started < 4000) {
    fail('ফর্মটি খুব দ্রুত জমা হয়েছে। কয়েক সেকেন্ড অপেক্ষা করে আবার চাপুন।');
  }

  const { kind, payload } = readInfo(formData);

  const submitterName = text(formData, 'submitter_name', 100);
  if (submitterName.length < 2) fail('আপনার নাম লিখুন।');
  const phone = normalizePhone(text(formData, 'submitter_phone', 30));
  if (!phone) fail('মোবাইল নম্বর ঠিক নয়। যেমন লিখুন: 01XXXXXXXXX');

  const supabase = createAnonClient();
  const { error } = await supabase.from('submissions').insert({
    user_id: null,
    kind,
    payload,
    submitter_name: submitterName,
    submitter_phone: phone,
  });

  if (error) {
    if (error.code === '42501') fail('এই মুহূর্তে অনেক তথ্য জমা পড়ছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।');
    fail('তথ্য জমা হয়নি। একটু পরে আবার চেষ্টা করুন।');
  }
  done();
}
