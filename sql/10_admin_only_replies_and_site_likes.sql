-- ============================================================
-- v29: (ক) রিপ্লাই শুধু অ্যাডমিন দিতে পারবেন (ডেটাবেস পর্যায়েও বন্ধ)
--      (খ) পুরো ওয়েবসাইটকে লাইক/লাভ দেওয়ার সুবিধা
-- Supabase → SQL Editor → New query → পুরোটা বসিয়ে Run
--
-- ক্রম: 01, 02, 04, 07, 08, 09 আগে চালানো থাকতে হবে। বারবার চালালে ক্ষতি নেই।
-- কোনো মন্তব্য বা ডেটা মোছে না। আগে দেওয়া সাধারণ ব্যবহারকারীর রিপ্লাই থাকলে সেগুলো যেমন আছে তেমনই থাকবে।
-- 01_policies.sql আবার চালালে এই ফাইলও আবার চালাবেন।
-- ============================================================

-- ক) সাধারণ ব্যবহারকারী (anon) আর রিপ্লাই দিতে পারবে না: p_parent দিলেই বাতিল।
--    অ্যাডমিন লগইন অবস্থায় সরাসরি comments টেবিলে (admin_all নিয়মে) রিপ্লাই দেন।
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
  if p_parent is not null then
    raise exception 'replies are admin only' using errcode = '42501';
  end if;

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
  values (p_mandapa, null, v_name, btrim(p_body), coalesce(p_anonymous, false), false)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.add_comment(uuid, uuid, text, text, boolean) from public;
grant execute on function public.add_comment(uuid, uuid, text, text, boolean) to anon, authenticated;

-- খ) ওয়েবসাইট লাইক: এক ব্রাউজার (voter) একবারই লাইক দিতে পারে
create table if not exists public.site_likes (
  voter      text primary key,
  created_at timestamptz not null default now(),
  constraint site_likes_voter_len check (char_length(voter) between 16 and 64)
);

alter table public.site_likes enable row level security;

-- সরাসরি টেবিল পড়া/লেখা বন্ধ (নিচের ফাংশন দিয়েই হয়); শুধু অ্যাডমিন সব দেখতে পারে
drop policy if exists "admin_all" on public.site_likes;
create policy "admin_all" on public.site_likes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- মোট লাইক ও এই ব্রাউজার লাইক দিয়েছে কি না
create or replace function public.site_like_state(p_voter text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return jsonb_build_object(
    'count', (select count(*) from public.site_likes),
    'liked', case
      when char_length(coalesce(p_voter, '')) between 16 and 64
        then exists (select 1 from public.site_likes where voter = p_voter)
      else false
    end
  );
end;
$$;

-- লাইক দেওয়া (p_like = true) বা তুলে নেওয়া (false)। বারবার চাপলেও একটির বেশি গোনা হয় না।
-- সীমা: সব মিলিয়ে ঘণ্টায় ৫০০টি নতুন লাইক। বদলাতে নিচের সংখ্যা বদলান।
create or replace function public.set_site_like(p_voter text, p_like boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if char_length(coalesce(p_voter, '')) not between 16 and 64 then
    raise exception 'invalid voter' using errcode = '22023';
  end if;

  if coalesce(p_like, false) then
    if not exists (select 1 from public.site_likes where voter = p_voter)
       and (select count(*) from public.site_likes where created_at > now() - interval '1 hour') >= 500 then
      raise exception 'limit reached' using errcode = 'P0001';
    end if;
    insert into public.site_likes (voter) values (p_voter) on conflict do nothing;
  else
    delete from public.site_likes where voter = p_voter;
  end if;

  return public.site_like_state(p_voter);
end;
$$;

revoke all on function public.site_like_state(text) from public;
revoke all on function public.set_site_like(text, boolean) from public;
grant execute on function public.site_like_state(text) to anon, authenticated;
grant execute on function public.set_site_like(text, boolean) to anon, authenticated;

-- যাচাই: তিনটিই true আসবে
select
  exists (select 1 from information_schema.tables where table_schema='public' and table_name='site_likes') as site_likes_table_ok,
  (select count(*) from pg_proc where pronamespace='public'::regnamespace and proname in ('site_like_state','set_site_like')) = 2 as like_functions_ok,
  position('admin only' in pg_get_functiondef('public.add_comment(uuid,uuid,text,text,boolean)'::regprocedure)) > 0 as replies_admin_only_ok;
