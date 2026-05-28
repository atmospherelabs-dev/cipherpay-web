'use client';

import { memo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { MerchantInfo, Invoice, Product, BillingSummary, ZecRates, EventSummary } from '@/lib/api';
import { zecToFiat, fiatLabel } from '@/lib/currency';
import type { Tab } from '../components/DashboardSidebar';
import type { TabAction, TabNavigateOptions } from '../DashboardClient';
import { ZecMapPrompt } from '@/components/ZecMapPrompt';

interface OverviewTabProps {
  merchant: MerchantInfo;
  products: Product[];
  invoices: Invoice[];
  loadingInvoices: boolean;
  billing: BillingSummary | null;
  zecRates: ZecRates | null;
  displayCurrency: string;
  setTab: (t: Tab) => void;
  navigateTo: (t: Tab, options?: TabNavigateOptions) => void;
  navigateWithAction: (t: Tab, action?: TabAction) => void;
  events: EventSummary[];
  hasLumaKey?: boolean;
  isTestnet: boolean;
}

function SetupChecklist({
  nameConfigured,
  emailConfigured,
  webhookConfigured,
  setupDone,
  setupTotal,
  onGoSettings,
  t,
  tc,
}: {
  nameConfigured: boolean;
  emailConfigured: boolean;
  webhookConfigured: boolean;
  setupDone: number;
  setupTotal: number;
  onGoSettings: () => void;
  t: ReturnType<typeof useTranslations<'dashboard.overview'>>;
  tc: ReturnType<typeof useTranslations<'common'>>;
}) {
  const progress = setupTotal > 0 ? Math.round((setupDone / setupTotal) * 100) : 0;

  return (
    <div className="panel dash-overview-setup">
      <div className="panel-header">
        <span className="panel-title">{t('accountSetup')}</span>
        <span style={{ fontSize: 9, color: 'var(--cp-text-dim)', letterSpacing: 0.5 }}>
          {t('setupProgress', { done: setupDone, total: setupTotal })}
        </span>
      </div>
      <div className="panel-body">
        <div className="dash-overview-setup-progress">
          <div className="dash-overview-setup-progress-bar" style={{ width: `${progress}%` }} />
        </div>
        {!nameConfigured || !emailConfigured || !webhookConfigured ? (
          <p style={{ fontSize: 10, color: 'var(--cp-text-dim)', margin: '0 0 12px' }}>{t('setupIncomplete')}</p>
        ) : null}
        <div className="stat-row">
          <span style={{ color: 'var(--cp-text-muted)' }}>{t('storeName')}</span>
          {nameConfigured ? (
            <span style={{ color: 'var(--cp-green)', fontSize: 14, fontWeight: 700 }}>✓</span>
          ) : (
            <button onClick={onGoSettings} className="dash-setup-link">{tc('setUp')}</button>
          )}
        </div>
        <div className="stat-row">
          <span style={{ color: 'var(--cp-text-muted)' }}>{t('recoveryEmail')}</span>
          {emailConfigured ? (
            <span style={{ color: 'var(--cp-green)', fontSize: 14, fontWeight: 700 }}>✓</span>
          ) : (
            <button onClick={onGoSettings} className="dash-setup-link">{tc('setUp')}</button>
          )}
        </div>
        <div className="stat-row">
          <span style={{ color: 'var(--cp-text-muted)' }}>{t('webhook')}</span>
          {webhookConfigured ? (
            <span style={{ color: 'var(--cp-green)', fontSize: 14, fontWeight: 700 }}>✓</span>
          ) : (
            <button onClick={onGoSettings} className="dash-setup-link">{tc('setUp')}</button>
          )}
        </div>
      </div>
    </div>
  );
}

export const OverviewTab = memo(function OverviewTab({
  merchant, invoices, loadingInvoices, zecRates, displayCurrency,
  setTab, navigateTo, navigateWithAction, events, isTestnet,
}: OverviewTabProps) {
  const t = useTranslations('dashboard.overview');
  const tc = useTranslations('common');

  const pending = invoices.filter(i => i.status === 'pending').length;
  const detected = invoices.filter(i => i.status === 'detected' || i.status === 'underpaid').length;
  const needsAttention = pending + detected;
  const totalFiat = zecToFiat(merchant.stats.total_zec, zecRates, displayCurrency);
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);
  const activeEvents = events.filter(e => e.status === 'active');
  const upcomingEvents = activeEvents
    .filter(e => e.event_date)
    .sort((a, b) => new Date(a.event_date!).getTime() - new Date(b.event_date!).getTime())
    .slice(0, 3);

  const webhookConfigured = !!merchant.webhook_url;
  const emailConfigured = merchant.has_recovery_email;
  const nameConfigured = !!merchant.name;
  const setupSteps = [nameConfigured, emailConfigured, webhookConfigured];
  const setupDone = setupSteps.filter(Boolean).length;
  const setupTotal = setupSteps.length;
  const setupComplete = setupDone === setupTotal;
  const isNewMerchant = merchant.stats.total_invoices === 0;
  const showZecMap = nameConfigured && merchant.stats.confirmed > 0;

  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const quickActionsPanel = (
    <div className="panel dash-overview-actions" style={{ overflow: 'visible', zIndex: 2, position: 'relative' }}>
      <div className="panel-header">
        <span className="panel-title">{t('quickActions')}</span>
      </div>
      <div className="panel-body dash-quick-actions-bar">
        <button onClick={() => navigateWithAction('links', 'create-link')} className="btn-primary">
          {t('createPayLink')}
        </button>
        <button onClick={() => navigateWithAction('invoices', 'create-paylink')} className="btn">
          {t('quickInvoice')}
        </button>
        <button onClick={() => navigateWithAction('products', 'add-product')} className="btn">
          {t('addProduct')}
        </button>
        <button onClick={() => setTab('pos')} className="btn">
          {t('openPos')}
        </button>
        <div className="dash-quick-actions-more-wrap">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="btn dash-quick-actions-more"
          >
            {t('moreActions')} <span style={{ fontSize: 8, marginInlineStart: 2, opacity: 0.6 }}>▼</span>
          </button>
          {showMoreMenu && (
            <div className="dash-more-menu">
              <button
                onClick={() => { setShowMoreMenu(false); navigateWithAction('links', 'create-donation-link'); }}
                className="dash-dropdown-item"
              >
                {t('createDonationLink')}
              </button>
              <button
                onClick={() => { setShowMoreMenu(false); navigateWithAction('events', 'create-event'); }}
                className="dash-dropdown-item"
              >
                {t('newCipherEvent')}
              </button>
              {isTestnet && (
                <button
                  onClick={() => { setShowMoreMenu(false); navigateWithAction('events', 'import-luma'); }}
                  className="dash-dropdown-item"
                  style={{ color: 'var(--cp-warm)' }}
                >
                  {t('importFromLuma')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="dash-overview-header">
        <h1 className="dash-overview-title">
          {isNewMerchant
            ? t('welcomeNew')
            : t('welcomeBack', { name: merchant.name || t('yourStore') })}
        </h1>
      </div>

      {/* New merchants: setup + get started (full width) */}
      {isNewMerchant && !setupComplete && (
        <SetupChecklist
          nameConfigured={nameConfigured}
          emailConfigured={emailConfigured}
          webhookConfigured={webhookConfigured}
          setupDone={setupDone}
          setupTotal={setupTotal}
          onGoSettings={() => setTab('settings')}
          t={t}
          tc={tc}
        />
      )}

      {isNewMerchant && (
        <div className="panel dash-get-started-panel">
          <div className="panel-body" style={{ padding: '24px 20px', textAlign: 'center' }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--cp-text)', margin: '0 0 8px' }}>
              {t('getStartedTitle')}
            </h2>
            <p style={{ fontSize: 11, color: 'var(--cp-text-dim)', margin: '0 0 16px', maxWidth: 420, marginInline: 'auto' }}>
              {t('getStartedDesc')}
            </p>
            <button
              onClick={() => navigateWithAction('links', 'create-link')}
              className="btn-primary"
              style={{ fontSize: 11 }}
            >
              {t('getStartedCta')}
            </button>
            <p style={{ fontSize: 10, color: 'var(--cp-text-dim)', margin: '16px 0 0' }}>
              {t('docsHelp')}{' '}
              <Link href="/docs/quickstart" style={{ color: 'var(--cp-cyan)', textDecoration: 'none' }}>
                {t('docsQuickstart')}
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Returning merchant layout */}
      {!isNewMerchant && (
        <div className="dash-overview-returning">
          {!setupComplete && (
            <div className="dash-overview-hero-setup">
              <SetupChecklist
                nameConfigured={nameConfigured}
                emailConfigured={emailConfigured}
                webhookConfigured={webhookConfigured}
                setupDone={setupDone}
                setupTotal={setupTotal}
                onGoSettings={() => setTab('settings')}
                t={t}
                tc={tc}
              />
            </div>
          )}
          <div className="dash-overview-hero-stats">
            <div className="dash-stat-grid dash-stat-grid--3">
              <div
                className="panel dash-stat-card"
                style={{ textAlign: 'center', cursor: 'pointer' }}
                onClick={() => navigateTo('cashOut')}
              >
                <div className="panel-body" style={{ padding: '20px 12px' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--cp-text)', lineHeight: 1.2 }}>
                    {merchant.stats.total_zec.toFixed(4)}
                  </div>
                  <div style={{ fontSize: 9, letterSpacing: 1, color: 'var(--cp-text-muted)', marginTop: 6 }}>
                    {t('totalZec')}
                  </div>
                  {totalFiat !== null && (
                    <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 4 }}>
                      {fiatLabel(totalFiat, displayCurrency).trim()}
                    </div>
                  )}
                  <div style={{ fontSize: 9, color: 'var(--cp-cyan)', marginTop: 4, letterSpacing: 0.5 }}>
                    {t('viewCashOut')} →
                  </div>
                </div>
              </div>
              <div
                className="panel dash-stat-card"
                style={{ textAlign: 'center', cursor: 'pointer' }}
                onClick={() => navigateTo('invoices', { statusFilter: 'confirmed' })}
              >
                <div className="panel-body" style={{ padding: '20px 12px' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--cp-text)', lineHeight: 1.2 }}>
                    {merchant.stats.confirmed}
                  </div>
                  <div style={{ fontSize: 9, letterSpacing: 1, color: 'var(--cp-text-muted)', marginTop: 6 }}>
                    {t('confirmed')}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 2 }}>
                    {t('ofTotal', { total: merchant.stats.total_invoices })}
                  </div>
                </div>
              </div>
              <div
                className={`panel dash-stat-card${needsAttention > 0 ? ' dash-stat-card--attention' : ''}`}
                style={{ textAlign: 'center', cursor: 'pointer' }}
                onClick={() => navigateTo('invoices', { statusFilter: 'attention' })}
              >
                <div className="panel-body" style={{ padding: '20px 12px' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: needsAttention > 0 ? 'var(--cp-yellow)' : 'var(--cp-text)', lineHeight: 1.2 }}>
                    {needsAttention}
                  </div>
                  <div style={{ fontSize: 9, letterSpacing: 1, color: 'var(--cp-text-muted)', marginTop: 6 }}>
                    {t('needsAttention')}
                  </div>
                  {detected > 0 && (
                    <div style={{ fontSize: 9, color: 'var(--cp-purple)', marginTop: 2 }}>
                      {t('detected', { count: detected })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {quickActionsPanel}
          <div className="panel dash-overview-recent">
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
                  <div
                    key={inv.id}
                    className="stat-row dash-activity-row"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigateTo('invoices', { invoiceId: inv.id })}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--cp-text)' }}>
                          {inv.product_name || inv.memo_code}
                        </span>
                        {(inv.is_donation || inv.is_event || inv.product_name === 'Fee Settlement') && (
                          <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: 0.5, color: inv.product_name === 'Fee Settlement' ? 'var(--cp-cyan)' : 'var(--cp-text-muted)', background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: 3 }}>
                            {inv.product_name === 'Fee Settlement' ? 'BILLING' : inv.is_donation ? 'DONATION' : inv.is_luma ? 'LUMA' : 'TICKET'}
                          </span>
                        )}
                      </div>
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
                      }`} style={{ fontSize: 9, minWidth: 60, textAlign: 'center' }}>
                        {inv.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upcoming events */}
      {!isNewMerchant && upcomingEvents.length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">{t('upcomingEvents')}</span>
            <button onClick={() => setTab('events')} className="btn btn-small">{tc('viewAll')}</button>
          </div>
          <div className="panel-body">
            {upcomingEvents.map((ev) => (
              <div key={ev.id} className="stat-row dash-activity-row" style={{ cursor: 'pointer' }} onClick={() => setTab('events')}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--cp-text)' }}>
                      {ev.title}
                    </span>
                    {ev.luma_event_id && (
                      <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.5, color: 'var(--cp-warm)', background: 'var(--cp-warm-bg)', padding: '1px 5px', borderRadius: 3, border: '1px solid var(--cp-warm-border)' }}>
                        LUMA
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 9, color: 'var(--cp-text-dim)' }}>
                    {new Date(ev.event_date!).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    {ev.event_location && ` · ${ev.event_location}`}
                  </span>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'end' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--cp-text)' }}>
                    {ev.total_capacity != null
                      ? `${ev.sold_count} / ${ev.total_capacity}`
                      : ev.sold_count}
                  </span>
                  <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', letterSpacing: 0.5 }}>
                    {t('soldLabel')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ZecMap — after first confirmed payment */}
      {showZecMap && (
        <div className="panel">
          <div className="panel-body">
            <ZecMapPrompt namespace="dashboard.overview" />
          </div>
        </div>
      )}
    </div>
  );
});
