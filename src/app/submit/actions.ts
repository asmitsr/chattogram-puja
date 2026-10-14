'use server';

import { redirect } from 'next/navigation';
import { computeChanges } from '@/lib/correction';
import { isValidPlace } from '@/lib/ctgPlaces';
import { createAnonClient } from '@/lib/supabase/anon';

const KINDS = ['new_mandapa', 'correction', 'schedule'];
const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const OK_CORRECTION = 'ধন্যবাদ! আপনার সংশোধনের অনুরোধ জমা হয়েছে। অ্যাডমিন যাচাই করে তথ্য হালনাগাদ করবেন।';
const OK_QUEUED = 'আপনার তথ্য জমা হয়েছে। অ্যাডমিন যাচাই করে অনুমোদন দিলে সাইটে প্রকাশ হবে। ধন্যবাদ।';

function text(f: FormData, k: string, max: number): string {
  return String(f.get(k) ?? '').trim().slice(0, max);
}

function fail(msg: string): never {
  redirect(`/submit?err=${encodeURIComponent(msg)}`);
}

function done(msg: string = OK_QUEUED): never {
  redirect(`/submit?ok=${encodeURIComponent(msg)}`);
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
  const thana = text(formData, 'thana', 60);
  const locality = text(formData, 'locality', 100);
  const address = text(formData, 'address', 300);
  const contact = text(formData, 'contact', 100);
  const detail = text(formData, 'detail', 2000);

  const pujaPlan = text(formData, 'puja_plan', 600);
  const anjali = text(formData, 'anjali_time', 200);
  const bisorjon = text(formData, 'bisorjon_time', 200);

  // অবস্থান: দুটোই দিতে হবে, নয়তো দুটোই খালি। ঠিকানা থেকে অনুমান করা হয় না।
  const latRaw = text(formData, 'latitude', 30).replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
  const lngRaw = text(formData, 'longitude', 30).replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
  let latitude = '';
  let longitude = '';
  if (latRaw !== '' || lngRaw !== '') {
    const la = Number(latRaw);
    const lo = Number(lngRaw);
    if (latRaw === '' || lngRaw === '' || !Number.isFinite(la) || !Number.isFinite(lo)) {
      fail('অবস্থানের অক্ষাংশ ও দ্রাঘিমাংশ দুটোই সঠিক সংখ্যায় দিন, অথবা দুটোই খালি রাখুন।');
    }
    // চট্টগ্রাম ও আশেপাশের মোটামুটি সীমা
    if (la < 21 || la > 23.5 || lo < 90.5 || lo > 92.5) {
      fail('অবস্থানটি চট্টগ্রাম অঞ্চলের বাইরে মনে হচ্ছে। ম্যাপে আবার চাপ দিন।');
    }
    latitude = la.toFixed(6);
    longitude = lo.toFixed(6);
  }

  if (!isValidPlace(thana, locality)) fail('থানা/উপজেলা ও এলাকা তালিকা থেকে বেছে নিন।');
  const area = `${locality.startsWith('তালিকায় নেই') ? 'এলাকা ঠিকানায় লেখা' : locality}, ${thana}, চট্টগ্রাম`;

  if (!KINDS.includes(kind)) fail('তথ্যের ধরন ঠিক নয়।');
  if (name.length < 3) fail('মণ্ডপের নাম লিখুন (কমপক্ষে ৩ অক্ষর)।');

  return { kind, payload: { name, area, thana, locality, address, contact, detail, latitude, longitude, puja_plan: pujaPlan, anjali_time: anjali, bisorjon_time: bisorjon } };
}

// অবস্থান: দুটোই দিতে হবে, নয়তো দুটোই খালি (সংশোধনের ফর্মে ব্যবহৃত)
function readPosition(formData: FormData): { latitude: string; longitude: string } {
  const latRaw = text(formData, 'latitude', 30).replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
  const lngRaw = text(formData, 'longitude', 30).replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
  if (latRaw === '' && lngRaw === '') return { latitude: '', longitude: '' };
  const la = Number(latRaw);
  const lo = Number(lngRaw);
  if (latRaw === '' || lngRaw === '' || !Number.isFinite(la) || !Number.isFinite(lo)) {
    fail('অবস্থানের অক্ষাংশ ও দ্রাঘিমাংশ দুটোই সঠিক সংখ্যায় দিন, অথবা দুটোই খালি রাখুন।');
  }
  if (la < 21 || la > 23.5 || lo < 90.5 || lo > 92.5) fail('অবস্থানটি চট্টগ্রাম অঞ্চলের বাইরে মনে হচ্ছে। ম্যাপে আবার চাপ দিন।');
  return { latitude: la.toFixed(6), longitude: lo.toFixed(6) };
}

// ভুল তথ্যের সংশোধন: কোনো ঘরই বাধ্যতামূলক নয়। মণ্ডপ বেছে নিতে হবে; বর্তমান তথ্যের সঙ্গে মিলিয়ে
// শুধু বদলগুলো অ্যাডমিনের জন্য "অপেক্ষমাণ" অনুরোধ হিসেবে জমা হয়। সাইটের তথ্য নিজে থেকে বদলায় না।
async function submitCorrection(formData: FormData, submitterName: string, phone: string): Promise<void> {
  const mandapaId = text(formData, 'mandapa_id', 60);
  if (!mandapaId) fail('আগে কোন মণ্ডপের তথ্য ঠিক করতে চান সেটি বেছে নিন।');

  const supabase = createAnonClient();
  const { data: orig } = await supabase
    .from('mandapas')
    .select('id,name,area,address,contact,latitude,longitude')
    .eq('id', mandapaId)
    .eq('status', 'published')
    .maybeSingle();
  if (!orig) fail('মণ্ডপটি পাওয়া যায়নি। পাতাটি রিফ্রেশ করে আবার বেছে নিন।');

  // এলাকা: থানা ও এলাকা বাছলে তবেই বদল ধরা হয়
  const thana = text(formData, 'thana', 60);
  const locality = text(formData, 'locality', 100);
  let area = '';
  if (thana || locality) {
    if (!isValidPlace(thana, locality)) fail('থানা/উপজেলা ও এলাকা তালিকা থেকে বেছে নিন, অথবা এলাকা বদলাতে না চাইলে দুটোই ফাঁকা রাখুন।');
    area = `${locality.startsWith('তালিকায় নেই') ? 'এলাকা ঠিকানায় লেখা' : locality}, ${thana}, চট্টগ্রাম`;
  }

  const pos = readPosition(formData);
  const input = {
    name: text(formData, 'name', 150),
    area,
    address: text(formData, 'address', 300),
    contact: text(formData, 'contact', 100),
    latitude: pos.latitude,
    longitude: pos.longitude,
    wrong: text(formData, 'wrong', 600),
    detail: text(formData, 'detail', 600),
    puja_plan: text(formData, 'puja_plan', 400),
    anjali_time: text(formData, 'anjali_time', 100),
    bisorjon_time: text(formData, 'bisorjon_time', 100),
  };
  if (input.name && input.name.length < 3) fail('মণ্ডপের নাম কমপক্ষে ৩ অক্ষরের হতে হবে।');

  const diff = computeChanges(orig, input);
  if (!diff.hasAny) fail('কোনো কিছু পরিবর্তন করা হয়নি। সব তথ্য আগের মতোই আছে।');

  const payload = {
    name: orig.name as string,
    mandapa_id: orig.id as string,
    changes: diff.changes,
    notes: diff.notes,
    // সরাসরি ব্যবহারের জন্য নতুন মানগুলো আলাদাও রাখা হয়
    latitude: pos.latitude,
    longitude: pos.longitude,
  };
  if (Buffer.byteLength(JSON.stringify(payload), 'utf8') > 7000) fail('লেখা অনেক বড় হয়ে গেছে। বর্ণনা একটু ছোট করে আবার জমা দিন।');

  const { error } = await supabase.from('submissions').insert({
    user_id: null,
    kind: 'correction',
    payload,
    submitter_name: submitterName,
    submitter_phone: phone,
  });
  if (error) {
    if (error.code === '42501') fail('এই মুহূর্তে অনেক তথ্য জমা পড়ছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।');
    fail('তথ্য জমা হয়নি। একটু পরে আবার চেষ্টা করুন।');
  }
  done(OK_CORRECTION);
}

// জমা: নাম ও মোবাইল নম্বর দিয়ে, লগইন লাগে না
export async function submitAnonymous(formData: FormData): Promise<void> {
  // লুকানো ফাঁদ-ঘর: মানুষ এটি দেখে না, স্প্যাম বট ভরে ফেলে। ভরা থাকলে চুপচাপ বাদ।
  if (text(formData, 'website', 200) !== '') done();

  // ফর্ম খোলার ৪ সেকেন্ডের মধ্যে জমা দিলে বট ধরে নেওয়া হয়
  const started = Number(formData.get('started'));
  if (!Number.isFinite(started) || Date.now() - started < 4000) {
    fail('ফর্মটি খুব দ্রুত জমা হয়েছে। কয়েক সেকেন্ড অপেক্ষা করে আবার চাপুন।');
  }

  const submitterName = text(formData, 'submitter_name', 100);
  if (submitterName.length < 2) fail('আপনার নাম লিখুন।');
  const phone = normalizePhone(text(formData, 'submitter_phone', 30));
  if (!phone) fail('মোবাইল নম্বর ঠিক নয়। যেমন লিখুন: 01XXXXXXXXX');

  // ভুল সংশোধন আলাদা পথে: অ্যাডমিনের কাছে অনুরোধ হিসেবে জমা হয়, নিজে থেকে কিছু বদলায় না
  if (text(formData, 'kind', 20) === 'correction') return submitCorrection(formData, submitterName, phone);

  const { kind, payload } = readInfo(formData);
  const supabase = createAnonClient();

  // সব জমা 'pending' হিসেবে থাকে; অ্যাডমিন অনুমোদন দিলে তবেই সাইটে প্রকাশ হয়
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
