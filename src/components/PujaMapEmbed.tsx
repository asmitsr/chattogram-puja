// গুগল মাই ম্যাপস এমবেড: কোনো এপিআই কি লাগে না। পূজা মানচিত্র একটি জায়গায় রাখা, দুই পেজেই ব্যবহার হয়।
const MAP_ID = '1IhlYJKsVryrIXpckFWpbNXWLCxi6sWw';
const MAP_EMBED = `https://www.google.com/maps/d/embed?mid=${MAP_ID}&ehbc=2E312F`;
const MAP_OPEN = `https://www.google.com/maps/d/viewer?mid=${MAP_ID}`;

export default function PujaMapEmbed({ ratio = 75 }: { ratio?: number }) {
  return (
    <div>
      <div className="relative w-full overflow-hidden rounded-md border border-line" style={{ paddingBottom: `${ratio}%` }}>
        <iframe
          src={MAP_EMBED}
          title="চট্টগ্রামের পূজামণ্ডপের ম্যাপ"
          className="absolute left-0 top-0 h-full w-full border-0"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div className="mt-3 flex justify-end">
        <a href={MAP_OPEN} target="_blank" rel="noopener noreferrer" className="btn">
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
          </svg>
          গুগল ম্যাপে খুলুন
        </a>
      </div>
    </div>
  );
}
