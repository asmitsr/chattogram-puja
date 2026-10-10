import Flash from '@/components/Flash';
import { requireAdmin } from '@/lib/admin';
import { fmtDateTime, toInputDT } from '@/lib/bn';
import type { Notice } from '@/lib/types';
import { deleteNotice, saveNotice } from '../../actions';

export default async function AdminNotices({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(50);
  const list = (data ?? []) as Notice[];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl text-accent">জরুরি নোটিশ</h1>
      <p className="muted">সক্রিয় নোটিশ হোম পাতার ওপরে সবাই দেখে। মেয়াদ পার হলে নিজে থেকে লুকিয়ে যায়।</p>
      <Flash ok={searchParams.ok} err={searchParams.err} />

      <form action={saveNotice} className="card space-y-3">
        <h2 className="text-xl text-accent">নতুন নোটিশ</h2>
        <div>
          <label className="label" htmlFor="nt-title">
            শিরোনাম
          </label>
          <input id="nt-title" name="title" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="nt-body">
            বিস্তারিত (ঐচ্ছিক)
          </label>
          <textarea id="nt-body" name="body" className="input min-h-[80px]" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="nt-exp">
              মেয়াদ শেষ (ঐচ্ছিক, ঢাকার সময়)
            </label>
            <input id="nt-exp" name="expires_at" type="datetime-local" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="nt-act">
              অবস্থা
            </label>
            <select id="nt-act" name="is_active" className="input" defaultValue="yes">
              <option value="yes">সক্রিয়</option>
              <option value="no">বন্ধ</option>
            </select>
          </div>
        </div>
        <button className="btn" type="submit">
          সংরক্ষণ
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="text-xl text-accent">সব নোটিশ</h2>
        {list.length === 0 && <p className="muted">এখনো কোনো নোটিশ নেই।</p>}
        {list.map((n) => (
          <div key={n.id} className="card space-y-3">
            <form action={saveNotice} className="space-y-3">
              <input type="hidden" name="id" value={n.id} />
              <div className="muted">তৈরি: {fmtDateTime(n.created_at)}</div>
              <div>
                <label className="label" htmlFor={`t-${n.id}`}>
                  শিরোনাম
                </label>
                <input id={`t-${n.id}`} name="title" className="input" defaultValue={n.title} required />
              </div>
              <div>
                <label className="label" htmlFor={`b-${n.id}`}>
                  বিস্তারিত
                </label>
                <textarea id={`b-${n.id}`} name="body" className="input min-h-[70px]" defaultValue={n.body ?? ''} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor={`e-${n.id}`}>
                    মেয়াদ শেষ
                  </label>
                  <input id={`e-${n.id}`} name="expires_at" type="datetime-local" className="input" defaultValue={toInputDT(n.expires_at)} />
                </div>
                <div>
                  <label className="label" htmlFor={`a-${n.id}`}>
                    অবস্থা
                  </label>
                  <select id={`a-${n.id}`} name="is_active" className="input" defaultValue={n.is_active ? 'yes' : 'no'}>
                    <option value="yes">সক্রিয়</option>
                    <option value="no">বন্ধ</option>
                  </select>
                </div>
              </div>
              <button className="btn" type="submit">
                আপডেট
              </button>
            </form>
            <form action={deleteNotice} className="flex flex-wrap items-center gap-3 border-t border-line pt-3">
              <input type="hidden" name="id" value={n.id} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="confirm" value="yes" />
                স্থায়ীভাবে মুছতে চাই
              </label>
              <button className="btn-danger !min-h-0 !py-1" type="submit">
                মুছুন
              </button>
            </form>
          </div>
        ))}
      </section>
    </div>
  );
}
