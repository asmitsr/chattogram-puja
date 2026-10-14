import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        fg: 'var(--fg)',
        muted: 'var(--muted)',
        line: 'var(--line)',
        accent: 'var(--accent)',
        btn: 'var(--btn-bg)',
        btnfg: 'var(--btn-fg)',
        gold: 'var(--gold)',
        goldsoft: 'var(--gold-soft)',
        hero: 'var(--hero-bg)',
        herofg: 'var(--hero-fg)',
        herogold: 'var(--hero-gold)',
        ok: 'var(--ok)',
        okbg: 'var(--ok-bg)',
        warn: 'var(--warn)',
        warnbg: 'var(--warn-bg)',
        err: 'var(--err)',
      },
      fontFamily: {
        display: ['"Noto Sans Bengali"', '"Tiro Bangla"', '"Noto Serif Bengali"', 'Georgia', 'serif'],
        body: ['"Noto Sans Bengali"', '"Hind Siliguri"', '"Segoe UI"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
