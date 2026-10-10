import Flash from '@/components/Flash';
import SubmitFields from '@/components/SubmitFields';
import { submitAnonymous } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'তথ্য জমা দিন' };

export default function SubmitPage({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  // ফর্ম খোলার সময়, বট ধরার জন্য
  const started = Date.now();
  return (
    <div className="wrap max-w-2xl py-6">
      <h1 className="text-3xl text-accent">তথ্য জমা দিন</h1>
      <p className="muted mb-4 mt-1">
        নতুন মণ্ডপ, অবস্থান, সময়সূচি বা ভুল সংশোধনের তথ্য জানান। জমা দেওয়া তথ্য সঙ্গে সঙ্গে প্রকাশ হয় না, অ্যাডমিন দেখে অনুমোদন দিলে তবেই দেখা যায়।
      </p>
      <Flash ok={searchParams.ok} err={searchParams.err} />

      <form action={submitAnonymous} className="card space-y-4">
        <SubmitFields />

        <div className="space-y-4 rounded-md bg-goldsoft p-3">
          <p className="text-sm">আপনার নাম ও মোবাইল নম্বর শুধু অ্যাডমিন দেখবেন, তথ্য যাচাইয়ের দরকারে। সাইটে প্রকাশ হবে না।</p>
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
    </div>
  );
}
