'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin, logActivity } from '@/lib/admin';
import { fromInputDT } from '@/lib/bn';
import { getYears, pickCurrent } from '@/lib/data';

const val = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const nz = (v: string) => (v === '' ? null : v);

function go(path: string, kind: 'ok' | 'err', msg: string): never {
  redirect(`${path}${path.includes('?') ? '&' : '?'}${kind}=${encodeURIComponent(msg)}`);
}

function refresh() {
  revalidatePath('/', 'layout');
}

function coords(f: FormData, back: string): { latitude: number | null; longitude: number | null } {
  const a = val(f, 'latitude');
  const b = val(f, 'longitude');
  if (a === '' && b === '') return { latitude: null, longitude: null };
  const lat = Number(a);
  const lng = Number(b);
  if (a === '' || b === '' || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    go(back, 'err', 'অবস্থান ঠিক নয়। অক্ষাংশ ও দ্রাঘিমাংশ দুটোই সঠিক সংখ্যায় দিন, অথবা দুটোই খালি রাখুন।');
  }
  return { latitude: lat, longitude: lng };
}

/* ---------- জমা দেওয়া তথ্য ---------- */

export async function approveSubmission(formData: FormData): Promise<void> {
  const { supabase, user } = await requireAdmin();
  const id = val(formData, 'id');
  const note = nz(val(formData, 'note'));
  const { data: sub } = await supabase.from('submissions').select('*').eq('id', id).maybeSingle();
  if (!sub) go('/admin/submissions', 'err', 'জমাটি পাওয়া যায়নি।');
  if (sub.status !== 'pending') go('/admin/submissions', 'err', 'এটি আগেই দেখা হয়েছে।');

  let newId: string | null = null;
  if (sub.kind === 'new_mandapa') {
    const year = pickCurrent(await getYears(supabase));
    if (!year) go('/admin/submissions', 'err', 'আগে একটি পূজাবর্ষ তৈরি করুন।');
    const p = sub.payload as Record<string, string>;
    const la = Number(p.latitude);
    const lo = Number(p.longitude);
    const hasPos = !!p.latitude && !!p.longitude && Number.isFinite(la) && Number.isFinite(lo);
    // সময়সূচির তথ্য হারিয়ে না যেতে বিবরণের নিচে জুড়ে দেওয়া হয়; অ্যাডমিন প্রকাশের আগে মিলিয়ে নেবেন
    const extra = [
      p.puja_plan ? `কোন দিন কী পূজা:\n${p.puja_plan}` : '',
      p.anjali_time ? `অঞ্জলির সময়: ${p.anjali_time}` : '',
      p.bisorjon_time ? `বিসর্জনের সময়: ${p.bisorjon_time}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    const description = [p.detail ?? '', extra].filter(Boolean).join('\n\n');
    const { data: created, error } = await supabase
      .from('mandapas')
      .insert({
        year_id: year.id,
        name: p.name,
        area: nz(p.area ?? ''),
        address: nz(p.address ?? ''),
        contact: nz(p.contact ?? ''),
        description: nz(description),
        latitude: hasPos ? la : null,
        longitude: hasPos ? lo : null,
        status: 'draft',
      })
      .select('id')
      .single();
    if (error || !created) go('/admin/submissions', 'err', 'মণ্ডপ তৈরি করা যায়নি।');
    newId = created.id as string;
  }

  await supabase
    .from('submissions')
    .update({ status: 'approved', admin_note: note, reviewed_at: new Date().toISOString() })
    .eq('id', id);
  await logActivity(supabase, user, 'submission.approve', 'submissions', id, { kind: sub.kind, mandapa_id: newId });
  refresh();

  if (newId) go(`/admin/mandapas/${newId}`, 'ok', 'খসড়া মণ্ডপ তৈরি হয়েছে। তথ্য মিলিয়ে অবস্থান বসান ও প্রকাশ করুন।');
  go('/admin/submissions', 'ok', 'অনুমোদিত হয়েছে। প্রয়োজনীয় পরিবর্তন নিজে করে নিন।');
}

export async function rejectSubmission(formData: FormData): Promise<void> {
  const { supabase, user } = await requireAdmin();
  const id = val(formData, 'id');
  const note = nz(val(formData, 'note'));
  await supabase
    .from('submissions')
    .update({ status: 'rejected', admin_note: note, reviewed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pending');
  await logActivity(supabase, user, 'submission.reject', 'submissions', id, { note });
  go('/admin/submissions', 'ok', 'প্রত্যাখ্যান করা হয়েছে।');
}

/* ---------- মণ্ডপ ---------- */

export async function saveMandapa(formData: FormData): Promise<void> {
  const { supabase, user } = await requireAdmin();
  const id = val(formData, 'id');
  const back = id ? `/admin/mandapas/${id}` : '/admin/mandapas/new';

  const name = val(formData, 'name');
  const yearId = val(formData, 'year_id');
  const status = val(formData, 'status');
  if (name.length < 2) go(back, 'err', 'মণ্ডপের নাম লিখুন।');
  if (!yearId) go(back, 'err', 'পূজাবর্ষ বেছে নিন।');
  if (!['draft', 'published', 'archived'].includes(status)) go(back, 'err', 'অবস্থা ঠিক নয়।');

  const row = {
    year_id: yearId,
    name,
    area: nz(val(formData, 'area')),
    address: nz(val(formData, 'address')),
    contact: nz(val(formData, 'contact')),
    description: nz(val(formData, 'description')),
    status,
    ...coords(formData, back),
  };

  if (id) {
    const { error } = await supabase.from('mandapas').update(row).eq('id', id);
    if (error) go(back, 'err', 'সংরক্ষণ করা যায়নি।');
    await logActivity(supabase, user, 'mandapa.update', 'mandapas', id, { name, status });
    refresh();
    go(back, 'ok', 'সংরক্ষণ হয়েছে।');
  }

  const { data, error } = await supabase.from('mandapas').insert(row).select('id').single();
  if (error || !data) go(back, 'err', 'মণ্ডপ যোগ করা যায়নি।');
  await logActivity(supabase, user, 'mandapa.create', 'mandapas', data.id, { name, status });
  refresh();
  go(`/admin/mandapas/${data.id}`, 'ok', 'মণ্ডপ যোগ হয়েছে। এবার সময়সূচি যোগ করতে পারেন।');
}

export async function deleteMandapa(formData: FormData): Promise<void> {
  const { supabase, user } = await requireAdmin();
  const id = val(formData, 'id');
  const back = `/admin/mandapas/${id}`;
  if (val(formData, 'confirm') !== 'yes') go(back, 'err', 'মুছতে নিশ্চিতকরণের ঘরে টিক দিন।');
  const { error } = await supabase.from('mandapas').delete().eq('id', id);
  if (error) go(back, 'err', 'মুছে ফেলা যায়নি।');
  await logActivity(supabase, user, 'mandapa.delete', 'mandapas', id);
  refresh();
  go('/admin/mandapas', 'ok', 'মণ্ডপ স্থায়ীভাবে মুছে ফেলা হয়েছে।');
}

export async function addSchedule(formData: FormData): Promise<void> {
  const { supabase, user } = await requireAdmin();
  const mandapaId = val(formData, 'mandapa_id');
  const back = `/admin/mandapas/${mandapaId}`;
  const title = val(formData, 'title');
  if (title.length < 2) go(back, 'err', 'কর্মসূচির নাম লিখুন।');
  const startsRaw = val(formData, 'starts_at');
  const endsRaw = val(formData, 'ends_at');
  const starts = fromInputDT(startsRaw);
  const ends = fromInputDT(endsRaw);
  if ((startsRaw && !starts) || (endsRaw && !ends)) go(back, 'err', 'সময় ঠিক নয়।');
  if (starts && ends && ends < starts) go(back, 'err', 'শেষের সময় শুরুর আগে হতে পারে না।');

  const { data, error } = await supabase
    .from('schedules')
    .insert({ mandapa_id: mandapaId, title, starts_at: starts, ends_at: ends, details: nz(val(formData, 'details')) })
    .select('id')
    .single();
  if (error || !data) go(back, 'err', 'সময়সূচি যোগ করা যায়নি।');
  await logActivity(supabase, user, 'schedule.create', 'schedules', data.id, { mandapa_id: mandapaId, title });
  refresh();
  go(back, 'ok', 'সময়সূচি যোগ হয়েছে।');
}

export async function deleteSchedule(formData: FormData): Promise<void> {
  const { supabase, user } = await requireAdmin();
  const id = val(formData, 'id');
  const back = `/admin/mandapas/${val(formData, 'mandapa_id')}`;
  const { error } = await supabase.from('schedules').delete().eq('id', id);
  if (error) go(back, 'err', 'মুছে ফেলা যায়নি।');
  await logActivity(supabase, user, 'schedule.delete', 'schedules', id);
  refresh();
  go(back, 'ok', 'সময়সূচি মুছে ফেলা হয়েছে।');
}

/* ---------- পূজাবর্ষ ---------- */

export async function createYear(formData: FormData): Promise<void> {
  const { supabase, user } = await requireAdmin();
  const back = '/admin/years';
  const year = Number(val(formData, 'year'));
  const title = val(formData, 'title');
  if (!Number.isInteger(year) || year < 2000 || year > 2100) go(back, 'err', 'বছর ঠিক নয় (যেমন ২০২৭ লিখুন ইংরেজি সংখ্যায়: 2027)।');
  if (title.length < 2) go(back, 'err', 'শিরোনাম লিখুন।');

  const { data, error } = await supabase
    .from('puja_years')
    .insert({ year, title, status: 'upcoming', starts_on: nz(val(formData, 'starts_on')), ends_on: nz(val(formData, 'ends_on')) })
    .select('id')
    .single();
  if (error || !data) go(back, 'err', 'এই বছর হয়তো আগেই তৈরি আছে।');

  const copyFrom = val(formData, 'copy_from');
  let copied = 0;
  if (copyFrom) {
    const { data: old } = await supabase.from('mandapas').select('*').eq('year_id', copyFrom).in('status', ['published', 'archived']);
    const rows = (old ?? []).map((m: Record<string, unknown>) => ({
      year_id: data.id,
      name: m.name,
      area: m.area,
      address: m.address,
      contact: m.contact,
      description: m.description,
      latitude: m.latitude,
      longitude: m.longitude,
      status: 'draft',
    }));
    if (rows.length) {
      await supabase.from('mandapas').insert(rows);
      copied = rows.length;
    }
  }
  await logActivity(supabase, user, 'year.create', 'puja_years', data.id, { year, copied });
  refresh();
  go(back, 'ok', copied ? `নতুন বছর তৈরি হয়েছে। ${copied}টি মণ্ডপ খসড়া হিসেবে কপি হয়েছে।` : 'নতুন বছর তৈরি হয়েছে।');
}

export async function updateYear(formData: FormData): Promise<void> {
  const { supabase, user } = await requireAdmin();
  const back = '/admin/years';
  const id = val(formData, 'id');
  const status = val(formData, 'status');
  const title = val(formData, 'title');
  if (!['upcoming', 'active', 'archived'].includes(status)) go(back, 'err', 'অবস্থা ঠিক নয়।');
  if (title.length < 2) go(back, 'err', 'শিরোনাম লিখুন।');

  if (status === 'active') {
    // একসঙ্গে একটিই সক্রিয় বছর; আগেরটি আর্কাইভে যায়
    await supabase.from('puja_years').update({ status: 'archived' }).eq('status', 'active').neq('id', id);
  }
  const { error } = await supabase
    .from('puja_years')
    .update({ title, status, starts_on: nz(val(formData, 'starts_on')), ends_on: nz(val(formData, 'ends_on')) })
    .eq('id', id);
  if (error) go(back, 'err', 'সংরক্ষণ করা যায়নি।');
  await logActivity(supabase, user, 'year.update', 'puja_years', id, { status, title });
  refresh();
  go(back, 'ok', 'সংরক্ষণ হয়েছে।');
}

export async function deleteYear(formData: FormData): Promise<void> {
  const { supabase, user } = await requireAdmin();
  const back = '/admin/years';
  const id = val(formData, 'id');
  if (val(formData, 'confirm') !== 'yes') go(back, 'err', 'মুছতে নিশ্চিতকরণের ঘরে টিক দিন।');
  const { error } = await supabase.from('puja_years').delete().eq('id', id);
  if (error) go(back, 'err', 'এই বছরে মণ্ডপ বা সংবাদ আছে, তাই মোছা যায়নি। আর্কাইভে রাখুন।');
  await logActivity(supabase, user, 'year.delete', 'puja_years', id);
  refresh();
  go(back, 'ok', 'বছরটি মুছে ফেলা হয়েছে।');
}

/* ---------- সংবাদ ---------- */

export async function saveNews(formData: FormData): Promise<void> {
  const { supabase, user } = await requireAdmin();
  const back = '/admin/news';
  const id = val(formData, 'id');
  const title = val(formData, 'title');
  const body = val(formData, 'body');
  const status = val(formData, 'status');
  if (title.length < 2 || body.length < 2) go(back, 'err', 'শিরোনাম ও লেখা দিন।');
  if (!['draft', 'published'].includes(status)) go(back, 'err', 'অবস্থা ঠিক নয়।');

  if (id) {
    const { data: old } = await supabase.from('news').select('published_at').eq('id', id).maybeSingle();
    const publishedAt = status === 'published' ? old?.published_at ?? new Date().toISOString() : old?.published_at ?? null;
    const { error } = await supabase.from('news').update({ title, body, status, published_at: publishedAt }).eq('id', id);
    if (error) go(back, 'err', 'সংরক্ষণ করা যায়নি।');
    await logActivity(supabase, user, 'news.update', 'news', id, { title, status });
  } else {
    const { data, error } = await supabase
      .from('news')
      .insert({
        title,
        body,
        status,
        year_id: nz(val(formData, 'year_id')),
        published_at: status === 'published' ? new Date().toISOString() : null,
      })
      .select('id')
      .single();
    if (error || !data) go(back, 'err', 'সংবাদ যোগ করা যায়নি।');
    await logActivity(supabase, user, 'news.create', 'news', data.id, { title, status });
  }
  refresh();
  go(back, 'ok', 'সংরক্ষণ হয়েছে।');
}

export async function deleteNews(formData: FormData): Promise<void> {
  const { supabase, user } = await requireAdmin();
  const id = val(formData, 'id');
  if (val(formData, 'confirm') !== 'yes') go('/admin/news', 'err', 'মুছতে নিশ্চিতকরণের ঘরে টিক দিন।');
  await supabase.from('news').delete().eq('id', id);
  await logActivity(supabase, user, 'news.delete', 'news', id);
  refresh();
  go('/admin/news', 'ok', 'সংবাদ মুছে ফেলা হয়েছে।');
}

/* ---------- নোটিশ ---------- */

export async function saveNotice(formData: FormData): Promise<void> {
  const { supabase, user } = await requireAdmin();
  const back = '/admin/notices';
  const id = val(formData, 'id');
  const title = val(formData, 'title');
  if (title.length < 2) go(back, 'err', 'নোটিশের শিরোনাম দিন।');
  const expRaw = val(formData, 'expires_at');
  const expires = fromInputDT(expRaw);
  if (expRaw && !expires) go(back, 'err', 'মেয়াদের সময় ঠিক নয়।');
  const row = { title, body: nz(val(formData, 'body')), is_active: val(formData, 'is_active') === 'yes', expires_at: expires };

  if (id) {
    const { error } = await supabase.from('notices').update(row).eq('id', id);
    if (error) go(back, 'err', 'সংরক্ষণ করা যায়নি।');
    await logActivity(supabase, user, 'notice.update', 'notices', id, { title });
  } else {
    const { data, error } = await supabase.from('notices').insert(row).select('id').single();
    if (error || !data) go(back, 'err', 'নোটিশ যোগ করা যায়নি।');
    await logActivity(supabase, user, 'notice.create', 'notices', data.id, { title });
  }
  refresh();
  go(back, 'ok', 'সংরক্ষণ হয়েছে।');
}

export async function deleteNotice(formData: FormData): Promise<void> {
  const { supabase, user } = await requireAdmin();
  const id = val(formData, 'id');
  if (val(formData, 'confirm') !== 'yes') go('/admin/notices', 'err', 'মুছতে নিশ্চিতকরণের ঘরে টিক দিন।');
  await supabase.from('notices').delete().eq('id', id);
  await logActivity(supabase, user, 'notice.delete', 'notices', id);
  refresh();
  go('/admin/notices', 'ok', 'নোটিশ মুছে ফেলা হয়েছে।');
}
