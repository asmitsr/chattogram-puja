// ভুল তথ্যের সংশোধন: প্রকাশিত মণ্ডপের বর্তমান তথ্য আর জমা দেওয়া তথ্যের পার্থক্য বের করা।
// একই ফাংশন ব্রাউজারে ("পরিবর্তন চেক করুন") ও সার্ভারে (জমার সময় আবার যাচাই) চলে।

export interface CorrectionBase {
  id: string;
  name: string;
  area: string | null;
  address: string | null;
  contact: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
}

export interface CorrectionInput {
  name: string;
  area: string; // থানা ও এলাকা বাছলে "এলাকা, থানা, চট্টগ্রাম"; না বাছলে ফাঁকা (এলাকা অপরিবর্তিত)
  address: string;
  contact: string;
  latitude: string;
  longitude: string;
  wrong: string;
  detail: string;
  puja_plan: string;
  anjali_time: string;
  bisorjon_time: string;
}

export interface Change {
  label: string;
  before: string;
  after: string;
}

export interface CorrectionDiff {
  changes: Change[]; // আগের তথ্য থেকে বদলানো ঘর
  notes: Change[]; // নতুন যোগ করা লেখা (বর্ণনা, সময়সূচি ইত্যাদি), "আগে" নেই
  hasAny: boolean;
}

const norm = (s: string | null | undefined) => (s ?? '').normalize('NFC').replace(/\s+/g, ' ').trim();
const num = (v: number | string | null | undefined): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export function computeChanges(orig: CorrectionBase, input: CorrectionInput): CorrectionDiff {
  const changes: Change[] = [];
  const notes: Change[] = [];

  const name = norm(input.name);
  if (name && name !== norm(orig.name)) changes.push({ label: 'মণ্ডপের নাম', before: norm(orig.name), after: name });

  const area = norm(input.area);
  if (area && area !== norm(orig.area)) changes.push({ label: 'এলাকা', before: norm(orig.area) || '(নেই)', after: area });

  const address = norm(input.address);
  if (address !== norm(orig.address)) changes.push({ label: 'ঠিকানা', before: norm(orig.address) || '(নেই)', after: address || '(মুছে ফেলতে চান)' });

  const contact = norm(input.contact);
  if (contact !== norm(orig.contact)) changes.push({ label: 'যোগাযোগ', before: norm(orig.contact) || '(নেই)', after: contact || '(মুছে ফেলতে চান)' });

  const oLat = num(orig.latitude);
  const oLng = num(orig.longitude);
  const nLat = num(input.latitude);
  const nLng = num(input.longitude);
  const hadPos = oLat !== null && oLng !== null;
  const hasPos = nLat !== null && nLng !== null;
  const fmt = (a: number, b: number) => `${a.toFixed(6)}, ${b.toFixed(6)}`;
  if (hasPos && (!hadPos || Math.abs(nLat - (oLat as number)) > 0.00001 || Math.abs(nLng - (oLng as number)) > 0.00001)) {
    changes.push({ label: 'ম্যাপে অবস্থান', before: hadPos ? fmt(oLat as number, oLng as number) : '(নেই)', after: fmt(nLat, nLng) });
  } else if (!hasPos && hadPos) {
    changes.push({ label: 'ম্যাপে অবস্থান', before: fmt(oLat as number, oLng as number), after: '(পিন মুছে ফেলতে চান)' });
  }

  const add = (label: string, v: string) => {
    const t = v.normalize('NFC').trim();
    if (t) notes.push({ label, before: '', after: t });
  };
  add('কী ভুল হয়েছে', input.wrong);
  add('কোন দিন কী পূজা', input.puja_plan);
  add('অঞ্জলির সময়', input.anjali_time);
  add('বিসর্জনের সময়', input.bisorjon_time);
  add('অতিরিক্ত বিবরণ', input.detail);

  return { changes, notes, hasAny: changes.length > 0 || notes.length > 0 };
}
