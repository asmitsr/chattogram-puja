-- ============================================================
-- তথ্য জমা দিলেই সঙ্গে সঙ্গে সাইটে প্রকাশ (অ্যাডমিনের অনুমোদন ছাড়া)
-- Supabase → SQL Editor → New query → পুরোটা বসিয়ে Run
--
-- ক্রম: 01, 02, 04 চালানোর পর এটি। বারবার চালালে ক্ষতি নেই।
-- 01_policies.sql আবার চালালে এই ফাইল আবার চালানোর দরকার নেই (ফাংশন মোছে না), তবে 04 আবার চালাতে হবে।
--
-- কী হয়: "নতুন মণ্ডপ" জমা দিলে প্রকাশিত মণ্ডপ তৈরি হয়, "সংবাদ বা অন্য তথ্য" জমা দিলে প্রকাশিত সংবাদ তৈরি হয়।
-- জমাদাতার নাম ও মোবাইল নম্বর শুধু অ্যাডমিনের জমা-তালিকায় থাকে, সাইটে দেখা যায় না।
-- সীমা: সব স্বয়ংক্রিয় প্রকাশ মিলিয়ে ঘণ্টায় ৩০টি, দিনে ১৫০টি। বদলাতে নিচের ৩০ ও ১৫০ বদলান।
-- ============================================================

create or replace function public.auto_publish(
  p_kind text,
  p_name text,
  p_area text,
  p_address text,
  p_contact text,
  p_detail text,
  p_lat numeric,
  p_lng numeric,
  p_submitter_name text,
  p_submitter_phone text,
  p_payload jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_year uuid;
  v_id uuid;
begin
  if p_kind not in ('new_mandapa', 'news') then
    raise exception 'invalid kind' using errcode = '22023';
  end if;
  if char_length(coalesce(p_name, '')) not between 3 and 150
     or char_length(coalesce(p_detail, '')) not between 10 and 2000
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
      where admin_note = 'স্বয়ংক্রিয় প্রকাশ' and created_at > now() - interval '1 hour') >= 30
     or (select count(*) from public.submissions
      where admin_note = 'স্বয়ংক্রিয় প্রকাশ' and created_at > now() - interval '1 day') >= 150 then
    raise exception 'limit reached' using errcode = 'P0001';
  end if;

  -- চলতি পূজাবর্ষ: সক্রিয় বছর, না থাকলে সবচেয়ে কাছের আসন্ন বছর
  select id into v_year from public.puja_years where status = 'active' order by year desc limit 1;
  if v_year is null then
    select id into v_year from public.puja_years where status = 'upcoming' order by year asc limit 1;
  end if;
  if v_year is null and p_kind = 'new_mandapa' then
    raise exception 'no year' using errcode = 'P0002';
  end if;

  if p_kind = 'new_mandapa' then
    insert into public.mandapas (year_id, name, area, address, contact, description, latitude, longitude, status)
    values (v_year, p_name, nullif(p_area, ''), nullif(p_address, ''), nullif(p_contact, ''), p_detail, p_lat, p_lng, 'published')
    returning id into v_id;
  else
    insert into public.news (year_id, title, body, status, published_at)
    values (v_year, p_name, p_detail, 'published', now())
    returning id into v_id;
  end if;

  insert into public.submissions (user_id, kind, payload, status, admin_note, reviewed_at, submitter_name, submitter_phone)
  values (null, p_kind, p_payload || jsonb_build_object('record_id', v_id), 'approved', 'স্বয়ংক্রিয় প্রকাশ', now(), p_submitter_name, p_submitter_phone);

  return v_id;
end;
$$;

revoke all on function public.auto_publish(text, text, text, text, text, text, numeric, numeric, text, text, jsonb) from public;
grant execute on function public.auto_publish(text, text, text, text, text, text, numeric, numeric, text, text, jsonb) to anon, authenticated;

-- যাচাই: এক সারিতে auto_publish দেখা গেলে ফাংশন বসেছে
select proname from pg_proc where proname = 'auto_publish';
