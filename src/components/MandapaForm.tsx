import LocationGuide from '@/components/LocationGuide';
import LocationPicker from '@/components/LocationPicker';
import PlacePicker from '@/components/PlacePicker';
import type { Pin } from '@/components/mapKit';
import type { Mandapa, Year } from '@/lib/types';
import { MANDAPA_STATUS, YEAR_STATUS } from '@/lib/types';
import { splitDescription } from '@/lib/mandapaText';
import { saveMandapa } from '@/app/admin/actions';

// অ্যাডমিনের মণ্ডপ সম্পাদনা/নতুন ফর্ম — "তথ্য জমা দিন"-এর সব ঘরই এখানে আছে (আগের তথ্য ভরা অবস্থায়)।
export default function MandapaForm({
  mandapa,
  years,
  defaultYearId,
  pins = [],
}: {
  mandapa?: Mandapa;
  years: Year[];
  defaultYearId?: string;
  pins?: Pin[];
}) {
  const d = splitDescription(mandapa?.description);
  const lat = mandapa?.latitude == null ? null : Number(mandapa.latitude);
  const lng = mandapa?.longitude == null ? null : Number(mandapa.longitude);
  const initial = lat !== null && lng !== null && Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;

  return (
    <form action={saveMandapa} className="card space-y-4">
      {mandapa && <input type="hidden" name="id" value={mandapa.id} />}
      <input type="hidden" name="detail_mode" value="1" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="year_id">
            পূজাবর্ষ
          </label>
          <select id="year_id" name="year_id" className="input" defaultValue={mandapa?.year_id ?? defaultYearId ?? ''} required>
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.year} · {YEAR_STATUS[y.status]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="status">
            অবস্থা
          </label>
          <select id="status" name="status" className="input" defaultValue={mandapa?.status ?? 'draft'}>
            {Object.entries(MANDAPA_STATUS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="name">
          মণ্ডপের নাম
        </label>
        <input id="name" name="name" className="input" required minLength={2} maxLength={150} defaultValue={mandapa?.name ?? ''} />
      </div>

      <div>
        <label className="label" htmlFor="area">
          এলাকা (বর্তমান)
        </label>
        <input id="area" name="area" className="input" list="area-list" maxLength={200} defaultValue={mandapa?.area ?? ''} />
        <datalist id="area-list">
          <option value="মহানগর" />
          <option value="মেট্রোপলিটন এলাকা (মহানগর)" />
          <option value="উত্তর চট্টগ্রাম" />
          <option value="দক্ষিণ চট্টগ্রাম" />
        </datalist>
        <p className="muted mt-1 text-sm">
          ওপরের ঘরে সরাসরি লিখতে পারেন, অথবা নিচে থানা ও এলাকা বেছে নিলে সেটিই এলাকা হিসেবে বসবে (ঐচ্ছিক)।
        </p>
      </div>
      <PlacePicker optional />

      <div>
        <label className="label" htmlFor="address">
          বিস্তারিত ঠিকানা (রাস্তা, গলি, বাড়ি/মোড়ের নাম)
        </label>
        <input id="address" name="address" className="input" maxLength={300} defaultValue={mandapa?.address ?? ''} />
      </div>
      <div>
        <label className="label" htmlFor="contact">
          পূজা কমিটির যোগাযোগ (সাইটে প্রকাশ হবে)
        </label>
        <input id="contact" name="contact" className="input" maxLength={100} defaultValue={mandapa?.contact ?? ''} />
      </div>

      <div>
        <span className="label">মণ্ডপের অবস্থান (ম্যাপে পিন বসান বা সরান)</span>
        <LocationGuide />
        <LocationPicker pins={pins} initial={initial} />
      </div>

      <div className="space-y-4 rounded-md border border-line p-3">
        <h3 className="text-lg text-accent">সময়সূচি</h3>
        <div>
          <label className="label" htmlFor="puja_plan">
            কোন দিন কী পূজা
          </label>
          <textarea
            id="puja_plan"
            name="puja_plan"
            className="input min-h-[90px]"
            maxLength={600}
            defaultValue={d.puja_plan}
            placeholder={'যেমন:\nষষ্ঠী: বোধন ও অধিবাস\nসপ্তমী: কলাবউ স্নান\nঅষ্টমী: কুমারী পূজা, সন্ধিপূজা'}
          />
        </div>
        <div>
          <label className="label" htmlFor="anjali_time">
            অঞ্জলির সময়
          </label>
          <input id="anjali_time" name="anjali_time" className="input" maxLength={200} defaultValue={d.anjali_time} placeholder="যেমন: অষ্টমীর সকাল ১০টা" />
        </div>
        <div>
          <label className="label" htmlFor="bisorjon_time">
            বিসর্জনের সময়
          </label>
          <input id="bisorjon_time" name="bisorjon_time" className="input" maxLength={200} defaultValue={d.bisorjon_time} placeholder="যেমন: দশমীর বিকাল ৪টা" />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="detail">
          বিস্তারিত
        </label>
        <textarea id="detail" name="detail" className="input min-h-[120px]" maxLength={2000} defaultValue={d.detail} />
      </div>

      <button type="submit" className="btn">
        সংরক্ষণ করুন
      </button>
    </form>
  );
}
