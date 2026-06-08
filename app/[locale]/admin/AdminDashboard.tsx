'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  merchants_inactive: number;
  products: number;
  invoices: { total: number; confirmed: number; pending: number; expired: number; draft: number };
  volume: { total_zec: number; total_zatoshis: number };
  fees: { total: number; collected: number; outstanding: number };
  subscriptions: { total: number; active: number };
  last_24h: { invoices: number; confirmed: number; volume_zec: number };
  last_7d: { invoices: number; confirmed: number; volume_zec: number };
  last_30d: { invoices: number; confirmed: number; volume_zec: number };
  prior_7d: { invoices: number; confirmed: number; volume_zec: number };
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

interface BillingCycle {
  id: string;
  merchant_id: string;
  merchant_name: string;
  period_end: string;
  total_fees_zec: number;
  outstanding_zec: number;
  status: string;
  grace_until: string | null;
}

interface OutstandingMerchant {
  merchant_id: string;
  merchant_name: string;
  outstanding_zec: number;
  billing_status: string;
  period_end: string;
}

interface BillingData {
  cycles: { open: number; invoiced: number; past_due: number; paid: number };
  merchants: { suspended: number; past_due: number };
  totals: { outstanding_zec: number; collected_zec: number; earned_zec: number };
  total_cycles: number;
  carried_over_cycles: number;
  outstanding_by_merchant: OutstandingMerchant[];
  active_cycles: BillingCycle[];
  all_cycles: BillingCycle[];
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

interface ScannerMetrics {
  status: string;
  uptime_secs: number;
  blocks_scanned: number;
  last_block_height: number;
  chain_tip_height: number;
  blocks_behind: number;
  payments_detected: number;
  mempool_txs_checked: number;
  scan_errors: number;
  last_block_scan_ms: number;
  last_mempool_scan_ms: number;
}

type Tab = 'overview' | 'merchants' | 'billing' | 'webhooks' | 'system';

function fmtUsd(zec: number, rate: number | undefined): string {
  if (!rate || zec === 0) return '';
  return `~$${(zec * rate).toFixed(2)}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function fmtDelta(current: number, prior: number): string | null {
  if (prior === 0 && current === 0) return null;
  if (prior === 0) return 'new';
  const pct = Math.round(((current - prior) / prior) * 100);
  if (pct === 0) return '—';
  return pct > 0 ? `+${pct}%` : `${pct}%`;
}

type HealthStatus = 'operational' | 'degraded' | 'down';

function deriveHealth(system: SystemData): HealthStatus {
  if (!system.scanner_height) return 'down';
  if (!system.price_feed) return 'degraded';
  const priceFeedAge = Date.now() - new Date(system.price_feed.updated_at).getTime();
  if (priceFeedAge > 30 * 60 * 1000) return 'degraded';
  if (system.webhooks.failed > 10) return 'degraded';
  return 'operational';
}

function cycleBadgeClass(status: string): string {
  if (status === 'paid') return 'status-confirmed';
  if (status === 'open') return 'status-pending';
  if (status === 'invoiced') return 'status-detected';
  if (status === 'carried_over') return 'status-carried';
  return 'status-expired';
}

function healthBadgeClass(h: HealthStatus): string {
  if (h === 'operational') return 'status-confirmed';
  if (h === 'degraded') return 'status-pending';
  return 'status-expired';
}

export default function AdminDashboard({ adminKey, onLogout }: AdminDashboardProps) {
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [system, setSystem] = useState<SystemData | null>(null);
  const [webhookData, setWebhookData] = useState<WebhookData | null>(null);
  const [scannerMetrics, setScannerMetrics] = useState<ScannerMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const headers = useCallback(() => ({ 'X-Admin-Key': adminKey }), [adminKey]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, merchantsRes, billingRes, systemRes, webhooksRes, scannerRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/stats`, { headers: headers() }),
        fetch(`${API_URL}/api/admin/merchants`, { headers: headers() }),
        fetch(`${API_URL}/api/admin/billing`, { headers: headers() }),
        fetch(`${API_URL}/api/admin/system`, { headers: headers() }),
        fetch(`${API_URL}/api/admin/webhooks?limit=100`, { headers: headers() }),
        fetch(`${API_URL}/api/admin/scanner-metrics`, { headers: headers() }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (merchantsRes.ok) setMerchants(await merchantsRes.json());
      if (billingRes.ok) setBilling(await billingRes.json());
      if (systemRes.ok) setSystem(await systemRes.json());
      if (webhooksRes.ok) setWebhookData(await webhooksRes.json());
      if (scannerRes.ok) setScannerMetrics(await scannerRes.json());
      setLastFetched(new Date());
    } catch (e) {
      console.error('Failed to fetch admin data', e);
    }
    setLoading(false);
  }, [headers]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

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

  const health = system ? deriveHealth(system) : null;

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/"><Logo size="sm" /></Link>
          <span className="admin-badge">ADMIN</span>
          {health && (
            <span className={`status-badge ${healthBadgeClass(health)}`} style={{ fontSize: 9 }}>
              {health.toUpperCase()}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {lastFetched && (
            <span style={{ fontSize: 9, color: 'var(--cp-text-dim)' }}>
              Updated {timeAgo(lastFetched.toISOString())}
            </span>
          )}
          <button onClick={fetchAll} className="btn btn-small" style={{ fontSize: 9 }}>REFRESH</button>
          <ThemeToggle />
          <button onClick={onLogout} className="btn btn-small" style={{ fontSize: 9 }}>LOGOUT</button>
        </div>
      </header>

      <div className="admin-body">
        <nav className="admin-nav">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`dash-nav-btn admin-nav-btn${tab === t.id ? ' active' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <main className="admin-main">
          {loading && !stats ? (
            <div className="admin-loading">
              <div className="w-6 h-6 border-2 border-cp-cyan border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {tab === 'overview' && stats && (
                <OverviewTab stats={stats} system={system} billing={billing} scanner={scannerMetrics} onNavigate={setTab} />
              )}
              {tab === 'merchants' && (
                <MerchantsTab merchants={merchants} billing={billing} system={system} onNavigate={setTab} />
              )}
              {tab === 'billing' && billing && <BillingTab billing={billing} system={system} />}
              {tab === 'webhooks' && webhookData && <WebhooksTab data={webhookData} adminKey={adminKey} />}
              {tab === 'system' && system && <SystemTab system={system} adminKey={adminKey} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card — values always in neutral color, matching merchant dashboard
// ---------------------------------------------------------------------------

function StatCard({ value, label, sub, sub2, attention }: {
  value: string | number; label: string; sub?: string; sub2?: string; attention?: boolean;
}) {
  return (
    <div className={`panel admin-stat-card${attention ? ' admin-stat-card--attention' : ''}`}>
      <div className="panel-body" style={{ padding: '20px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--cp-text)', lineHeight: 1.2 }}>{value}</div>
        <div style={{ fontSize: 9, letterSpacing: 1, color: 'var(--cp-text-muted)', marginTop: 6 }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', marginTop: 2 }}>{sub}</div>}
        {sub2 && <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', marginTop: 1 }}>{sub2}</div>}
      </div>
    </div>
  );
}

function FilterPills({ options, value, onChange }: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="admin-filter-pills">
      {options.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)} className={`admin-filter-pill${value === o.id ? ' active' : ''}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function AlertsStrip({ stats, system, billing, onNavigate }: {
  stats: Stats; system: SystemData | null; billing: BillingData | null;
  onNavigate: (tab: Tab) => void;
}) {
  const alerts: { message: string; tab: Tab; severity: 'warn' | 'info' }[] = [];
  if (system && system.webhooks.failed > 0) {
    alerts.push({ message: `${system.webhooks.failed} failed webhook${system.webhooks.failed > 1 ? 's' : ''}`, tab: 'webhooks', severity: 'warn' });
  }
  if (billing && billing.merchants.past_due > 0) {
    alerts.push({ message: `${billing.merchants.past_due} past due merchant${billing.merchants.past_due > 1 ? 's' : ''}`, tab: 'billing', severity: 'warn' });
  }
  if (billing && billing.merchants.suspended > 0) {
    alerts.push({ message: `${billing.merchants.suspended} suspended merchant${billing.merchants.suspended > 1 ? 's' : ''}`, tab: 'billing', severity: 'warn' });
  }
  if (stats.fees.outstanding > 0) {
    alerts.push({ message: `${stats.fees.outstanding.toFixed(4)} ZEC outstanding`, tab: 'billing', severity: 'info' });
  }
  if (alerts.length === 0) return null;
  return (
    <div className="admin-alerts">
      {alerts.map((a, i) => (
        <button key={i} onClick={() => onNavigate(a.tab)} className={`admin-alert admin-alert--${a.severity}`}>
          {a.severity === 'warn' ? '⚠' : '●'} {a.message} →
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

function fmtUptime(secs: number): string {
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m`;
  const days = Math.floor(hrs / 24);
  return `${days}d ${hrs % 24}h`;
}

function scannerStatusClass(status: string): string {
  if (status === 'healthy') return 'status-confirmed';
  if (status === 'catching_up') return 'status-detected';
  if (status === 'starting') return 'status-pending';
  return 'status-expired';
}

function OverviewTab({ stats, system, billing, scanner, onNavigate }: {
  stats: Stats; system: SystemData | null; billing: BillingData | null;
  scanner: ScannerMetrics | null; onNavigate: (tab: Tab) => void;
}) {
  const usd = system?.price_feed?.zec_usd;
  const feeCollectionRate = stats.fees.total > 0
    ? Math.round((stats.fees.collected / stats.fees.total) * 100) : 0;

  return (
    <div className="admin-tab-content">
      <AlertsStrip stats={stats} system={system} billing={billing} onNavigate={onNavigate} />

      {scanner && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="panel-header">
            <span className="panel-title">Scanner Health</span>
            <span className={`status-badge ${scannerStatusClass(scanner.status)}`} style={{ fontSize: 9 }}>
              {scanner.status.toUpperCase().replace('_', ' ')}
            </span>
          </div>
          <div className="panel-body">
            <div className="admin-activity-grid">
              <div>
                <div style={{ fontSize: 9, letterSpacing: 1, color: 'var(--cp-text-muted)', marginBottom: 8 }}>CHAIN</div>
                <div className="stat-row">
                  <span style={{ color: 'var(--cp-text-muted)' }}>Last Block</span>
                  <span style={{ fontWeight: 500, fontFamily: 'var(--font-mono)' }}>{scanner.last_block_height.toLocaleString()}</span>
                </div>
                <div className="stat-row">
                  <span style={{ color: 'var(--cp-text-muted)' }}>Chain Tip</span>
                  <span style={{ fontWeight: 500, fontFamily: 'var(--font-mono)' }}>{scanner.chain_tip_height.toLocaleString()}</span>
                </div>
                <div className="stat-row">
                  <span style={{ color: 'var(--cp-text-muted)' }}>Behind</span>
                  <span style={{ fontWeight: 500, color: scanner.blocks_behind > 20 ? 'var(--cp-warm)' : 'inherit' }}>
                    {scanner.blocks_behind} blocks
                  </span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, letterSpacing: 1, color: 'var(--cp-text-muted)', marginBottom: 8 }}>COUNTERS</div>
                <div className="stat-row">
                  <span style={{ color: 'var(--cp-text-muted)' }}>Payments Detected</span>
                  <span style={{ fontWeight: 500 }}>{scanner.payments_detected}</span>
                </div>
                <div className="stat-row">
                  <span style={{ color: 'var(--cp-text-muted)' }}>Blocks Scanned</span>
                  <span style={{ fontWeight: 500 }}>{scanner.blocks_scanned.toLocaleString()}</span>
                </div>
                <div className="stat-row">
                  <span style={{ color: 'var(--cp-text-muted)' }}>Mempool Txs</span>
                  <span style={{ fontWeight: 500 }}>{scanner.mempool_txs_checked.toLocaleString()}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, letterSpacing: 1, color: 'var(--cp-text-muted)', marginBottom: 8 }}>PERFORMANCE</div>
                <div className="stat-row">
                  <span style={{ color: 'var(--cp-text-muted)' }}>Block Scan</span>
                  <span style={{ fontWeight: 500, fontFamily: 'var(--font-mono)' }}>{scanner.last_block_scan_ms}ms</span>
                </div>
                <div className="stat-row">
                  <span style={{ color: 'var(--cp-text-muted)' }}>Mempool Scan</span>
                  <span style={{ fontWeight: 500, fontFamily: 'var(--font-mono)' }}>{scanner.last_mempool_scan_ms}ms</span>
                </div>
                <div className="stat-row">
                  <span style={{ color: 'var(--cp-text-muted)' }}>Uptime</span>
                  <span style={{ fontWeight: 500 }}>{fmtUptime(scanner.uptime_secs)}</span>
                </div>
                {scanner.scan_errors > 0 && (
                  <div className="stat-row">
                    <span style={{ color: 'var(--cp-text-muted)' }}>Errors</span>
                    <span style={{ fontWeight: 500, color: 'var(--cp-warm)' }}>{scanner.scan_errors}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="admin-stat-grid admin-stat-grid--3">
        <StatCard value={stats.volume.total_zec.toFixed(4)} label="PLATFORM VOLUME" sub="ZEC" sub2={fmtUsd(stats.volume.total_zec, usd)} />
        <StatCard value={stats.fees.outstanding.toFixed(4)} label="FEES OUTSTANDING" sub="ZEC" sub2={fmtUsd(stats.fees.outstanding, usd)} attention={stats.fees.outstanding > 0} />
        <StatCard value={stats.merchants} label="MERCHANTS" sub={stats.merchants_inactive > 0 ? `${stats.merchants_inactive} inactive` : undefined} />
      </div>

      <div className="panel">
        <div className="panel-header"><span className="panel-title">Activity</span></div>
        <div className="panel-body">
          <div className="admin-activity-grid">
            {([
              { label: 'LAST 24H', data: stats.last_24h, prior: null as Stats['prior_7d'] | null },
              { label: 'LAST 7D', data: stats.last_7d, prior: stats.prior_7d },
              { label: 'LAST 30D', data: stats.last_30d, prior: null as Stats['prior_7d'] | null },
            ]).map(({ label, data, prior }) => (
              <div key={label}>
                <div style={{ fontSize: 9, letterSpacing: 1, color: 'var(--cp-text-muted)', marginBottom: 8 }}>{label}</div>
                <div className="stat-row">
                  <span style={{ color: 'var(--cp-text-muted)' }}>Invoices</span>
                  <span style={{ fontWeight: 500 }}>
                    {data.invoices}
                    {prior && fmtDelta(data.invoices, prior.invoices) && (
                      <span className={`admin-delta admin-delta--${data.invoices >= prior.invoices ? 'up' : 'down'}`}>{fmtDelta(data.invoices, prior.invoices)}</span>
                    )}
                  </span>
                </div>
                <div className="stat-row">
                  <span style={{ color: 'var(--cp-text-muted)' }}>Confirmed</span>
                  <span style={{ fontWeight: 500 }}>
                    {data.confirmed}
                    {prior && fmtDelta(data.confirmed, prior.confirmed) && (
                      <span className={`admin-delta admin-delta--${data.confirmed >= prior.confirmed ? 'up' : 'down'}`}>{fmtDelta(data.confirmed, prior.confirmed)}</span>
                    )}
                  </span>
                </div>
                <div className="stat-row">
                  <span style={{ color: 'var(--cp-text-muted)' }}>Volume</span>
                  <span style={{ fontWeight: 500 }}>
                    {data.volume_zec.toFixed(4)} ZEC
                    {usd && <span style={{ color: 'var(--cp-text-dim)', fontWeight: 400, marginLeft: 4 }}>{fmtUsd(data.volume_zec, usd)}</span>}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-two-col">
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Fee Revenue</span>
            <button onClick={() => onNavigate('billing')} className="btn btn-small" style={{ fontSize: 9 }}>VIEW BILLING →</button>
          </div>
          <div className="panel-body">
            <div className="stat-row">
              <span style={{ color: 'var(--cp-text-muted)' }}>Total Earned</span>
              <span style={{ fontWeight: 600 }}>{stats.fees.total.toFixed(6)} ZEC{usd && <span style={{ color: 'var(--cp-text-dim)', fontWeight: 400, marginLeft: 4 }}>{fmtUsd(stats.fees.total, usd)}</span>}</span>
            </div>
            <div className="stat-row">
              <span style={{ color: 'var(--cp-text-muted)' }}>Collected</span>
              <span style={{ fontWeight: 500 }}>{stats.fees.collected.toFixed(6)} ZEC ({feeCollectionRate}%)</span>
            </div>
            <div className="stat-row">
              <span style={{ color: 'var(--cp-text-muted)' }}>Outstanding</span>
              <span style={{ fontWeight: 500 }}>
                {stats.fees.outstanding.toFixed(6)} ZEC
                {stats.fees.outstanding > 0 && <span className="status-badge status-pending" style={{ fontSize: 8, marginLeft: 6 }}>OWED</span>}
              </span>
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-header"><span className="panel-title">Pipeline</span></div>
          <div className="panel-body">
            <div className="stat-row"><span style={{ color: 'var(--cp-text-muted)' }}>Confirmed</span><span style={{ fontWeight: 500 }}>{stats.invoices.confirmed} of {stats.invoices.total}</span></div>
            <div className="stat-row"><span style={{ color: 'var(--cp-text-muted)' }}>Pending</span><span style={{ fontWeight: 500 }}>{stats.invoices.pending}</span></div>
            <div className="stat-row"><span style={{ color: 'var(--cp-text-muted)' }}>Products</span><span style={{ fontWeight: 500 }}>{stats.products}</span></div>
            <div className="stat-row"><span style={{ color: 'var(--cp-text-muted)' }}>Active Subscriptions</span><span style={{ fontWeight: 500 }}>{stats.subscriptions.active}</span></div>
            {system && system.webhooks.failed > 0 && (
              <div className="stat-row">
                <span style={{ color: 'var(--cp-text-muted)' }}>Failed Webhooks</span>
                <span style={{ fontWeight: 500 }}>{system.webhooks.failed}<span className="status-badge status-expired" style={{ fontSize: 8, marginLeft: 6 }}>ATTENTION</span></span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Merchants
// ---------------------------------------------------------------------------

const TH: React.CSSProperties = { padding: '10px 16px', fontSize: 9, letterSpacing: 1, color: 'var(--cp-text-muted)', fontWeight: 500 };

function SortHeader({ label, sortKey, current, dir, onSort, align = 'left' }: {
  label: string; sortKey: string; current: string; dir: 'asc' | 'desc';
  onSort: (key: string) => void; align?: 'left' | 'right' | 'center';
}) {
  const active = current === sortKey;
  return (
    <th
      style={{ ...TH, textAlign: align, cursor: 'pointer', userSelect: 'none' }}
      onClick={() => onSort(sortKey)}
    >
      {label}{active ? (dir === 'asc' ? ' ↑' : ' ↓') : ''}
    </th>
  );
}

function MerchantsTab({ merchants, billing, system, onNavigate }: {
  merchants: Merchant[]; billing: BillingData | null; system: SystemData | null;
  onNavigate: (tab: Tab) => void;
}) {
  const usd = system?.price_feed?.zec_usd;
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('volume');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const filtered = useMemo(() => {
    let list = search
      ? merchants.filter(m =>
          (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
          m.id.toLowerCase().includes(search.toLowerCase())
        )
      : [...merchants];

    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = (a.name || '').localeCompare(b.name || '');
      else if (sortKey === 'invoices') cmp = a.invoice_count - b.invoice_count;
      else if (sortKey === 'volume') cmp = a.total_zec - b.total_zec;
      else if (sortKey === 'joined') cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      else if (sortKey === 'billing') cmp = a.billing_status.localeCompare(b.billing_status);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [merchants, search, sortKey, sortDir]);

  const selected = selectedId ? merchants.find(m => m.id === selectedId) : null;
  const merchantOutstanding = selectedId && billing
    ? billing.outstanding_by_merchant.find(m => m.merchant_id === selectedId)
    : null;
  const merchantCycles = selectedId && billing
    ? billing.all_cycles.filter(c => c.merchant_id === selectedId).slice(0, 10)
    : [];

  return (
    <div className="admin-tab-content">
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Merchants ({filtered.length})</span>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input"
            style={{ width: 180, padding: '4px 10px', fontSize: 10 }}
          />
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--cp-border)' }}>
                  <SortHeader label="NAME" sortKey="name" current={sortKey} dir={sortDir} onSort={handleSort} />
                  <SortHeader label="INVOICES" sortKey="invoices" current={sortKey} dir={sortDir} onSort={handleSort} align="right" />
                  <SortHeader label="VOLUME (ZEC)" sortKey="volume" current={sortKey} dir={sortDir} onSort={handleSort} align="right" />
                  <th style={{ ...TH, textAlign: 'center' }}>WEBHOOK</th>
                  <SortHeader label="BILLING" sortKey="billing" current={sortKey} dir={sortDir} onSort={handleSort} align="center" />
                  <SortHeader label="JOINED" sortKey="joined" current={sortKey} dir={sortDir} onSort={handleSort} align="right" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr
                    key={m.id}
                    className={`admin-table-row${selectedId === m.id ? ' admin-table-row--selected' : ''}`}
                    style={{ borderBottom: '1px solid var(--cp-border)', cursor: 'pointer' }}
                    onClick={() => setSelectedId(selectedId === m.id ? null : m.id)}
                  >
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ fontWeight: 500, color: 'var(--cp-text)' }}>{m.name || '(unnamed)'}</div>
                      <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', fontFamily: 'monospace' }}>{m.id.slice(0, 8)}...</div>
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 500 }}>{m.invoice_count}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                      <div style={{ fontWeight: 500 }}>{m.total_zec.toFixed(4)}</div>
                      {usd && m.total_zec > 0 && <div style={{ fontSize: 9, color: 'var(--cp-text-dim)' }}>{fmtUsd(m.total_zec, usd)}</div>}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', fontSize: 9 }}>
                      {m.webhook_configured ? 'YES' : <span style={{ color: 'var(--cp-text-dim)' }}>NO</span>}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                      <span className={`status-badge ${
                        m.billing_status === 'active' ? 'status-confirmed' :
                        m.billing_status === 'past_due' ? 'status-detected' :
                        m.billing_status === 'suspended' ? 'status-expired' :
                        'status-pending'
                      }`} style={{ fontSize: 9 }}>
                        {m.billing_status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 10, color: 'var(--cp-text-dim)' }}>
                      {new Date(m.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--cp-text-dim)' }}>
                      {search ? 'No merchants match your search.' : 'No merchants registered yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selected && (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">{selected.name || '(unnamed)'} — Detail</span>
            {merchantOutstanding && merchantOutstanding.outstanding_zec > 0 && (
              <button onClick={() => onNavigate('billing')} className="btn btn-small" style={{ fontSize: 9 }}>VIEW BILLING →</button>
            )}
          </div>
          <div className="panel-body">
            <div className="admin-two-col">
              <div>
                <div className="stat-row"><span style={{ color: 'var(--cp-text-muted)' }}>Merchant ID</span><span style={{ fontFamily: 'monospace', fontSize: 10 }}>{selected.id}</span></div>
                <div className="stat-row"><span style={{ color: 'var(--cp-text-muted)' }}>Invoices</span><span style={{ fontWeight: 500 }}>{selected.invoice_count}</span></div>
                <div className="stat-row"><span style={{ color: 'var(--cp-text-muted)' }}>Volume</span><span style={{ fontWeight: 500 }}>{selected.total_zec.toFixed(4)} ZEC</span></div>
                <div className="stat-row"><span style={{ color: 'var(--cp-text-muted)' }}>Webhook</span><span>{selected.webhook_configured ? 'Configured' : 'Not configured'}</span></div>
                <div className="stat-row"><span style={{ color: 'var(--cp-text-muted)' }}>Billing Status</span>
                  <span className={`status-badge ${
                    selected.billing_status === 'active' ? 'status-confirmed' :
                    selected.billing_status === 'past_due' ? 'status-detected' :
                    selected.billing_status === 'suspended' ? 'status-expired' : 'status-pending'
                  }`} style={{ fontSize: 9 }}>{selected.billing_status.toUpperCase()}</span>
                </div>
                {merchantOutstanding && (
                  <div className="stat-row">
                    <span style={{ color: 'var(--cp-text-muted)' }}>Outstanding</span>
                    <span style={{ fontWeight: 600 }}>{merchantOutstanding.outstanding_zec.toFixed(6)} ZEC</span>
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: 9, letterSpacing: 1, color: 'var(--cp-text-muted)', marginBottom: 8 }}>RECENT CYCLES</div>
                {merchantCycles.length === 0 ? (
                  <div style={{ fontSize: 10, color: 'var(--cp-text-dim)' }}>No billing cycles.</div>
                ) : merchantCycles.map(c => (
                  <div key={c.id} className="stat-row">
                    <span style={{ color: 'var(--cp-text-muted)', fontSize: 10 }}>
                      {new Date(c.period_end).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <span style={{ fontSize: 10 }}>
                      {c.outstanding_zec.toFixed(6)} ZEC
                      <span className={`status-badge ${cycleBadgeClass(c.status)}`} style={{ fontSize: 8, marginLeft: 6 }}>{c.status.toUpperCase()}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Billing
// ---------------------------------------------------------------------------

function BillingTab({ billing, system }: { billing: BillingData; system: SystemData | null }) {
  const usd = system?.price_feed?.zec_usd;
  const [cycleFilter, setCycleFilter] = useState<'active' | 'history' | 'all'>('active');

  const cycles = useMemo(() => {
    if (cycleFilter === 'active') return billing.active_cycles;
    if (cycleFilter === 'history') {
      return billing.all_cycles.filter(c =>
        c.status === 'paid' || c.status === 'carried_over'
      );
    }
    return billing.all_cycles;
  }, [billing, cycleFilter]);

  return (
    <div className="admin-tab-content">
      <div className="admin-stat-grid admin-stat-grid--4">
        <StatCard value={billing.totals.earned_zec.toFixed(4)} label="TOTAL EARNED" sub="ZEC" sub2={fmtUsd(billing.totals.earned_zec, usd)} />
        <StatCard value={billing.totals.collected_zec.toFixed(4)} label="COLLECTED" sub="ZEC" sub2={fmtUsd(billing.totals.collected_zec, usd)} />
        <StatCard value={billing.totals.outstanding_zec.toFixed(4)} label="OUTSTANDING" sub="ZEC" sub2={fmtUsd(billing.totals.outstanding_zec, usd)} attention={billing.totals.outstanding_zec > 0} />
        <StatCard value={billing.cycles.past_due} label="PAST DUE" sub={`${billing.merchants.past_due} merchant${billing.merchants.past_due !== 1 ? 's' : ''}`} attention={billing.cycles.past_due > 0} />
      </div>

      {billing.outstanding_by_merchant.length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Outstanding by Merchant</span>
            <span style={{ fontSize: 10, color: 'var(--cp-text-dim)' }}>
              {billing.outstanding_by_merchant.length} merchant{billing.outstanding_by_merchant.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--cp-border)' }}>
                    <th style={{ ...TH, textAlign: 'left' }}>MERCHANT</th>
                    <th style={{ ...TH, textAlign: 'right' }}>OUTSTANDING (ZEC)</th>
                    <th style={{ ...TH, textAlign: 'center' }}>STATUS</th>
                    <th style={{ ...TH, textAlign: 'right' }}>PERIOD END</th>
                  </tr>
                </thead>
                <tbody>
                  {billing.outstanding_by_merchant.map(m => (
                    <tr key={m.merchant_id} style={{ borderBottom: '1px solid var(--cp-border)' }}>
                      <td style={{ padding: '10px 16px', fontWeight: 500 }}>{m.merchant_name || m.merchant_id.slice(0, 8)}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        <div style={{ fontWeight: 600 }}>{m.outstanding_zec.toFixed(6)}</div>
                        {usd && m.outstanding_zec > 0 && <div style={{ fontSize: 9, color: 'var(--cp-text-dim)' }}>{fmtUsd(m.outstanding_zec, usd)}</div>}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <span className={`status-badge ${
                          m.billing_status === 'active' ? 'status-confirmed' :
                          m.billing_status === 'past_due' ? 'status-detected' :
                          m.billing_status === 'suspended' ? 'status-expired' : 'status-pending'
                        }`} style={{ fontSize: 9 }}>{m.billing_status.toUpperCase()}</span>
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 10, color: 'var(--cp-text-dim)' }}>
                        {new Date(m.period_end).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Billing Cycles</span>
          <FilterPills
            options={[
              { id: 'active', label: 'ACTIVE' },
              { id: 'history', label: 'HISTORY' },
              { id: 'all', label: 'ALL' },
            ]}
            value={cycleFilter}
            onChange={v => setCycleFilter(v as 'active' | 'history' | 'all')}
          />
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--cp-border)' }}>
                  <th style={{ ...TH, textAlign: 'left' }}>MERCHANT</th>
                  <th style={{ ...TH, textAlign: 'right' }}>FEES (ZEC)</th>
                  <th style={{ ...TH, textAlign: 'right' }}>OWED (ZEC)</th>
                  <th style={{ ...TH, textAlign: 'center' }}>STATUS</th>
                  <th style={{ ...TH, textAlign: 'right' }}>PERIOD END</th>
                </tr>
              </thead>
              <tbody>
                {cycles.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--cp-border)' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 500 }}>{c.merchant_name || c.merchant_id.slice(0, 8)}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                      <div>{c.total_fees_zec.toFixed(6)}</div>
                      {usd && <div style={{ fontSize: 9, color: 'var(--cp-text-dim)' }}>{fmtUsd(c.total_fees_zec, usd)}</div>}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                      <div>{c.outstanding_zec.toFixed(6)}</div>
                      {usd && c.outstanding_zec > 0 && <div style={{ fontSize: 9, color: 'var(--cp-text-dim)' }}>{fmtUsd(c.outstanding_zec, usd)}</div>}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                      <span className={`status-badge ${cycleBadgeClass(c.status)}`} style={{ fontSize: 9 }}>
                        {c.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 10, color: 'var(--cp-text-dim)' }}>
                      {new Date(c.period_end).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                ))}
                {cycles.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--cp-text-dim)' }}>
                      No billing cycles in this view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {cycleFilter === 'all' && billing.carried_over_cycles > 0 && (
          <div style={{ padding: '8px 16px', fontSize: 9, color: 'var(--cp-text-dim)', borderTop: '1px solid var(--cp-border)' }}>
            {billing.carried_over_cycles} carried-over cycle{billing.carried_over_cycles !== 1 ? 's' : ''} · {billing.total_cycles} total
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

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

  return (
    <div className="admin-tab-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <FilterPills
          options={[
            { id: 'all', label: 'ALL' },
            { id: 'delivered', label: 'DELIVERED' },
            { id: 'pending', label: 'PENDING' },
            { id: 'failed', label: 'FAILED' },
          ]}
          value={filter}
          onChange={v => { setFilter(v); setPage(0); }}
        />
        <span style={{ fontSize: 10, color: 'var(--cp-text-dim)' }}>{total} total</span>
      </div>

      <div className="panel">
        <div className="panel-body" style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--cp-border)' }}>
                  <th style={{ ...TH, textAlign: 'left' }}>TIME</th>
                  <th style={{ ...TH, textAlign: 'left' }}>EVENT</th>
                  <th style={{ ...TH, textAlign: 'left' }}>INVOICE</th>
                  <th style={{ ...TH, textAlign: 'left' }}>STATUS</th>
                  <th style={{ ...TH, textAlign: 'center' }}>HTTP</th>
                  <th style={{ ...TH, textAlign: 'center' }}>ATTEMPTS</th>
                  <th style={{ ...TH, textAlign: 'left' }}>ERROR</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid var(--cp-border)' }}>
                    <td style={{ padding: '10px 12px', fontSize: 10, color: 'var(--cp-text-dim)', whiteSpace: 'nowrap' }}>
                      {new Date(d.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 10 }}>
                      {d.event_type || '\u2014'}
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 10, color: 'var(--cp-text-dim)' }}>
                      {d.invoice_id.slice(0, 12)}...
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span className={`status-badge ${
                        d.status === 'delivered' ? 'status-confirmed' :
                        d.status === 'pending' ? 'status-pending' :
                        'status-expired'
                      }`} style={{ fontSize: 9 }}>
                        {d.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'monospace', fontSize: 10 }}>
                      {d.response_status ?? <span style={{ color: 'var(--cp-text-dim)' }}>{'\u2014'}</span>}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--cp-text-muted)' }}>{d.attempts}</td>
                    <td style={{ padding: '10px 12px', fontSize: 10, color: 'var(--cp-text-dim)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

// ---------------------------------------------------------------------------
// System
// ---------------------------------------------------------------------------

const EMAIL_TEMPLATES = [
  { value: 'settlement_invoice', label: 'Settlement Invoice' },
  { value: 'grace_reminder', label: 'Grace Reminder' },
  { value: 'past_due', label: 'Past Due' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'payment_confirmed', label: 'Payment Confirmed' },
  { value: 'discount_expiry_warning', label: 'Discount Expiry Warning' },
  { value: 'discount_expired', label: 'Discount Expired' },
];

function SystemTab({ system, adminKey }: { system: SystemData; adminKey: string }) {
  const health = deriveHealth(system);
  const priceFeedAge = system.price_feed
    ? Date.now() - new Date(system.price_feed.updated_at).getTime()
    : null;
  const priceFeedStale = priceFeedAge !== null && priceFeedAge > 15 * 60 * 1000;

  const [testEmail, setTestEmail] = useState('');
  const [testTemplate, setTestTemplate] = useState('settlement_invoice');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const sendTestEmail = async () => {
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/test-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
        body: JSON.stringify({ to: testEmail, template: testTemplate }),
      });
      const data = await res.json();
      if (res.ok && data.sent) {
        setTestResult({ ok: true, msg: `Sent ${testTemplate} to ${testEmail}` });
      } else {
        setTestResult({ ok: false, msg: data.error || data.reason || 'Failed to send' });
      }
    } catch {
      setTestResult({ ok: false, msg: 'Network error' });
    }
    setTestSending(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">System Status</span>
          <span className={`status-badge ${healthBadgeClass(health)}`} style={{ fontSize: 9 }}>
            {health.toUpperCase()}
          </span>
        </div>
        <div className="panel-body">
          <div className="stat-row">
            <span style={{ color: 'var(--cp-text-muted)' }}>Network</span>
            <span style={{ fontWeight: 600 }}>{system.network.toUpperCase()}</span>
          </div>
          <div className="stat-row">
            <span style={{ color: 'var(--cp-text-muted)' }}>Scanner Height</span>
            <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>
              {system.scanner_height || <span className="status-badge status-expired" style={{ fontSize: 8 }}>OFFLINE</span>}
            </span>
          </div>
          <div className="stat-row">
            <span style={{ color: 'var(--cp-text-muted)' }}>Active Sessions</span>
            <span style={{ fontWeight: 500 }}>{system.active_sessions}</span>
          </div>
          <div className="stat-row">
            <span style={{ color: 'var(--cp-text-muted)' }}>Fee System</span>
            <span style={{ fontWeight: 500 }}>
              {system.fee_enabled ? `ENABLED (${(system.fee_rate * 100).toFixed(1)}%)` : 'DISABLED'}
            </span>
          </div>
        </div>
      </div>

      {system.price_feed && (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Price Feed</span>
            {priceFeedStale && (
              <span className="status-badge status-pending" style={{ fontSize: 8 }}>STALE</span>
            )}
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
              <span style={{ fontSize: 10, color: priceFeedStale ? 'var(--cp-text)' : 'var(--cp-text-dim)' }}>
                {timeAgo(system.price_feed.updated_at)}
                {priceFeedStale && ' (stale)'}
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
            <span style={{ fontWeight: 500 }}>{system.webhooks.pending}</span>
          </div>
          <div className="stat-row">
            <span style={{ color: 'var(--cp-text-muted)' }}>Failed Deliveries</span>
            <span style={{ fontWeight: 500 }}>
              {system.webhooks.failed}
              {system.webhooks.failed > 0 && (
                <span className="status-badge status-expired" style={{ fontSize: 8, marginLeft: 6 }}>FAILING</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Test Email */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Test Email</span>
        </div>
        <div className="panel-body">
          <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', marginBottom: 12 }}>
            Send a test email using an existing billing template.
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label className="form-label">Recipient</label>
              <input
                type="email"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                placeholder="you@example.com"
                className="input"
                style={{ fontSize: 10 }}
              />
            </div>
            <div style={{ minWidth: 160 }}>
              <label className="form-label">Template</label>
              <select
                value={testTemplate}
                onChange={e => setTestTemplate(e.target.value)}
                className="input"
                style={{ fontSize: 10 }}
              >
                {EMAIL_TEMPLATES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={sendTestEmail}
              disabled={testSending || !testEmail}
              className="btn"
              style={{ fontSize: 9, opacity: testSending || !testEmail ? 0.4 : 1, whiteSpace: 'nowrap' }}
            >
              {testSending ? 'SENDING...' : 'SEND TEST'}
            </button>
          </div>
          {testResult && (
            <div style={{ marginTop: 8, fontSize: 10, color: testResult.ok ? 'var(--cp-text)' : 'var(--cp-text)' }}>
              <span className={`status-badge ${testResult.ok ? 'status-confirmed' : 'status-expired'}`} style={{ fontSize: 8, marginRight: 6 }}>
                {testResult.ok ? 'SENT' : 'ERROR'}
              </span>
              {testResult.msg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
