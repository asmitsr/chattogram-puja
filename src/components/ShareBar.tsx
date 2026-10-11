'use client';

import { useState } from 'react';

const BTN =
  'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white no-underline cursor-pointer';

// মণ্ডপের পাতা শেয়ার: ফেসবুক, মেসেঞ্জার, হোয়াটসঅ্যাপ ও আরও শেয়ার অপশন (লিংক কপিসহ)
export default function ShareBar({ title, what = 'এই মণ্ডপের তথ্য' }: { title: string; what?: string }) {
  const [msg, setMsg] = useState('');

  const url = () => window.location.href.split('#')[0];
  const flash = (t: string) => {
    setMsg(t);
    setTimeout(() => setMsg(''), 3500);
  };

  async function copy(): Promise<boolean> {
    const u = url();
    try {
      await navigator.clipboard.writeText(u);
      return true;
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = u;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
      } catch {
        return false;
      }
    }
  }

  function facebook() {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url())}`, '_blank', 'noopener,noreferrer');
  }

  async function messenger() {
    const u = url();
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      // ফোনে মেসেঞ্জার অ্যাপ খোলে; না থাকলে লিংক কপি হয়ে যায়
      const t = setTimeout(() => void copy().then((ok) => ok && flash('লিংক কপি হয়েছে। মেসেঞ্জারে পেস্ট করে পাঠান।')), 1500);
      window.addEventListener('pagehide', () => clearTimeout(t), { once: true });
      window.location.href = `fb-messenger://share/?link=${encodeURIComponent(u)}`;
    } else {
      const ok = await copy();
      flash(ok ? 'লিংক কপি হয়েছে। মেসেঞ্জারে পেস্ট করে পাঠান।' : 'লিংক কপি করা যায়নি।');
      window.open('https://www.messenger.com/', '_blank', 'noopener,noreferrer');
    }
  }

  function whatsapp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${title}\n${url()}`)}`, '_blank', 'noopener,noreferrer');
  }

  async function more() {
    const u = url();
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text: title, url: u });
        return;
      } catch (e) {
        if ((e as { name?: string })?.name === 'AbortError') return;
      }
    }
    flash((await copy()) ? 'লিংক কপি হয়েছে।' : 'লিংক কপি করা যায়নি।');
  }

  return (
    <div className="space-y-2 border-t border-line pt-4 text-center">
      <p className="muted">{what} অন্যদের সাথে শেয়ার করুন:</p>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" className={BTN} style={{ background: '#1877f2' }} onClick={facebook}>
          <span aria-hidden="true" className="font-bold">f</span> ফেসবুক
        </button>
        <button type="button" className={BTN} style={{ background: '#0a7cff' }} onClick={() => void messenger()}>
          <span aria-hidden="true">💬</span> মেসেঞ্জার
        </button>
        <button type="button" className={BTN} style={{ background: '#1fa855' }} onClick={whatsapp}>
          <span aria-hidden="true">✆</span> হোয়াটসঅ্যাপ
        </button>
        <button type="button" className={BTN} style={{ background: '#8a3ffc' }} onClick={() => void more()}>
          <span aria-hidden="true">⤴</span> আরও শেয়ার অপশন
        </button>
      </div>
      <p role="status" aria-live="polite" className="min-h-[1.25rem] text-sm font-semibold text-ok">
        {msg}
      </p>
    </div>
  );
}
