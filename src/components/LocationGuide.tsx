'use client';

import { useState } from 'react';

// ───────── এখানে লেখা ও ভিডিও বদলানো যায় ─────────
const GUIDE_TITLE = 'গুগল ম্যাপে লোকেশন যুক্ত করার নিয়ম';
const GUIDE_STEPS: string[] = [
  'প্রথমে Google Maps খুলুন এবং সার্চ বারে মণ্ডলের আশেপাশের যেকোনো একটি পরিচিত স্থান সার্চ করে খুঁজে বের করুন।',
  'স্থানটির ওপর কিছুক্ষণ চেপে ধরে (Long Press) একটি পিন মার্ক করুন।',
  'এরপর Share (শেয়ার) অপশনে চাপ দিয়ে লোকেশনটির লিংক কপি করুন।',
  'কপি করা লিংকটি আমাদের নির্ধারিত খালি বক্সে পেস্ট করে দিন।',
];
const GUIDE_VIDEO_NOTE = 'সম্পূর্ণ প্রক্রিয়াটি ভিডিওতে দেখানো হয়েছে। বুঝতে অসুবিধা হলে অনুগ্রহ করে ভিডিওটি দেখে নিন।';

// ভিডিও: ফাইলটি public/videos/location-guide.mp4 নামে রাখুন।
// ইউটিউবে আপলোড করলে YOUTUBE_ID তে ভিডিওর আইডি বসান (যেমন 'dQw4w9WgXcQ'), তখন লোকাল ফাইল লাগবে না।
const VIDEO_SRC = '/videos/location-guide.mp4';
const VIDEO_POSTER = '/videos/location-guide-poster.jpg'; // ঐচ্ছিক; না থাকলে সমস্যা নেই
const YOUTUBE_ID = '';
// ──────────────────────────────────────────────

export default function LocationGuide() {
  const [videoFailed, setVideoFailed] = useState(false);

  return (
    <section className="mb-3 space-y-3 rounded-md border border-line bg-goldsoft p-3 sm:p-4" aria-labelledby="loc-guide-title">
      <h3 id="loc-guide-title" className="text-lg text-accent">
        📍 {GUIDE_TITLE}
      </h3>

      <ol className="list-decimal space-y-1.5 pl-5 text-sm">
        {GUIDE_STEPS.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      <p className="text-sm font-medium">📹 {GUIDE_VIDEO_NOTE}</p>

      {YOUTUBE_ID ? (
        <div className="overflow-hidden rounded-md border border-line bg-black" style={{ aspectRatio: '16 / 9' }}>
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_ID}?rel=0`}
            title="লোকেশন দেওয়ার ভিডিও গাইড"
            loading="lazy"
            allow="encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        !videoFailed && (
          <div className="mx-auto w-full max-w-[320px] overflow-hidden rounded-md border border-line bg-black">
            <video
              className="block h-auto max-h-[70vh] w-full"
              src={VIDEO_SRC}
              poster={VIDEO_POSTER}
              controls
              playsInline
              preload="metadata"
              onError={() => setVideoFailed(true)}
              aria-label="লোকেশন দেওয়ার ভিডিও গাইড"
            >
              আপনার ব্রাউজারে ভিডিও চলছে না। নিচের ধাপগুলো অনুসরণ করুন।
            </video>
          </div>
        )
      )}
    </section>
  );
}
