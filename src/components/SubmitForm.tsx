'use client';

import { useRef, useState } from 'react';
import CorrectionFields from '@/components/CorrectionFields';
import SubmitFields from '@/components/SubmitFields';
import type { Pin } from '@/components/mapKit';
import { computeChanges, type CorrectionBase, type CorrectionDiff } from '@/lib/correction';
import { KIND_LABEL } from '@/lib/types';

const s = (f: FormData, k: string) => String(f.get(k) ?? '');

// তথ্য জমার ফর্ম। "ভুল তথ্যের সংশোধন" বাছলে মণ্ডপ বেছে বদলের ফর্ম আসে এবং "পরিবর্তন চেক করুন" বোতাম পাওয়া যায়।
export default function SubmitForm({
  action,
  pins,
  mandapas,
  started,
  initialKind,
  initialMandapa,
}: {
  action: (formData: FormData) => void | Promise<void>;
  pins: Pin[];
  mandapas: CorrectionBase[];
  started: number;
  initialKind: string;
  initialMandapa: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [kind, setKind] = useState(initialKind in KIND_LABEL ? initialKind : 'new_mandapa');
  const [mandapaId, setMandapaId] = useState(mandapas.some((m) => m.id === initialMandapa) ? initialMandapa : '');
  const [diff, setDiff] = useState<CorrectionDiff | null>(null);
  const [err, setErr] = useState('');

  const isCorrection = kind === 'correction';
  const sel = mandapas.find((m) => m.id === mandapaId) ?? null;

  // বর্তমান তথ্যের সঙ্গে ফর্মের তথ্য মিলিয়ে দেখা
  function check(): CorrectionDiff | null {
    setErr('');
    if (!sel || !formRef.current) {
      setDiff(null);
      setErr('আগে মণ্ডপ বেছে নিন।');
      return null;
    }
    const f = new FormData(formRef.current);
    const thana = s(f, 'thana');
    const locality = s(f, 'locality');
    if (thana && !locality) {
      setDiff(null);
      setErr('থানা বেছেছেন, এবার এলাকাও বেছে নিন। এলাকা বদলাতে না চাইলে থানা ফাঁকা রাখুন।');
      return null;
    }
    const area = thana && locality ? `${locality.startsWith('তালিকায় নেই') ? 'এলাকা ঠিকানায় লেখা' : locality}, ${thana}, চট্টগ্রাম` : '';
    const d = computeChanges(sel, {
      name: s(f, 'name'),
      area,
      address: s(f, 'address'),
      contact: s(f, 'contact'),
      latitude: s(f, 'latitude'),
      longitude: s(f, 'longitude'),
      wrong: s(f, 'wrong'),
      detail: s(f, 'detail'),
      puja_plan: s(f, 'puja_plan'),
      anjali_time: s(f, 'anjali_time'),
      bisorjon_time: s(f, 'bisorjon_time'),
    });
    setDiff(d);
    return d;
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!isCorrection) return;
    const d = check();
    if (!d || !d.hasAny) e.preventDefault(); // কিছু বদলায়নি: জমা যাবে না, বার্তা দেখানো হবে
  }

  return (
    <form ref={formRef} action={action} onSubmit={onSubmit} className="card space-y-4">
      <div>
        <label className="label" htmlFor="kind">
          কী জানাতে চান?
        </label>
        <select
          id="kind"
          name="kind"
          className="input"
          value={kind}
          onChange={(e) => {
            setKind(e.target.value);
            setDiff(null);
            setErr('');
          }}
        >
          {Object.entries(KIND_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {isCorrection ? (
        <CorrectionFields
          mandapas={mandapas}
          pins={pins}
          mandapaId={mandapaId}
          onSelect={(id) => {
            setMandapaId(id);
            setDiff(null);
            setErr('');
          }}
        />
      ) : (
        <SubmitFields pins={pins} />
      )}

      {isCorrection && sel && (
        <div className="space-y-3 rounded-md border border-line p-3">
          <button type="button" className="btn-ghost w-full" onClick={() => check()}>
            🔍 পরিবর্তন চেক করুন
          </button>
          {err && (
            <p role="alert" className="rounded-md bg-warnbg p-3 font-semibold text-err">
              {err}
            </p>
          )}
          {diff && !diff.hasAny && (
            <p role="status" className="rounded-md bg-goldsoft p-3 font-semibold">
              কোনো কিছু পরিবর্তন করা হয়নি। সব তথ্য আগের মতোই আছে, তাই জমা দেওয়ার দরকার নেই।
            </p>
          )}
          {diff && diff.hasAny && (
            <div role="status" className="space-y-2 rounded-md bg-okbg p-3">
              <p className="font-semibold text-ok">এই পরিবর্তনগুলো জমা যাবে:</p>
              <ul className="space-y-2 text-sm">
                {diff.changes.map((c) => (
                  <li key={c.label}>
                    <b>{c.label}:</b>
                    <div className="muted">আগে: {c.before}</div>
                    <div>এখন: {c.after}</div>
                  </li>
                ))}
                {diff.notes.map((c) => (
                  <li key={c.label}>
                    <b>{c.label}:</b>
                    <div className="whitespace-pre-line">{c.after}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

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
          <input id="submitter_phone" name="submitter_phone" className="input" required inputMode="tel" maxLength={20} autoComplete="tel" placeholder="01XXXXXXXXX" />
        </div>
      </div>

      {/* স্প্যাম বটের ফাঁদ: মানুষের চোখে পড়ে না, ফাঁকা রাখতে হবে */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
        <label htmlFor="website">এই ঘরটি ফাঁকা রাখুন</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <input type="hidden" name="started" value={started} />

      <button type="submit" className="btn">
        {isCorrection ? 'সংশোধনের অনুরোধ জমা দিন' : 'জমা দিন'}
      </button>
      <p className="muted">
        {isCorrection
          ? 'আপনার অনুরোধ সঙ্গে সঙ্গে সাইটে বদলায় না। অ্যাডমিন যাচাই করে নিজে তথ্য হালনাগাদ করবেন।'
          : 'অন্যের ব্যক্তিগত ফোন নম্বর বা ঠিকানা দেবেন না।'}
      </p>
    </form>
  );
}
