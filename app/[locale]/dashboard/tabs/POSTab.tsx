'use client';

import { memo, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';

interface POSTabProps {
  products: { id: string; active?: number }[];
  loadingProducts: boolean;
}

export const POSTab = memo(function POSTab({ products }: POSTabProps) {
  const t = useTranslations('dashboard.pos');
  const [hasPin, setHasPin] = useState<boolean | null>(null);

  useEffect(() => {
    api.hasPosPin()
      .then(r => setHasPin(r.has_pin))
      .catch(() => setHasPin(null));
  }, []);

  const productCount = products.filter(p => p.active === 1).length;

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">{t('title')}</span>
      </div>

      <div style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' }}>
        {/* POS icon */}
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--cp-cyan)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </div>

        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cp-text)', marginBottom: 6 }}>
            {t('launcherTitle')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 1.6, maxWidth: 400 }}>
            {t('launcherDesc')}
          </div>
        </div>

        {/* Status indicators */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--cp-text-muted)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: productCount > 0 ? 'var(--cp-green)' : 'var(--cp-yellow)' }} />
            {t('productCount', { count: productCount })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--cp-text-muted)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: hasPin ? 'var(--cp-green)' : 'var(--cp-text-dim)' }} />
            {hasPin ? t('pinSet') : t('pinNotSet')}
          </div>
        </div>

        {/* Open POS button */}
        <a
          href="/pos"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
          style={{
            padding: '14px 40px',
            fontSize: 13,
            letterSpacing: 2,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {t('openPos')}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>

        {/* Quick links */}
        <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'var(--cp-text-dim)' }}>
          <span style={{ cursor: 'default' }}>{t('features')}</span>
        </div>
        <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', lineHeight: 2, maxWidth: 320 }}>
          {t('featureList')}
        </div>
      </div>
    </div>
  );
});
