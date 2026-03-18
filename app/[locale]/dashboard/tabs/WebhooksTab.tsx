'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { api, type WebhookDelivery } from '@/lib/api';

interface WebhooksTabProps {
  initialDeliveries: WebhookDelivery[];
  initialTotal: number;
}

export function WebhooksTab({ initialDeliveries, initialTotal }: WebhooksTabProps) {
  const t = useTranslations('dashboard.webhooks');
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [deliveries, setDeliveries] = useState(initialDeliveries);
  const [total, setTotal] = useState(initialTotal);
  const pageSize = 50;

  const fetchPage = useCallback(async (p: number, status: string) => {
    try {
      const data = await api.webhookHistory({
        status: status === 'all' ? undefined : status,
        limit: pageSize,
        offset: p * pageSize,
      });
      setDeliveries(data.deliveries);
      setTotal(data.total);
    } catch (e) {
      console.error('Failed to fetch webhooks', e);
    }
  }, []);

  useEffect(() => { fetchPage(page, filter); }, [page, filter, fetchPage]);

  const totalPages = Math.ceil(total / pageSize);
  const thStyle = { textAlign: 'left' as const, padding: '10px 12px', fontSize: 9, letterSpacing: 1, color: 'var(--cp-text-muted)', fontWeight: 500 };
  const tdStyle = { padding: '10px 12px', fontSize: 11 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">{t('title')}</span>
          <span style={{ fontSize: 10, color: 'var(--cp-text-dim)' }}>{total} {t('total')}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {['all', 'delivered', 'pending', 'failed'].map(s => (
          <button
            key={s}
            onClick={() => { setFilter(s); setPage(0); }}
            style={{
              padding: '4px 12px', fontSize: 9, letterSpacing: 1, fontFamily: 'inherit',
              border: '1px solid var(--cp-border)', borderRadius: 4, cursor: 'pointer',
              background: filter === s ? 'var(--cp-hover)' : 'transparent',
              color: filter === s ? 'var(--cp-cyan)' : 'var(--cp-text-muted)',
              fontWeight: filter === s ? 600 : 400,
            }}
          >
            {t(s)}
          </button>
        ))}
      </div>

      <div className="panel">
        <div className="panel-body" style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--cp-border)' }}>
                  <th style={thStyle}>{t('colTime')}</th>
                  <th style={thStyle}>{t('colEvent')}</th>
                  <th style={thStyle}>{t('colInvoice')}</th>
                  <th style={thStyle}>{t('colStatus')}</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>{t('colHttp')}</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>{t('colAttempts')}</th>
                  <th style={thStyle}>{t('colError')}</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid var(--cp-border)' }}>
                    <td style={{ ...tdStyle, fontSize: 10, color: 'var(--cp-text-dim)', whiteSpace: 'nowrap' }}>
                      {new Date(d.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--cp-cyan)' }}>
                        {d.event_type || '—'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 10, color: 'var(--cp-text-dim)' }}>
                      {d.invoice_id.slice(0, 12)}...
                    </td>
                    <td style={tdStyle}>
                      <span className={`status-badge ${
                        d.status === 'delivered' ? 'status-confirmed' :
                        d.status === 'pending' ? 'status-pending' :
                        'status-expired'
                      }`} style={{ fontSize: 8 }}>
                        {d.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      {d.response_status ? (
                        <span style={{
                          fontFamily: 'monospace', fontSize: 10,
                          color: d.response_status >= 200 && d.response_status < 300 ? 'var(--cp-green)' :
                                 d.response_status >= 400 ? 'var(--cp-red)' : 'var(--cp-yellow)'
                        }}>
                          {d.response_status}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--cp-text-dim)' }}>—</span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center', color: 'var(--cp-text-muted)' }}>{d.attempts}</td>
                    <td style={{ ...tdStyle, fontSize: 10, color: 'var(--cp-red)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.response_error || ''}
                    </td>
                  </tr>
                ))}
                {deliveries.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--cp-text-dim)' }}>
                      {t('empty')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="btn btn-small"
            style={{ fontSize: 9, opacity: page === 0 ? 0.4 : 1 }}
          >
            {t('prev')}
          </button>
          <span style={{ fontSize: 10, color: 'var(--cp-text-muted)', lineHeight: '28px' }}>
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="btn btn-small"
            style={{ fontSize: 9, opacity: page >= totalPages - 1 ? 0.4 : 1 }}
          >
            {t('next')}
          </button>
        </div>
      )}
    </div>
  );
}
