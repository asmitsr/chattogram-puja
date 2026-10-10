-- ============================================================
-- নিজেকে অ্যাডমিন বানানো (শুধু একবার)
--
-- আগে Supabase → Authentication → Users → Add user → Create new user দিয়ে
-- আপনার ইমেইল ও নিজের বানানো শক্তিশালী পাসওয়ার্ডে একটি অ্যাকাউন্ট খুলুন
-- ("Auto Confirm User" টিক দিন)। পাসওয়ার্ড কোডে বা এই ফাইলে লিখবেন না।
--
-- তারপর নিচের লাইনে 'আপনার-ইমেইল@example.com' বদলে আপনার ইমেইল দিন এবং Run করুন।
-- ============================================================

insert into public.admins (user_id)
select id from auth.users
where email = 'আপনার-ইমেইল@example.com'
on conflict (user_id) do nothing;

-- যাচাই: নিচের কোয়েরিতে আপনার ইমেইল দেখা গেলে অ্যাডমিন হয়েছে
select u.email, a.created_at
from public.admins a
join auth.users u on u.id = a.user_id;
