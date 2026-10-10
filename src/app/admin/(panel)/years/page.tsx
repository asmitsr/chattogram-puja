import Flash from '@/components/Flash';
import { requireAdmin } from '@/lib/admin';
import { getYears } from '@/lib/data';
import { bn } from '@/lib/bn';
import { YEAR_STATUS } from '@/lib/types';
import { createYear, deleteYear, updateYear } from '../../actions';

export default async function YearsPage({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const { supabase } = await requireAdmin();
  const years = await getYears(supabase);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl text-accent">পূজাবর্ষ ব্যবস্থাপনা</h1>
      <p className="muted max-w-2xl">
        প্রতি বছরের মণ্ডপ, সময়সূচি ও সংবাদ আলাদা থাকে। নতুন বছর তৈরি করলে সাইট নতুন করে বানাতে হয় না। একটি বছরকে "সক্রিয়" করলে আগের সক্রিয় বছর নিজে আর্কাইভ হয়ে যায়। আর্কাইভ করা তথ্য মোছে না।
      </p>
      <Flash ok={searchParams.ok} err={searchParams.err} />

      <form action={createYear} className="card space-y-3">
        <h2 className="text-xl text-accent">নতুন পূজাবর্ষ তৈরি</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="n-year">
              বছর (ইংরেজি সংখ্যায়, যেমন 2027)
            </label>
            <input id="n-year" name="year" inputMode="numeric" className="input" required />
          </div>
          <div>
            <label className="label" htmlFor="n-title">
              শিরোনাম
            </label>
            <input id="n-title" name="title" className="input" required placeholder="যেমন: পূজা ২০২৭" />
          </div>
          <div>
            <label className="label" htmlFor="n-start">
              পূজা শুরুর তারিখ (কাউন্টডাউনের জন্য)
            </label>
            <input id="n-start" name="starts_on" type="date" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="n-end">
              শেষের তারিখ
            </label>
            <input id="n-end" name="ends_on" type="date" className="input" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="n-copy">
            আগের বছরের মণ্ডপ খসড়া হিসেবে কপি করবেন?
          </label>
          <select id="n-copy" name="copy_from" className="input" defaultValue="">
            <option value="">না, খালি শুরু করব</option>
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {bn(y.year)} সালের মণ্ডপ কপি করুন
              </option>
            ))}
          </select>
          <p className="muted mt-1">কপি করা মণ্ডপ খসড়া থাকে, আপনি যাচাই করে প্রকাশ করবেন। সময়সূচি কপি হয় না।</p>
        </div>
        <button className="btn" type="submit">
          তৈরি করুন
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="text-xl text-accent">সব বছর</h2>
        {years.length === 0 && <p className="muted">এখনো কোনো বছর নেই। উপরে প্রথম বছরটি তৈরি করুন।</p>}
        {years.map((y) => (
          <div key={y.id} className="card space-y-3">
            <form action={updateYear} className="space-y-3">
              <input type="hidden" name="id" value={y.id} />
              <div className="flex flex-wrap items-center gap-2">
                <b className="font-display text-2xl">{bn(y.year)}</b>
                <span className={y.status === 'archived' ? 'badge' : 'badge-ok'}>{YEAR_STATUS[y.status]}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor={`t-${y.id}`}>
                    শিরোনাম
                  </label>
                  <input id={`t-${y.id}`} name="title" className="input" defaultValue={y.title} required />
                </div>
                <div>
                  <label className="label" htmlFor={`s-${y.id}`}>
                    অবস্থা
                  </label>
                  <select id={`s-${y.id}`} name="status" className="input" defaultValue={y.status}>
                    {Object.entries(YEAR_STATUS).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor={`a-${y.id}`}>
                    শুরুর তারিখ
                  </label>
                  <input id={`a-${y.id}`} name="starts_on" type="date" className="input" defaultValue={y.starts_on ?? ''} />
                </div>
                <div>
                  <label className="label" htmlFor={`e-${y.id}`}>
                    শেষের তারিখ
                  </label>
                  <input id={`e-${y.id}`} name="ends_on" type="date" className="input" defaultValue={y.ends_on ?? ''} />
                </div>
              </div>
              <button className="btn" type="submit">
                সংরক্ষণ
              </button>
            </form>
            <form action={deleteYear} className="flex flex-wrap items-center gap-3 border-t border-line pt-3">
              <input type="hidden" name="id" value={y.id} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="confirm" value="yes" />
                এই বছর স্থায়ীভাবে মুছতে চাই (মণ্ডপ বা সংবাদ থাকলে মোছা যাবে না)
              </label>
              <button className="btn-danger !min-h-0 !py-1" type="submit">
                মুছুন
              </button>
            </form>
          </div>
        ))}
      </section>
    </div>
  );
}
