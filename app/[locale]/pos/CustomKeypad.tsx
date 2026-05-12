'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { currencySymbol, SUPPORTED_CURRENCIES } from '@/lib/currency';

interface CustomKeypadProps {
  onSubmit: (amount: number, currency: string, note: string) => void;
  onBack: () => void;
}

export function CustomKeypad({ onSubmit, onBack }: CustomKeypadProps) {
  const t = useTranslations('pos.keypad');
  const [display, setDisplay] = useState('0');
  const [currency, setCurrency] = useState('EUR');
  const [note, setNote] = useState('');
  const sym = currencySymbol(currency);

  const handleDigit = (d: string) => {
    setDisplay(prev => {
      if (d === '.' && prev.includes('.')) return prev;
      const decimals = prev.split('.')[1];
      if (decimals && decimals.length >= 2) return prev;
      if (prev === '0' && d !== '.') return d;
      return prev + d;
    });
  };

  const handleBackspace = () => {
    setDisplay(prev => prev.length <= 1 ? '0' : prev.slice(0, -1));
  };

  const handleClear = () => setDisplay('0');

  const amount = parseFloat(display) || 0;

  const handleSubmit = () => {
    if (amount <= 0) return;
    onSubmit(amount, currency, note);
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'];

  return (
    <div className="pos-keypad-screen">
      <div className="pos-keypad-container">
        <div className="pos-keypad-header">
          <button className="pos-back-btn" onClick={onBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="pos-keypad-title">{t('title')}</span>
        </div>

        <div className="pos-keypad-display">
          <span className="pos-keypad-sym">{sym}</span>
          <span className="pos-keypad-amount">{display}</span>
        </div>

        <div className="pos-keypad-currency">
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            className="pos-currency-select"
          >
            {SUPPORTED_CURRENCIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder={t('notePlaceholder')}
          className="pos-keypad-note"
          maxLength={100}
        />

        <div className="pos-numpad">
          {keys.map((k, i) => {
            if (k === 'back') {
              return (
                <button key={i} className="pos-numpad-key" onClick={handleBackspace} onDoubleClick={handleClear}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                    <line x1="18" y1="9" x2="12" y2="15" />
                    <line x1="12" y1="9" x2="18" y2="15" />
                  </svg>
                </button>
              );
            }
            return (
              <button key={i} className="pos-numpad-key" onClick={() => handleDigit(k)}>
                {k}
              </button>
            );
          })}
        </div>

        <button
          className="pos-checkout-btn"
          disabled={amount <= 0}
          onClick={handleSubmit}
        >
          {t('charge', { amount: `${sym}${amount.toFixed(2)}` })}
        </button>
      </div>
    </div>
  );
}
