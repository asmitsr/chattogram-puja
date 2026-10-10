import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t-[3px] border-herogold bg-hero py-6 text-sm text-herofg">
      <div className="wrap flex flex-wrap items-center justify-between gap-2">
        <p>চট্টগ্রামের পুজো · চট্টগ্রামের দুর্গাপূজার মণ্ডপ, ম্যাপ ও সময়সূচি</p>
        <Link href="/admin/login" className="text-herofg opacity-80">
          অ্যাডমিন
        </Link>
      </div>
    </footer>
  );
}
