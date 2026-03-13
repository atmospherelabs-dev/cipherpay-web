'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { api, type MerchantInfo, type Product, type Invoice, type BillingSummary, type BillingCycle, type X402Verification, type ZecRates } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

import { DashboardNavbar } from './components/DashboardNavbar';
import { DashboardSidebar, type Tab } from './components/DashboardSidebar';
import { OverviewTab } from './tabs/OverviewTab';
import { ProductsTab } from './tabs/ProductsTab';
import { POSTab } from './tabs/POSTab';
import { InvoicesTab } from './tabs/InvoicesTab';
import { BillingTab } from './tabs/BillingTab';
import { SettingsTab } from './tabs/SettingsTab';
import { X402Tab } from './tabs/X402Tab';


export type TabAction = 'add-product' | 'create-paylink' | null;

export default function DashboardClient({ merchant }: { merchant: MerchantInfo }) {
  const t = useTranslations('dashboard');
  const [tab, setTab] = useState<Tab>('overview');
  const [tabAction, setTabAction] = useState<TabAction>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(true);

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


  useEffect(() => {
    loadProducts(); loadInvoices(); loadBilling(); loadX402();
  }, [loadProducts, loadInvoices, loadBilling, loadX402]);

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
        <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.5)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', letterSpacing: 1 }}>{t('suspended')}</div>
            <div style={{ fontSize: 10, color: 'var(--cp-text-muted)', marginTop: 4 }}>
              {t('suspendedDesc', { amount: billing.outstanding_zec.toFixed(6) })}
            </div>
          </div>
          <button onClick={settleBilling} className="btn" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.5)' }}>
            {t('payNow')}
          </button>
        </div>
      )}
      {billing?.fee_enabled && billing.billing_status === 'past_due' && (
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.4)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', letterSpacing: 1 }}>{t('pastDue')}</div>
            <div style={{ fontSize: 10, color: 'var(--cp-text-muted)', marginTop: 2 }}>
              {t('pastDueDesc', { amount: billing.outstanding_zec.toFixed(6) })}
            </div>
          </div>
          <button onClick={settleBilling} className="btn" style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.5)' }}>
            {t('payNow')}
          </button>
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
        <div className="grid-layout">
          <DashboardSidebar
            merchant={merchant}
            tab={tab}
            setTab={setTab}
            billing={billing}
            hasX402={x402Verifications.length > 0}
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
            {tab === 'pos' && (
              <POSTab
                products={products}
                loadingProducts={loadingProducts}
              />
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
              />
            )}
            {tab === 'billing' && (
              <BillingTab
                billing={billing}
                billingHistory={billingHistory}
                reloadBilling={loadBilling}
                zecRates={zecRates}
                displayCurrency={displayCurrency}
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
            {tab === 'x402' && (
              <X402Tab
                x402Verifications={x402Verifications}
                loadingX402={loadingX402}
                loadX402={loadX402}
                zecRates={zecRates}
                displayCurrency={displayCurrency}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
