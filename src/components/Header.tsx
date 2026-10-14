import Link from 'next/link';
import Lotus from '@/components/Lotus';
import SiteLike from '@/components/SiteLike';

// উপরের বারে শুধু নাম ও লাইক; পাতা বদলের মেনু নিচের স্থায়ী মেনুতে (BottomNav)।
export default function Header() {
  return (
    <header className="hx-header sticky top-0 z-20">
      <div className="wrap flex items-center justify-between gap-3 py-2.5">
        <Link href="/" className="hx-brand no-underline">
          <Lotus size={30} className="text-herogold" />
          <span>চট্টগ্রামের পুজো</span>
        </Link>
        <SiteLike />
      </div>
    </header>
  );
}
