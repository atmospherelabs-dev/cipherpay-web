'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { api, type MerchantInfo, type Product, type Invoice, type BillingSummary, type BillingCycle, type X402Verification, type ZecRates, type WebhookDelivery, type EventSummary, type AgentSession } from '@/lib/api';
import { isTestnet } from '@/lib/config';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

import { DashboardNavbar } from './components/DashboardNavbar';
import { Banner } from '@/components/Banner';
import { DashboardSidebar, type Tab } from './components/DashboardSidebar';
import { OverviewTab } from './tabs/OverviewTab';
import { ProductsTab } from './tabs/ProductsTab';
import { EventsTab } from './tabs/EventsTab';
import { POSTab } from './tabs/POSTab';
import { InvoicesTab } from './tabs/InvoicesTab';
import { BillingTab } from './tabs/BillingTab';
import { SettingsTab } from './tabs/SettingsTab';
import { X402Tab } from './tabs/X402Tab';
import { WebhooksTab } from './tabs/WebhooksTab';
import { PaymentLinksTab } from './tabs/PaymentLinksTab';
import { SubscriptionsTab } from './tabs/SubscriptionsTab';
import { CashOutTab } from './tabs/CashOutTab';


export type TabAction = 'add-product' | 'create-paylink' | 'create-link' | 'create-donation-link' | 'create-event' | 'import-luma' | null;

export default function DashboardClient({ merchant }: { merchant: MerchantInfo }) {
  const t = useTranslations('dashboard');
  const [tab, setTab] = useState<Tab>('overview');
  const [tabAction, setTabAction] = useState<TabAction>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const [displayCurrency, setDisplayCurrency] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cp_currency') || 'EUR';
    }
    return 'EUR';
  });
  const [zecRates, setZecRates] = useState<ZecRates | null>(null);

  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingCycle[]>([]);

  const [x402Verifications, setX402Verifications] = useState<X402Verification[]>([]);
  const [loadingX402, setLoadingX402] = useState(true);

  const [sessions, setSessions] = useState<AgentSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const [webhookDeliveries, setWebhookDeliveries] = useState<WebhookDelivery[]>([]);
  const [webhookTotal, setWebhookTotal] = useState(0);


  const { logout, refreshMerchant } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const loadProducts = useCallback(async () => {
    try { setProducts(await api.listProducts()); }
    catch (err) { console.error('Failed to load products', err); }
    setLoadingProducts(false);
  }, []);

  const loadInvoices = useCallback(async () => {
    try { setInvoices(await api.myInvoices()); }
    catch (err) { console.error('Failed to load invoices', err); }
    setLoadingInvoices(false);
  }, []);

  const loadEvents = useCallback(async () => {
    try { setEvents(await api.listEvents()); }
    catch (err) { console.error('Failed to load events', err); }
    setLoadingEvents(false);
  }, []);

  const loadBilling = useCallback(async () => {
    try {
      setBilling(await api.getBilling());
      setBillingHistory(await api.getBillingHistory());
    } catch (err) { console.error('Failed to load billing', err); }
  }, []);

  const loadX402 = useCallback(async () => {
    try {
      const data = await api.x402History();
      setX402Verifications(data.verifications || []);
    } catch (err) { console.error('Failed to load x402', err); }
    setLoadingX402(false);
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const data = await api.sessionHistory();
      setSessions(data.sessions || []);
    } catch (err) { console.error('Failed to load sessions', err); }
    setLoadingSessions(false);
  }, []);

  const loadWebhooks = useCallback(async () => {
    try {
      const data = await api.webhookHistory({ limit: 50 });
      setWebhookDeliveries(data.deliveries);
      setWebhookTotal(data.total);
    } catch (err) { console.error('Failed to load webhooks', err); }
  }, []);


  useEffect(() => {
    loadProducts(); loadInvoices(); loadBilling(); loadX402(); loadSessions(); loadWebhooks(); loadEvents();
  }, [loadProducts, loadEvents, loadInvoices, loadBilling, loadX402, loadSessions, loadWebhooks]);

  useEffect(() => {
    const fetchRates = () => {
      api.getRates()
        .then(r => setZecRates(r))
        .catch(() => {});
    };
    fetchRates();
    const interval = setInterval(fetchRates, 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => { await logout(); router.push('/dashboard/login'); };

  const settleBilling = async () => {
    try {
      const resp = await api.settleBilling();
      showToast(t('toasts.settlementCreated', { amount: resp.outstanding_zec.toFixed(6) }));
      if (resp.invoice_id) {
        window.open(`/pay/${resp.invoice_id}`, '_blank');
      }
      loadBilling();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('toasts.failedSettle'), true);
    }
  };

  const checkoutOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  const navigateWithAction = (t: Tab, action: TabAction = null) => {
    setTab(t);
    setTabAction(action);
  };

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, lineHeight: 1.6 }}>
      <DashboardNavbar
        merchant={merchant}
        zecRates={zecRates}
        displayCurrency={displayCurrency}
        onLogout={handleLogout}
      />

      {/* Billing status banners */}
      {billing?.fee_enabled && billing.billing_status === 'suspended' && (
        <Banner
          variant="error"
          title={t('suspended')}
          description={t('suspendedDesc', { amount: billing.outstanding_zec.toFixed(6) })}
          action={
            <button onClick={settleBilling} className="btn" style={{ color: 'var(--cp-red)', borderColor: 'rgba(239,68,68,0.5)' }}>
              {t('payNow')}
            </button>
          }
        />
      )}
      {billing?.fee_enabled && billing.billing_status === 'past_due' && (
        <Banner
          variant="warning"
          title={t('pastDue')}
          description={t('pastDueDesc', { amount: billing.outstanding_zec.toFixed(6) })}
          action={
            <button onClick={settleBilling} className="btn" style={{ color: 'var(--cp-yellow)', borderColor: 'rgba(245,158,11,0.5)' }}>
              {t('payNow')}
            </button>
          }
        />
      )}

      <PasskeyPrompt merchant={merchant} setTab={setTab} />

      <div className="dash-container">
        <div className="grid-layout">
          <DashboardSidebar
            merchant={merchant}
            tab={tab}
            setTab={setTab}
            billing={billing}
          />

          <div>
            {tab === 'overview' && (
              <OverviewTab
                merchant={merchant}
                products={products}
                invoices={invoices}
                loadingInvoices={loadingInvoices}
                billing={billing}
                zecRates={zecRates}
                displayCurrency={displayCurrency}
                setTab={setTab}
                navigateWithAction={navigateWithAction}
                events={events}
                hasLumaKey={merchant?.has_luma_key}
                isTestnet={merchant.payment_address.startsWith('utest')}
              />
            )}
            {tab === 'products' && (
              <ProductsTab
                products={products}
                loadingProducts={loadingProducts}
                reloadProducts={loadProducts}
                checkoutOrigin={checkoutOrigin}
                displayCurrency={displayCurrency}
                initialAction={tabAction}
                clearAction={() => setTabAction(null)}
              />
            )}
            {tab === 'events' && (
              <EventsTab
                events={events}
                loadingEvents={loadingEvents}
                reloadEvents={loadEvents}
                checkoutOrigin={checkoutOrigin}
                hasLumaKey={merchant?.has_luma_key}
                isTestnet={merchant.payment_address.startsWith('utest')}
                initialAction={tabAction}
                clearAction={() => setTabAction(null)}
              />
            )}
            {tab === 'links' && (
              <PaymentLinksTab
                products={products}
                checkoutOrigin={checkoutOrigin}
                initialAction={tabAction}
                clearAction={() => setTabAction(null)}
              />
            )}
            {tab === 'pos' && (
              <POSTab
                products={products}
                loadingProducts={loadingProducts}
                onGoToSettings={() => setTab('settings')}
              />
            )}
            {tab === 'subscriptions' && (
              <SubscriptionsTab products={products} />
            )}
            {tab === 'invoices' && (
              <InvoicesTab
                invoices={invoices}
                loadingInvoices={loadingInvoices}
                reloadInvoices={loadInvoices}
                products={products}
                zecRates={zecRates}
                displayCurrency={displayCurrency}
                checkoutOrigin={checkoutOrigin}
                initialAction={tabAction}
                clearAction={() => setTabAction(null)}
                isTestnet={merchant.payment_address.startsWith('utest')}
              />
            )}
            {tab === 'billing' && (
              <BillingTab
                billing={billing}
                billingHistory={billingHistory}
                reloadBilling={loadBilling}
                zecRates={zecRates}
                displayCurrency={displayCurrency}
                invoices={invoices}
              />
            )}
            {tab === 'settings' && (
              <SettingsTab
                merchant={merchant}
                displayCurrency={displayCurrency}
                setDisplayCurrency={setDisplayCurrency}
                reloadMerchant={refreshMerchant}
              />
            )}
            {tab === 'cashOut' && (
              <CashOutTab
                merchant={merchant}
                zecRates={zecRates}
                displayCurrency={displayCurrency}
              />
            )}
            {tab === 'webhooks' && (
              <WebhooksTab
                initialDeliveries={webhookDeliveries}
                initialTotal={webhookTotal}
                hasWebhookUrl={!!merchant.webhook_url}
                onGoToSettings={() => setTab('settings')}
              />
            )}
            {tab === 'x402' && (
              <X402Tab
                x402Verifications={x402Verifications}
                loadingX402={loadingX402}
                loadX402={loadX402}
                sessions={sessions}
                loadingSessions={loadingSessions}
                loadSessions={loadSessions}
                zecRates={zecRates}
                displayCurrency={displayCurrency}
                isTestnet={merchant.payment_address.startsWith('utest')}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PasskeyPrompt({ merchant, setTab }: { merchant: MerchantInfo; setTab: (t: Tab) => void }) {
  const t = useTranslations('dashboard.passkeyPrompt');
  const [dismissed, setDismissed] = useState(false);

  const show = useMemo(() => {
    if (dismissed) return false;
    if (merchant.has_passkeys) return false;
    if (typeof window === 'undefined') return false;
    if (!window.PublicKeyCredential) return false;
    if (sessionStorage.getItem('cp_passkey_prompt_dismissed')) return false;
    return true;
  }, [merchant.has_passkeys, dismissed]);

  if (!show) return null;

  return (
    <Banner
      variant="info"
      title={t('title')}
      description={t('description')}
      action={
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setTab('settings')}
            className="btn"
            style={{ color: 'var(--cp-cyan)', borderColor: 'rgba(86,212,200,0.5)', fontSize: 10 }}
          >
            {t('setup')}
          </button>
          <button
            onClick={() => {
              setDismissed(true);
              sessionStorage.setItem('cp_passkey_prompt_dismissed', '1');
            }}
            className="btn"
            style={{ fontSize: 10, color: 'var(--cp-text-dim)' }}
          >
            {t('notNow')}
          </button>
        </div>
      }
    />
  );
}
