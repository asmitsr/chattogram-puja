import Flash from '@/components/Flash';
import { loginAdmin } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'অ্যাডমিন লগইন', robots: { index: false, follow: false } };

const MESSAGES: Record<string, string> = {
  bad: 'ইমেইল বা পাসওয়ার্ড ভুল।',
  notadmin: 'এই অ্যাকাউন্টের অ্যাডমিন অনুমতি নেই।',
};

export default function AdminLogin({ searchParams }: { searchParams: { e?: string } }) {
  return (
    <div className="wrap max-w-md py-10">
      <h1 className="text-3xl text-accent">অ্যাডমিন লগইন</h1>
      <p className="muted mb-4 mt-2">শুধু সাইটের অ্যাডমিনের জন্য।</p>
      <Flash err={searchParams.e ? MESSAGES[searchParams.e] ?? 'লগইন করা যায়নি।' : undefined} />
      <form action={loginAdmin} className="card space-y-4">
        <div>
          <label className="label" htmlFor="email">
            ইমেইল
          </label>
          <input id="email" name="email" type="email" autoComplete="username" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="password">
            পাসওয়ার্ড
          </label>
          <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
        </div>
        <button type="submit" className="btn w-full">
          লগইন
        </button>
      </form>
    </div>
  );
}
