'use client';

import { useState } from 'react';

// পাসওয়ার্ডের ঘরে "দেখান" বোতাম: ফোনে ভুল টাইপ ধরতে সুবিধা।
export default function PasswordInput({ id, name }: { id: string; name: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={show ? 'text' : 'password'}
        autoComplete="current-password"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        required
        className="input pr-20"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-3 text-sm text-accent"
        aria-label={show ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখান'}
      >
        {show ? 'লুকান' : 'দেখান'}
      </button>
    </div>
  );
}
