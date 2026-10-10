import Flash from '@/components/Flash';
import LoginButton from '@/components/LoginButton';
import SubmitFields from '@/components/SubmitFields';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';
import { fmtDateTime } from '@/lib/bn';
import type { Submission } from '@/lib/types';
import { KIND_LABEL, SUBMISSION_STATUS } from '@/lib/types';
import { submitAnonymous, submitInfo } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'তথ্য জমা দিন' };

export default async function SubmitPage({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const user = await getUser();

  if (!user) {
    // ফর্ম খোলার সময়, বট ধরার জন্য
    const started = Date.now();
    return (
      <div className="wrap max-w-2xl py-6">
        <h1 className="text-3xl text-accent">তথ্য জমা দিন</h1>
        <p className="muted mb-4 mt-1">
          নতুন মণ্ডপ, ঠিকানা, সময়সূচি বা ভুল সংশোধনের তথ্য জানাতে লগইন লাগবে না। জমা দেওয়া তথ্য সঙ্গে সঙ্গে প্রকাশ হয় না, অ্যাডমিন দেখে অনুমোদন দিলে তবেই দেখা যায়।
        </p>
        <Flash ok={searchParams.ok} err={searchParams.err} />

        <form action={submitAnonymous} className="card space-y-4">
          <h2 className="text-xl text-accent">লগইন ছাড়াই তথ্য দিন</h2>
          <SubmitFields />

          <div className="space-y-4 rounded-md bg-goldsoft p-3">
            <p className="text-sm">
              আপনার নাম ও মোবাইল নম্বর শুধু অ্যাডমিন দেখবেন, তথ্য যাচাইয়ের দরকারে। সাইটে প্রকাশ হবে না।
            </p>
            <div>
              <label className="label" htmlFor="submitter_name">
                আপনার নাম
              </label>
              <input id="submitter_name" name="submitter_name" className="input" required minLength={2} maxLength={100} autoComplete="name" />
            </div>
            <div>
              <label className="label" htmlFor="submitter_phone">
                আপনার মোবাইল নম্বর
              </label>
              <input
                id="submitter_phone"
                name="submitter_phone"
                className="input"
                required
                inputMode="tel"
                maxLength={20}
                autoComplete="tel"
                placeholder="01XXXXXXXXX"
              />
            </div>
          </div>

          {/* স্প্যাম বটের ফাঁদ: মানুষের চোখে পড়ে না, ফাঁকা রাখতে হবে */}
          <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
            <label htmlFor="website">এই ঘরটি ফাঁকা রাখুন</label>
            <input id="website" name="website" tabIndex={-1} autoComplete="off" />
          </div>
          <input type="hidden" name="started" value={started} />

          <button type="submit" className="btn">
            জমা দিন
          </button>
          <p className="muted">অন্যের ব্যক্তিগত ফোন নম্বর বা ঠিকানা দেবেন না।</p>
        </form>

        <div className="card mt-5 space-y-3">
          <h2 className="text-lg text-accent">চাইলে Google দিয়ে লগইন করুন</h2>
          <p className="muted">
            লগইন করলে আপনার জমা দেওয়া তথ্যের অবস্থা (অপেক্ষমাণ, অনুমোদিত বা প্রত্যাখ্যাত) এখানে দেখতে পারবেন, আর নাম ও নম্বর আলাদা করে দিতে হবে না। এটি বাধ্যতামূলক নয়।
          </p>
          <LoginButton next="/submit" />
        </div>
      </div>
    );
  }

  const supabase = createClient();
  const { data } = await supabase.from('submissions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
  const mine = (data ?? []) as Submission[];

  return (
    <div className="wrap max-w-2xl py-6">
      <h1 className="text-3xl text-accent">তথ্য জমা দিন</h1>
      <p className="muted mb-4 mt-1">
        জমা দেওয়া তথ্য অ্যাডমিনের অনুমোদনের অপেক্ষায় থাকে। অন্যের ব্যক্তিগত ফোন নম্বর বা ঠিকানা দেবেন না। প্রতিদিন সর্বোচ্চ ১০টি তথ্য জমা দেওয়া যায়।
      </p>
      <Flash ok={searchParams.ok} err={searchParams.err} />

      <form action={submitInfo} className="card space-y-4">
        <SubmitFields />
        <button type="submit" className="btn">
          জমা দিন
        </button>
      </form>

      <h2 className="mb-3 mt-8 text-2xl text-accent">আপনার জমা দেওয়া তথ্য</h2>
      {mine.length === 0 ? (
        <p className="muted">এখনো কিছু জমা দেননি।</p>
      ) : (
        <div className="space-y-3">
          {mine.map((s) => (
            <div key={s.id} className="card">
              <span className={s.status === 'approved' ? 'badge-ok' : s.status === 'rejected' ? 'badge-warn' : 'badge'}>
                {SUBMISSION_STATUS[s.status]}
              </span>{' '}
              <span className="muted">
                {KIND_LABEL[s.kind]} · {fmtDateTime(s.created_at)}
              </span>
              <h3 className="mt-1 text-lg">{s.payload.name}</h3>
              {s.admin_note && <p className="muted mt-1">অ্যাডমিনের মন্তব্য: {s.admin_note}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
