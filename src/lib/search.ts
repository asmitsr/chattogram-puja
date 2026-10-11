// বাংলা খোঁজার সুবিধা: বানানের ছোটখাটো ভেদ (পুজা/পূজা, মন্ডপ/মণ্ডপ, দুর্গা/দূর্গা) ধরা পড়ে।
// ইংরেজি অক্ষরে (Chawkbazar, Jamalkhan, jamal khan…) লিখলেও বাংলা নামের সাথে মেলে —
// দুই দিকের লেখাকেই একটি সাধারণ "ধ্বনি-কাঠামো" (শুধু ব্যঞ্জনের ধ্বনি-দল) এ রূপান্তর করে মেলানো হয়।
export function norm(input: string): string {
  return input
    .normalize('NFC')
    .toLowerCase()
    .replace(/[‌‍]/g, '')
    .replace(/ূ/g, 'ু')
    .replace(/ী/g, 'ি')
    .replace(/ণ/g, 'ন')
    .replace(/[শষ]/g, 'স')
    .replace(/\s+/g, ' ')
    .trim();
}

// বাংলা ব্যঞ্জন → ধ্বনি-দল। স্বরবর্ণ ও কারচিহ্ন বাদ যায় (ইংরেজি বানানে স্বর অনিশ্চিত)।
const BN: Record<string, string> = {
  'ক': 'k', 'খ': 'k', 'গ': 'k', 'ঘ': 'k',
  'চ': 'c', 'ছ': 'c',
  'জ': 'j', 'ঝ': 'j', 'য': 'j',
  'ট': 't', 'ঠ': 't', 'ড': 't', 'ঢ': 't', 'ত': 't', 'থ': 't', 'দ': 't', 'ধ': 't', 'ৎ': 't',
  'ণ': 'n', 'ন': 'n', 'ঙ': 'n', 'ঞ': 'n', 'ং': 'n',
  'প': 'p', 'ফ': 'p',
  'ব': 'b', 'ভ': 'b',
  'ম': 'm', 'র': 'r', 'ল': 'l',
  'শ': 's', 'ষ': 's', 'স': 's',
  'হ': 'h',
};

function collapse(s: string): string {
  // একই ধ্বনি পরপর থাকলে একটি; আর "ঙ্গ" (n+k) ও ইংরেজি "ng" যেন একই দাঁড়ায়
  return s.replace(/(.)\1+/g, '$1').replace(/nk/g, 'n');
}

export function bengaliKey(text: string): string {
  // ড়, ঢ় → 'র'; য় (উচ্চারণে y/w) বাদ
  const t = text.normalize('NFC').replace(/[ডঢ]়/g, 'র').replace(/য়/g, '');
  let out = '';
  for (const ch of t) out += BN[ch] ?? '';
  return collapse(out);
}

// ইংরেজি (রোমান) লেখা → একই ধ্বনি-দল।
export function latinKey(text: string): string {
  const t = text.toLowerCase().replace(/[^a-z]/g, ' ');
  let out = '';
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    const n = t[i + 1];
    if (c === ' ') continue;
    if (c === 'c' && n === 'h') { out += 'c'; i++; if (t[i + 1] === 'h') i++; continue; }
    if (c === 's' && n === 'h') { out += 's'; i++; continue; }
    if ('kgdtbjpc'.includes(c) && n === 'h') {
      out += c === 'k' || c === 'g' || c === 'c' ? 'k' : c === 'p' ? 'p' : c === 'b' ? 'b' : c === 'j' ? 'j' : 't';
      i++;
      continue;
    }
    if (c === 'n' && n === 'g') { out += 'n'; i++; continue; }
    if ('aeiouwy'.includes(c)) continue;
    if ('kgqcx'.includes(c)) out += 'k';
    else if ('jz'.includes(c)) out += 'j';
    else if ('tdn'.includes(c)) out += c === 'n' ? 'n' : 't';
    else if ('pf'.includes(c)) out += 'p';
    else if ('bv'.includes(c)) out += 'b';
    else if (c === 'm' || c === 'r' || c === 'l' || c === 'h') out += c;
    else if (c === 's') out += 's';
  }
  return collapse(out);
}

const HAS_LATIN = /[a-z]/i;

// লেখাকে শব্দে ভাগ করা (ফাঁকা, কমা, হাইফেন, বন্ধনী ইত্যাদিতে)। শব্দের সীমা না রাখলে
// পাশাপাশি দুই শব্দের ব্যঞ্জন জুড়ে ভুল মিল তৈরি হয়।
function words(text: string): string[] {
  return text
    .normalize('NFC')
    .replace(/[‌‍]/g, '')
    .split(/[^ঀ-৿a-zA-Z0-9]+/)
    .filter(Boolean);
}

function wordKeys(text: string): string[] {
  const keys: string[] = [];
  for (const w of words(text)) {
    const k = HAS_LATIN.test(w) ? latinKey(w) : bengaliKey(w);
    if (k) keys.push(k);
  }
  return keys;
}

// খোঁজার প্রতিটি শব্দ লেখাটির কোথাও থাকলেই মিলে যায়।
// বাংলায় লিখলে বাংলা বানান-মিল; ইংরেজিতে লিখলে ধ্বনি-মিল (এবং হুবহু ইংরেজি লেখাও)।
// ধ্বনি-মিল হয় শুধু একটি শব্দের ভেতরে, শব্দ ডিঙিয়ে নয়।
export function matches(haystack: string, query: string): boolean {
  const q = norm(query);
  if (!q) return true;
  const h = norm(haystack);
  let keys: string[] | null = null;
  return q.split(' ').every((w) => {
    if (h.includes(w)) return true;
    if (!HAS_LATIN.test(w)) return false;
    const wk = latinKey(w);
    if (!wk) return false;
    keys ??= wordKeys(haystack);
    // খুব ছোট (১-২ ধ্বনির) খোঁজা শুধু শব্দের শুরুতে মেলে, নইলে প্রায় সবই মিলে যেত
    return wk.length < 3 ? keys.some((k) => k.startsWith(wk)) : keys.some((k) => k.includes(wk));
  });
}
