// যেকোনো পাতায় চাপ দেওয়া মাত্র এটি দেখায়; আসল পাতা তৈরি হলে বদলে যায়। (ল্যাগের অনুভূতি কমায়)
export default function Loading() {
  return (
    <div className="wrap space-y-4 py-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">লোড হচ্ছে…</span>
      <div className="h-8 w-2/3 animate-pulse rounded-md bg-goldsoft" />
      <div className="h-4 w-1/2 animate-pulse rounded-md bg-line" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card space-y-2">
            <div className="h-4 w-1/3 animate-pulse rounded-full bg-goldsoft" />
            <div className="h-6 w-4/5 animate-pulse rounded-md bg-line" />
            <div className="h-4 w-full animate-pulse rounded-md bg-line" />
          </div>
        ))}
      </div>
    </div>
  );
}
