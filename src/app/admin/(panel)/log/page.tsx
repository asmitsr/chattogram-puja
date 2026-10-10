import { requireAdmin } from '@/lib/admin';
import { fmtDateTime } from '@/lib/bn';

interface Row {
  id: number;
  action: string;
  table_name: string | null;
  record_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export default async function LogPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(100);
  const rows = (data ?? []) as Row[];

  return (
    <div className="space-y-4">
      <h1 className="text-3xl text-accent">Activity Log</h1>
      <p className="muted">অ্যাডমিনের গুরুত্বপূর্ণ কাজের তালিকা, সর্বশেষ ১০০টি। এখান থেকে কিছু বদলানো বা মোছা যায় না।</p>
      {rows.length === 0 && <p className="muted">এখনো কিছু নেই।</p>}
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="card text-sm">
            <b className="font-mono">{r.action}</b> <span className="muted">· {fmtDateTime(r.created_at)}</span>
            {r.details && <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-xs text-muted">{JSON.stringify(r.details)}</pre>}
          </li>
        ))}
      </ul>
    </div>
  );
}
