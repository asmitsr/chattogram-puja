// ব্রাউজারে সংরক্ষিত এলোমেলো পরিচয় (লগইন লাগে না); লাইক গোনার জন্য।
const VOTER_KEY = 'cp_voter';

export function readLS(k: string): string | null {
  try {
    return window.localStorage.getItem(k);
  } catch {
    return null;
  }
}
export function writeLS(k: string, v: string) {
  try {
    window.localStorage.setItem(k, v);
  } catch {
    /* ব্রাউজার সংরক্ষণ বন্ধ থাকলে চলবে, শুধু মনে থাকবে না */
  }
}
export function voterId(): string {
  let v = readLS(VOTER_KEY);
  if (!v || !/^[A-Za-z0-9-]{16,64}$/.test(v)) {
    v = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}-xxxxxxxx`;
    writeLS(VOTER_KEY, v);
  }
  return v;
}
