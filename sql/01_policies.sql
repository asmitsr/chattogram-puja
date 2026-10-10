-- ============================================================
-- চট্টগ্রামের পুজো: নিরাপত্তা নিয়ম (RLS policies) ও ইনডেক্স
-- Supabase → SQL Editor → New query → পুরোটা বসিয়ে Run
-- আগে টেবিল তৈরির SQL (ধাপ ৩) চালানো থাকতে হবে।
-- এই ফাইলটি বারবার চালালে ক্ষতি নেই; আগের নিয়ম মুছে নতুন করে বসায়। ডেটা মোছে না।
-- ============================================================

-- ১) public স্কিমার সব পুরোনো নিয়ম সরানো (ডেটা মুছবে না)
do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public'
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- ২) অ্যাডমিন কি না যাচাইয়ের ফাংশন
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = (select auth.uid())
  );
$$;

-- ৩) সব টেবিলে RLS চালু (আবার চালালেও ক্ষতি নেই)
alter table public.puja_years   enable row level security;
alter table public.mandapas     enable row level security;
alter table public.schedules    enable row level security;
alter table public.news         enable row level security;
alter table public.notices      enable row level security;
alter table public.submissions  enable row level security;
alter table public.profiles     enable row level security;
alter table public.admins       enable row level security;
alter table public.activity_log enable row level security;

-- ৪) পাবলিক শুধু প্রকাশিত তথ্য পড়তে পারে
create policy "pub_read_years" on public.puja_years
  for select to anon, authenticated using (true);

create policy "pub_read_mandapas" on public.mandapas
  for select to anon, authenticated
  using (status in ('published','archived'));

create policy "pub_read_schedules" on public.schedules
  for select to anon, authenticated
  using (exists (
    select 1 from public.mandapas m
    where m.id = schedules.mandapa_id
      and m.status in ('published','archived')
  ));

create policy "pub_read_news" on public.news
  for select to anon, authenticated
  using (status = 'published');

create policy "pub_read_notices" on public.notices
  for select to anon, authenticated
  using (is_active and (expires_at is null or expires_at > now()));

-- ৫) Google ব্যবহারকারী: শুধু নিজের নামে জমা (দিনে সর্বোচ্চ ১০টি, শুরুতে pending)
create policy "user_read_own_submissions" on public.submissions
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "user_insert_submission" on public.submissions
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending'
    and admin_note is null
    and reviewed_at is null
    and pg_column_size(payload) < 20000
    and (
      select count(*) from public.submissions s
      where s.user_id = (select auth.uid())
        and s.created_at > now() - interval '1 day'
    ) < 10
  );

create policy "user_read_own_profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "user_insert_own_profile" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy "user_update_own_profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- কেউ নিজে অ্যাডমিন কি না দেখতে পারে; admins টেবিলে লেখার অনুমতি কারও নেই
create policy "user_read_own_admin_row" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

-- ৬) অ্যাডমিন: সব কাজ (পড়া, লেখা, বদলানো, মোছা)
create policy "admin_all" on public.puja_years
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_all" on public.mandapas
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_all" on public.schedules
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_all" on public.news
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_all" on public.notices
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_all" on public.submissions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_read_profiles" on public.profiles
  for select to authenticated using (public.is_admin());

-- Activity Log: অ্যাডমিন শুধু দেখতে ও যোগ করতে পারে; বদলানো/মোছা যায় না
create policy "admin_read_log" on public.activity_log
  for select to authenticated using (public.is_admin());
create policy "admin_insert_log" on public.activity_log
  for insert to authenticated
  with check (public.is_admin() and admin_id = (select auth.uid()));

-- ৭) ইনডেক্স (সাইট দ্রুত রাখতে)
create index if not exists mandapas_year_status_idx on public.mandapas (year_id, status);
create index if not exists schedules_mandapa_idx    on public.schedules (mandapa_id, starts_at);
create index if not exists news_status_pub_idx      on public.news (status, published_at desc);
create index if not exists submissions_user_idx     on public.submissions (user_id, created_at desc);
create index if not exists submissions_status_idx   on public.submissions (status, created_at desc);

-- একসঙ্গে একটিই সক্রিয় পূজাবর্ষ
create unique index if not exists one_active_year on public.puja_years ((status)) where status = 'active';
