'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { currencySymbol } from '@/lib/currency';

interface TipScreenProps {
  subtotal: number;
  currency: string;
  onDone: (tipAmount: number) => void;
  onCancel: () => void;
}

const TIP_PRESETS = [10, 15, 20];

export function TipScreen({ subtotal, currency, onDone, onCancel }: TipScreenProps) {
  const t = useTranslations('pos.tip');
  const [selected, setSelected] = useState<number | 'custom' | 'none' | null>(null);
  const [customValue, setCustomValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const sym = currencySymbol(currency);

  const tipAmount = (() => {
    if (selected === 'none' || selected === null) return 0;
    if (selected === 'custom') return parseFloat(customValue) || 0;
    return Math.round(subtotal * (selected / 100) * 100) / 100;
  })();

  const total = Math.round((subtotal + tipAmount) * 100) / 100;

  const handleContinue = async () => {
    setSubmitting(true);
    await onDone(tipAmount);
    setSubmitting(false);
  };

  return (
    <div className="pos-tip-screen">
      <div className="pos-tip-container">
        <div className="pos-tip-header">
          <span className="pos-tip-title">{t('addTip')}</span>
        </div>

        <div className="pos-tip-subtotal">
          <span>{t('subtotal')}</span>
          <span>{sym}{subtotal.toFixed(2)}</span>
        </div>

        <div className="pos-tip-options">
          {TIP_PRESETS.map(pct => {
            const amt = Math.round(subtotal * (pct / 100) * 100) / 100;
            return (
              <button
                key={pct}
                className={`pos-tip-btn${selected === pct ? ' active' : ''}`}
                onClick={() => setSelected(pct)}
              >
                <span className="pos-tip-pct">{pct}%</span>
                <span className="pos-tip-amt">{sym}{amt.toFixed(2)}</span>
              </button>
            );
          })}
          <button
            className={`pos-tip-btn${selected === 'custom' ? ' active' : ''}`}
            onClick={() => setSelected('custom')}
          >
            <span className="pos-tip-pct">{t('custom')}</span>
          </button>
          <button
            className={`pos-tip-btn pos-tip-none${selected === 'none' ? ' active' : ''}`}
            onClick={() => setSelected('none')}
          >
            <span className="pos-tip-pct">{t('noTip')}</span>
          </button>
        </div>

        {selected === 'custom' && (
          <div className="pos-tip-custom-input">
            <span className="pos-tip-sym">{sym}</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={customValue}
              onChange={e => setCustomValue(e.target.value)}
              placeholder="0.00"
              className="pos-tip-input"
              autoFocus
            />
          </div>
        )}

        <div className="pos-tip-total">
          <span>{t('total')}</span>
          <span className="pos-tip-total-amount">{sym}{total.toFixed(2)}</span>
        </div>

        <button
          className="pos-checkout-btn"
          disabled={selected === null || submitting}
          onClick={handleContinue}
        >
          {submitting ? t('creating') : t('continue')}
        </button>

        <button className="pos-tip-cancel" onClick={onCancel}>
          {t('cancel')}
        </button>
      </div>
    </div>
  );
}
