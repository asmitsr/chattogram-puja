import MapPicker from '@/components/MapPicker';
import type { Mandapa, Year } from '@/lib/types';
import { MANDAPA_STATUS, YEAR_STATUS } from '@/lib/types';
import { saveMandapa } from '@/app/admin/actions';

export default function MandapaForm({ mandapa, years, defaultYearId }: { mandapa?: Mandapa; years: Year[]; defaultYearId?: string }) {
  return (
    <form action={saveMandapa} className="card space-y-4">
      {mandapa && <input type="hidden" name="id" value={mandapa.id} />}
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
        <input id="name" name="name" className="input" required defaultValue={mandapa?.name ?? ''} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="area">
            এলাকা
          </label>
          <input id="area" name="area" className="input" defaultValue={mandapa?.area ?? ''} />
        </div>
        <div>
          <label className="label" htmlFor="contact">
            যোগাযোগ (পূজা কমিটির)
          </label>
          <input id="contact" name="contact" className="input" defaultValue={mandapa?.contact ?? ''} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="address">
          ঠিকানা
        </label>
        <input id="address" name="address" className="input" defaultValue={mandapa?.address ?? ''} />
      </div>
      <div>
        <label className="label" htmlFor="description">
          বিবরণ
        </label>
        <textarea id="description" name="description" className="input min-h-[100px]" defaultValue={mandapa?.description ?? ''} />
      </div>
      <div>
        <h3 className="mb-2 text-lg">ম্যাপে অবস্থান</h3>
        <MapPicker lat={mandapa?.latitude ?? null} lng={mandapa?.longitude ?? null} />
      </div>
      <button type="submit" className="btn">
        সংরক্ষণ করুন
      </button>
    </form>
  );
}
