import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="wrap py-10">
      <h1 className="text-3xl text-accent">পাতাটি পাওয়া যায়নি</h1>
      <p className="mt-3">ঠিকানাটি ভুল হতে পারে, অথবা তথ্যটি আর প্রকাশিত নেই।</p>
      <p className="mt-5">
        <Link href="/" className="btn">
          হোমে ফিরুন
        </Link>
      </p>
    </div>
  );
}
