import Flash from '@/components/Flash';
import SubmitForm from '@/components/SubmitForm';
import { fetchAllPublished, getYears, pickCurrent } from '@/lib/data';
import { fetchPins } from '@/lib/pins';
import { createClient } from '@/lib/supabase/server';
import { submitAnonymous } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'তথ্য জমা দিন' };

export default async function SubmitPage({ searchParams }: { searchParams: { ok?: string; err?: string; kind?: string; mandapa?: string } }) {
  // ফর্ম খোলার সময়, বট ধরার জন্য
  const started = Date.now();
  const supabase = createClient();
  const { pins } = await fetchPins(supabase);

  // "ভুল তথ্যের সংশোধন"-এর জন্য প্রকাশিত মণ্ডপের তালিকা (বর্তমান তথ্যসহ)
  const year = pickCurrent(await getYears(supabase));
  const all = year ? await fetchAllPublished(supabase, year.id) : [];
  const mandapas = all.map((m) => ({
    id: m.id,
    name: m.name,
    area: m.area,
    address: m.address,
    contact: m.contact,
    latitude: m.latitude,
    longitude: m.longitude,
  }));

  return (
    <div className="wrap max-w-2xl py-6">
      <h1 className="text-3xl text-accent">তথ্য জমা দিন</h1>
      <p className="muted mb-4 mt-1">
        নতুন মণ্ডপ, অবস্থান বা সময়সূচির তথ্য জানান। কোনো মণ্ডপের তথ্যে ভুল থাকলে "ভুল তথ্যের সংশোধন" বেছে অনুরোধ পাঠান। জমা দেওয়া তথ্য অ্যাডমিন যাচাই করে অনুমোদন দিলে তবেই সাইটে ও ম্যাপে দেখা যায়।
      </p>
      <Flash ok={searchParams.ok} err={searchParams.err} />

      <SubmitForm
        action={submitAnonymous}
        pins={pins}
        mandapas={mandapas}
        started={started}
        initialKind={searchParams.kind ?? 'new_mandapa'}
        initialMandapa={searchParams.mandapa ?? ''}
      />
    </div>
  );
}
