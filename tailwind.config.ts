import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cp: {
          bg: 'var(--cp-bg)',
          surface: 'var(--cp-surface)',
          border: 'var(--cp-border)',
          text: 'var(--cp-text)',
          muted: 'var(--cp-text-muted)',
          cyan: 'var(--cp-cyan)',
          purple: 'var(--cp-purple)',
          green: 'var(--cp-green)',
          yellow: 'var(--cp-yellow)',
          orange: 'var(--cp-orange)',
          red: 'var(--cp-red)',
        },
      },
      spacing: {
        'sp-1': '4px',
        'sp-2': '8px',
        'sp-3': '12px',
        'sp-4': '16px',
        'sp-5': '20px',
        'sp-6': '24px',
        'sp-7': '32px',
        'sp-8': '48px',
        'sp-9': '64px',
        'sp-10': '80px',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
