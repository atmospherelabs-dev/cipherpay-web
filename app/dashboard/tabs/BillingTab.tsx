'use client';

import { memo, useState } from 'react';
import { api, type BillingSummary, type BillingCycle, type ZecRates } from '@/lib/api';
import { currencySymbol, zecToFiat, fiatLabel } from '../utils/currency';
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
  const [settling, setSettling] = useState(false);
  const sym = currencySymbol(displayCurrency);

  const settleBilling = async () => {
    setSettling(true);
    try {
      const resp = await api.settleBilling();
      showToast(`Settlement invoice created: ${resp.outstanding_zec.toFixed(6)} ZEC`);
      if (resp.invoice_id) {
        window.open(`/pay/${resp.invoice_id}`, '_blank');
      }
      reloadBilling();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to settle', true);
    }
    setSettling(false);
  };

  const toFiat = (zec: number) => zecToFiat(zec, zecRates, displayCurrency);
  const label = (fiat: number | null) => fiatLabel(fiat, displayCurrency);

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Billing</span>
        {billing?.fee_enabled && (
          <span className={`status-badge ${billing.billing_status === 'active' ? 'status-confirmed' : billing.billing_status === 'past_due' ? 'status-detected' : 'status-expired'}`} style={{ fontSize: 8 }}>
            {billing.billing_status.toUpperCase().replace('_', ' ')}
          </span>
        )}
      </div>
      <div className="panel-body">
        {!billing?.fee_enabled ? (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cp-green)', marginBottom: 8 }}>NO FEES</div>
            <div style={{ fontSize: 11, color: 'var(--cp-text-muted)', lineHeight: 1.6 }}>
              This instance is running in self-hosted mode.<br />
              No transaction fees are applied.
            </div>
          </div>
        ) : (
          <>
            {/* Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
              <div style={{ background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 4, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Fee Rate</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--cp-text)' }}>{(billing.fee_rate * 100).toFixed(1)}%</div>
              </div>
              <div style={{ background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 4, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Trust Tier</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: billing.trust_tier === 'trusted' ? 'var(--cp-green)' : billing.trust_tier === 'standard' ? 'var(--cp-cyan)' : 'var(--cp-text-muted)' }}>
                  {billing.trust_tier.toUpperCase()}
                </div>
              </div>
              <div style={{ background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 4, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Status</div>
                <div style={{
                  fontSize: 18, fontWeight: 700,
                  color: billing.billing_status === 'active' ? 'var(--cp-green)' :
                    billing.billing_status === 'past_due' ? '#f59e0b' : '#ef4444'
                }}>
                  {billing.billing_status.toUpperCase().replace('_', ' ')}
                </div>
              </div>
            </div>

            {/* Current Cycle */}
            {billing.current_cycle ? (
              <div style={{ background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 4, padding: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 10, letterSpacing: 1, color: 'var(--cp-cyan)', fontWeight: 600 }}>CURRENT CYCLE</span>
                  {zecRates && (
                    <span style={{ fontSize: 9, color: 'var(--cp-text-dim)', fontFamily: 'monospace' }}>
                      1 ZEC = {sym}{((zecRates as unknown as Record<string, number>)[`zec_${displayCurrency.toLowerCase()}`] || zecRates.zec_eur).toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="stat-row" style={{ marginBottom: 6 }}>
                  <span style={{ color: 'var(--cp-text-muted)', fontSize: 11 }}>Period</span>
                  <span style={{ fontSize: 11 }}>
                    {new Date(billing.current_cycle.period_start).toLocaleDateString()} — {new Date(billing.current_cycle.period_end).toLocaleDateString()}
                  </span>
                </div>
                <div className="stat-row" style={{ marginBottom: 6 }}>
                  <span style={{ color: 'var(--cp-text-muted)', fontSize: 11 }}>Total Fees</span>
                  <span style={{ fontSize: 11, fontFamily: 'monospace' }}>{billing.total_fees_zec.toFixed(8)} ZEC{label(toFiat(billing.total_fees_zec))}</span>
                </div>
                <div className="stat-row" style={{ marginBottom: 6 }}>
                  <span style={{ color: 'var(--cp-text-muted)', fontSize: 11 }}>Auto-Collected</span>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--cp-green)' }}>{billing.auto_collected_zec.toFixed(8)} ZEC{label(toFiat(billing.auto_collected_zec))}</span>
                </div>
                <div className="stat-row" style={{ marginBottom: 6 }}>
                  <span style={{ color: 'var(--cp-text-muted)', fontSize: 11 }}>Outstanding</span>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 600, color: billing.outstanding_zec > 0.00001 ? '#f59e0b' : 'var(--cp-green)' }}>
                    {billing.outstanding_zec.toFixed(8)} ZEC{label(toFiat(billing.outstanding_zec))}
                  </span>
                </div>
                {billing.current_cycle.grace_until && (
                  <div className="stat-row">
                    <span style={{ color: 'var(--cp-text-muted)', fontSize: 11 }}>Grace Until</span>
                    <span style={{ fontSize: 11, color: '#f59e0b' }}>
                      {new Date(billing.current_cycle.grace_until).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 4, padding: 16, marginBottom: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--cp-text-muted)' }}>
                  No active billing cycle yet. A cycle starts when your first invoice is confirmed.
                </div>
              </div>
            )}

            {/* Settle button */}
            {billing.outstanding_zec > 0.00001 && (
              <button onClick={settleBilling} disabled={settling} className="btn" style={{ width: '100%', marginBottom: 16 }}>
                {settling ? 'CREATING INVOICE...' : `SETTLE NOW — ${billing.outstanding_zec.toFixed(6)} ZEC${label(toFiat(billing.outstanding_zec))}`}
              </button>
            )}

            {/* Billing History */}
            {billingHistory.filter(c => c.status !== 'open').length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, letterSpacing: 1, color: 'var(--cp-text-muted)', marginBottom: 8, fontWeight: 600 }}>PAST CYCLES</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {billingHistory.filter(c => c.status !== 'open').map(cycle => {
                    const statusColors: Record<string, string> = {
                      paid: 'var(--cp-green)', carried_over: '#a78bfa',
                      invoiced: '#f59e0b', past_due: '#f59e0b', suspended: '#ef4444',
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
                            fontSize: 8, fontWeight: 700, letterSpacing: 1,
                            color: statusColors[cycle.status] || 'var(--cp-text-muted)',
                          }}>
                            {cycle.status === 'carried_over' ? 'CARRIED OVER' : cycle.status.toUpperCase().replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* How it works */}
            <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', lineHeight: 1.7 }}>
              <div style={{ fontSize: 10, letterSpacing: 1, color: 'var(--cp-text-muted)', marginBottom: 6, fontWeight: 600 }}>HOW IT WORKS</div>
              A {(billing.fee_rate * 100).toFixed(1)}% fee is added as a second output in payment QR codes (ZIP 321).
              When buyers scan the QR, the fee is auto-collected. If a buyer copies the address manually,
              the fee accrues and is billed at cycle end. Consistent on-time payment upgrades your trust tier,
              extending billing cycles and grace periods.
            </div>
          </>
        )}
      </div>
    </div>
  );
});
