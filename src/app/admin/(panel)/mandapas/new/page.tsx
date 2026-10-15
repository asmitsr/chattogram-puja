import Flash from '@/components/Flash';
import MandapaForm from '@/components/MandapaForm';
import { requireAdmin } from '@/lib/admin';
import { getYears, pickCurrent } from '@/lib/data';
import { fetchPins } from '@/lib/pins';

export default async function NewMandapa({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const { supabase } = await requireAdmin();
  const years = await getYears(supabase);
  const current = pickCurrent(years);
  const { pins } = await fetchPins(supabase);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl text-accent">নতুন মণ্ডপ</h1>
      <Flash ok={searchParams.ok} err={searchParams.err} />
      {years.length === 0 ? <p>আগে একটি পূজাবর্ষ তৈরি করুন।</p> : <MandapaForm years={years} defaultYearId={current?.id} pins={pins} />}
    </div>
  );
}
