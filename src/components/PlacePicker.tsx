'use client';

import { useState } from 'react';
import { CTG_FLAT, CTG_GROUPS, OTHER_AREA } from '@/lib/ctgPlaces';

// চট্টগ্রামের থানা/উপজেলা বেছে নিলে নিচে তার এলাকার তালিকা আসে
export default function PlacePicker() {
  const [thana, setThana] = useState('');
  const list = thana ? CTG_FLAT[thana] ?? [] : [];

  return (
    <div className="space-y-4">
      <div>
        <label className="label" htmlFor="thana">
          থানা / উপজেলা (চট্টগ্রাম জেলা)
        </label>
        <select id="thana" name="thana" className="input" required value={thana} onChange={(e) => setThana(e.target.value)}>
          <option value="">বেছে নিন</option>
          {CTG_GROUPS.map((g) => (
            <optgroup key={g.label} label={g.label}>
              {Object.keys(g.places).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="locality">
          এলাকা
        </label>
        <select id="locality" name="locality" className="input" required disabled={!thana} defaultValue="" key={thana}>
          <option value="">{thana ? 'এলাকা বেছে নিন' : 'আগে থানা/উপজেলা বেছে নিন'}</option>
          {list.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
          {thana && <option value={OTHER_AREA}>{OTHER_AREA}</option>}
        </select>
      </div>
    </div>
  );
}
