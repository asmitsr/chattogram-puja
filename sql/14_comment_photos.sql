-- ============================================================
-- কমেন্টে ছবি যুক্ত করা (ঐচ্ছিক)
-- Supabase → SQL Editor-এ পুরোটা কপি করে একবার Run করুন। বারবার চালালেও সমস্যা নেই।
-- ============================================================

-- ১) কমেন্টে ছবির নাম রাখার ঘর
alter table public.comments add column if not exists image_path text;
alter table public.comments drop constraint if exists comments_image_path_fmt;
alter table public.comments add constraint comments_image_path_fmt
  check (image_path is null or image_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$');

-- ২) ছবি রাখার পাবলিক বাকেট (সর্বোচ্চ ২ MB, শুধু JPEG)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('comment-photos', 'comment-photos', true, 2097152, array['image/jpeg'])
on conflict (id) do update
  set public = true, file_size_limit = 2097152, allowed_mime_types = array['image/jpeg'];

-- ৩) সবাই (লগইন ছাড়া) ছবি আপলোড করতে পারবে, কিন্তু শুধু এই বাকেটে ও নির্দিষ্ট নামে; মুছতে পারবেন শুধু অ্যাডমিন
drop policy if exists "comment_photos_insert" on storage.objects;
create policy "comment_photos_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'comment-photos' and name ~ '^[0-9a-f-]{36}\.jpg$');

drop policy if exists "comment_photos_admin_delete" on storage.objects;
create policy "comment_photos_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'comment-photos' and public.is_admin());

-- ৪) ছবিসহ মন্তব্য জমার ফাংশন (আগের ফাংশন যেমন ছিল তেমনই থাকে)
create or replace function public.add_comment(
  p_mandapa   uuid,
  p_parent    uuid,
  p_name      text,
  p_body      text,
  p_anonymous boolean,
  p_image     text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_id   uuid;
begin
  if p_parent is not null then
    raise exception 'replies are admin only' using errcode = '42501';
  end if;

  v_name := case when p_anonymous then 'অজ্ঞাতনামা ব্যবহারকারী' else btrim(coalesce(p_name, '')) end;

  if char_length(v_name) not between 2 and 60
     or char_length(btrim(coalesce(p_body, ''))) not between 2 and 1000 then
    raise exception 'invalid input' using errcode = '22023';
  end if;

  if p_image is not null and p_image !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$' then
    raise exception 'invalid image' using errcode = '22023';
  end if;

  if p_mandapa is not null and not exists (
    select 1 from public.mandapas where id = p_mandapa and status in ('published','archived')
  ) then
    raise exception 'no mandapa' using errcode = 'P0002';
  end if;

  if (select count(*) from public.comments where created_at > now() - interval '1 hour') >= 200
     or (select count(*) from public.comments
         where mandapa_id is not distinct from p_mandapa and created_at > now() - interval '1 hour') >= 60 then
    raise exception 'limit reached' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.comments
    where mandapa_id is not distinct from p_mandapa and body = btrim(p_body) and created_at > now() - interval '10 minutes'
  ) then
    raise exception 'duplicate' using errcode = 'P0001';
  end if;

  insert into public.comments (mandapa_id, parent_id, author_name, body, is_anonymous, by_admin, image_path)
  values (p_mandapa, null, v_name, btrim(p_body), coalesce(p_anonymous, false), false, p_image)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.add_comment(uuid, uuid, text, text, boolean, text) from public;
grant execute on function public.add_comment(uuid, uuid, text, text, boolean, text) to anon, authenticated;

-- যাচাই: তিনটিই true হলে ঠিক আছে
select
  exists (select 1 from information_schema.columns where table_schema='public' and table_name='comments' and column_name='image_path') as column_ok,
  exists (select 1 from storage.buckets where id='comment-photos') as bucket_ok,
  exists (select 1 from pg_proc where pronamespace='public'::regnamespace and proname='add_comment' and pronargs=6) as function_ok;
