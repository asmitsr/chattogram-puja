'use client';

import { useEffect, useState } from 'react';

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

// সার্ভিস ওয়ার্কার চালু করা + "অ্যাপ ইনস্টল করুন" বোতাম।
// Chrome/Edge/Samsung ব্রাউজারে সরাসরি ইনস্টল; iPhone-এ Safari-র "Add to Home Screen" নিয়ম দেখায়।
export default function InstallApp() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});

    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) {
      setInstalled(true);
      return;
    }
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setEvt(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed || (!evt && !ios)) return null;

  async function install() {
    if (evt) {
      await evt.prompt();
      await evt.userChoice.catch(() => null);
      setEvt(null);
    } else {
      setHint((v) => !v);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={install}
        className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full border border-herogold bg-transparent px-3 py-1 text-xs font-semibold text-herofg"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M5 20h14v-2H5v2zM12 3v10.2l3.6-3.6L17 11l-5 5-5-5 1.4-1.4L11 13.2V3h1z" />
        </svg>
        অ্যাপ ইনস্টল করুন
      </button>
      {hint && ios && (
        <p className="max-w-xs text-xs leading-relaxed opacity-90">
          Safari-তে নিচের শেয়ার (⬆) বোতাম চাপুন, তারপর "Add to Home Screen" বেছে নিন।
        </p>
      )}
    </div>
  );
}
