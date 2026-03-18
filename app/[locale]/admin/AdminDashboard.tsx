'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '@/lib/config';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import Link from 'next/link';

interface AdminDashboardProps {
  adminKey: string;
  onLogout: () => void;
}

interface Stats {
  merchants: number;
  products: number;
  invoices: { total: number; confirmed: number; pending: number; expired: number; draft: number };
  volume: { total_zec: number; total_zatoshis: number };
  fees: { total: number; collected: number; outstanding: number };
  subscriptions: { total: number; active: number };
  last_24h: { invoices: number; confirmed: number; volume_zec: number };
  last_7d: { invoices: number; confirmed: number; volume_zec: number };
  last_30d: { invoices: number; confirmed: number; volume_zec: number };
}

interface Merchant {
  id: string;
  name: string;
  invoice_count: number;
  total_zec: number;
  webhook_configured: boolean;
  created_at: string;
  billing_status: string;
}

interface BillingData {
  cycles: { open: number; invoiced: number; past_due: number; paid: number };
  merchants: { suspended: number; past_due: number };
  totals: { outstanding_zec: number; collected_zec: number };
  recent_cycles: Array<{
    id: string;
    merchant_id: string;
    merchant_name: string;
    period_end: string;
    total_fees_zec: number;
    outstanding_zec: number;
    status: string;
    grace_until: string | null;
  }>;
}

interface SystemData {
  network: string;
  scanner_height: string | null;
  price_feed: { zec_eur: number; zec_usd: number; zec_brl: number; zec_gbp: number; updated_at: string } | null;
  webhooks: { pending: number; failed: number };
  active_sessions: number;
  fee_enabled: boolean;
  fee_rate: number;
}

type Tab = 'overview' | 'merchants' | 'billing' | 'webhooks' | 'system';

interface WebhookDelivery {
  id: string;
  invoice_id: string;
  event_type: string | null;
  merchant_id: string | null;
  url: string;
  status: string;
  response_status: number | null;
  response_error: string | null;
  attempts: number;
  created_at: string;
  last_attempt_at: string | null;
}

interface WebhookData {
  deliveries: WebhookDelivery[];
  total: number;
}

function fmtUsd(zec: number, rate: number | undefined): string {
  if (!rate) return '';
  return `(~$${(zec * rate).toFixed(2)})`;
}

export default function AdminDashboard({ adminKey, onLogout }: AdminDashboardProps) {
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [system, setSystem] = useState<SystemData | null>(null);
  const [webhookData, setWebhookData] = useState<WebhookData | null>(null);
  const [loading, setLoading] = useState(true);

  const headers = useCallback(() => ({ 'X-Admin-Key': adminKey }), [adminKey]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, merchantsRes, billingRes, systemRes, webhooksRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/stats`, { headers: headers() }),
        fetch(`${API_URL}/api/admin/merchants`, { headers: headers() }),
        fetch(`${API_URL}/api/admin/billing`, { headers: headers() }),
        fetch(`${API_URL}/api/admin/system`, { headers: headers() }),
        fetch(`${API_URL}/api/admin/webhooks?limit=100`, { headers: headers() }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (merchantsRes.ok) setMerchants(await merchantsRes.json());
      if (billingRes.ok) setBilling(await billingRes.json());
      if (systemRes.ok) setSystem(await systemRes.json());
      if (webhooksRes.ok) setWebhookData(await webhooksRes.json());
    } catch (e) {
      console.error('Failed to fetch admin data', e);
    }
    setLoading(false);
  }, [headers]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'OVERVIEW' },
    { id: 'merchants', label: 'MERCHANTS' },
    { id: 'billing', label: 'BILLING' },
    { id: 'webhooks', label: 'WEBHOOKS' },
    { id: 'system', label: 'SYSTEM' },
  ];

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, lineHeight: 1.6, display: 'flex', flexDirection: 'column' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--cp-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/"><Logo size="sm" /></Link>
          <span style={{ fontSize: 9, letterSpacing: 2, color: 'var(--cp-purple)', fontWeight: 600, padding: '2px 8px', border: '1px solid var(--cp-purple)', borderRadius: 4 }}>
            ADMIN
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ThemeToggle />
          <button onClick={onLogout} className="btn btn-small" style={{ fontSize: 9 }}>LOGOUT</button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <nav style={{ width: 180, borderRight: '1px solid var(--cp-border)', padding: '16px 0', flexShrink: 0 }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '10px 20px',
                fontSize: 10, letterSpacing: 1, fontWeight: tab === t.id ? 600 : 400,
                color: tab === t.id ? 'var(--cp-cyan)' : 'var(--cp-text-muted)',
                background: tab === t.id ? 'var(--cp-hover)' : 'transparent',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                borderLeft: tab === t.id ? '2px solid var(--cp-cyan)' : '2px solid transparent',
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <main style={{ flex: 1, padding: 24, maxWidth: 1000, overflow: 'auto' }}>
          {loading && !stats ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
              <div className="w-6 h-6 border-2 border-cp-cyan border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {tab === 'overview' && stats && <OverviewTab stats={stats} system={system} />}
              {tab === 'merchants' && <MerchantsTab merchants={merchants} system={system} />}
              {tab === 'billing' && billing && <BillingTab billing={billing} system={system} />}
              {tab === 'webhooks' && webhookData && <WebhooksTab data={webhookData} adminKey={adminKey} />}
              {tab === 'system' && system && <SystemTab system={system} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function StatCard({ value, label, color, sub, sub2 }: { value: string | number; label: string; color: string; sub?: string; sub2?: string }) {
  return (
    <div className="panel" style={{ textAlign: 'center' }}>
      <div className="panel-body" style={{ padding: '20px 16px' }}>
        <div style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
        <div style={{ fontSize: 9, letterSpacing: 1, color: 'var(--cp-text-muted)', marginTop: 6 }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', marginTop: 2 }}>{sub}</div>}
        {sub2 && <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', marginTop: 1 }}>{sub2}</div>}
      </div>
    </div>
  );
}

function OverviewTab({ stats, system }: { stats: Stats; system: SystemData | null }) {
  const conversionRate = stats.invoices.total > 0
    ? Math.round((stats.invoices.confirmed / stats.invoices.total) * 100)
    : 0;
  const usd = system?.price_feed?.zec_usd;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <StatCard value={stats.merchants} label="MERCHANTS" color="var(--cp-cyan)" />
        <StatCard value={stats.volume.total_zec.toFixed(4)} label="TOTAL VOLUME" color="var(--cp-green)" sub="ZEC" sub2={fmtUsd(stats.volume.total_zec, usd)} />
        <StatCard value={stats.invoices.confirmed} label="CONFIRMED" color="var(--cp-green)" sub={`of ${stats.invoices.total} total`} />
        <StatCard value={`${conversionRate}%`} label="CONVERSION" color="var(--cp-text)" sub={`${stats.invoices.expired} expired`} />
      </div>

      {/* Time-based metrics */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Activity</span>
        </div>
        <div className="panel-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: 1, color: 'var(--cp-text-muted)', marginBottom: 8 }}>LAST 24H</div>
              <div className="stat-row"><span style={{ color: 'var(--cp-text-muted)' }}>Invoices</span><span style={{ fontWeight: 500 }}>{stats.last_24h.invoices}</span></div>
              <div className="stat-row"><span style={{ color: 'var(--cp-text-muted)' }}>Confirmed</span><span style={{ fontWeight: 500, color: 'var(--cp-green)' }}>{stats.last_24h.confirmed}</span></div>
              <div className="stat-row"><span style={{ color: 'var(--cp-text-muted)' }}>Volume</span><span style={{ fontWeight: 500 }}>{stats.last_24h.volume_zec.toFixed(4)} ZEC <span style={{ color: 'var(--cp-text-dim)', fontWeight: 400 }}>{fmtUsd(stats.last_24h.volume_zec, usd)}</span></span></div>
            </div>
            <div>
              <div style={{ fontSize: 9, letterSpacing: 1, color: 'var(--cp-text-muted)', marginBottom: 8 }}>LAST 7D</div>
              <div className="stat-row"><span style={{ color: 'var(--cp-text-muted)' }}>Invoices</span><span style={{ fontWeight: 500 }}>{stats.last_7d.invoices}</span></div>
              <div className="stat-row"><span style={{ color: 'var(--cp-text-muted)' }}>Confirmed</span><span style={{ fontWeight: 500, color: 'var(--cp-green)' }}>{stats.last_7d.confirmed}</span></div>
              <div className="stat-row"><span style={{ color: 'var(--cp-text-muted)' }}>Volume</span><span style={{ fontWeight: 500 }}>{stats.last_7d.volume_zec.toFixed(4)} ZEC <span style={{ color: 'var(--cp-text-dim)', fontWeight: 400 }}>{fmtUsd(stats.last_7d.volume_zec, usd)}</span></span></div>
            </div>
            <div>
              <div style={{ fontSize: 9, letterSpacing: 1, color: 'var(--cp-text-muted)', marginBottom: 8 }}>LAST 30D</div>
              <div className="stat-row"><span style={{ color: 'var(--cp-text-muted)' }}>Invoices</span><span style={{ fontWeight: 500 }}>{stats.last_30d.invoices}</span></div>
              <div className="stat-row"><span style={{ color: 'var(--cp-text-muted)' }}>Confirmed</span><span style={{ fontWeight: 500, color: 'var(--cp-green)' }}>{stats.last_30d.confirmed}</span></div>
              <div className="stat-row"><span style={{ color: 'var(--cp-text-muted)' }}>Volume</span><span style={{ fontWeight: 500 }}>{stats.last_30d.volume_zec.toFixed(4)} ZEC <span style={{ color: 'var(--cp-text-dim)', fontWeight: 400 }}>{fmtUsd(stats.last_30d.volume_zec, usd)}</span></span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Fee revenue */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Fee Revenue</span>
        </div>
        <div className="panel-body">
          <div className="stat-row">
            <span style={{ color: 'var(--cp-text-muted)' }}>Total Fees Earned</span>
            <span style={{ fontWeight: 600, color: 'var(--cp-cyan)' }}>{stats.fees.total.toFixed(8)} ZEC <span style={{ color: 'var(--cp-text-dim)', fontWeight: 400 }}>{fmtUsd(stats.fees.total, usd)}</span></span>
          </div>
          <div className="stat-row">
            <span style={{ color: 'var(--cp-text-muted)' }}>Collected</span>
            <span style={{ fontWeight: 500, color: 'var(--cp-green)' }}>{stats.fees.collected.toFixed(8)} ZEC <span style={{ color: 'var(--cp-text-dim)', fontWeight: 400 }}>{fmtUsd(stats.fees.collected, usd)}</span></span>
          </div>
          <div className="stat-row">
            <span style={{ color: 'var(--cp-text-muted)' }}>Outstanding</span>
            <span style={{ fontWeight: 500, color: stats.fees.outstanding > 0 ? 'var(--cp-yellow)' : 'var(--cp-text-dim)' }}>
              {stats.fees.outstanding.toFixed(8)} ZEC <span style={{ color: 'var(--cp-text-dim)', fontWeight: 400 }}>{fmtUsd(stats.fees.outstanding, usd)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Quick info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="panel">
          <div className="panel-header"><span className="panel-title">Products & Subscriptions</span></div>
          <div className="panel-body">
            <div className="stat-row"><span style={{ color: 'var(--cp-text-muted)' }}>Active Products</span><span style={{ fontWeight: 500 }}>{stats.products}</span></div>
            <div className="stat-row"><span style={{ color: 'var(--cp-text-muted)' }}>Total Subscriptions</span><span style={{ fontWeight: 500 }}>{stats.subscriptions.total}</span></div>
            <div className="stat-row"><span style={{ color: 'var(--cp-text-muted)' }}>Active Subscriptions</span><span style={{ fontWeight: 500, color: 'var(--cp-green)' }}>{stats.subscriptions.active}</span></div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-header"><span className="panel-title">Pipeline</span></div>
          <div className="panel-body">
            <div className="stat-row"><span style={{ color: 'var(--cp-text-muted)' }}>Pending</span><span style={{ fontWeight: 500, color: 'var(--cp-yellow)' }}>{stats.invoices.pending}</span></div>
            <div className="stat-row"><span style={{ color: 'var(--cp-text-muted)' }}>Draft</span><span style={{ fontWeight: 500, color: 'var(--cp-purple)' }}>{stats.invoices.draft}</span></div>
            {system && (
              <>
                <div className="stat-row"><span style={{ color: 'var(--cp-text-muted)' }}>Pending Webhooks</span><span style={{ fontWeight: 500 }}>{system.webhooks.pending}</span></div>
                <div className="stat-row"><span style={{ color: 'var(--cp-text-muted)' }}>Failed Webhooks</span><span style={{ fontWeight: 500, color: system.webhooks.failed > 0 ? 'var(--cp-red)' : 'var(--cp-text-dim)' }}>{system.webhooks.failed}</span></div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MerchantsTab({ merchants, system }: { merchants: Merchant[]; system: SystemData | null }) {
  const usd = system?.price_feed?.zec_usd;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">All Merchants ({merchants.length})</span>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--cp-border)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 9, letterSpacing: 1, color: 'var(--cp-text-muted)', fontWeight: 500 }}>NAME</th>
                  <th style={{ textAlign: 'right', padding: '10px 16px', fontSize: 9, letterSpacing: 1, color: 'var(--cp-text-muted)', fontWeight: 500 }}>INVOICES</th>
                  <th style={{ textAlign: 'right', padding: '10px 16px', fontSize: 9, letterSpacing: 1, color: 'var(--cp-text-muted)', fontWeight: 500 }}>VOLUME (ZEC)</th>
                  <th style={{ textAlign: 'center', padding: '10px 16px', fontSize: 9, letterSpacing: 1, color: 'var(--cp-text-muted)', fontWeight: 500 }}>WEBHOOK</th>
                  <th style={{ textAlign: 'center', padding: '10px 16px', fontSize: 9, letterSpacing: 1, color: 'var(--cp-text-muted)', fontWeight: 500 }}>BILLING</th>
                  <th style={{ textAlign: 'right', padding: '10px 16px', fontSize: 9, letterSpacing: 1, color: 'var(--cp-text-muted)', fontWeight: 500 }}>JOINED</th>
                </tr>
              </thead>
              <tbody>
                {merchants.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--cp-border)' }}>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ fontWeight: 500, color: 'var(--cp-text)' }}>{m.name || '(unnamed)'}</div>
                      <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', fontFamily: 'monospace' }}>{m.id.slice(0, 8)}...</div>
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 500 }}>{m.invoice_count}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                      <div style={{ fontWeight: 500, color: 'var(--cp-green)' }}>{m.total_zec.toFixed(4)}</div>
                      {usd && <div style={{ fontSize: 9, color: 'var(--cp-text-dim)' }}>{fmtUsd(m.total_zec, usd)}</div>}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                      <span style={{ fontSize: 9, color: m.webhook_configured ? 'var(--cp-green)' : 'var(--cp-text-dim)' }}>
                        {m.webhook_configured ? 'YES' : 'NO'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                      <span className={`status-badge ${
                        m.billing_status === 'active' ? 'status-confirmed' :
                        m.billing_status === 'past_due' ? 'status-detected' :
                        m.billing_status === 'suspended' ? 'status-expired' :
                        'status-pending'
                      }`} style={{ fontSize: 8 }}>
                        {m.billing_status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 10, color: 'var(--cp-text-dim)' }}>
                      {new Date(m.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
                {merchants.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--cp-text-dim)' }}>
                      No merchants registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function BillingTab({ billing, system }: { billing: BillingData; system: SystemData | null }) {
  const usd = system?.price_feed?.zec_usd;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <StatCard value={billing.totals.collected_zec.toFixed(4)} label="COLLECTED" color="var(--cp-green)" sub="ZEC" sub2={fmtUsd(billing.totals.collected_zec, usd)} />
        <StatCard value={billing.totals.outstanding_zec.toFixed(4)} label="OUTSTANDING" color={billing.totals.outstanding_zec > 0 ? 'var(--cp-yellow)' : 'var(--cp-text-dim)'} sub="ZEC" sub2={fmtUsd(billing.totals.outstanding_zec, usd)} />
        <StatCard value={billing.cycles.open} label="OPEN CYCLES" color="var(--cp-cyan)" />
        <StatCard value={billing.cycles.past_due} label="PAST DUE" color={billing.cycles.past_due > 0 ? 'var(--cp-red)' : 'var(--cp-text-dim)'} />
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Cycle Summary</span>
        </div>
        <div className="panel-body">
          <div className="stat-row"><span style={{ color: 'var(--cp-text-muted)' }}>Open</span><span style={{ fontWeight: 500 }}>{billing.cycles.open}</span></div>
          <div className="stat-row"><span style={{ color: 'var(--cp-text-muted)' }}>Invoiced</span><span style={{ fontWeight: 500 }}>{billing.cycles.invoiced}</span></div>
          <div className="stat-row"><span style={{ color: 'var(--cp-text-muted)' }}>Past Due</span><span style={{ fontWeight: 500, color: billing.cycles.past_due > 0 ? 'var(--cp-red)' : 'var(--cp-text-dim)' }}>{billing.cycles.past_due}</span></div>
          <div className="stat-row"><span style={{ color: 'var(--cp-text-muted)' }}>Paid</span><span style={{ fontWeight: 500, color: 'var(--cp-green)' }}>{billing.cycles.paid}</span></div>
          <div className="divider" />
          <div className="stat-row"><span style={{ color: 'var(--cp-text-muted)' }}>Suspended Merchants</span><span style={{ fontWeight: 500, color: billing.merchants.suspended > 0 ? 'var(--cp-red)' : 'var(--cp-text-dim)' }}>{billing.merchants.suspended}</span></div>
          <div className="stat-row"><span style={{ color: 'var(--cp-text-muted)' }}>Past Due Merchants</span><span style={{ fontWeight: 500, color: billing.merchants.past_due > 0 ? 'var(--cp-yellow)' : 'var(--cp-text-dim)' }}>{billing.merchants.past_due}</span></div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Recent Cycles</span>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--cp-border)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 9, letterSpacing: 1, color: 'var(--cp-text-muted)', fontWeight: 500 }}>MERCHANT</th>
                  <th style={{ textAlign: 'right', padding: '10px 16px', fontSize: 9, letterSpacing: 1, color: 'var(--cp-text-muted)', fontWeight: 500 }}>FEES (ZEC)</th>
                  <th style={{ textAlign: 'right', padding: '10px 16px', fontSize: 9, letterSpacing: 1, color: 'var(--cp-text-muted)', fontWeight: 500 }}>OWED (ZEC)</th>
                  <th style={{ textAlign: 'center', padding: '10px 16px', fontSize: 9, letterSpacing: 1, color: 'var(--cp-text-muted)', fontWeight: 500 }}>STATUS</th>
                  <th style={{ textAlign: 'right', padding: '10px 16px', fontSize: 9, letterSpacing: 1, color: 'var(--cp-text-muted)', fontWeight: 500 }}>PERIOD END</th>
                </tr>
              </thead>
              <tbody>
                {billing.recent_cycles.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--cp-border)' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 500 }}>{c.merchant_name || c.merchant_id.slice(0, 8)}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                      <div>{c.total_fees_zec.toFixed(6)}</div>
                      {usd && <div style={{ fontSize: 9, color: 'var(--cp-text-dim)' }}>{fmtUsd(c.total_fees_zec, usd)}</div>}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', color: c.outstanding_zec > 0 ? 'var(--cp-yellow)' : 'var(--cp-text-dim)' }}>
                      <div>{c.outstanding_zec.toFixed(6)}</div>
                      {usd && c.outstanding_zec > 0 && <div style={{ fontSize: 9 }}>{fmtUsd(c.outstanding_zec, usd)}</div>}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                      <span className={`status-badge ${
                        c.status === 'paid' ? 'status-confirmed' :
                        c.status === 'open' ? 'status-pending' :
                        c.status === 'invoiced' ? 'status-detected' :
                        'status-expired'
                      }`} style={{ fontSize: 8 }}>
                        {c.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 10, color: 'var(--cp-text-dim)' }}>
                      {new Date(c.period_end).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                ))}
                {billing.recent_cycles.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--cp-text-dim)' }}>
                      No billing cycles yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function WebhooksTab({ data, adminKey }: { data: WebhookData; adminKey: string }) {
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [deliveries, setDeliveries] = useState(data.deliveries);
  const [total, setTotal] = useState(data.total);
  const pageSize = 50;

  const fetchPage = useCallback(async (p: number, status: string) => {
    const params = new URLSearchParams({ limit: String(pageSize), offset: String(p * pageSize) });
    if (status !== 'all') params.set('status', status);
    try {
      const res = await fetch(`${API_URL}/api/admin/webhooks?${params}`, {
        headers: { 'X-Admin-Key': adminKey },
      });
      if (res.ok) {
        const d = await res.json();
        setDeliveries(d.deliveries);
        setTotal(d.total);
      }
    } catch (e) {
      console.error('Failed to fetch webhooks', e);
    }
  }, [adminKey]);

  useEffect(() => { fetchPage(page, filter); }, [page, filter, fetchPage]);

  const totalPages = Math.ceil(total / pageSize);
  const thStyle = { textAlign: 'left' as const, padding: '10px 12px', fontSize: 9, letterSpacing: 1, color: 'var(--cp-text-muted)', fontWeight: 500 };
  const tdStyle = { padding: '10px 12px', fontSize: 11 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
              {s.toUpperCase()}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 10, color: 'var(--cp-text-dim)' }}>{total} total</span>
      </div>

      <div className="panel">
        <div className="panel-body" style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--cp-border)' }}>
                  <th style={thStyle}>TIME</th>
                  <th style={thStyle}>EVENT</th>
                  <th style={thStyle}>INVOICE</th>
                  <th style={thStyle}>STATUS</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>HTTP</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>ATTEMPTS</th>
                  <th style={thStyle}>ERROR</th>
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
                      No webhook deliveries found.
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
            PREV
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
            NEXT
          </button>
        </div>
      )}
    </div>
  );
}

function SystemTab({ system }: { system: SystemData }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">System Status</span>
          <span className="status-badge status-confirmed" style={{ fontSize: 8 }}>OPERATIONAL</span>
        </div>
        <div className="panel-body">
          <div className="stat-row">
            <span style={{ color: 'var(--cp-text-muted)' }}>Network</span>
            <span style={{ fontWeight: 600, color: system.network === 'mainnet' ? 'var(--cp-green)' : 'var(--cp-yellow)' }}>
              {system.network.toUpperCase()}
            </span>
          </div>
          <div className="stat-row">
            <span style={{ color: 'var(--cp-text-muted)' }}>Scanner Height</span>
            <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>{system.scanner_height || 'N/A'}</span>
          </div>
          <div className="stat-row">
            <span style={{ color: 'var(--cp-text-muted)' }}>Active Sessions</span>
            <span style={{ fontWeight: 500 }}>{system.active_sessions}</span>
          </div>
          <div className="stat-row">
            <span style={{ color: 'var(--cp-text-muted)' }}>Fee System</span>
            <span style={{ fontWeight: 500, color: system.fee_enabled ? 'var(--cp-green)' : 'var(--cp-text-dim)' }}>
              {system.fee_enabled ? `ENABLED (${(system.fee_rate * 100).toFixed(1)}%)` : 'DISABLED'}
            </span>
          </div>
        </div>
      </div>

      {system.price_feed && (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Price Feed</span>
          </div>
          <div className="panel-body">
            <div className="stat-row">
              <span style={{ color: 'var(--cp-text-muted)' }}>ZEC/EUR</span>
              <span style={{ fontWeight: 500 }}>&euro;{system.price_feed.zec_eur.toFixed(2)}</span>
            </div>
            <div className="stat-row">
              <span style={{ color: 'var(--cp-text-muted)' }}>ZEC/USD</span>
              <span style={{ fontWeight: 500 }}>${system.price_feed.zec_usd.toFixed(2)}</span>
            </div>
            <div className="stat-row">
              <span style={{ color: 'var(--cp-text-muted)' }}>ZEC/BRL</span>
              <span style={{ fontWeight: 500 }}>R${system.price_feed.zec_brl.toFixed(2)}</span>
            </div>
            <div className="stat-row">
              <span style={{ color: 'var(--cp-text-muted)' }}>ZEC/GBP</span>
              <span style={{ fontWeight: 500 }}>&pound;{system.price_feed.zec_gbp.toFixed(2)}</span>
            </div>
            <div className="stat-row">
              <span style={{ color: 'var(--cp-text-muted)' }}>Last Updated</span>
              <span style={{ fontSize: 10, color: 'var(--cp-text-dim)' }}>
                {new Date(system.price_feed.updated_at).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Webhooks</span>
        </div>
        <div className="panel-body">
          <div className="stat-row">
            <span style={{ color: 'var(--cp-text-muted)' }}>Pending Deliveries</span>
            <span style={{ fontWeight: 500, color: system.webhooks.pending > 0 ? 'var(--cp-yellow)' : 'var(--cp-text-dim)' }}>
              {system.webhooks.pending}
            </span>
          </div>
          <div className="stat-row">
            <span style={{ color: 'var(--cp-text-muted)' }}>Failed Deliveries</span>
            <span style={{ fontWeight: 500, color: system.webhooks.failed > 0 ? 'var(--cp-red)' : 'var(--cp-text-dim)' }}>
              {system.webhooks.failed}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
