'use client';

import { memo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api, type BillingSummary, type BillingCycle, type ZecRates, type Invoice } from '@/lib/api';
import { currencySymbol, zecToFiat, fiatLabel } from '@/lib/currency';
import { useToast } from '@/contexts/ToastContext';

interface BillingTabProps {
  billing: BillingSummary | null;
  billingHistory: BillingCycle[];
  reloadBilling: () => void;
  zecRates: ZecRates | null;
  displayCurrency: string;
  invoices: Invoice[];
}

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(iso: string): number {
  const now = new Date();
  const target = new Date(iso);
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

function tierProgress(tier: string, paidCount: number): { current: number; target: number; nextTier: string } | null {
  if (tier === 'trusted') return null;
  const nextTier = tier === 'new' ? 'standard' : 'trusted';
  return { current: Math.min(paidCount, 3), target: 3, nextTier };
}

const TIER_INFO: Record<string, { grace: string; suspend: string }> = {
  new: { grace: '7 days', suspend: '7 days' },
  standard: { grace: '7 days', suspend: '14 days' },
  trusted: { grace: '14 days', suspend: '30 days' },
};

export const BillingTab = memo(function BillingTab({
  billing, billingHistory, reloadBilling, zecRates, displayCurrency, invoices,
}: BillingTabProps) {
  const { showToast } = useToast();
  const t = useTranslations('dashboard.billing');
  const [settling, setSettling] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showTierInfo, setShowTierInfo] = useState(false);
  const [expandedCycle, setExpandedCycle] = useState<string | null>(null);
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

  const recentPaidCount = billingHistory.filter(c => ['paid', 'carried_over'].includes(c.status)).length;
  const progress = billing ? tierProgress(billing.trust_tier, recentPaidCount) : null;

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
            {/* Outstanding hero */}
            {billing.outstanding_zec > 0.00001 && (
              <div style={{
                textAlign: 'center', padding: '20px 16px', marginBottom: 16,
                background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 4,
              }}>
                <div style={{ fontSize: 9, letterSpacing: 1, color: 'var(--cp-text-dim)', textTransform: 'uppercase', marginBottom: 6 }}>
                  {t('outstanding')}
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'monospace', color: 'var(--cp-text)', lineHeight: 1 }}>
                  {billing.outstanding_zec.toFixed(6)} <span style={{ fontSize: 14, fontWeight: 400 }}>ZEC</span>
                </div>
                {toFiat(billing.outstanding_zec) !== null && (
                  <div style={{ fontSize: 12, color: 'var(--cp-text-muted)', marginTop: 4, fontFamily: 'monospace' }}>
                    ≈ {sym}{toFiat(billing.outstanding_zec)!.toFixed(2)}
                  </div>
                )}
              </div>
            )}

            {/* Metrics */}
            <div className="dash-billing-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
              <div style={{ background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 4, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{t('feeRate')}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--cp-text)' }}>{(billing.fee_rate * 100).toFixed(1)}%</div>
              </div>
              <div
                style={{ background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 4, padding: 12, textAlign: 'center', cursor: 'pointer', position: 'relative' }}
                onClick={() => setShowTierInfo(!showTierInfo)}
              >
                <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                  {t('trustTier')} <span style={{ fontSize: 8, opacity: 0.5 }}>ⓘ</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: billing.trust_tier === 'trusted' ? 'var(--cp-green)' : billing.trust_tier === 'standard' ? 'var(--cp-cyan)' : 'var(--cp-text-muted)' }}>
                  {billing.trust_tier.toUpperCase()}
                </div>
                {progress && (
                  <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 4 }}>
                    {t('tierProgress', { current: progress.current, target: progress.target, next: progress.nextTier.toUpperCase() })}
                  </div>
                )}
                {showTierInfo && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 10,
                    background: 'var(--cp-surface)', border: '1px solid var(--cp-border)', borderRadius: 4,
                    padding: 10, textAlign: 'left', fontSize: 10, lineHeight: 1.6,
                  }}>
                    {(['new', 'standard', 'trusted'] as const).map(tier => {
                      const info = TIER_INFO[tier];
                      const isCurrent = billing.trust_tier === tier;
                      return (
                        <div key={tier} style={{ marginBottom: tier !== 'trusted' ? 6 : 0, opacity: isCurrent ? 1 : 0.6 }}>
                          <span style={{ fontWeight: 700, color: isCurrent ? 'var(--cp-cyan)' : 'var(--cp-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {tier}{isCurrent ? ' ←' : ''}
                          </span>
                          <br />
                          <span style={{ color: 'var(--cp-text-dim)' }}>
                            {t('tierGrace', { days: info.grace })} · {t('tierSuspend', { days: info.suspend })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Settlement action — before cycle details so merchant sees "do I need to act?" first */}
            {billing.outstanding_zec > 0.00001 && (() => {
              const min = billing.min_settlement_zec || 0.05;
              const pct = Math.min((billing.outstanding_zec / min) * 100, 100);
              const canSettle = billing.outstanding_zec >= min;
              return (
                <div style={{ marginBottom: 16 }}>
                  {!canSettle && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                        <span style={{ fontSize: 10, letterSpacing: 1, color: 'var(--cp-text-dim)', fontWeight: 600 }}>{t('settlementThreshold')}</span>
                        <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--cp-text-muted)' }}>
                          {billing.outstanding_zec.toFixed(4)} / {min.toFixed(2)} ZEC
                        </span>
                      </div>
                      <div style={{ width: '100%', height: 8, background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                        <div style={{
                          width: `${pct}%`, height: '100%',
                          background: 'linear-gradient(90deg, var(--cp-cyan), var(--cp-blue))',
                          transition: 'width 0.4s ease',
                          minWidth: pct > 0 ? 4 : 0,
                        }} />
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', lineHeight: 1.6 }}>
                        {t('belowMinimum', { min: min.toFixed(2) })}
                      </div>
                    </>
                  )}
                  {canSettle && (
                    billing.settlement_invoice_status === 'detected' ? (
                      <div style={{ width: '100%', padding: '10px 0', textAlign: 'center', background: 'rgba(86,212,200,0.08)', border: '1px solid rgba(86,212,200,0.3)', borderRadius: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--cp-cyan)', fontWeight: 600, letterSpacing: 0.5 }}>
                          {t('paymentDetected')}
                        </span>
                      </div>
                    ) : billing.settlement_invoice_status === 'confirmed' ? (
                      <div style={{ width: '100%', padding: '10px 0', textAlign: 'center', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--cp-green)', fontWeight: 600, letterSpacing: 0.5 }}>
                          {t('paymentConfirmed')}
                        </span>
                      </div>
                    ) : billing.settlement_invoice_status === 'pending' ? (
                      <button onClick={() => window.open(`/pay/${billing.current_cycle?.settlement_invoice_id}`, '_blank')} className="btn" style={{ width: '100%' }}>
                        {t('settleNow', { amount: `${billing.outstanding_zec.toFixed(6)} ZEC${label(toFiat(billing.outstanding_zec))}` })}
                      </button>
                    ) : (
                      <button onClick={settleBilling} disabled={settling} className="btn" style={{ width: '100%' }}>
                        {settling ? t('creatingInvoice') : t('settleNow', { amount: `${billing.outstanding_zec.toFixed(6)} ZEC${label(toFiat(billing.outstanding_zec))}` })}
                      </button>
                    )
                  )}
                </div>
              );
            })()}

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
                    {formatDateShort(billing.current_cycle.period_start)} — {formatDateShort(billing.current_cycle.period_end)}
                  </span>
                </div>
                <div className="stat-row" style={{ marginBottom: 6 }}>
                  <span style={{ color: 'var(--cp-text-muted)', fontSize: 11 }}>{t('totalFees')}</span>
                  <span style={{ fontSize: 11, fontFamily: 'monospace' }}>{billing.total_fees_zec.toFixed(6)} ZEC{label(toFiat(billing.total_fees_zec))}</span>
                </div>
                {billing.auto_collected_zec > 0.000001 && (
                  <div className="stat-row" style={{ marginBottom: 6 }}>
                    <span style={{ color: 'var(--cp-text-muted)', fontSize: 11 }}>{t('autoCollected')}</span>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--cp-green)' }}>{billing.auto_collected_zec.toFixed(6)} ZEC{label(toFiat(billing.auto_collected_zec))}</span>
                  </div>
                )}
                {billing.current_cycle.grace_until && (() => {
                  const days = daysUntil(billing.current_cycle!.grace_until!);
                  return (
                    <div className="stat-row">
                      <span style={{ color: 'var(--cp-text-muted)', fontSize: 11 }}>{t('graceUntil')}</span>
                      <span style={{ fontSize: 11, color: days <= 3 ? 'var(--cp-red)' : 'var(--cp-yellow)' }}>
                        {t('daysRemaining', { days })}
                        <span style={{ color: 'var(--cp-text-dim)', marginLeft: 6, fontSize: 10 }}>
                          ({formatDateShort(billing.current_cycle!.grace_until!)})
                        </span>
                      </span>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div style={{ background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 4, padding: 16, marginBottom: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--cp-text-muted)' }}>
                  {t('noCycle')}
                </div>
              </div>
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
                    const isExpanded = expandedCycle === cycle.id;
                    const settlementInvoice = cycle.settlement_invoice_id
                      ? invoices.find(inv => inv.id === cycle.settlement_invoice_id)
                      : null;
                    return (
                      <div key={cycle.id}>
                        <div
                          onClick={() => setExpandedCycle(isExpanded ? null : cycle.id)}
                          style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap',
                            padding: '8px 10px', background: 'var(--cp-surface)', borderRadius: isExpanded ? '4px 4px 0 0' : 4, fontSize: 11, gap: 6,
                            cursor: 'pointer',
                            border: '1px solid var(--cp-border)',
                            borderBottom: isExpanded ? '1px solid var(--cp-border)' : '1px solid var(--cp-border)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 9, transition: 'transform 0.15s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block', color: 'var(--cp-text-dim)' }}>▸</span>
                            <span style={{ color: 'var(--cp-text-muted)' }}>
                              {formatDateShort(cycle.period_start)} — {formatDateShort(cycle.period_end)}
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
                        {isExpanded && (
                          <div style={{
                            padding: '10px 12px', background: 'var(--cp-bg)',
                            border: '1px solid var(--cp-border)', borderTop: 'none',
                            borderRadius: '0 0 4px 4px', fontSize: 10,
                          }}>
                            <div className="stat-row" style={{ marginBottom: 4 }}>
                              <span style={{ color: 'var(--cp-text-dim)' }}>{t('totalFees')}</span>
                              <span style={{ fontFamily: 'monospace' }}>{cycle.total_fees_zec.toFixed(6)} ZEC{label(toFiat(cycle.total_fees_zec))}</span>
                            </div>
                            <div className="stat-row" style={{ marginBottom: 4 }}>
                              <span style={{ color: 'var(--cp-text-dim)' }}>{t('autoCollected')}</span>
                              <span style={{ fontFamily: 'monospace', color: cycle.auto_collected_zec > 0 ? 'var(--cp-green)' : 'var(--cp-text-dim)' }}>
                                {cycle.auto_collected_zec.toFixed(6)} ZEC
                              </span>
                            </div>
                            <div className="stat-row" style={{ marginBottom: 4 }}>
                              <span style={{ color: 'var(--cp-text-dim)' }}>{t('outstanding')}</span>
                              <span style={{ fontFamily: 'monospace' }}>{cycle.outstanding_zec.toFixed(6)} ZEC</span>
                            </div>
                            {settlementInvoice && (
                              <>
                                <div style={{ borderTop: '1px solid var(--cp-border)', margin: '8px 0' }} />
                                <div className="stat-row" style={{ marginBottom: 4 }}>
                                  <span style={{ color: 'var(--cp-text-dim)' }}>{t('settlementRef')}</span>
                                  <span style={{ fontFamily: 'monospace' }}>{settlementInvoice.memo_code}</span>
                                </div>
                                {settlementInvoice.detected_txid && (
                                  <div className="stat-row" style={{ marginBottom: 4 }}>
                                    <span style={{ color: 'var(--cp-text-dim)' }}>TxID</span>
                                    <span style={{ fontFamily: 'monospace', fontSize: 9 }}>{settlementInvoice.detected_txid.slice(0, 16)}...</span>
                                  </div>
                                )}
                                {settlementInvoice.confirmed_at && (
                                  <div className="stat-row" style={{ marginBottom: 4 }}>
                                    <span style={{ color: 'var(--cp-text-dim)' }}>{t('paidOn')}</span>
                                    <span>{formatDateShort(settlementInvoice.confirmed_at)}</span>
                                  </div>
                                )}
                                {['invoiced', 'past_due'].includes(cycle.status) && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); window.open(`/pay/${cycle.settlement_invoice_id}`, '_blank'); }}
                                    className="btn" style={{ width: '100%', marginTop: 8, fontSize: 10 }}
                                  >
                                    {t('payInvoice')}
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        )}
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
