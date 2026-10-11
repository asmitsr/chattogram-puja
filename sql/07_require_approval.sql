-- ============================================================
-- v19: সব জমা আগে "অপেক্ষমাণ (pending)" থাকবে, অ্যাডমিন অনুমোদন দিলে তবেই সাইটে প্রকাশ হবে
-- Supabase → SQL Editor → New query → পুরোটা বসিয়ে Run
--
-- ক্রম: 01, 02, 04 আগে চালানো থাকতে হবে। বারবার চালালে ক্ষতি নেই। কোনো ডেটা মোছে না।
-- আগের ৭৯টি প্রকাশিত মণ্ডপ যেমন ছিল তেমনই থাকবে।
-- ============================================================

-- ১) বন্ধ হবে: অনুমোদন ছাড়া সঙ্গে সঙ্গে প্রকাশের ফাংশন (05_auto_publish.sql)
--    ফাংশনটি থাকলে কেউ সরাসরি API ডেকে অনুমোদন এড়াতে পারত, তাই anon/লগইন-করা সবার অনুমতি তুলে নেওয়া হলো।
do $$
begin
  if exists (select 1 from pg_proc where proname = 'auto_publish' and pronamespace = 'public'::regnamespace) then
    revoke all on function public.auto_publish(text, text, text, text, text, text, numeric, numeric, text, text, jsonb)
      from public, anon, authenticated;
  end if;
end $$;

-- ২) লগইন ছাড়া জমার নিয়ম: শুধু 'pending' অবস্থায় জমা নেওয়া যাবে (04 ফাইলের নিয়মই, নিশ্চিত করার জন্য আবার)
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

-- ৩) যাচাই
-- (ক) auto_publish-এ anon-এর execute অনুমতি নেই → নিচের ফলাফলে false আসবে
select has_function_privilege('anon',
  'public.auto_publish(text,text,text,text,text,text,numeric,numeric,text,text,jsonb)', 'execute') as anon_can_auto_publish;
-- (খ) পাবলিক শুধু published/archived মণ্ডপ দেখতে পায় → pub_read_mandapas থাকলে ঠিক আছে
select policyname, cmd, roles from pg_policies
where schemaname = 'public' and tablename in ('mandapas','submissions')
order by tablename, policyname;
