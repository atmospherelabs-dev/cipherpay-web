'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { useEffect, useRef, useState } from 'react';

const LABELS: Record<string, string> = {
  en: 'English',
  pt: 'Português',
  es: 'Español',
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleSelect = (newLocale: string) => {
    setOpen(false);
    if (newLocale !== locale) {
      router.replace(pathname, { locale: newLocale });
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Language"
        aria-expanded={open}
        style={{
          width: 36,
          height: 36,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 4,
          border: '1px solid var(--cp-border)',
          background: 'var(--cp-hover)',
          cursor: 'pointer',
          color: 'inherit',
          padding: 0,
          transition: 'border-color 0.2s',
          position: 'relative',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" />
        </svg>
        <span style={{
          position: 'absolute',
          bottom: 2,
          right: 2,
          fontSize: 7,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: 0.3,
          color: 'var(--cp-text-muted)',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-mono, monospace)',
        }}>
          {locale.toUpperCase()}
        </span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          background: 'var(--cp-surface)',
          border: '1px solid var(--cp-border)',
          borderRadius: 8,
          padding: 4,
          minWidth: 140,
          zIndex: 100,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}>
          {routing.locales.map((loc) => (
            <button
              key={loc}
              onClick={() => handleSelect(loc)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                borderRadius: 6,
                background: loc === locale ? 'var(--cp-hover)' : 'transparent',
                color: loc === locale ? 'var(--cp-cyan)' : 'var(--cp-text)',
                cursor: 'pointer',
                fontSize: 13,
                fontFamily: 'inherit',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (loc !== locale) e.currentTarget.style.background = 'var(--cp-hover)';
              }}
              onMouseLeave={(e) => {
                if (loc !== locale) e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 0.5,
                color: loc === locale ? 'var(--cp-cyan)' : 'var(--cp-text-muted)',
                width: 20,
              }}>
                {loc.toUpperCase()}
              </span>
              <span>{LABELS[loc] ?? loc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
