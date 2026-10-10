import Link from 'next/link';
import type { Mandapa } from '@/lib/types';

export default function MandapaCard({ m }: { m: Mandapa }) {
  return (
    <Link href={`/mandapa/${m.id}`} className="card block text-fg no-underline hover:border-accent">
      {m.area && <span className="badge">{m.area}</span>}
      <h3 className="mt-1.5 text-xl text-accent">{m.name}</h3>
      {m.address && <p className="muted mt-1">{m.address}</p>}
    </Link>
  );
}
