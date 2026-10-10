import { redirect } from 'next/navigation';
import Flash from '@/components/Flash';
import LoginButton from '@/components/LoginButton';
import { getUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'লগইন' };

export default async function LoginPage({ searchParams }: { searchParams: { next?: string; err?: string } }) {
  const next = searchParams.next && searchParams.next.startsWith('/') && !searchParams.next.startsWith('//') ? searchParams.next : '/submit';
  const user = await getUser();
  if (user) redirect(next);

  return (
    <div className="wrap max-w-lg py-8">
      <h1 className="text-3xl text-accent">লগইন</h1>
      <p className="muted mt-2">
        সাইট দেখতে লগইন লাগে না। তথ্য জমা দিতে Google অ্যাকাউন্ট দিয়ে লগইন করতে হয়। আপনার নাম বা ইমেইল সবার সামনে প্রকাশ হয় না।
      </p>
      <div className="mt-5">
        <Flash err={searchParams.err} />
        <LoginButton next={next} />
      </div>
    </div>
  );
}
