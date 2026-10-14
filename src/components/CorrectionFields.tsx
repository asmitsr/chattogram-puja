'use client';

import { useState } from 'react';
import LocationGuide from '@/components/LocationGuide';
import LocationPicker from '@/components/LocationPicker';
import PlacePicker from '@/components/PlacePicker';
import type { Pin } from '@/components/mapKit';
import type { CorrectionBase } from '@/lib/correction';
import { matches } from '@/lib/search';

// "ভুল তথ্যের সংশোধন": আগে মণ্ডপ বাছাই, তারপর বর্তমান তথ্য ভরা ঘরগুলোতে বদল। কোনো ঘরই বাধ্যতামূলক নয়।
export default function CorrectionFields({
  mandapas,
  pins,
  mandapaId,
  onSelect,
}: {
  mandapas: CorrectionBase[];
  pins: Pin[];
  mandapaId: string;
  onSelect: (id: string) => void;
}) {
  const [filter, setFilter] = useState('');
  const sel = mandapas.find((m) => m.id === mandapaId) ?? null;
  const shown = mandapas.filter((m) => m.id === mandapaId || matches(`${m.name} ${m.area ?? ''}`, filter));
  const lat = sel && sel.latitude !== null ? Number(sel.latitude) : NaN;
  const lng = sel && sel.longitude !== null ? Number(sel.longitude) : NaN;
  const initial = Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;

  return (
    <>
      <div className="space-y-2">
        <label className="label" htmlFor="mandapa_filter">
          কোন মণ্ডপের তথ্য ঠিক করতে চান?
        </label>
        <input
          id="mandapa_filter"
          className="input"
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="নাম লিখে খুঁজুন (বাংলা বা ইংরেজিতে)"
          autoComplete="off"
        />
        <select name="mandapa_id" className="input" required value={mandapaId} onChange={(e) => onSelect(e.target.value)} aria-label="মণ্ডপ বাছুন">
          <option value="">মণ্ডপ বেছে নিন ({shown.length}টি)</option>
          {shown.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {sel && (
        <div key={sel.id} className="space-y-4">
          <div>
            <label className="label" htmlFor="wrong">
              কী ভুল হয়েছে? (বর্ণনা)
            </label>
            <textarea
              id="wrong"
              name="wrong"
              className="input min-h-[100px]"
              maxLength={600}
              placeholder="যেমন: ঠিকানা ভুল আছে, মণ্ডপটি আসলে ... এর পাশে"
            />
          </div>

          <p className="muted">নিচের ঘরগুলোতে এখনকার তথ্য বসানো আছে। যা বদলাতে চান শুধু সেটুকু বদলান। কোনো ঘর বাধ্যতামূলক নয়।</p>

          <div>
            <label className="label" htmlFor="name">
              মণ্ডপের নাম
            </label>
            <input id="name" name="name" className="input" maxLength={150} defaultValue={sel.name} />
          </div>

          <div className="space-y-2">
            <p className="text-sm">
              বর্তমান এলাকা: <b>{sel.area || 'দেওয়া নেই'}</b>
            </p>
            <p className="muted">এলাকা বদলাতে চাইলে নিচে থানা ও এলাকা বেছে নিন। না বদলালে ফাঁকা রাখুন।</p>
            <PlacePicker optional />
          </div>

          <div>
            <label className="label" htmlFor="address">
              বিস্তারিত ঠিকানা (রাস্তা, গলি, বাড়ি/মোড়ের নাম)
            </label>
            <input id="address" name="address" className="input" maxLength={300} defaultValue={sel.address ?? ''} />
          </div>
          <div>
            <label className="label" htmlFor="contact">
              পূজা কমিটির যোগাযোগ (সাইটে প্রকাশ হবে)
            </label>
            <input id="contact" name="contact" className="input" maxLength={100} defaultValue={sel.contact ?? ''} />
          </div>
          <div>
            <span className="label">মণ্ডপের অবস্থান (ম্যাপে পিন বসান)</span>
            <LocationGuide />
            <LocationPicker pins={pins} initial={initial} />
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
                maxLength={400}
                placeholder={'যেমন:\nষষ্ঠী: বোধন ও অধিবাস\nসপ্তমী: কলাবউ স্নান'}
              />
            </div>
            <div>
              <label className="label" htmlFor="anjali_time">
                অঞ্জলির সময়
              </label>
              <input id="anjali_time" name="anjali_time" className="input" maxLength={100} placeholder="যেমন: অষ্টমীর সকাল ১০টা" />
            </div>
            <div>
              <label className="label" htmlFor="bisorjon_time">
                বিসর্জনের সময়
              </label>
              <input id="bisorjon_time" name="bisorjon_time" className="input" maxLength={100} placeholder="যেমন: দশমীর বিকাল ৪টা" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="detail">
              অতিরিক্ত বিবরণ (ঐচ্ছিক)
            </label>
            <textarea id="detail" name="detail" className="input min-h-[100px]" maxLength={600} />
          </div>
        </div>
      )}
    </>
  );
}
