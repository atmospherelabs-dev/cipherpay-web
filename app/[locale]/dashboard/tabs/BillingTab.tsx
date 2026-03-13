'use client';

import { memo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api, type BillingSummary, type BillingCycle, type ZecRates } from '@/lib/api';
import { currencySymbol, zecToFiat, fiatLabel } from '@/lib/currency';
import { useToast } from '@/contexts/ToastContext';

interface BillingTabProps {
  billing: BillingSummary | null;
  billingHistory: BillingCycle[];
  reloadBilling: () => void;
  zecRates: ZecRates | null;
  displayCurrency: string;
}

export const BillingTab = memo(function BillingTab({
  billing, billingHistory, reloadBilling, zecRates, displayCurrency,
}: BillingTabProps) {
  const { showToast } = useToast();
  const t = useTranslations('dashboard.billing');
  const [settling, setSettling] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const sym = currencySymbol(displayCurrency);

  const settleBilling = async () => {
    setSettling(true);
    try {
      const resp = await api.settleBilling();
      showToast(t('toastSettlement', { amount: resp.outstanding_zec.toFixed(6) }));
      if (resp.invoice_id) {
        window.open(`/pay/${resp.invoice_id}`, '_blank');
      }
      reloadBilling();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('toastFailedSettle'), true);
    }
    setSettling(false);
  };

  const toFiat = (zec: number) => zecToFiat(zec, zecRates, displayCurrency);
  const label = (fiat: number | null) => fiatLabel(fiat, displayCurrency);

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">{t('title')}</span>
        {billing?.fee_enabled && (
          <span className={`status-badge ${billing.billing_status === 'active' ? 'status-confirmed' : billing.billing_status === 'past_due' ? 'status-detected' : 'status-expired'}`} style={{ fontSize: 9 }}>
            {billing.billing_status.toUpperCase().replace('_', ' ')}
          </span>
        )}
      </div>
      <div className="panel-subtitle">
        {t('subtitle')}
      </div>
      <div className="panel-body">
        {!billing?.fee_enabled ? (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cp-green)', marginBottom: 8 }}>{t('noFees')}</div>
            <div style={{ fontSize: 11, color: 'var(--cp-text-muted)', lineHeight: 1.6 }}>
              {t('selfHosted')}
            </div>
          </div>
        ) : (
          <>
            {/* Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
              <div style={{ background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 4, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{t('feeRate')}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--cp-text)' }}>{(billing.fee_rate * 100).toFixed(1)}%</div>
              </div>
              <div style={{ background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 4, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{t('trustTier')}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: billing.trust_tier === 'trusted' ? 'var(--cp-green)' : billing.trust_tier === 'standard' ? 'var(--cp-cyan)' : 'var(--cp-text-muted)' }}>
                  {billing.trust_tier.toUpperCase()}
                </div>
              </div>
              <div style={{ background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 4, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{t('status')}</div>
                <div style={{
                  fontSize: 18, fontWeight: 700,
                  color: billing.billing_status === 'active' ? 'var(--cp-green)' :
                    billing.billing_status === 'past_due' ? 'var(--cp-yellow)' : 'var(--cp-red)'
                }}>
                  {billing.billing_status.toUpperCase().replace('_', ' ')}
                </div>
              </div>
            </div>

            {/* Current Cycle */}
            {billing.current_cycle ? (
              <div style={{ background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 4, padding: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 10, letterSpacing: 1, color: 'var(--cp-cyan)', fontWeight: 600 }}>{t('currentCycle')}</span>
                  {zecRates && (
                    <span style={{ fontSize: 9, color: 'var(--cp-text-dim)', fontFamily: 'monospace' }}>
                      1 ZEC = {sym}{((zecRates as unknown as Record<string, number>)[`zec_${displayCurrency.toLowerCase()}`] || zecRates.zec_eur).toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="stat-row" style={{ marginBottom: 6 }}>
                  <span style={{ color: 'var(--cp-text-muted)', fontSize: 11 }}>{t('period')}</span>
                  <span style={{ fontSize: 11 }}>
                    {new Date(billing.current_cycle.period_start).toLocaleDateString()} — {new Date(billing.current_cycle.period_end).toLocaleDateString()}
                  </span>
                </div>
                <div className="stat-row" style={{ marginBottom: 6 }}>
                  <span style={{ color: 'var(--cp-text-muted)', fontSize: 11 }}>{t('totalFees')}</span>
                  <span style={{ fontSize: 11, fontFamily: 'monospace' }}>{billing.total_fees_zec.toFixed(6)} ZEC{label(toFiat(billing.total_fees_zec))}</span>
                </div>
                <div className="stat-row" style={{ marginBottom: 6 }}>
                  <span style={{ color: 'var(--cp-text-muted)', fontSize: 11 }}>{t('autoCollected')}</span>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--cp-green)' }}>{billing.auto_collected_zec.toFixed(6)} ZEC{label(toFiat(billing.auto_collected_zec))}</span>
                </div>
                <div className="stat-row" style={{ marginBottom: 6 }}>
                  <span style={{ color: 'var(--cp-text-muted)', fontSize: 11 }}>{t('outstanding')}</span>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 600, color: billing.outstanding_zec > 0.00001 ? 'var(--cp-yellow)' : 'var(--cp-green)' }}>
                    {billing.outstanding_zec.toFixed(6)} ZEC{label(toFiat(billing.outstanding_zec))}
                  </span>
                </div>
                {billing.current_cycle.grace_until && (
                  <div className="stat-row">
                    <span style={{ color: 'var(--cp-text-muted)', fontSize: 11 }}>{t('graceUntil')}</span>
                    <span style={{ fontSize: 11, color: 'var(--cp-yellow)' }}>
                      {new Date(billing.current_cycle.grace_until).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 4, padding: 16, marginBottom: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--cp-text-muted)' }}>
                  {t('noCycle')}
                </div>
              </div>
            )}

            {/* Settle button */}
            {billing.outstanding_zec > 0.00001 && (
              <button onClick={settleBilling} disabled={settling} className="btn" style={{ width: '100%', marginBottom: 16 }}>
                {settling ? t('creatingInvoice') : t('settleNow', { amount: `${billing.outstanding_zec.toFixed(6)} ZEC${label(toFiat(billing.outstanding_zec))}` })}
              </button>
            )}

            {/* Billing History */}
            {billingHistory.filter(c => c.status !== 'open').length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, letterSpacing: 1, color: 'var(--cp-text-muted)', marginBottom: 8, fontWeight: 600 }}>{t('pastCycles')}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {billingHistory.filter(c => c.status !== 'open').map(cycle => {
                    const statusColors: Record<string, string> = {
                      paid: 'var(--cp-green)', carried_over: 'var(--cp-purple)',
                      invoiced: 'var(--cp-yellow)', past_due: 'var(--cp-yellow)', suspended: 'var(--cp-red)',
                    };
                    return (
                      <div key={cycle.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 10px', background: 'var(--cp-surface)', borderRadius: 4, fontSize: 11,
                      }}>
                        <div>
                          <span style={{ color: 'var(--cp-text-muted)' }}>
                            {new Date(cycle.period_start).toLocaleDateString()} — {new Date(cycle.period_end).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 10 }}>
                            {cycle.total_fees_zec.toFixed(6)} ZEC
                          </span>
                          <span style={{
                            fontSize: 9, fontWeight: 700, letterSpacing: 1,
                            color: statusColors[cycle.status] || 'var(--cp-text-muted)',
                          }}>
                            {cycle.status === 'carried_over' ? t('carriedOver') : cycle.status.toUpperCase().replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* How it works — collapsible */}
            <div>
              <button
                onClick={() => setShowHowItWorks(!showHowItWorks)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  fontSize: 10, letterSpacing: 1, color: 'var(--cp-text-muted)', fontWeight: 600, fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <span style={{ transition: 'transform 0.15s', transform: showHowItWorks ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}>▸</span>
                {t('howItWorks')}
              </button>
              {showHowItWorks && (
                <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', lineHeight: 1.7, marginTop: 8 }}>
                  {t('howItWorksDesc', { rate: (billing.fee_rate * 100).toFixed(1) })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
});
