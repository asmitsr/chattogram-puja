-- ============================================================
-- v20: (ক) সংবাদ সুবিধা সম্পূর্ণ বাদ  (খ) মণ্ডপের মন্তব্য, রিপ্লাই ও লাইক
-- Supabase → SQL Editor → New query → পুরোটা বসিয়ে Run
--
-- ক্রম: 01, 02, 04, 07 আগে চালানো থাকতে হবে। বারবার চালালে ক্ষতি নেই।
-- সতর্কতা: এটি "news" টেবিলটি স্থায়ীভাবে মুছে ফেলে। (সংবাদ সুবিধা আর নেই।)
-- ভবিষ্যতে 01_policies.sql আবার চালালে সব নিয়ম মুছে যায়, তখন এই ফাইলটিও আবার চালাবেন।
-- ============================================================

-- ক) সংবাদ বাদ
-- অপেক্ষমাণ "সংবাদ" ধরনের জমা থাকলে সেগুলো প্রত্যাখ্যাত হিসেবে বন্ধ করা (মোছা হয় না)
update public.submissions
   set status = 'rejected', admin_note = 'সংবাদ সুবিধা বন্ধ', reviewed_at = now()
 where kind = 'news' and status = 'pending';

drop function if exists public.auto_publish(text, text, text, text, text, text, numeric, numeric, text, text, jsonb);
drop table if exists public.news cascade;

-- খ) মন্তব্যের টেবিল
create table if not exists public.comments (
  id           uuid primary key default gen_random_uuid(),
  mandapa_id   uuid not null references public.mandapas(id) on delete cascade,
  parent_id    uuid references public.comments(id) on delete cascade,
  author_name  text not null,
  body         text not null,
  is_anonymous boolean not null default false,
  by_admin     boolean not null default false,
  like_count   integer not null default 0,
  created_at   timestamptz not null default now(),
  constraint comments_name_len check (char_length(author_name) between 2 and 60),
  constraint comments_body_len check (char_length(body) between 2 and 1000)
);

create index if not exists comments_mandapa_idx on public.comments (mandapa_id, created_at);
create index if not exists comments_parent_idx  on public.comments (parent_id);
create index if not exists comments_recent_idx  on public.comments (created_at desc);

-- লাইক: একই ব্রাউজার (voter) এক মন্তব্যে একবারই লাইক দিতে পারে
create table if not exists public.comment_likes (
  comment_id uuid not null references public.comments(id) on delete cascade,
  voter      text not null,
  created_at timestamptz not null default now(),
  primary key (comment_id, voter),
  constraint comment_likes_voter_len check (char_length(voter) between 16 and 64)
);

alter table public.comments      enable row level security;
alter table public.comment_likes enable row level security;

-- পাবলিক শুধু প্রকাশিত/আর্কাইভ মণ্ডপের মন্তব্য পড়তে পারে। সরাসরি লেখা বা মোছা যায় না।
drop policy if exists "pub_read_comments" on public.comments;
create policy "pub_read_comments" on public.comments
  for select to anon, authenticated
  using (exists (
    select 1 from public.mandapas m
    where m.id = comments.mandapa_id and m.status in ('published','archived')
  ));

-- অ্যাডমিন: সব কাজ (দেখা, রিপ্লাই, মোছা)
drop policy if exists "admin_all" on public.comments;
create policy "admin_all" on public.comments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_all" on public.comment_likes;
create policy "admin_all" on public.comment_likes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- গ) মন্তব্য যোগ করার ফাংশন (সীমা ও যাচাইসহ)
-- সীমা: সব মিলিয়ে ঘণ্টায় ২০০টি, এক মণ্ডপে ঘণ্টায় ৬০টি। বদলাতে নিচের সংখ্যা বদলান।
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

  if not exists (select 1 from public.mandapas where id = p_mandapa and status in ('published','archived')) then
    raise exception 'no mandapa' using errcode = 'P0002';
  end if;

  -- রিপ্লাই হলে: মূল মন্তব্য একই মণ্ডপের ও সরাসরি মন্তব্য (রিপ্লাইয়ের রিপ্লাই নয়) হতে হবে
  if p_parent is not null and not exists (
    select 1 from public.comments where id = p_parent and mandapa_id = p_mandapa and parent_id is null
  ) then
    raise exception 'bad parent' using errcode = '22023';
  end if;

  if (select count(*) from public.comments where created_at > now() - interval '1 hour') >= 200
     or (select count(*) from public.comments where mandapa_id = p_mandapa and created_at > now() - interval '1 hour') >= 60 then
    raise exception 'limit reached' using errcode = 'P0001';
  end if;

  -- একই লেখা ১০ মিনিটের মধ্যে একই মণ্ডপে বারবার দিলে বাদ
  if exists (
    select 1 from public.comments
    where mandapa_id = p_mandapa and body = btrim(p_body) and created_at > now() - interval '10 minutes'
  ) then
    raise exception 'duplicate' using errcode = 'P0001';
  end if;

  insert into public.comments (mandapa_id, parent_id, author_name, body, is_anonymous, by_admin)
  values (p_mandapa, p_parent, v_name, btrim(p_body), coalesce(p_anonymous, false), false)
  returning id into v_id;

  return v_id;
end;
$$;

-- ঘ) লাইক চালু/বন্ধ (আবার চাপলে লাইক উঠে যায়); নতুন সংখ্যা ফেরত দেয়
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
    join public.mandapas m on m.id = c.mandapa_id
    where c.id = p_comment and m.status in ('published','archived')
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

-- যাচাই: news টেবিল নেই (false), comments টেবিল আছে (true), ফাংশন দুটি আছে (২)
select
  exists (select 1 from information_schema.tables where table_schema='public' and table_name='news')     as news_table_exists,
  exists (select 1 from information_schema.tables where table_schema='public' and table_name='comments') as comments_table_exists,
  (select count(*) from pg_proc where pronamespace='public'::regnamespace and proname in ('add_comment','toggle_comment_like')) as functions_count;
