-- ============================================================
-- লগইন ছাড়া তথ্য জমা (নাম ও মোবাইল নম্বর দিয়ে)
-- Supabase → SQL Editor → New query → পুরোটা বসিয়ে Run
--
-- ক্রম: আগে 01_policies.sql, তারপর এটি।
-- ভবিষ্যতে 01_policies.sql আবার চালালে সব নিয়ম মুছে যায়, তাই তখন এই ফাইলটিও আবার চালাবেন।
-- বারবার চালালে ক্ষতি নেই, ডেটা মোছে না।
-- ============================================================

-- ১) জমার টেবিলে লগইন ছাড়া জমার জায়গা
alter table public.submissions alter column user_id drop not null;
alter table public.submissions add column if not exists submitter_name  text;
alter table public.submissions add column if not exists submitter_phone text;

-- ২) লগইন ছাড়া জমার সংখ্যা গোনার ফাংশন
-- (anon ব্যবহারকারী submissions টেবিল পড়তে পারে না, তাই এই ফাংশন দিয়ে শুধু সংখ্যাটি জানা যায়)
create or replace function public.anon_recent_count(p_interval interval)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.submissions
  where user_id is null
    and created_at > now() - p_interval;
$$;

revoke all on function public.anon_recent_count(interval) from public;
grant execute on function public.anon_recent_count(interval) to anon, authenticated;

-- ৩) লগইন ছাড়া জমার নিয়ম
-- সীমা: সব লগইন-ছাড়া জমা মিলিয়ে ঘণ্টায় সর্বোচ্চ ৪০টি, দিনে সর্বোচ্চ ২০০টি।
-- স্প্যামের বন্যা ঠেকাতে এই সীমা। বেশি বা কম চাইলে নিচের ৪০ ও ২০০ বদলান।
drop policy if exists "anon_insert_submission" on public.submissions;

create policy "anon_insert_submission" on public.submissions
  for insert to anon
  with check (
    user_id is null
    and status = 'pending'
    and admin_note is null
    and reviewed_at is null
    and pg_column_size(payload) < 8000
    and char_length(coalesce(submitter_name, '')) between 2 and 100
    and char_length(coalesce(submitter_phone, '')) between 10 and 20
    and public.anon_recent_count(interval '1 hour') < 40
    and public.anon_recent_count(interval '1 day')  < 200
  );

create index if not exists submissions_anon_idx
  on public.submissions (created_at) where user_id is null;

-- যাচাই: নিচের কোয়েরিতে anon_insert_submission নামটি দেখা গেলে নিয়ম বসেছে
select policyname, cmd, roles
from pg_policies
where schemaname = 'public' and tablename = 'submissions'
order by policyname;
