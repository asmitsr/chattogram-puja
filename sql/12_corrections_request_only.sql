-- ============================================================
-- v48: ভুল সংশোধন এখন শুধু "অনুরোধ"। অ্যাডমিন যাচাই করে নিজে মণ্ডপের তথ্য বদলান।
-- আগের স্বয়ংক্রিয় সংশোধনের ফাংশনটি মুছে ফেলা হচ্ছে, যাতে কেউ সরাসরি ডাটাবেসে ডেকে মণ্ডপের তথ্য বদলাতে না পারে।
-- Supabase → SQL Editor → New query → পুরোটা বসিয়ে Run
-- বারবার চালালেও ক্ষতি নেই। জমা পড়া আগের অনুরোধ বা মণ্ডপের কোনো তথ্য মোছে না।
-- ============================================================

drop function if exists public.apply_correction(text, text, text, text, text, text, numeric, numeric, text, text, jsonb);

-- যাচাই: নিচের কোয়েরিতে কোনো সারি না এলে ফাংশনটি মুছে গেছে
select proname from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and proname = 'apply_correction';
