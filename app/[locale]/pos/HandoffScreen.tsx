'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface HandoffScreenProps {
  onReady: () => void;
  onCancel: () => void;
}

export function HandoffScreen({ onReady, onCancel }: HandoffScreenProps) {
  const t = useTranslations('pos.handoff');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (countdown <= 0) {
      onReady();
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onReady]);

  return (
    <div className="pos-handoff-screen">
      <div className="pos-handoff-content">
        <div className="pos-handoff-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8h1a4 4 0 010 8h-1" />
            <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
            <line x1="6" y1="1" x2="6" y2="4" />
            <line x1="10" y1="1" x2="10" y2="4" />
            <line x1="14" y1="1" x2="14" y2="4" />
          </svg>
        </div>
        <h2 className="pos-handoff-title">{t('title')}</h2>
        <p className="pos-handoff-subtitle">{t('subtitle')}</p>
        <div className="pos-handoff-countdown">{countdown}</div>
        <button className="pos-handoff-cancel" onClick={onCancel}>
          {t('cancel')}
        </button>
      </div>
    </div>
  );
}
