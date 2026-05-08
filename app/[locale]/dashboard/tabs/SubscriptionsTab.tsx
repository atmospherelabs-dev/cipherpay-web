'use client';

import { memo, useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { api, type Subscription, type Product } from '@/lib/api';
import { CopyButton } from '@/components/CopyButton';
import { Spinner } from '@/components/Spinner';
import { useToast } from '@/contexts/ToastContext';
import { currencySymbol } from '@/lib/currency';

interface SubscriptionsTabProps {
  products: Product[];
}

export const SubscriptionsTab = memo(function SubscriptionsTab({
  products,
}: SubscriptionsTabProps) {
  const t = useTranslations('dashboard.subscriptions');
  const { showToast } = useToast();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<{ id: string; atPeriodEnd: boolean } | null>(null);
  const [pausingId, setPausingId] = useState<string | null>(null);
  const [resumingId, setResumingId] = useState<string | null>(null);

  const loadSubs = useCallback(async () => {
    try {
      setSubs(await api.listSubscriptions());
    } catch {
      showToast(t('loadError'), true);
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => { loadSubs(); }, [loadSubs]);

  const priceMap = new Map<string, { productName: string; amount: number; currency: string; interval: string | null }>();
  for (const prod of products) {
    if (prod.prices) {
      for (const p of prod.prices) {
        priceMap.set(p.id, {
          productName: prod.name,
          amount: p.unit_amount,
          currency: p.currency,
          interval: p.billing_interval,
        });
      }
    }
  }

  const handleCancel = async (id: string, atPeriodEnd: boolean) => {
    setCancelingId(id);
    setConfirmCancel(null);
    try {
      await api.cancelSubscription(id, atPeriodEnd);
      showToast(atPeriodEnd ? t('canceledAtEnd') : t('canceledNow'));
      await loadSubs();
    } catch {
      showToast(t('cancelError'), true);
    } finally {
      setCancelingId(null);
    }
  };

  const handlePause = async (id: string) => {
    setPausingId(id);
    try {
      await api.pauseSubscription(id);
      showToast(t('pauseScheduled'));
      await loadSubs();
    } catch {
      showToast(t('pauseError'), true);
    } finally {
      setPausingId(null);
    }
  };

  const handleResume = async (id: string) => {
    setResumingId(id);
    try {
      await api.resumeSubscription(id);
      showToast(t('resumed'));
      await loadSubs();
    } catch {
      showToast(t('resumeError'), true);
    } finally {
      setResumingId(null);
    }
  };

  const statusBadge = (status: string, cancelAtEnd: number, pauseAtEnd: number = 0) => {
    let color = 'var(--cp-text-muted)';
    let bg = 'rgba(255,255,255,0.05)';
    let label = status.toUpperCase();

    if (status === 'paused') {
      color = 'var(--cp-yellow, #E8C48D)';
      bg = 'rgba(232,196,141,0.1)';
      label = t('statusPaused');
    } else if (status === 'active' && pauseAtEnd) {
      color = 'var(--cp-yellow, #E8C48D)';
      bg = 'rgba(232,196,141,0.1)';
      label = t('pausingAtEnd');
    } else if (status === 'active' && cancelAtEnd) {
      color = 'var(--cp-yellow, #E8C48D)';
      bg = 'rgba(232,196,141,0.1)';
      label = t('cancelingAtEnd');
    } else if (status === 'active') {
      color = 'var(--cp-cyan, #56D4C8)';
      bg = 'rgba(86,212,200,0.1)';
      label = t('statusActive');
    } else if (status === 'past_due') {
      color = 'var(--cp-yellow, #E8C48D)';
      bg = 'rgba(232,196,141,0.1)';
      label = t('statusPastDue');
    } else if (status === 'canceled') {
      color = 'var(--cp-text-dim, #666)';
      bg = 'rgba(255,255,255,0.03)';
      label = t('statusCanceled');
    }

    return (
      <span style={{
        fontSize: 9, fontWeight: 600, letterSpacing: 0.5,
        color, background: bg,
        padding: '2px 6px', borderRadius: 3,
      }}>
        {label}
      </span>
    );
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return iso; }
  };

  const activeSubs = subs.filter(s => s.status !== 'canceled');
  const canceledSubs = subs.filter(s => s.status === 'canceled');

  if (loading) {
    return (
      <div className="panel">
        <div className="panel-header"><span className="panel-title">{t('title')}</span></div>
        <div className="panel-body" style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Active / Past Due */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">{t('title')}</span>
          <span style={{ fontSize: 11, color: 'var(--cp-text-muted)' }}>
            {activeSubs.length} {t('active')}
          </span>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          {activeSubs.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--cp-text-dim)' }}>
              <div style={{ fontSize: 13, marginBottom: 4 }}>{t('noActive')}</div>
              <div style={{ fontSize: 11 }}>{t('noActiveHint')}</div>
            </div>
          )}
          {activeSubs.map((sub) => {
            const price = priceMap.get(sub.price_id);
            return (
              <div key={sub.id} style={{
                padding: '14px 18px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                {/* Top row: name + status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>
                      {sub.label || price?.productName || t('subscription')}
                    </span>
                    {statusBadge(sub.status, sub.cancel_at_period_end, sub.pause_at_period_end)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--cp-text-muted)', fontFamily: 'var(--font-geist-mono)' }}>
                      {sub.id.substring(0, 12)}...
                    </span>
                    <CopyButton text={sub.id} label="" />
                  </div>
                </div>

                {/* Details row */}
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 11, color: 'var(--cp-text-muted)' }}>
                  {price && (
                    <span>
                      {currencySymbol(price.currency)}{price.amount.toFixed(2)} / {price.interval || 'month'}
                    </span>
                  )}
                  <span>
                    {t('period')}: {formatDate(sub.current_period_start)} — {formatDate(sub.current_period_end)}
                  </span>
                  <span>
                    {t('created')}: {formatDate(sub.created_at)}
                  </span>
                </div>

                {/* Actions */}
                {sub.status === 'paused' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                    <button
                      className="btn"
                      onClick={() => handleResume(sub.id)}
                      disabled={resumingId === sub.id}
                      style={{ fontSize: 10, padding: '4px 10px', color: 'var(--cp-cyan, #56D4C8)', borderColor: 'rgba(86,212,200,0.3)' }}
                    >
                      {resumingId === sub.id ? <Spinner size={10} /> : t('resume')}
                    </button>
                    <button
                      className="btn"
                      onClick={() => handleCancel(sub.id, false)}
                      disabled={cancelingId === sub.id}
                      style={{ fontSize: 10, padding: '4px 10px', color: 'var(--cp-text-muted)' }}
                    >
                      {cancelingId === sub.id ? <Spinner size={10} /> : t('cancel')}
                    </button>
                  </div>
                )}

                {sub.status === 'active' && sub.pause_at_period_end === 1 && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                    <div style={{ fontSize: 10, color: 'var(--cp-yellow, #E8C48D)', opacity: 0.8 }}>
                      {t('pausesOn', { date: formatDate(sub.current_period_end) })}
                    </div>
                    <button
                      className="btn"
                      onClick={() => handleResume(sub.id)}
                      disabled={resumingId === sub.id}
                      style={{ fontSize: 10, padding: '4px 10px', color: 'var(--cp-cyan, #56D4C8)', borderColor: 'rgba(86,212,200,0.3)' }}
                    >
                      {resumingId === sub.id ? <Spinner size={10} /> : t('undoPause')}
                    </button>
                  </div>
                )}

                {sub.status === 'active' && !sub.cancel_at_period_end && !sub.pause_at_period_end && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                    {confirmCancel?.id === sub.id ? (
                      <>
                        <button
                          className="btn"
                          onClick={() => handleCancel(sub.id, true)}
                          disabled={cancelingId === sub.id}
                          style={{ fontSize: 10, padding: '4px 10px', color: 'var(--cp-yellow)', borderColor: 'rgba(232,196,141,0.3)' }}
                        >
                          {cancelingId === sub.id ? <Spinner size={10} /> : t('cancelAtEnd')}
                        </button>
                        <button
                          className="btn"
                          onClick={() => handleCancel(sub.id, false)}
                          disabled={cancelingId === sub.id}
                          style={{ fontSize: 10, padding: '4px 10px', color: 'var(--cp-red, #ef4444)', borderColor: 'rgba(239,68,68,0.3)' }}
                        >
                          {cancelingId === sub.id ? <Spinner size={10} /> : t('cancelNow')}
                        </button>
                        <button
                          className="btn"
                          onClick={() => setConfirmCancel(null)}
                          style={{ fontSize: 10, padding: '4px 10px' }}
                        >
                          {t('nevermind')}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn"
                          onClick={() => handlePause(sub.id)}
                          disabled={pausingId === sub.id}
                          style={{ fontSize: 10, padding: '4px 10px', color: 'var(--cp-text-muted)' }}
                        >
                          {pausingId === sub.id ? <Spinner size={10} /> : t('pause')}
                        </button>
                        <button
                          className="btn"
                          onClick={() => setConfirmCancel({ id: sub.id, atPeriodEnd: true })}
                          style={{ fontSize: 10, padding: '4px 10px', color: 'var(--cp-text-muted)' }}
                        >
                          {t('cancel')}
                        </button>
                      </>
                    )}
                  </div>
                )}

                {sub.cancel_at_period_end === 1 && sub.status !== 'canceled' && (
                  <div style={{ fontSize: 10, color: 'var(--cp-yellow, #E8C48D)', opacity: 0.8 }}>
                    {t('cancelsOn', { date: formatDate(sub.current_period_end) })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Canceled */}
      {canceledSubs.length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">{t('canceled')}</span>
            <span style={{ fontSize: 11, color: 'var(--cp-text-muted)' }}>{canceledSubs.length}</span>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            {canceledSubs.map((sub) => {
              const price = priceMap.get(sub.price_id);
              return (
                <div key={sub.id} style={{
                  padding: '12px 18px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  opacity: 0.6,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 500, fontSize: 12 }}>
                        {sub.label || price?.productName || t('subscription')}
                      </span>
                      {statusBadge('canceled', 0)}
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--cp-text-dim)' }}>
                      {sub.canceled_at ? formatDate(sub.canceled_at) : ''}
                    </span>
                  </div>
                  {price && (
                    <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', marginTop: 4 }}>
                      {currencySymbol(price.currency)}{price.amount.toFixed(2)} / {price.interval || 'month'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});
