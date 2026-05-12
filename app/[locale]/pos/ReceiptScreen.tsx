'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { currencySymbol } from '@/lib/currency';
import type { CreateInvoiceResponse } from '@/lib/api';

interface ReceiptScreenProps {
  invoice: CreateInvoiceResponse;
  tipAmount: number;
  merchantName: string;
  onNewSale: () => void;
}

const AUTO_RETURN_MS = 10_000;

export function ReceiptScreen({ invoice, tipAmount, merchantName, onNewSale }: ReceiptScreenProps) {
  const t = useTranslations('pos.receipt');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [countdown, setCountdown] = useState(AUTO_RETURN_MS / 1000);

  useEffect(() => {
    timerRef.current = setTimeout(onNewSale, AUTO_RETURN_MS);
    const interval = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      clearInterval(interval);
    };
  }, [onNewSale]);

  const handleInteraction = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(onNewSale, AUTO_RETURN_MS);
    setCountdown(AUTO_RETURN_MS / 1000);
  };

  const handlePrint = () => {
    handleInteraction();
    window.print();
  };

  const sym = currencySymbol(invoice.currency);
  const subtotal = invoice.amount - tipAmount;
  const now = new Date().toLocaleString();

  return (
    <div className="pos-receipt-screen" onClick={handleInteraction}>
      <div className="pos-receipt-container">
        {/* Animated checkmark */}
        <div className="pos-receipt-check">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" className="pos-check-animate" />
          </svg>
        </div>

        <div className="pos-receipt-confirmed">{t('paymentReceived')}</div>

        {/* Print-optimized receipt */}
        <div className="pos-receipt-card" id="pos-receipt-print">
          <div className="pos-receipt-merchant">{merchantName || 'CipherPay'}</div>
          <div className="pos-receipt-divider" />

          <div className="pos-receipt-row">
            <span>{t('subtotal')}</span>
            <span>{sym}{subtotal.toFixed(2)}</span>
          </div>
          {tipAmount > 0 && (
            <div className="pos-receipt-row">
              <span>{t('tip')}</span>
              <span>{sym}{tipAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="pos-receipt-divider" />
          <div className="pos-receipt-row pos-receipt-total">
            <span>{t('total')}</span>
            <span>{sym}{invoice.amount.toFixed(2)} {invoice.currency}</span>
          </div>
          <div className="pos-receipt-row pos-receipt-zec">
            <span>ZEC</span>
            <span>{invoice.price_zec.toFixed(6)}</span>
          </div>

          <div className="pos-receipt-divider" />
          <div className="pos-receipt-meta">
            <div>{t('invoice')}: {invoice.memo_code}</div>
            <div>{now}</div>
          </div>
          <div className="pos-receipt-footer">Powered by CipherPay</div>
        </div>

        <div className="pos-receipt-actions">
          <button className="pos-print-btn" onClick={handlePrint}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            {t('print')}
          </button>
          <button className="pos-newsale-btn" onClick={onNewSale}>
            {t('newSale')}
          </button>
        </div>

        <div className="pos-receipt-auto">{t('autoReturn', { seconds: countdown })}</div>
      </div>
    </div>
  );
}
