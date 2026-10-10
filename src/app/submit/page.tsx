import Flash from '@/components/Flash';
import LoginButton from '@/components/LoginButton';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';
import { fmtDateTime } from '@/lib/bn';
import type { Submission } from '@/lib/types';
import { KIND_LABEL, SUBMISSION_STATUS } from '@/lib/types';
import { submitInfo } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'তথ্য জমা দিন' };

export default async function SubmitPage({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const user = await getUser();

  if (!user) {
    return (
      <div className="wrap max-w-lg py-8">
        <h1 className="text-3xl text-accent">তথ্য জমা দিন</h1>
        <p className="muted mt-2">
          নতুন মণ্ডপ, ঠিকানা, সময়সূচি বা ভুল সংশোধনের তথ্য জানাতে প্রথমে Google দিয়ে লগইন করুন। জমা দেওয়া তথ্য সঙ্গে সঙ্গে প্রকাশ হয় না, অ্যাডমিন দেখে অনুমোদন দিলে তবেই দেখা যায়।
        </p>
        <div className="card mt-5">
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
        <div>
          <label className="label" htmlFor="kind">
            কী জানাতে চান?
          </label>
          <select id="kind" name="kind" className="input" defaultValue="new_mandapa">
            {Object.entries(KIND_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="name">
            মণ্ডপের নাম
          </label>
          <input id="name" name="name" className="input" required minLength={3} maxLength={150} />
        </div>
        <div>
          <label className="label" htmlFor="area">
            এলাকা
          </label>
          <input id="area" name="area" className="input" maxLength={100} placeholder="যেমন: আন্দরকিল্লা" />
        </div>
        <div>
          <label className="label" htmlFor="address">
            ঠিকানা
          </label>
          <input id="address" name="address" className="input" maxLength={300} />
        </div>
        <div>
          <label className="label" htmlFor="contact">
            পূজা কমিটির যোগাযোগ (ঐচ্ছিক)
          </label>
          <input id="contact" name="contact" className="input" maxLength={100} />
        </div>
        <div>
          <label className="label" htmlFor="detail">
            বিস্তারিত
          </label>
          <textarea id="detail" name="detail" className="input min-h-[120px]" required minLength={10} maxLength={2000} />
        </div>
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
