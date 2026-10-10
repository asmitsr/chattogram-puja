import { KIND_LABEL } from '@/lib/types';

// লগইনসহ ও লগইন ছাড়া, দুই ফর্মেই একই ঘরগুলো
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
      <div>
        <label className="label" htmlFor="area">
          এলাকা
        </label>
        <input id="area" name="area" className="input" maxLength={100} placeholder="যেমন: আন্দরকিল্লা" />
      </div>
      <div>
        <label className="label" htmlFor="address">
          ঠিকানা
        </label>
        <input id="address" name="address" className="input" maxLength={300} />
      </div>
      <div>
        <label className="label" htmlFor="contact">
          পূজা কমিটির যোগাযোগ (ঐচ্ছিক, সাইটে প্রকাশ হতে পারে)
        </label>
        <input id="contact" name="contact" className="input" maxLength={100} />
      </div>
      <div>
        <label className="label" htmlFor="detail">
          বিস্তারিত
        </label>
        <textarea id="detail" name="detail" className="input min-h-[120px]" required minLength={10} maxLength={2000} />
      </div>
    </>
  );
}
