import Link from 'next/link';

const LINKS: [string, string][] = [
  ['/', 'হোম'],
  ['/mandapa', 'পূজামণ্ডপ'],
  ['/map', 'ম্যাপ'],
  ['/schedule', 'সময়সূচি'],
  ['/news', 'সংবাদ'],
  ['/archive', 'আর্কাইভ'],
  ['/submit', 'তথ্য জমা দিন'],
];

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b-[3px] border-herogold bg-hero text-herofg">
      <div className="wrap flex items-center justify-between gap-3 py-2.5">
        <Link href="/" className="font-display text-xl text-herofg no-underline">
          চট্টগ্রামের পুজো
        </Link>
      </div>
      <nav aria-label="প্রধান মেনু" className="wrap flex gap-1.5 overflow-x-auto pb-2">
        {LINKS.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="shrink-0 rounded-full border border-transparent px-3.5 py-1.5 font-medium text-herofg no-underline hover:border-herogold"
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
