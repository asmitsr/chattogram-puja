'use server';

import { revalidatePath } from 'next/cache';
import { createAnonClient } from '@/lib/supabase/anon';
import { getAdminContext, logActivity } from '@/lib/admin';

export interface CommentInput {
  mandapaId: string | null;
  parentId: string | null;
  name: string;
  anonymous: boolean;
  body: string;
  website: string; // স্প্যাম বটের ফাঁদ-ঘর, ফাঁকা থাকতে হবে
  started: number; // ফর্ম খোলার সময় (ms)
  imagePath?: string | null; // আপলোড করা ছবির নাম (ঐচ্ছিক)
}

const IMG_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// মন্তব্য বা রিপ্লাই জমা: লগইন লাগে না। ডেটাবেসের add_comment ফাংশন সীমা ও যাচাই করে।
export async function postComment(input: CommentInput): Promise<{ ok: boolean; error?: string }> {
  // রিপ্লাই শুধু অ্যাডমিন দিতে পারেন (adminReply)। সাধারণ ব্যবহারকারী শুধু নতুন মন্তব্য করতে পারেন।
  if (input.parentId) return { ok: false, error: 'রিপ্লাই শুধু অ্যাডমিন দিতে পারেন।' };

  // বট ধরা: ফাঁদ-ঘর ভরা থাকলে চুপচাপ সফল দেখানো, কিছু সেভ হয় না
  if (String(input.website ?? '').trim() !== '') return { ok: true };

  const started = Number(input.started);
  if (!Number.isFinite(started) || Date.now() - started < 2500) {
    return { ok: false, error: 'একটু অপেক্ষা করে আবার চাপুন।' };
  }
  if ((input.mandapaId !== null && !UUID.test(input.mandapaId)) || (input.parentId !== null && !UUID.test(input.parentId))) {
    return { ok: false, error: 'অনুরোধটি ঠিক নয়।' };
  }

  const anonymous = Boolean(input.anonymous);
  const name = String(input.name ?? '').trim().slice(0, 60);
  const body = String(input.body ?? '').trim().slice(0, 1000);
  if (!anonymous && name.length < 2) return { ok: false, error: 'আপনার নাম লিখুন, অথবা "নাম হাইড করে কমেন্ট করুন" বেছে নিন।' };
  if (body.length < 2) return { ok: false, error: 'মন্তব্য লিখুন।' };

  const image = input.imagePath ? String(input.imagePath) : null;
  if (image !== null && !IMG_NAME.test(image)) return { ok: false, error: 'ছবিটি ঠিক নয়। আবার বেছে নিন।' };

  const supabase = createAnonClient();
  const args = {
    p_mandapa: input.mandapaId,
    p_parent: input.parentId,
    p_name: name,
    p_body: body,
    p_anonymous: anonymous,
  };
  // ছবি থাকলে নতুন ফাংশন (sql/14), না থাকলে আগের ফাংশন — তাই sql/14 চালানোর আগেও লেখা-মন্তব্য চলে
  const { error } = image ? await supabase.rpc('add_comment', { ...args, p_image: image }) : await supabase.rpc('add_comment', args);
  if (error) {
    if (error.message.includes('limit')) return { ok: false, error: 'এই মুহূর্তে অনেক মন্তব্য জমা পড়ছে। কিছুক্ষণ পরে চেষ্টা করুন।' };
    if (error.message.includes('duplicate')) return { ok: false, error: 'এই মন্তব্যটি একটু আগেই দেওয়া হয়েছে।' };
    return { ok: false, error: 'মন্তব্য জমা হয়নি। একটু পরে আবার চেষ্টা করুন।' };
  }
  return { ok: true };
}

// কমেন্টের ছবি আপলোড: ব্রাউজারে ছোট করা JPEG আসে; এখানে ধরন ও আকার আবার যাচাই করে Storage-এ রাখা হয়
export async function uploadCommentPhoto(fd: FormData): Promise<{ ok: boolean; path?: string; error?: string }> {
  const f = fd.get('photo');
  if (!f || typeof f === 'string' || f.size === 0) return { ok: false, error: 'ছবি পাওয়া যায়নি।' };
  if (f.size > 1_900_000) return { ok: false, error: 'ছবিটি অনেক বড়। ছোট ছবি বেছে নিন।' };
  const buf = new Uint8Array(await f.arrayBuffer());
  const isJpeg = buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (!isJpeg) return { ok: false, error: 'শুধু ছবি (JPG/PNG/WebP) দেওয়া যাবে।' };
  const path = `${crypto.randomUUID()}.jpg`;
  const supabase = createAnonClient();
  const { error } = await supabase.storage.from('comment-photos').upload(path, buf, { contentType: 'image/jpeg', upsert: false });
  if (error) return { ok: false, error: 'ছবি আপলোড হয়নি। অ্যাডমিনকে জানান (sql/14 চালানো হয়েছে কি?)।' };
  return { ok: true, path };
}

// লাইক চালু/বন্ধ। voter = ব্রাউজারে সংরক্ষিত এলোমেলো পরিচয় (লগইন লাগে না)
export async function toggleLike(commentId: string, voter: string): Promise<{ ok: boolean; count?: number }> {
  if (!UUID.test(commentId) || !/^[A-Za-z0-9-]{16,64}$/.test(voter)) return { ok: false };
  const supabase = createAnonClient();
  const { data, error } = await supabase.rpc('toggle_comment_like', { p_comment: commentId, p_voter: voter });
  if (error || typeof data !== 'number') return { ok: false };
  return { ok: true, count: data };
}

// ---------- শুধু অ্যাডমিনের কাজ ----------
// আসল সুরক্ষা ডেটাবেসের RLS (is_admin)। এখানকার যাচাই সুবিধার জন্য।

export async function adminReply(parentId: string, bodyRaw: string): Promise<{ ok: boolean; error?: string }> {
  if (!UUID.test(parentId)) return { ok: false, error: 'অনুরোধটি ঠিক নয়।' };
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false, error: 'শুধু অ্যাডমিন রিপ্লাই দিতে পারেন। আগে অ্যাডমিন হিসেবে লগইন করুন।' };
  const body = String(bodyRaw ?? '').trim().slice(0, 1000);
  if (body.length < 2) return { ok: false, error: 'রিপ্লাই লিখুন।' };

  const { supabase, user } = ctx;
  const { data: parent } = await supabase.from('comments').select('id,mandapa_id,parent_id').eq('id', parentId).maybeSingle();
  if (!parent) return { ok: false, error: 'মূল মন্তব্য পাওয়া যায়নি।' };
  // রিপ্লাই সবসময় মূল মন্তব্যের নিচে বসে
  const rootId = parent.parent_id ?? parent.id;
  const { data, error } = await supabase
    .from('comments')
    .insert({ mandapa_id: parent.mandapa_id, parent_id: rootId, author_name: 'অ্যাডমিন', body, by_admin: true })
    .select('id')
    .single();
  if (error || !data) return { ok: false, error: 'রিপ্লাই দেওয়া যায়নি।' };
  await logActivity(supabase, user, 'comment.reply', 'comments', data.id, { parent_id: rootId });
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function adminDeleteComment(commentId: string): Promise<{ ok: boolean; error?: string }> {
  if (!UUID.test(commentId)) return { ok: false, error: 'অনুরোধটি ঠিক নয়।' };
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false, error: 'শুধু অ্যাডমিন মন্তব্য মুছতে পারেন।' };
  const { supabase, user } = ctx;
  const { data: old } = await supabase.from('comments').select('image_path').eq('id', commentId).maybeSingle();
  const { error } = await supabase.from('comments').delete().eq('id', commentId);
  if (error) return { ok: false, error: 'মন্তব্য মোছা যায়নি।' };
  if (old?.image_path) await supabase.storage.from('comment-photos').remove([old.image_path]);
  await logActivity(supabase, user, 'comment.delete', 'comments', commentId);
  revalidatePath('/', 'layout');
  return { ok: true };
}
