import Link from 'next/link';
import { notFound } from 'next/navigation';
import Flash from '@/components/Flash';
import MandapaForm from '@/components/MandapaForm';
import { requireAdmin } from '@/lib/admin';
import { getYears } from '@/lib/data';
import { fmtDateTime } from '@/lib/bn';
import type { Mandapa, Schedule } from '@/lib/types';
import { addSchedule, deleteMandapa, deleteSchedule } from '../../../actions';

export default async function EditMandapa({ params, searchParams }: { params: { id: string }; searchParams: { ok?: string; err?: string } }) {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from('mandapas').select('*').eq('id', params.id).maybeSingle();
  if (!data) notFound();
  const m = data as Mandapa;
  const years = await getYears(supabase);
  const { data: s } = await supabase.from('schedules').select('*').eq('mandapa_id', m.id).order('starts_at');
  const schedules = (s ?? []) as Schedule[];
  const { count: corrCount } = await supabase
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('kind', 'correction')
    .eq('status', 'pending')
    .eq('payload->>mandapa_id', m.id);

  return (
    <div className="space-y-6">
      <p>
        <Link href="/admin/mandapas">← সব মণ্ডপ</Link>
        {m.status === 'published' && (
          <>
            {' · '}
            <Link href={`/mandapa/${m.id}`}>পাবলিক পাতা দেখুন</Link>
          </>
        )}
      </p>
      <h1 className="text-3xl text-accent">{m.name}</h1>
      <Flash ok={searchParams.ok} err={searchParams.err} />

      {(corrCount ?? 0) > 0 && (
        <p className="rounded-md bg-goldsoft p-3">
          এই মণ্ডপের জন্য <b>{corrCount}টি</b> সংশোধনের অনুরোধ অপেক্ষায় আছে। <Link href="/admin/corrections">অনুরোধগুলো দেখুন</Link>।
        </p>
      )}

      <MandapaForm mandapa={m} years={years} />

      <section className="space-y-3">
        <h2 className="text-2xl text-accent">সময়সূচি</h2>
        {schedules.length === 0 && <p className="muted">এখনো কোনো সময়সূচি নেই।</p>}
        {schedules.map((x) => (
          <div key={x.id} className="card flex flex-wrap items-center justify-between gap-2">
            <div>
              <b>{x.title}</b>
              <div className="muted">
                {x.starts_at ? fmtDateTime(x.starts_at) : 'সময় নেই'}
                {x.ends_at ? ` – ${fmtDateTime(x.ends_at)}` : ''}
              </div>
              {x.details && <div className="text-sm">{x.details}</div>}
            </div>
            <form action={deleteSchedule}>
              <input type="hidden" name="id" value={x.id} />
              <input type="hidden" name="mandapa_id" value={m.id} />
              <button className="btn-danger !min-h-0 !py-1" type="submit">
                মুছুন
              </button>
            </form>
          </div>
        ))}

        <details className="card">
          <summary className="cursor-pointer text-lg font-semibold">নতুন সময়সূচি যোগ করুন (ঐচ্ছিক)</summary>
        <form action={addSchedule} className="mt-3 space-y-3">
          <input type="hidden" name="mandapa_id" value={m.id} />
          <div>
            <label className="label" htmlFor="s-title">
              কর্মসূচির নাম
            </label>
            <input id="s-title" name="title" className="input" placeholder="যেমন: সন্ধ্যা আরতি" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="s-start">
                শুরু (ঢাকার সময়)
              </label>
              <input id="s-start" name="starts_at" type="datetime-local" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="s-end">
                শেষ (ঐচ্ছিক)
              </label>
              <input id="s-end" name="ends_at" type="datetime-local" className="input" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="s-details">
              বিস্তারিত (ঐচ্ছিক)
            </label>
            <input id="s-details" name="details" className="input" />
          </div>
          <button className="btn" type="submit">
            যোগ করুন
          </button>
        </form>
        </details>
      </section>

      <section className="card space-y-3 border-err">
        <h2 className="text-xl text-err">স্থায়ীভাবে মুছে ফেলা</h2>
        <p className="muted">এই কাজ ফেরানো যায় না। শুধু ভুলে তৈরি হলে মুছুন। সাধারণ ক্ষেত্রে "আর্কাইভ" অবস্থা বেছে নিন।</p>
        <form action={deleteMandapa} className="space-y-3">
          <input type="hidden" name="id" value={m.id} />
          <label className="flex items-center gap-2">
            <input type="checkbox" name="confirm" value="yes" />
            আমি নিশ্চিত, এই মণ্ডপ ও এর সময়সূচি মুছে ফেলতে চাই
          </label>
          <button className="btn-danger" type="submit">
            মুছে ফেলুন
          </button>
        </form>
      </section>
    </div>
  );
}
