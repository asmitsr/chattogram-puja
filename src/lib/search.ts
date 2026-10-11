// বাংলা খোঁজার সুবিধা: বানানের ছোটখাটো ভেদ (পুজা/পূজা, মন্ডপ/মণ্ডপ, দুর্গা/দূর্গা) ধরা পড়ে।
// ইংরেজি অক্ষরে বড়-ছোট হাতের ভেদ থাকে না।
export function norm(input: string): string {
  return input
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\u200c\u200d]/g, '')
    .replace(/ূ/g, 'ু')
    .replace(/ী/g, 'ি')
    .replace(/ণ/g, 'ন')
    .replace(/[শষ]/g, 'স')
    .replace(/\s+/g, ' ')
    .trim();
}

// খোঁজার প্রতিটি শব্দ লেখাটির কোথাও থাকলেই মিলে যায়।
export function matches(haystack: string, query: string): boolean {
  const q = norm(query);
  if (!q) return true;
  const h = norm(haystack);
  return q.split(' ').every((w) => h.includes(w));
}
