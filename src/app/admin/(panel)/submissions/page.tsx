import Flash from '@/components/Flash';
import { requireAdmin } from '@/lib/admin';
import { fmtDateTime } from '@/lib/bn';
import type { Submission } from '@/lib/types';
import { KIND_LABEL, SUBMISSION_STATUS } from '@/lib/types';
import { approveSubmission, rejectSubmission } from '../../actions';

export default async function SubmissionsPage({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const { supabase } = await requireAdmin();

  const { data } = await supabase.from('submissions').select('*').order('created_at', { ascending: false }).limit(60);
  const subs = (data ?? []) as Submission[];

  const ids = Array.from(new Set(subs.map((s) => s.user_id).filter((x): x is string => Boolean(x))));
  const names = new Map<string, string>();
  if (ids.length) {
    const { data: ps } = await supabase.from('profiles').select('id,display_name').in('id', ids);
    (ps ?? []).forEach((p: { id: string; display_name: string | null }) => names.set(p.id, p.display_name ?? 'নাম নেই'));
  }

  const pending = subs.filter((s) => s.status === 'pending');
  const done = subs.filter((s) => s.status !== 'pending');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl text-accent">জমা দেওয়া তথ্য</h1>
      <Flash ok={searchParams.ok} err={searchParams.err} />

      <section className="space-y-3">
        <h2 className="text-xl text-accent">অপেক্ষমাণ ({pending.length})</h2>
        {pending.length === 0 && <p className="muted">কোনো অপেক্ষমাণ জমা নেই।</p>}
        {pending.map((s) => (
          <article key={s.id} className="card space-y-2">
            <div>
              <span className="badge">{KIND_LABEL[s.kind]}</span>{' '}
              {s.user_id ? (
                <span className="muted">
                  {names.get(s.user_id) ?? 'নাম নেই'} (Google লগইন) · {fmtDateTime(s.created_at)}
                </span>
              ) : (
                <>
                  <span className="badge-warn">লগইন ছাড়া জমা, যাচাই করে নিন</span>{' '}
                  <span className="muted">{fmtDateTime(s.created_at)}</span>
                </>
              )}
            </div>
            {!s.user_id && (
              <p className="rounded-md bg-goldsoft p-2 text-sm">
                জমাদাতা: <b>{s.submitter_name}</b> · মোবাইল: <b>{s.submitter_phone}</b> (প্রকাশ হবে না)
              </p>
            )}
            <h3 className="text-xl">{s.payload.name}</h3>
            <dl className="grid gap-1 text-sm sm:grid-cols-[7rem_1fr]">
              {s.payload.area && (
                <>
                  <dt className="text-muted">এলাকা</dt>
                  <dd>{s.payload.area}</dd>
                </>
              )}
              {s.payload.address && (
                <>
                  <dt className="text-muted">ঠিকানা</dt>
                  <dd>{s.payload.address}</dd>
                </>
              )}
              {s.payload.contact && (
                <>
                  <dt className="text-muted">যোগাযোগ</dt>
                  <dd>{s.payload.contact}</dd>
                </>
              )}
              {s.payload.latitude && s.payload.longitude && (
                <>
                  <dt className="text-muted">অবস্থান</dt>
                  <dd>
                    {s.payload.latitude}, {s.payload.longitude} ·{' '}
                    <a
                      className="underline"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={`https://www.openstreetmap.org/?mlat=${s.payload.latitude}&mlon=${s.payload.longitude}#map=17/${s.payload.latitude}/${s.payload.longitude}`}
                    >
                      ম্যাপে দেখুন
                    </a>
                  </dd>
                </>
              )}
              {s.payload.puja_plan && (
                <>
                  <dt className="text-muted">কোন দিন কী পূজা</dt>
                  <dd className="whitespace-pre-line">{s.payload.puja_plan}</dd>
                </>
              )}
              {s.payload.anjali_time && (
                <>
                  <dt className="text-muted">অঞ্জলি</dt>
                  <dd>{s.payload.anjali_time}</dd>
                </>
              )}
              {s.payload.bisorjon_time && (
                <>
                  <dt className="text-muted">বিসর্জন</dt>
                  <dd>{s.payload.bisorjon_time}</dd>
                </>
              )}
              <dt className="text-muted">বিস্তারিত</dt>
              <dd className="whitespace-pre-line">{s.payload.detail}</dd>
            </dl>
            <div className="grid gap-2 sm:grid-cols-2">
              <form action={approveSubmission} className="space-y-2">
                <input type="hidden" name="id" value={s.id} />
                <label className="label" htmlFor={`an-${s.id}`}>
                  মন্তব্য (ঐচ্ছিক)
                </label>
                <input id={`an-${s.id}`} name="note" className="input" />
                {s.kind === 'new_mandapa' || s.kind === 'news' ? (
                  <>
                    <button className="btn w-full" type="submit" name="mode" value="publish">
                      ✔ অনুমোদন ও এখনই প্রকাশ
                    </button>
                    <button className="btn-ghost w-full" type="submit" name="mode" value="draft">
                      খসড়া করে আগে সম্পাদনা করব
                    </button>
                  </>
                ) : (
                  <button className="btn w-full" type="submit">
                    অনুমোদন (পরিবর্তন নিজে করতে হবে)
                  </button>
                )}
              </form>
              <form action={rejectSubmission} className="space-y-2">
                <input type="hidden" name="id" value={s.id} />
                <label className="label" htmlFor={`rn-${s.id}`}>
                  প্রত্যাখ্যানের কারণ (ঐচ্ছিক)
                </label>
                <input id={`rn-${s.id}`} name="note" className="input" />
                <button className="btn-danger w-full" type="submit">
                  প্রত্যাখ্যান
                </button>
              </form>
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-xl text-accent">সাম্প্রতিক নিষ্পত্তি</h2>
        {done.length === 0 && <p className="muted">এখনো কিছু নেই।</p>}
        {done.map((s) => (
          <div key={s.id} className="card">
            <span className={s.status === 'approved' ? 'badge-ok' : 'badge-warn'}>{SUBMISSION_STATUS[s.status]}</span>{' '}
            <span className="muted">
              {KIND_LABEL[s.kind]} · {fmtDateTime(s.reviewed_at ?? s.created_at)}
            </span>
            <div className="mt-1">{s.payload.name}</div>
            {s.submitter_name && (
              <div className="muted">
                জমাদাতা: {s.submitter_name} · {s.submitter_phone}
              </div>
            )}
            {s.admin_note && <div className="muted">মন্তব্য: {s.admin_note}</div>}
          </div>
        ))}
      </section>
    </div>
  );
}
