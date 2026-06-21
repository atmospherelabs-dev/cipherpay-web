'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { API_URL } from '@/lib/config';

interface LedgerEntry {
  id: string;
  memo_code: string;
  product_name: string | null;
  currency: string | null;
  amount_fiat: number | null;
  price_zec: number;
  zec_rate_at_creation: number;
  confirmed_rate: number | null;
  confirmed_fiat_amount: number | null;
  received_zec: number;
  status: string;
  txid: string | null;
  created_at: string;
  confirmed_at: string | null;
}

export default function LedgerPage() {
  const params = useParams();
  const token = params.token as string;
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/ledger/${token}`)
      .then(async res => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: 'Access denied' }));
          throw new Error(body.error || 'Access denied');
        }
        return res.json();
      })
      .then(data => setEntries(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const exportCsv = () => {
    const headers = ['Date', 'Product', 'Currency', 'Amount (fiat)', 'ZEC Rate (creation)', 'ZEC Rate (confirmed)', 'Fiat at confirmation', 'ZEC Amount', 'ZEC Received', 'Status', 'TxID'];
    const rows = entries.map(e => [
      e.confirmed_at || e.created_at,
      e.product_name || '',
      e.currency || 'EUR',
      e.amount_fiat?.toFixed(2) ?? '',
      e.zec_rate_at_creation.toFixed(4),
      e.confirmed_rate?.toFixed(4) ?? '',
      e.confirmed_fiat_amount?.toFixed(2) ?? '',
      e.price_zec.toFixed(8),
      e.received_zec.toFixed(8),
      e.status,
      e.txid || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cipherpay-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cp-bg)', color: 'var(--cp-text)' }}>
        <p style={{ opacity: 0.5, fontFamily: 'var(--font-geist-mono)' }}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cp-bg)', color: 'var(--cp-text)' }}>
        <div style={{ textAlign: 'center', fontFamily: 'var(--font-geist-mono)' }}>
          <p style={{ fontSize: 14, marginBottom: 8 }}>Access Denied</p>
          <p style={{ fontSize: 11, color: 'var(--cp-text-muted)' }}>{error}</p>
        </div>
      </div>
    );
  }

  const totalFiat = entries.reduce((sum, e) => sum + (e.confirmed_fiat_amount ?? e.amount_fiat ?? 0), 0);
  const totalZec = entries.reduce((sum, e) => sum + e.received_zec, 0);
  const currency = entries[0]?.currency || 'EUR';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cp-bg)', color: 'var(--cp-text)', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 12 }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 600, margin: 0, letterSpacing: '0.05em' }}>CIPHERPAY LEDGER</h1>
            <p style={{ color: 'var(--cp-text-muted)', fontSize: 11, marginTop: 4 }}>
              Read-only payment history &middot; {entries.length} transactions
            </p>
          </div>
          <button onClick={exportCsv} className="btn" style={{ fontSize: 10 }}>
            EXPORT CSV
          </button>
        </div>

        {/* Summary */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
          <div style={{ border: '1px solid var(--cp-border)', borderRadius: 8, padding: 16, flex: 1 }}>
            <div style={{ color: 'var(--cp-text-muted)', fontSize: 10, marginBottom: 4 }}>TOTAL ({currency})</div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{totalFiat.toFixed(2)}</div>
          </div>
          <div style={{ border: '1px solid var(--cp-border)', borderRadius: 8, padding: 16, flex: 1 }}>
            <div style={{ color: 'var(--cp-text-muted)', fontSize: 10, marginBottom: 4 }}>TOTAL (ZEC)</div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{totalZec.toFixed(6)}</div>
          </div>
          <div style={{ border: '1px solid var(--cp-border)', borderRadius: 8, padding: 16, flex: 1 }}>
            <div style={{ color: 'var(--cp-text-muted)', fontSize: 10, marginBottom: 4 }}>TRANSACTIONS</div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{entries.length}</div>
          </div>
        </div>

        {/* Table */}
        <div style={{ border: '1px solid var(--cp-border)', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--cp-border)', fontSize: 10, color: 'var(--cp-text-muted)' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500 }}>DATE</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500 }}>PRODUCT</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 500 }}>AMOUNT ({currency})</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 500 }}>ZEC</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 500 }}>RATE</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 500 }}>FIAT AT PAYMENT</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 500 }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid var(--cp-border)' }}>
                  <td style={{ padding: '8px 12px', fontSize: 11 }}>
                    {new Date(e.confirmed_at || e.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--cp-text-muted)' }}>
                    {e.product_name || '—'}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11 }}>
                    {e.amount_fiat?.toFixed(2) ?? '—'}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, color: 'var(--cp-cyan)' }}>
                    {e.received_zec.toFixed(6)}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, color: 'var(--cp-text-muted)' }}>
                    {e.confirmed_rate?.toFixed(2) ?? e.zec_rate_at_creation.toFixed(2)}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, fontWeight: 500 }}>
                    {e.confirmed_fiat_amount?.toFixed(2) ?? '—'}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <span className={`status-badge status-${e.status}`} style={{ fontSize: 9 }}>
                      {e.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ color: 'var(--cp-text-dim)', fontSize: 10, textAlign: 'center', marginTop: 24 }}>
          Powered by CipherPay &middot; Read-only view &middot; No wallet access
        </p>
      </div>
    </div>
  );
}
