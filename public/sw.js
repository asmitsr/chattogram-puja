// ছোট সার্ভিস ওয়ার্কার: অ্যাপ ইনস্টলের জন্য দরকার। কোনো ডেটা জমিয়ে রাখে না,
// তাই সাইটে নতুন তথ্য এলে সবসময় সাথে সাথে দেখা যায়। ইন্টারনেট না থাকলে শুধু একটি বার্তা দেখায়।
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(
    fetch(e.request).catch(
      () =>
        new Response(
          '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;display:flex;min-height:100vh;align-items:center;justify-content:center;background:#34010a;color:#fbeed6;font-family:sans-serif;text-align:center;padding:24px"><p>ইন্টারনেট সংযোগ নেই। সংযোগ ফিরলে আবার চেষ্টা করুন।</p></body>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
        ),
    ),
  );
});
