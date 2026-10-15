// বিবরণ (description) ↔ আলাদা ঘর: বিস্তারিত + কোন দিন কী পূজা + অঞ্জলির সময় + বিসর্জনের সময়
// জমা-ফর্ম অনুমোদনের সময় যে আকারে বিবরণ তৈরি হয়, ঠিক সেই আকারেই ভাঙা ও জোড়া হয়।
export type DescParts = { detail: string; puja_plan: string; anjali_time: string; bisorjon_time: string };

export function splitDescription(desc: string | null | undefined): DescParts {
  let rest = (desc ?? '').replace(/\r\n/g, '\n');
  const out: DescParts = { detail: '', puja_plan: '', anjali_time: '', bisorjon_time: '' };
  let m = rest.match(/(?:^|\n)বিসর্জনের সময়: ([^\n]*)\s*$/);
  if (m) {
    out.bisorjon_time = m[1].trim();
    rest = rest.slice(0, m.index);
  }
  m = rest.match(/(?:^|\n)অঞ্জলির সময়: ([^\n]*)\s*$/);
  if (m) {
    out.anjali_time = m[1].trim();
    rest = rest.slice(0, m.index);
  }
  m = rest.match(/(?:^|\n)কোন দিন কী পূজা:\n([\s\S]*)$/);
  if (m) {
    out.puja_plan = m[1].trim();
    rest = rest.slice(0, m.index);
  }
  out.detail = rest.trim();
  return out;
}

export function joinDescription(p: DescParts): string {
  const extra = [
    p.puja_plan ? `কোন দিন কী পূজা:\n${p.puja_plan}` : '',
    p.anjali_time ? `অঞ্জলির সময়: ${p.anjali_time}` : '',
    p.bisorjon_time ? `বিসর্জনের সময়: ${p.bisorjon_time}` : '',
  ]
    .filter(Boolean)
    .join('\n');
  return [p.detail, extra].filter(Boolean).join('\n\n');
}
