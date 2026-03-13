'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import type { MerchantInfo, Invoice, Product, BillingSummary, ZecRates } from '@/lib/api';
import { currencySymbol, zecToFiat } from '@/lib/currency';
import type { Tab } from '../components/DashboardSidebar';
import type { TabAction } from '../DashboardClient';

interface OverviewTabProps {
  merchant: MerchantInfo;
  products: Product[];
  invoices: Invoice[];
  loadingInvoices: boolean;
  billing: BillingSummary | null;
  zecRates: ZecRates | null;
  displayCurrency: string;
  setTab: (t: Tab) => void;
  navigateWithAction: (t: Tab, action?: TabAction) => void;
}

export const OverviewTab = memo(function OverviewTab({
  merchant, products, invoices, loadingInvoices, billing, zecRates, displayCurrency, setTab, navigateWithAction,
}: OverviewTabProps) {
  const t = useTranslations('dashboard.overview');
  const tc = useTranslations('common');
  const tn = useTranslations('dashboard.navbar');
  const sym = currencySymbol(displayCurrency);

  const pending = invoices.filter(i => i.status === 'pending').length;
  const detected = invoices.filter(i => i.status === 'detected' || i.status === 'underpaid').length;
  const expired = invoices.filter(i => i.status === 'expired').length;
  const rate = merchant.stats.total_invoices > 0
    ? Math.round((merchant.stats.confirmed / merchant.stats.total_invoices) * 100)
    : 0;
  const totalFiat = zecToFiat(merchant.stats.total_zec, zecRates, displayCurrency);
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);
  const webhookConfigured = !!merchant.webhook_url;
  const emailConfigured = merchant.has_recovery_email;
  const nameConfigured = !!merchant.name;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <div className="panel" style={{ textAlign: 'center' }}>
          <div className="panel-body" style={{ padding: '20px 16px' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--cp-cyan)', lineHeight: 1.2 }}>
              {merchant.stats.total_zec.toFixed(4)}
            </div>
            <div style={{ fontSize: 9, letterSpacing: 1, color: 'var(--cp-text-muted)', marginTop: 6 }}>
              {t('totalZec')}
            </div>
            {totalFiat !== null && (
              <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', marginTop: 2 }}>
                ~{sym}{totalFiat < 0.01 ? totalFiat.toFixed(4) : totalFiat.toFixed(2)}
              </div>
            )}
          </div>
        </div>
        <div className="panel" style={{ textAlign: 'center' }}>
          <div className="panel-body" style={{ padding: '20px 16px' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--cp-green)', lineHeight: 1.2 }}>
              {merchant.stats.confirmed}
            </div>
            <div style={{ fontSize: 9, letterSpacing: 1, color: 'var(--cp-text-muted)', marginTop: 6 }}>
              {t('confirmed')}
            </div>
            <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', marginTop: 2 }}>
              {t('ofTotal', { total: merchant.stats.total_invoices })}
            </div>
          </div>
        </div>
        <div className="panel" style={{ textAlign: 'center' }}>
          <div className="panel-body" style={{ padding: '20px 16px' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: pending > 0 ? 'var(--cp-yellow)' : 'var(--cp-text-dim)', lineHeight: 1.2 }}>
              {pending + detected}
            </div>
            <div style={{ fontSize: 9, letterSpacing: 1, color: 'var(--cp-text-muted)', marginTop: 6 }}>
              {t('pending')}
            </div>
            {detected > 0 && (
              <div style={{ fontSize: 10, color: 'var(--cp-purple)', marginTop: 2 }}>
                {t('detected', { count: detected })}
              </div>
            )}
          </div>
        </div>
        <div className="panel" style={{ textAlign: 'center' }}>
          <div className="panel-body" style={{ padding: '20px 16px' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--cp-text)', lineHeight: 1.2 }}>
              {rate}%
            </div>
            <div style={{ fontSize: 9, letterSpacing: 1, color: 'var(--cp-text-muted)', marginTop: 6 }}>
              {t('conversion')}
            </div>
            <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', marginTop: 2 }}>
              {t('expired', { count: expired })}
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">{t('quickActions')}</span>
        </div>
        <div className="panel-body" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => navigateWithAction('invoices', 'create-paylink')} className="btn-primary" style={{ fontSize: 10 }}>
            {t('createPayLink')}
          </button>
          <button onClick={() => navigateWithAction('products', 'add-product')} className="btn" style={{ fontSize: 10 }}>
            {t('addProduct')}
          </button>
          <button onClick={() => setTab('pos')} className="btn" style={{ fontSize: 10 }}>
            {t('openPos')}
          </button>
        </div>
      </div>

      {/* Recent activity */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">{t('recentActivity')}</span>
          <button onClick={() => setTab('invoices')} className="btn btn-small">{tc('viewAll')}</button>
        </div>
        <div className="panel-body">
          {loadingInvoices ? (
            <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', padding: '12px 0' }}>{tc('loading')}</div>
          ) : recentInvoices.length === 0 ? (
            <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', padding: '16px 0', textAlign: 'center' }}>
              {t('noInvoicesYet')}
            </div>
          ) : (
            recentInvoices.map((inv) => (
              <div key={inv.id} className="stat-row" style={{ padding: '8px 0' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--cp-text)' }}>
                    {inv.product_name || inv.memo_code}
                  </span>
                  <span style={{ fontSize: 9, color: 'var(--cp-text-dim)' }}>
                    {new Date(inv.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--cp-text)' }}>
                    {inv.price_zec.toFixed(4)} ZEC
                  </span>
                  <span className={`status-badge ${
                    inv.status === 'confirmed' ? 'status-confirmed' :
                    inv.status === 'detected' || inv.status === 'underpaid' ? 'status-detected' :
                    inv.status === 'expired' ? 'status-expired' :
                    inv.status === 'refunded' ? 'status-expired' :
                    'status-pending'
                  }`} style={{ fontSize: 8, minWidth: 60, textAlign: 'center' }}>
                    {inv.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Account health */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">{t('accountSetup')}</span>
        </div>
        <div className="panel-body">
          <div className="stat-row">
            <span style={{ color: 'var(--cp-text-muted)' }}>{t('storeName')}</span>
            {nameConfigured ? (
              <span style={{ color: 'var(--cp-green)', fontSize: 10, fontWeight: 600 }}>{tc('configured')}</span>
            ) : (
              <button onClick={() => setTab('settings')} style={{ background: 'none', border: 'none', color: 'var(--cp-yellow)', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 1 }}>
                {tc('setUp')}
              </button>
            )}
          </div>
          <div className="stat-row">
            <span style={{ color: 'var(--cp-text-muted)' }}>{t('webhook')}</span>
            {webhookConfigured ? (
              <span style={{ color: 'var(--cp-green)', fontSize: 10, fontWeight: 600 }}>{tc('configured')}</span>
            ) : (
              <button onClick={() => setTab('settings')} style={{ background: 'none', border: 'none', color: 'var(--cp-yellow)', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 1 }}>
                {tc('setUp')}
              </button>
            )}
          </div>
          <div className="stat-row">
            <span style={{ color: 'var(--cp-text-muted)' }}>{t('recoveryEmail')}</span>
            {emailConfigured ? (
              <span style={{ color: 'var(--cp-green)', fontSize: 10, fontWeight: 600 }}>{tc('configured')}</span>
            ) : (
              <button onClick={() => setTab('settings')} style={{ background: 'none', border: 'none', color: 'var(--cp-yellow)', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 1 }}>
                {tc('setUp')}
              </button>
            )}
          </div>
          {billing?.fee_enabled && (
            <div className="stat-row">
              <span style={{ color: 'var(--cp-text-muted)' }}>{t('billing')}</span>
              <span className={`status-badge ${
                billing.billing_status === 'active' ? 'status-confirmed' :
                billing.billing_status === 'past_due' ? 'status-detected' :
                'status-expired'
              }`} style={{ fontSize: 8 }}>
                {billing.billing_status.toUpperCase().replace('_', ' ')}
              </span>
            </div>
          )}
          <div className="stat-row">
            <span style={{ color: 'var(--cp-text-muted)' }}>{t('productsLabel')}</span>
            <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--cp-text)' }}>{products.length}</span>
          </div>
          <div className="stat-row">
            <span style={{ color: 'var(--cp-text-muted)' }}>{t('network')}</span>
            <span style={{ fontSize: 10, fontWeight: 500, color: merchant.payment_address.startsWith('utest') ? 'var(--cp-yellow)' : 'var(--cp-green)' }}>
              {merchant.payment_address.startsWith('utest') ? tn('testnet') : tn('mainnet')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
