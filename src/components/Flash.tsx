export default function Flash({ ok, err }: { ok?: string; err?: string }) {
  if (!ok && !err) return null;
  return (
    <div
      role={err ? 'alert' : 'status'}
      className={`mb-4 rounded-md p-3 font-semibold ${err ? 'bg-warnbg text-err' : 'bg-okbg text-ok'}`}
    >
      {err ?? ok}
    </div>
  );
}
