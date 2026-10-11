-- ============================================================
-- v21: (ক) ভুল সংশোধনের ফর্ম জমা দিলে অ্যাডমিন অনুমোদন ছাড়াই মণ্ডপের তথ্য সঙ্গে সঙ্গে হালনাগাদ
--      (খ) ম্যাপ পাতার নিচে সাধারণ মতামত/কমেন্ট (নির্দিষ্ট মণ্ডপ ছাড়া)
-- Supabase → SQL Editor → New query → পুরোটা বসিয়ে Run
--
-- ক্রম: 01, 02, 04, 07, 08 আগে চালানো থাকতে হবে। বারবার চালালে ক্ষতি নেই।
-- 01_policies.sql আবার চালালে এই ফাইলও আবার চালাবেন।
-- ============================================================

-- ক) সংশোধন: প্রকাশিত মণ্ডপের নাম মিললে সরাসরি হালনাগাদ। একটি মাত্র মণ্ডপ না মিললে null ফেরত দেয়
--    (তখন কোড জমাটি আগের মতো 'pending' রাখে, অ্যাডমিন দেখে নেবে)।
-- সীমা: সব স্বয়ংক্রিয় সংশোধন মিলিয়ে ঘণ্টায় ৬০টি, দিনে ৩০০টি; এক মণ্ডপে দিনে সর্বোচ্চ ৮টি।
-- হালনাগাদের আগের তথ্য জমার payload-এর "before" অংশে রাখা হয়, তাই ভুল সংশোধন হলে ফিরিয়ে আনা যায়।
create or replace function public.apply_correction(
  p_name            text,
  p_thana           text,
  p_area            text,
  p_address         text,
  p_contact         text,
  p_description     text,
  p_lat             numeric,
  p_lng             numeric,
  p_submitter_name  text,
  p_submitter_phone text,
  p_payload         jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ids  uuid[];
  v_id   uuid;
  v_old  public.mandapas%rowtype;
begin
  if char_length(coalesce(p_name, '')) not between 3 and 150
     or char_length(coalesce(p_description, '')) > 3000
     or char_length(coalesce(p_area, '')) > 200
     or char_length(coalesce(p_address, '')) > 300
     or char_length(coalesce(p_contact, '')) > 100
     or char_length(coalesce(p_submitter_name, '')) not between 2 and 100
     or char_length(coalesce(p_submitter_phone, '')) not between 10 and 20
     or pg_column_size(p_payload) >= 8000 then
    raise exception 'invalid input' using errcode = '22023';
  end if;
  if (p_lat is null) <> (p_lng is null) then
    raise exception 'invalid position' using errcode = '22023';
  end if;
  if p_lat is not null and (p_lat not between 21 and 23.5 or p_lng not between 90.5 and 92.5) then
    raise exception 'invalid position' using errcode = '22023';
  end if;

  if (select count(*) from public.submissions
      where admin_note = 'স্বয়ংক্রিয় সংশোধন' and created_at > now() - interval '1 hour') >= 60
     or (select count(*) from public.submissions
      where admin_note = 'স্বয়ংক্রিয় সংশোধন' and created_at > now() - interval '1 day') >= 300 then
    raise exception 'limit reached' using errcode = 'P0001';
  end if;

  -- একই নামের প্রকাশিত মণ্ডপ খোঁজা
  select array_agg(id) into v_ids
  from public.mandapas
  where status = 'published'
    and lower(btrim(name)) = lower(btrim(p_name));

  -- একাধিক মিললে থানা দিয়ে ছাঁটা
  if coalesce(array_length(v_ids, 1), 0) > 1 and coalesce(p_thana, '') <> '' then
    select array_agg(id) into v_ids
    from public.mandapas
    where id = any (v_ids) and coalesce(area, '') like '%' || p_thana || '%';
  end if;

  if coalesce(array_length(v_ids, 1), 0) <> 1 then
    return null;
  end if;
  v_id := v_ids[1];

  if (select count(*) from public.submissions
      where admin_note = 'স্বয়ংক্রিয় সংশোধন'
        and payload ->> 'record_id' = v_id::text
        and created_at > now() - interval '1 day') >= 8 then
    raise exception 'limit reached' using errcode = 'P0001';
  end if;

  select * into v_old from public.mandapas where id = v_id;

  update public.mandapas set
    area        = coalesce(nullif(p_area, ''), area),
    address     = coalesce(nullif(p_address, ''), address),
    contact     = coalesce(nullif(p_contact, ''), contact),
    description = coalesce(nullif(p_description, ''), description),
    latitude    = coalesce(p_lat, latitude),
    longitude   = coalesce(p_lng, longitude)
  where id = v_id;

  insert into public.submissions (user_id, kind, payload, status, admin_note, reviewed_at, submitter_name, submitter_phone)
  values (
    null, 'correction',
    p_payload || jsonb_build_object(
      'record_id', v_id,
      'before', jsonb_build_object(
        'area', v_old.area, 'address', v_old.address, 'contact', v_old.contact,
        'description', v_old.description, 'latitude', v_old.latitude, 'longitude', v_old.longitude
      )
    ),
    'approved', 'স্বয়ংক্রিয় সংশোধন', now(), p_submitter_name, p_submitter_phone
  );

  return v_id;
end;
$$;

revoke all on function public.apply_correction(text, text, text, text, text, text, numeric, numeric, text, text, jsonb) from public;
grant execute on function public.apply_correction(text, text, text, text, text, text, numeric, numeric, text, text, jsonb) to anon, authenticated;

-- খ) সাধারণ মতামত: মণ্ডপ ছাড়া (ম্যাপ পাতার নিচের) মন্তব্য
alter table public.comments alter column mandapa_id drop not null;

drop policy if exists "pub_read_comments" on public.comments;
create policy "pub_read_comments" on public.comments
  for select to anon, authenticated
  using (
    mandapa_id is null
    or exists (
      select 1 from public.mandapas m
      where m.id = comments.mandapa_id and m.status in ('published','archived')
    )
  );

create or replace function public.add_comment(
  p_mandapa   uuid,
  p_parent    uuid,
  p_name      text,
  p_body      text,
  p_anonymous boolean
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
  v_name := case when p_anonymous then 'অজ্ঞাতনামা ব্যবহারকারী' else btrim(coalesce(p_name, '')) end;

  if char_length(v_name) not between 2 and 60
     or char_length(btrim(coalesce(p_body, ''))) not between 2 and 1000 then
    raise exception 'invalid input' using errcode = '22023';
  end if;

  -- p_mandapa null = ম্যাপ পাতার সাধারণ মতামত
  if p_mandapa is not null and not exists (
    select 1 from public.mandapas where id = p_mandapa and status in ('published','archived')
  ) then
    raise exception 'no mandapa' using errcode = 'P0002';
  end if;

  if p_parent is not null and not exists (
    select 1 from public.comments
    where id = p_parent and mandapa_id is not distinct from p_mandapa and parent_id is null
  ) then
    raise exception 'bad parent' using errcode = '22023';
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

  insert into public.comments (mandapa_id, parent_id, author_name, body, is_anonymous, by_admin)
  values (p_mandapa, p_parent, v_name, btrim(p_body), coalesce(p_anonymous, false), false)
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.toggle_comment_like(p_comment uuid, p_voter text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if char_length(coalesce(p_voter, '')) not between 16 and 64 then
    raise exception 'invalid voter' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.comments c
    left join public.mandapas m on m.id = c.mandapa_id
    where c.id = p_comment
      and (c.mandapa_id is null or m.status in ('published','archived'))
  ) then
    raise exception 'no comment' using errcode = 'P0002';
  end if;

  if exists (select 1 from public.comment_likes where comment_id = p_comment and voter = p_voter) then
    delete from public.comment_likes where comment_id = p_comment and voter = p_voter;
    update public.comments set like_count = greatest(like_count - 1, 0) where id = p_comment
      returning like_count into v_count;
  else
    insert into public.comment_likes (comment_id, voter) values (p_comment, p_voter);
    update public.comments set like_count = like_count + 1 where id = p_comment
      returning like_count into v_count;
  end if;
  return v_count;
end;
$$;

revoke all on function public.add_comment(uuid, uuid, text, text, boolean) from public;
revoke all on function public.toggle_comment_like(uuid, text) from public;
grant execute on function public.add_comment(uuid, uuid, text, text, boolean) to anon, authenticated;
grant execute on function public.toggle_comment_like(uuid, text) to anon, authenticated;

-- যাচাই: দুটি সারিতেই true আসবে
select
  exists (select 1 from pg_proc where pronamespace='public'::regnamespace and proname='apply_correction') as correction_fn_ok,
  (select is_nullable = 'YES' from information_schema.columns
    where table_schema='public' and table_name='comments' and column_name='mandapa_id') as general_comments_ok;
