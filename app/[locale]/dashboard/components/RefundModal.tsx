'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

interface RefundModalProps {
  invoiceId: string;
  onClose: () => void;
  onRefunded: () => void;
}

export function RefundModal({ invoiceId, onClose, onRefunded }: RefundModalProps) {
  const [txid, setTxid] = useState('');
  const { showToast } = useToast();
  const t = useTranslations('dashboard.refundModal');
  const tc = useTranslations('common');

  const confirmRefund = async () => {
    try {
      await api.refundInvoice(invoiceId, txid || undefined);
      onRefunded();
      showToast(t('toastRefunded'));
    } catch { showToast(t('toastFailed'), true); }
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div className="panel" style={{ maxWidth: 440, width: '100%' }} onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <span className="panel-title">{t('title')}</span>
        </div>
        <div className="panel-body">
          <p style={{ fontSize: 11, color: 'var(--cp-text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
            {t('description')}
          </p>
          <div className="form-group">
            <label className="form-label">{t('txidLabel')}</label>
            <input
              type="text"
              value={txid}
              onChange={(e) => setTxid(e.target.value)}
              placeholder={t('txidPlaceholder')}
              className="input"
              style={{ fontFamily: 'monospace', fontSize: 10 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={onClose} className="btn" style={{ flex: 1 }}>
              {tc('cancel')}
            </button>
            <button onClick={confirmRefund} className="btn-primary" style={{ flex: 1, background: '#f59e0b', borderColor: '#f59e0b' }}>
              {t('confirmRefund')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
