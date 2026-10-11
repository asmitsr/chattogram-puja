import PujaMapEmbed from '@/components/PujaMapEmbed';

export const metadata = { title: 'ম্যাপ' };

export default function MapPage() {
  return (
    <div className="wrap space-y-4 py-6">
      <h1 className="text-3xl text-accent">ম্যাপে মণ্ডপ</h1>
      <p className="muted">পিনে চাপ দিলে মণ্ডপের নাম ও বিস্তারিত দেখা যাবে।</p>
      <PujaMapEmbed ratio={110} />
    </div>
  );
}
