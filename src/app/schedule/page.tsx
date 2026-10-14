import { SCHEDULE_HEADERS as H, SCHEDULE_ROWS, SCHEDULE_SUB, SCHEDULE_TITLE } from '@/lib/pujaSchedule';

export const metadata = { title: 'সময়সূচি' };

export default function SchedulePage() {
  return (
    <div className="wrap py-6">
      <header className="border-b-2 border-gold pb-3">
        <h1 className="font-display text-3xl leading-snug text-accent">{SCHEDULE_TITLE}</h1>
        <p className="mt-1 font-display text-xl text-gold">{SCHEDULE_SUB}</p>
      </header>

      {/* ছোট পর্দা (ফোন): প্রতিটি আচার একটি কার্ডে */}
      <ol className="mt-5 space-y-4 md:hidden">
        {SCHEDULE_ROWS.map((r, i) => (
          <li key={i} className="overflow-hidden rounded-md border border-line bg-surface">
            <div className="border-b border-line bg-goldsoft px-4 py-3">
              <h2 className="font-display text-xl leading-snug text-accent">{r.ritual}</h2>
              <p className="mt-1 font-semibold text-gold">{r.date}</p>
            </div>
            <div className="space-y-3 px-4 py-3">
              <div className="border-l-4 border-accent pl-3">
                <h3 className="text-sm font-bold text-accent">{H.guptapress.label}</h3>
                <p className="text-xs text-muted">{H.guptapress.note}</p>
                <p className="mt-1">{r.guptapress}</p>
              </div>
              <div className="border-l-4 border-gold pl-3">
                <h3 className="text-sm font-bold text-gold">{H.bishuddha.label}</h3>
                <p className="text-xs text-muted">{H.bishuddha.note}</p>
                <p className="mt-1">{r.bishuddha}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>

      {/* বড় পর্দা: ছক */}
      <div className="mt-5 hidden overflow-x-auto rounded-md border border-line md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-hero text-herofg">
              <th scope="col" className="w-[17%] px-4 py-3 align-bottom font-display text-lg font-normal">
                {H.ritual}
              </th>
              <th scope="col" className="w-[15%] px-4 py-3 align-bottom font-display text-lg font-normal">
                {H.date}
              </th>
              <th scope="col" className="w-[34%] px-4 py-3 align-bottom font-display text-lg font-normal">
                {H.guptapress.label}
                <span className="block font-body text-xs text-herogold">{H.guptapress.note}</span>
              </th>
              <th scope="col" className="w-[34%] px-4 py-3 align-bottom font-display text-lg font-normal">
                {H.bishuddha.label}
                <span className="block font-body text-xs text-herogold">{H.bishuddha.note}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {SCHEDULE_ROWS.map((r, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-surface' : 'bg-goldsoft'}>
                <th scope="row" className="border-t border-line px-4 py-3 align-top font-display text-lg font-normal text-accent">
                  {r.ritual}
                </th>
                <td className="border-t border-line px-4 py-3 align-top font-semibold text-gold">{r.date}</td>
                <td className="border-t border-line px-4 py-3 align-top">{r.guptapress}</td>
                <td className="border-t border-line px-4 py-3 align-top">{r.bishuddha}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
