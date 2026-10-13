// আপনার Google My Maps (যেখানে সব ॐ চিহ্ন আছে)। Vercel-এ NEXT_PUBLIC_MY_MAPS_ID দিলে সেটি আগে ব্যবহার হয়।
// এই লিংক খুললে গুগল ম্যাপে সেই মণ্ডপ ঘিরে আশেপাশের সব পূজার ॐ চিহ্নও দেখা যায় (বন্ধুর ম্যাপের মতো)।
export const MY_MAPS_ID = process.env.NEXT_PUBLIC_MY_MAPS_ID || '11un1DpH9VJ2TsVjSuQs8ExkCsiKb_J0';

export function myMapsUrl(lat: number, lng: number, zoom = 16): string {
  return `https://www.google.com/maps/d/viewer?mid=${MY_MAPS_ID}&ll=${lat.toFixed(6)}%2C${lng.toFixed(6)}&z=${zoom}`;
}

// দূরত্ব হিসাব (মিটার): হ্যাভারসাইন সূত্র
export function distanceM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLng = (bLng - aLng) * rad;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
