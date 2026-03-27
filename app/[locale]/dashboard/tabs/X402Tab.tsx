'use client';

import { memo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Spinner } from '@/components/Spinner';
import type { X402Verification, AgentSession, ZecRates } from '@/lib/api';
import { zecToFiat, fiatLabel } from '@/lib/currency';

type SubTab = 'verifications' | 'sessions';

interface X402TabProps {
  x402Verifications: X402Verification[];
  loadingX402: boolean;
  loadX402: () => void;
  sessions: AgentSession[];
  loadingSessions: boolean;
  loadSessions: () => void;
  zecRates: ZecRates | null;
  displayCurrency: string;
  isTestnet: boolean;
}

const STATUS_CLASSES: Record<string, string> = {
  active: 'status-pending',
  closed: 'status-confirmed',
  expired: 'status-expired',
  depleted: 'status-expired',
};

function formatZec(zatoshis: number): string {
  return (zatoshis / 100_000_000).toFixed(8);
}

export const X402Tab = memo(function X402Tab({
  x402Verifications, loadingX402, loadX402,
  sessions, loadingSessions, loadSessions,
  zecRates, displayCurrency, isTestnet,
}: X402TabProps) {
  const t = useTranslations('dashboard.x402');
  const tc = useTranslations('common');
  const [subTab, setSubTab] = useState<SubTab>('verifications');

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">{t('title')}</span>
        <button
          onClick={subTab === 'verifications' ? loadX402 : loadSessions}
          className="btn btn-small"
        >
          {tc('refresh')}
        </button>
      </div>
      <div className="panel-subtitle">
        {t('subtitle')}
      </div>

      {/* Sub-tab navigation */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid var(--cp-border)' }}>
        <button
          onClick={() => setSubTab('verifications')}
          style={{
            padding: '8px 16px',
            fontSize: 11,
            fontWeight: 600,
            color: subTab === 'verifications' ? 'var(--cp-text)' : 'var(--cp-text-dim)',
            borderBottom: subTab === 'verifications' ? '2px solid var(--cp-blue)' : '2px solid transparent',
            background: 'none',
            border: 'none',
            borderBottomWidth: 2,
            borderBottomStyle: 'solid',
            borderBottomColor: subTab === 'verifications' ? 'var(--cp-blue)' : 'transparent',
            cursor: 'pointer',
            fontFamily: 'inherit',
            letterSpacing: '0.05em',
          }}
        >
          VERIFICATIONS
          {x402Verifications.length > 0 && (
            <span style={{ marginLeft: 6, fontSize: 9, opacity: 0.6 }}>({x402Verifications.length})</span>
          )}
        </button>
        <button
          onClick={() => setSubTab('sessions')}
          style={{
            padding: '8px 16px',
            fontSize: 11,
            fontWeight: 600,
            color: subTab === 'sessions' ? 'var(--cp-text)' : 'var(--cp-text-dim)',
            background: 'none',
            border: 'none',
            borderBottomWidth: 2,
            borderBottomStyle: 'solid',
            borderBottomColor: subTab === 'sessions' ? 'var(--cp-blue)' : 'transparent',
            cursor: 'pointer',
            fontFamily: 'inherit',
            letterSpacing: '0.05em',
          }}
        >
          SESSIONS
          {sessions.length > 0 && (
            <span style={{ marginLeft: 6, fontSize: 9, opacity: 0.6 }}>({sessions.length})</span>
          )}
        </button>
      </div>

      {subTab === 'verifications' && (
        <>
          {loadingX402 ? (
            <div className="empty-state"><Spinner /></div>
          ) : x402Verifications.length === 0 ? (
            <div className="empty-state">
              <div className="icon">&#9632;</div>
              <div>{t('noVerifications')}</div>
            </div>
          ) : (
            x402Verifications.map((v) => {
              const date = new Date(v.created_at.endsWith('Z') ? v.created_at : v.created_at + 'Z');
              const dateStr = isNaN(date.getTime()) ? v.created_at : date.toLocaleString();
              return (
                <div key={v.id} className="invoice-card">
                  <div className="invoice-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cp-text)' }}>
                        {v.amount_zec != null ? `${v.amount_zec.toFixed(8)} ZEC` : '—'}
                      </span>
                      {v.amount_zec != null && (
                        <span style={{ fontSize: 10, color: 'var(--cp-text-dim)' }}>
                          {fiatLabel(zecToFiat(v.amount_zec, zecRates, displayCurrency), displayCurrency)}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {v.protocol && v.protocol !== 'x402' && (
                        <span className="tag" style={{ fontSize: 8, padding: '2px 6px' }}>
                          {v.protocol.toUpperCase()}
                        </span>
                      )}
                      <span className={`status-badge ${v.status === 'verified' ? 'status-confirmed' : 'status-expired'}`}>
                        {v.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="invoice-meta" style={{ justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'var(--cp-text-dim)' }}>{t('txid')}</span>
                      <a
                        href={`${isTestnet ? 'https://testnet.cipherscan.app' : 'https://cipherscan.app'}/tx/${v.txid}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-link"
                        style={{ fontSize: 10, fontFamily: 'var(--font-geist-mono), monospace' }}
                      >
                        {v.txid.substring(0, 12)}...
                      </a>
                    </span>
                    <span style={{ color: 'var(--cp-text-dim)' }}>{dateStr}</span>
                  </div>
                  {v.reason && (
                    <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', marginTop: 6 }}>{v.reason}</div>
                  )}
                </div>
              );
            })
          )}
        </>
      )}

      {subTab === 'sessions' && (
        <>
          {loadingSessions ? (
            <div className="empty-state"><Spinner /></div>
          ) : sessions.length === 0 ? (
            <div className="empty-state">
              <div className="icon">&#9632;</div>
              <div>No agent sessions yet</div>
            </div>
          ) : (
            sessions.map((s) => {
              const date = new Date(s.created_at.endsWith('Z') ? s.created_at : s.created_at + 'Z');
              const dateStr = isNaN(date.getTime()) ? s.created_at : date.toLocaleString();
              const pctUsed = s.balance_zatoshis > 0
                ? Math.round(((s.balance_zatoshis - s.balance_remaining) / s.balance_zatoshis) * 100)
                : 0;

              return (
                <div key={s.id} className="invoice-card">
                  <div className="invoice-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cp-text)' }}>
                        {formatZec(s.balance_zatoshis)} ZEC
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--cp-text-dim)' }}>
                        {s.requests_made} requests
                      </span>
                    </div>
                    <span className={`status-badge ${STATUS_CLASSES[s.status] ?? 'status-pending'}`}>
                      {s.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Balance usage bar */}
                  <div style={{ margin: '8px 0' }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', fontSize: 9,
                      color: 'var(--cp-text-dim)', marginBottom: 4
                    }}>
                      <span>Used: {formatZec(s.balance_used)} ZEC ({pctUsed}%)</span>
                      <span>Remaining: {formatZec(s.balance_remaining)} ZEC</span>
                    </div>
                    <div style={{
                      height: 3, borderRadius: 2, background: 'var(--cp-border)',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%', borderRadius: 2, width: `${pctUsed}%`,
                        background: s.status === 'active'
                          ? 'var(--cp-blue)' : 'var(--cp-text-dim)',
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                  </div>

                  <div className="invoice-meta" style={{ justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'var(--cp-text-dim)' }}>Deposit</span>
                      <a
                        href={`${isTestnet ? 'https://testnet.cipherscan.app' : 'https://cipherscan.app'}/tx/${s.deposit_txid}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-link"
                        style={{ fontSize: 10, fontFamily: 'var(--font-geist-mono), monospace' }}
                      >
                        {s.deposit_txid.substring(0, 12)}...
                      </a>
                    </span>
                    <span style={{ color: 'var(--cp-text-dim)' }}>{dateStr}</span>
                  </div>

                  {s.refund && s.refund.amount_zatoshis > 0 && (
                    <div style={{
                      marginTop: 8, padding: '6px 10px', borderRadius: 4,
                      background: 'rgba(232, 196, 141, 0.08)',
                      border: '1px solid rgba(232, 196, 141, 0.2)',
                      fontSize: 10,
                    }}>
                      <div style={{ fontWeight: 600, color: 'var(--cp-warm)', marginBottom: 2 }}>
                        Refund pending — {s.refund.amount_zec.toFixed(8)} ZEC
                      </div>
                      <div style={{
                        color: 'var(--cp-text-dim)', wordBreak: 'break-all',
                        fontFamily: 'var(--font-geist-mono), monospace', fontSize: 9,
                      }}>
                        {s.refund.address}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </>
      )}
    </div>
  );
});
