const DIGITS = '০১২৩৪৫৬৭৮৯';

export function bn(n: number | string): string {
  return String(n).replace(/\d/g, (d) => DIGITS[Number(d)]);
}

export function fmtDateTime(iso?: string | null): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('bn-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Dhaka',
  }).format(new Date(iso));
}

export function fmtTime(iso?: string | null): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('bn-BD', {
    timeStyle: 'short',
    timeZone: 'Asia/Dhaka',
  }).format(new Date(iso));
}

export function fmtDate(iso?: string | null): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('bn-BD', {
    dateStyle: 'long',
    timeZone: 'Asia/Dhaka',
  }).format(new Date(iso));
}

// ঢাকার সময় অনুযায়ী দিনের চাবি (YYYY-MM-DD)
export function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString('sv-SE', { timeZone: 'Asia/Dhaka' });
}

// datetime-local ঘরের মান ↔ ISO (সবসময় ঢাকার সময়)
export function toInputDT(iso?: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('sv-SE', { timeZone: 'Asia/Dhaka' }).replace(' ', 'T').slice(0, 16);
}

export function fromInputDT(v: string): string | null {
  if (!v) return null;
  const d = new Date(`${v}:00+06:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
