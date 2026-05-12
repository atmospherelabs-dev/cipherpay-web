'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { QRCode } from '@/components/QRCode';
import { currencySymbol } from '@/lib/currency';
import type { CreateInvoiceResponse } from '@/lib/api';

interface QRCheckoutProps {
  invoice: CreateInvoiceResponse;
  status: string;
  onCancel: () => void;
  startSSE: (invoiceId: string) => (() => void) | void;
  tipAmount: number;
}

function useCountdown(expiresAt: string) {
  const [text, setText] = useState('');
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setExpired(true); setText('EXPIRED'); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setText(`${m}:${s.toString().padStart(2, '0')}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return { text, expired };
}

export function QRCheckout({ invoice, status, onCancel, startSSE, tipAmount }: QRCheckoutProps) {
  const t = useTranslations('pos.qr');
  const { text: countdown, expired } = useCountdown(invoice.expires_at);
  const sym = currencySymbol(invoice.currency);

  useEffect(() => {
    const cleanup = startSSE(invoice.invoice_id);
    return () => { if (typeof cleanup === 'function') cleanup(); };
  }, [invoice.invoice_id, startSSE]);

  const statusLabel = (() => {
    if (expired) return t('expired');
    switch (status) {
      case 'pending': return t('waitingPayment');
      case 'detected': return t('detected');
      case 'confirmed': return t('confirmed');
      default: return status.toUpperCase();
    }
  })();

  const statusClass = (() => {
    if (expired) return 'pos-status-expired';
    switch (status) {
      case 'pending': return 'pos-status-pending';
      case 'detected': return 'pos-status-detected';
      case 'confirmed': return 'pos-status-confirmed';
      default: return '';
    }
  })();

  return (
    <div className="pos-qr-screen">
      <div className="pos-qr-container">
        <div className="pos-qr-amounts">
          <div className="pos-qr-fiat">
            {sym}{invoice.amount.toFixed(2)} <span className="pos-qr-currency">{invoice.currency}</span>
          </div>
          {tipAmount > 0 && (
            <div className="pos-qr-tip">{t('includesTip', { amount: `${sym}${tipAmount.toFixed(2)}` })}</div>
          )}
          <div className="pos-qr-zec">{invoice.price_zec.toFixed(6)} ZEC</div>
        </div>

        <div className="pos-qr-code-wrap">
          <QRCode data={invoice.zcash_uri} size={280} dense />
        </div>

        <div className={`pos-qr-status ${statusClass}`}>
          {status === 'detected' && (
            <div className="pos-status-icon pos-pulse">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
          )}
          {status === 'confirmed' && (
            <div className="pos-status-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
          )}
          <span>{statusLabel}</span>
        </div>

        {!expired && status === 'pending' && (
          <div className="pos-qr-timer">{countdown}</div>
        )}

        {status === 'pending' && !expired && (
          <button className="pos-cancel-btn" onClick={onCancel}>
            {t('cancel')}
          </button>
        )}
      </div>
    </div>
  );
}
