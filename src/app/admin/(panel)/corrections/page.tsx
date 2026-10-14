import Link from 'next/link';
import Flash from '@/components/Flash';
import { requireAdmin } from '@/lib/admin';
import { fmtDateTime } from '@/lib/bn';
import type { Submission } from '@/lib/types';
import { SUBMISSION_STATUS } from '@/lib/types';
import { approveSubmission, rejectSubmission } from '../../actions';

type Row = { label: string; before?: string; after: string };
type CorrPayload = Record<string, unknown> & { name?: string; mandapa_id?: string; changes?: Row[]; notes?: Row[] };

export default async function CorrectionsPage({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const { supabase } = await requireAdmin();

  const { data } = await supabase.from('submissions').select('*').eq('kind', 'correction').order('created_at', { ascending: false }).limit(100);
  const subs = (data ?? []) as (Submission & { payload: CorrPayload })[];
  const pending = subs.filter((s) => s.status === 'pending');
  const done = subs.filter((s) => s.status !== 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-accent">মণ্ডপের তথ্য সংশোধনের অনুরোধ</h1>
        <p className="muted mt-1">
          মানুষ শুধু অনুরোধ পাঠায়, সাইটের তথ্য নিজে থেকে বদলায় না। এখান থেকে দেখে আপনি মণ্ডপের পাতা খুলে নিজে হালনাগাদ করবেন, তারপর "সম্পন্ন" চিহ্নিত করবেন।
        </p>
      </div>
      <Flash ok={searchParams.ok} err={searchParams.err} />

      <section className="space-y-3">
        <h2 className="text-xl text-accent">অপেক্ষমাণ ({pending.length})</h2>
        {pending.length === 0 && <p className="muted">কোনো অপেক্ষমাণ সংশোধনের অনুরোধ নেই।</p>}
        {pending.map((s) => {
          const p = s.payload;
          const changes = Array.isArray(p.changes) ? p.changes : [];
          const notes = Array.isArray(p.notes) ? p.notes : [];
          const legacy = changes.length === 0 && notes.length === 0; // আগের পদ্ধতিতে জমা পড়া অনুরোধ
          const lat = String(p.latitude ?? '');
          const lng = String(p.longitude ?? '');
          return (
            <article key={s.id} className="card space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge-warn">সংশোধনের অনুরোধ</span>
                <span className="muted">{fmtDateTime(s.created_at)}</span>
              </div>
              <p className="rounded-md bg-goldsoft p-2 text-sm">
                জমাদাতা: <b>{s.submitter_name ?? 'নাম নেই'}</b> · মোবাইল: <b>{s.submitter_phone ?? '—'}</b> (প্রকাশ হবে না)
              </p>

              <h3 className="text-xl">{p.name}</h3>
              {p.mandapa_id && (
                <Link href={`/admin/mandapas/${p.mandapa_id}`} className="btn w-full sm:w-auto">
                  ✎ এই মণ্ডপের তথ্য সম্পাদনা করুন
                </Link>
              )}

              {notes.map((n) => (
                <div key={n.label}>
                  <div className="text-sm font-semibold text-muted">{n.label}</div>
                  <div className="whitespace-pre-line">{n.after}</div>
                </div>
              ))}

              {changes.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-muted">যে তথ্য বদলাতে চেয়েছেন</div>
                  {changes.map((c) => (
                    <div key={c.label} className="rounded-md border border-line p-2 text-sm">
                      <b>{c.label}</b>
                      <div className="muted">আগে: {c.before}</div>
                      <div>এখন: {c.after}</div>
                      {c.label === 'ম্যাপে অবস্থান' && lat && lng && (
                        <a
                          className="underline"
                          target="_blank"
                          rel="noopener noreferrer"
                          href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                        >
                          গুগল ম্যাপে দেখুন
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {legacy && (
                <dl className="grid gap-1 text-sm sm:grid-cols-[7rem_1fr]">
                  {(['area', 'address', 'contact', 'detail'] as const).map((k) =>
                    p[k] ? (
                      <div key={k} className="contents">
                        <dt className="text-muted">{{ area: 'এলাকা', address: 'ঠিকানা', contact: 'যোগাযোগ', detail: 'বিস্তারিত' }[k]}</dt>
                        <dd className="whitespace-pre-line">{String(p[k])}</dd>
                      </div>
                    ) : null,
                  )}
                </dl>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                <form action={approveSubmission} className="space-y-2">
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="back" value="/admin/corrections" />
                  <label className="label" htmlFor={`an-${s.id}`}>
                    মন্তব্য (ঐচ্ছিক)
                  </label>
                  <input id={`an-${s.id}`} name="note" className="input" />
                  <button className="btn w-full" type="submit">
                    ✔ সম্পন্ন (আমি তথ্য হালনাগাদ করেছি)
                  </button>
                </form>
                <form action={rejectSubmission} className="space-y-2">
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="back" value="/admin/corrections" />
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
          );
        })}
      </section>

      <section className="space-y-2">
        <h2 className="text-xl text-accent">সাম্প্রতিক নিষ্পত্তি</h2>
        {done.length === 0 && <p className="muted">এখনো কিছু নেই।</p>}
        {done.map((s) => (
          <div key={s.id} className="card">
            <span className={s.status === 'approved' ? 'badge-ok' : 'badge-warn'}>{SUBMISSION_STATUS[s.status]}</span>{' '}
            <span className="muted">{fmtDateTime(s.reviewed_at ?? s.created_at)}</span>
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
