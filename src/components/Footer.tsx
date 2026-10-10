import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t-[3px] border-herogold bg-hero py-6 text-sm text-herofg">
      <div className="wrap space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p>চট্টগ্রামের পুজো · চট্টগ্রামের দুর্গাপূজার মণ্ডপ, ম্যাপ ও সময়সূচি</p>
          <Link href="/admin/login" className="text-herofg opacity-80">
            অ্যাডমিন
          </Link>
        </div>

        <div className="rounded-xl border border-herogold p-4">
          <p className="text-xs uppercase tracking-wider opacity-80">ওয়েবসাইট তৈরি ও পরিচালনা</p>
          <p className="mt-1 text-lg font-semibold">Asmit Sarkar</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a
              href="tel:+8801859732897"
              className="inline-flex items-center gap-2 rounded-full border border-herogold px-4 py-2 text-herofg no-underline"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1z" />
              </svg>
              01859732897
            </a>
            <a
              href="https://www.facebook.com/share/1GNDaUSk2A/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Asmit Sarkar-এর ফেসবুক প্রোফাইল"
              className="inline-flex items-center gap-2 rounded-full bg-herogold px-4 py-2 font-medium text-hero no-underline"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12z" />
              </svg>
              ফেসবুকে যোগাযোগ
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
