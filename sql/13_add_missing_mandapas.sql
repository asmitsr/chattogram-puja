-- ============================================================
-- v52: Google My Maps-এর ১২০টির মধ্যে যে ৭টি আগের ইমপোর্টে ছিল না, সেগুলো যোগ করা।
-- Supabase → SQL Editor → New query → পুরোটা বসিয়ে Run
-- বারবার চালালেও ক্ষতি নেই: যেটা আগে থেকে (একই নামে) আছে সেটা আবার যোগ হয় না;
-- খসড়া/আর্কাইভ অবস্থায় থাকলে শুধু "প্রকাশিত" করা হয়।
-- শেষে যাচাইয়ের তালিকা আসবে: "১. প্রকাশিত মোট" = ১২০ হওয়ার কথা।
-- ============================================================

create temp table kmz (name text, area text, address text, description text, lat numeric, lng numeric) on commit drop;

do $$
declare v_year uuid;
begin
  select id into v_year from public.puja_years where year = 2026;
  if v_year is null then
    raise exception '২০২৬ সালের পূজাবর্ষ পাওয়া যায়নি';
  end if;

  insert into kmz (name, area, address, description, lat, lng) values
    ($q$দেবেন্দ্র মাস্টারপাড়া সর্বজনীন$q$, $q$মেট্রোপলিটন এলাকা (মহানগর)$q$, $q$হালিশহর A-ব্লক, বাসস্ট্যান্ড, দক্ষিণ কাট্টলী, মাস্টার পাড়া, চট্টগ্রাম।$q$, null, 22.346061, 91.77856),
    ($q$বেটারীগলি সর্বজনীন পুজা উদযাপন পরিষদ$q$, $q$মেট্রোপলিটন এলাকা (মহানগর)$q$, $q$ধোপাপাড়া, বেটারীগলি, চট্টেশ্বরী রোড, চট্টগ্রাম$q$, null, 22.3525125, 91.8273281),
    ($q$উত্তর গুজরা সবুজ সংঘ$q$, $q$উত্তর চট্টগ্রাম$q$, $q$শ্রী শ্রী জ্বালাকুমারী মাতৃ মন্দির, উত্তর গুজরা, রাউজান, চট্টগ্রাম$q$, null, 22.4935233, 91.8995297),
    ($q$জ্যৈষ্ঠপুরা বীণাপানি সংঘ$q$, $q$দক্ষিণ চট্টগ্রাম$q$, $q$জ্যৈষ্ঠপুরা, শ্রীপুর-খরন্দ্বীপ, বোয়ালখালী, চট্টগ্রাম$q$, null, 22.399308, 91.983041),
    ($q$জ্যৈষ্ঠপুরা মৈত্রী সংঘ ও দেবেন পাঠাগার$q$, $q$দক্ষিণ চট্টগ্রাম$q$, $q$গ্রাম: জ্যৈষ্ঠপুরা, ৮নং শ্রীপুর-খরন্দ্বীপ ইউনিয়ন, কানুনগোপাড়া রোড, বোয়ালখালী, চট্টগ্রাম$q$, null, 22.394397, 91.986987),
    ($q$রুপায়ন ক্লাব$q$, $q$দক্ষিণ চট্টগ্রাম$q$, $q$সারোয়াতলী, বোয়ালখালী, চট্টগ্রাম$q$, $q$ইমামুল্লারচর ১নং সরকারি প্রাথমিক বিদ্যালয় এর পাশে মাঠ প্রাঙ্গণ$q$, 22.354777, 91.958371),
    ($q$বিদগ্রাম ও সারোয়াতলী উদয়ন সংঘ$q$, $q$দক্ষিণ চট্টগ্রাম$q$, $q$কানুনগোপাড়া, বোয়ালখালী, চট্টগ্রাম$q$, $q$এইবারের থিম ভবানী প্রাপ্তি$q$, 22.377186, 91.966864);

  insert into public.mandapas (year_id, name, area, address, description, latitude, longitude, status)
  select v_year, d.name, d.area, d.address, d.description, d.lat, d.lng, 'published'
  from kmz d
  where not exists (select 1 from public.mandapas m where m.year_id = v_year and m.name = d.name);

  -- আগে থেকে থাকলেও খসড়া/আর্কাইভ হলে প্রকাশ করা
  update public.mandapas m set status = 'published'
  from kmz d
  where m.year_id = v_year and m.name = d.name and m.status <> 'published';
end $$;

-- যাচাই (সব ফল একটাই তালিকায়)
--   "১. প্রকাশিত মোট"        → ১২০ আসার কথা
--   "২. স্থানাঙ্কসহ"          → প্রকাশিতের সমান
--   "৩. এলাকা"               → মহানগর/উত্তর/দক্ষিণ ভাগ
--   "৪. সাইটে আছে, ৭টির মধ্যে নেই" → একটাও আসা উচিত নয়
--   "৫. একই নামে দুইবার"      → একটাও আসা উচিত নয়
with pub as (
  select m.* from public.mandapas m join public.puja_years y on y.id = m.year_id
  where y.year = 2026 and m.status = 'published'
)
select 1 as ক্রম, '১. প্রকাশিত মোট' as বিষয়, count(*)::text as মান from pub
union all
select 2, '২. স্থানাঙ্কসহ', count(*)::text from pub where latitude is not null and longitude is not null
union all
select 3, '৩. এলাকা: ' || coalesce(area, '(ফাঁকা)'), count(*)::text from pub group by area
union all
select 4, '৪. ৭টির মধ্যে সাইটে নেই', n from unnest(array[
  'দেবেন্দ্র মাস্টারপাড়া সর্বজনীন','বেটারীগলি সর্বজনীন পুজা উদযাপন পরিষদ','উত্তর গুজরা সবুজ সংঘ',
  'জ্যৈষ্ঠপুরা বীণাপানি সংঘ','জ্যৈষ্ঠপুরা মৈত্রী সংঘ ও দেবেন পাঠাগার','রুপায়ন ক্লাব','বিদগ্রাম ও সারোয়াতলী উদয়ন সংঘ']) n
  where not exists (select 1 from pub p where p.name = n)
union all
select 5, '৫. একই নামে একাধিক: ' || name, count(*)::text from pub group by name having count(*) > 1
order by 1, 2, 3;
