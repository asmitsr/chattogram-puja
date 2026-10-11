import PlacePicker from '@/components/PlacePicker';
import { KIND_LABEL } from '@/lib/types';

const MAP_ID = '1IhlYJKsVryrIXpckFWpbNXWLCxi6sWw';
const MAP_EMBED = `https://www.google.com/maps/d/embed?mid=${MAP_ID}&ehbc=2E312F`;
const MAP_OPEN = `https://www.google.com/maps/d/viewer?mid=${MAP_ID}`;

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
      <div>
        <span className="label">মণ্ডপের অবস্থান (ম্যাপে দেখুন)</span>
        <div className="relative w-full overflow-hidden rounded-md border border-line" style={{ paddingBottom: '75%' }}>
          <iframe
            src={MAP_EMBED}
            title="মণ্ডপের অবস্থানের ম্যাপ"
            className="absolute left-0 top-0 h-full w-full border-0"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <div className="mt-3 flex justify-end">
          <a href={MAP_OPEN} target="_blank" rel="noopener noreferrer" className="btn">
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
            </svg>
            গুগল ম্যাপে খুলুন
          </a>
        </div>
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
