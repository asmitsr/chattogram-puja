'use client';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="wrap py-10">
      <h1 className="text-3xl text-accent">কিছু একটা ভুল হয়েছে</h1>
      <p className="mt-3">পাতাটি এখন দেখানো যাচ্ছে না। একটু পরে আবার চেষ্টা করুন।</p>
      <p className="mt-5">
        <button type="button" className="btn" onClick={() => reset()}>
          আবার চেষ্টা করুন
        </button>
      </p>
    </div>
  );
}
