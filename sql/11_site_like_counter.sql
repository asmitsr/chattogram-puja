-- ওয়েবসাইটের লাইক: যতবার খুশি চাপা যাবে, প্রতিটি চাপে মোট সংখ্যা বাড়বে।
-- আগের ব্রাউজার-ভিত্তিক গণনার (site_likes) সংখ্যা শুরুর মান হিসেবে নেওয়া হয়।

create table if not exists public.site_like_counter (
  id    int primary key check (id = 1),
  total bigint not null default 0
);

insert into public.site_like_counter (id, total)
select 1, coalesce((select count(*) from public.site_likes), 0)
on conflict (id) do nothing;

alter table public.site_like_counter enable row level security;

-- মোট লাইক দেখা
create or replace function public.site_like_total()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select total from public.site_like_counter where id = 1), 0);
$$;

-- p_n টি লাইক যোগ করা (একবারে ১ থেকে ১০০)
create or replace function public.add_site_likes(p_n int)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v bigint;
begin
  update public.site_like_counter
     set total = total + greatest(1, least(coalesce(p_n, 1), 100))
   where id = 1
  returning total into v;
  return v;
end;
$$;

revoke all on function public.site_like_total() from public;
revoke all on function public.add_site_likes(int) from public;
grant execute on function public.site_like_total() to anon, authenticated;
grant execute on function public.add_site_likes(int) to anon, authenticated;

notify pgrst, 'reload schema';

-- যাচাই: মোট সংখ্যা আসবে (শুরুতে আগের লাইক সংখ্যার সমান)
select public.site_like_total() as total_now;
