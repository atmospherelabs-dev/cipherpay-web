'use client';

import { useTranslations } from 'next-intl';

const ZECMAP_URL = 'https://zecmap.com/';

type ZecMapPromptProps = {
  namespace: 'auth.register' | 'dashboard.overview';
};

export function ZecMapPrompt({ namespace }: ZecMapPromptProps) {
  const t = useTranslations(namespace);

  return (
    <div className="zecmap-prompt">
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, color: 'var(--cp-cyan)', marginBottom: 6 }}>
        {t('zecmapTitle')}
      </div>
      <p style={{ fontSize: 10, color: 'var(--cp-text-muted)', lineHeight: 1.6, marginBottom: 10 }}>
        {t('zecmapDesc')}
      </p>
      <a
        href={ZECMAP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="btn"
        style={{ display: 'inline-block', fontSize: 10, padding: '8px 14px' }}
      >
        {t('zecmapAction')}
      </a>
    </div>
  );
}
