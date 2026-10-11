import PlacePicker from '@/components/PlacePicker';
import LocationPicker from '@/components/LocationPicker';
import { KIND_LABEL } from '@/lib/types';

// জমা দেওয়ার ফর্মের ঘরগুলো (ম্যাপ ও সময়সূচিসহ)
export default function SubmitFields() {
  return (
    <>
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
      <PlacePicker />
      <div>
        <label className="label" htmlFor="address">
          বিস্তারিত ঠিকানা (রাস্তা, গলি, বাড়ি/মোড়ের নাম)
        </label>
        <input id="address" name="address" className="input" maxLength={300} placeholder="যেমন: ৫ নম্বর গলি, কালীবাড়ি মোড়ের পাশে" />
      </div>
      <div>
        <label className="label" htmlFor="contact">
          পূজা কমিটির যোগাযোগ (ঐচ্ছিক, সাইটে প্রকাশ হবে)
        </label>
        <input id="contact" name="contact" className="input" maxLength={100} />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg text-accent">মণ্ডপের অবস্থান (ম্যাপে চিহ্নিত করুন)</h3>
        <LocationPicker />
      </div>
      <div className="space-y-4 rounded-md border border-line p-3">
        <h3 className="text-lg text-accent">সময়সূচি (জানা থাকলে)</h3>
        <div>
          <label className="label" htmlFor="puja_plan">
            কোন দিন কী পূজা
          </label>
          <textarea
            id="puja_plan"
            name="puja_plan"
            className="input min-h-[90px]"
            maxLength={600}
            placeholder={'যেমন:\nষষ্ঠী: বোধন ও অধিবাস\nসপ্তমী: কলাবউ স্নান\nঅষ্টমী: কুমারী পূজা, সন্ধিপূজা'}
          />
        </div>
        <div>
          <label className="label" htmlFor="anjali_time">
            অঞ্জলির সময়
          </label>
          <input id="anjali_time" name="anjali_time" className="input" maxLength={200} placeholder="যেমন: অষ্টমীর সকাল ১০টা" />
        </div>
        <div>
          <label className="label" htmlFor="bisorjon_time">
            বিসর্জনের সময়
          </label>
          <input id="bisorjon_time" name="bisorjon_time" className="input" maxLength={200} placeholder="যেমন: দশমীর বিকাল ৪টা" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="detail">
          বিস্তারিত (ঐচ্ছিক)
        </label>
        <textarea id="detail" name="detail" className="input min-h-[120px]" maxLength={2000} />
      </div>
    </>
  );
}
