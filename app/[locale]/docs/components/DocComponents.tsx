'use client';

import { useState } from 'react';
import { CopyButton } from '@/components/CopyButton';

export function Code({ children }: { children: string }) {
  return <code style={{ color: 'var(--cp-cyan)', fontSize: 'inherit' }}>{children}</code>;
}

export function CodeBlock({ lang, code }: { lang: string; code: string }) {
  return (
    <div style={{ position: 'relative', marginBottom: 16 }}>
      <div style={{ position: 'absolute', top: 6, right: 6, zIndex: 1 }}>
        <CopyButton text={code} label="" />
      </div>
      <pre style={{
        background: 'var(--cp-bg)',
        border: '1px solid var(--cp-border)',
        borderRadius: 4,
        padding: '14px 16px',
        fontSize: 11,
        lineHeight: 1.6,
        overflowX: 'auto',
        color: 'var(--cp-text)',
        fontFamily: 'var(--font-geist-mono), monospace',
      }}>
        <code>{code}</code>
      </pre>
      <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: -12, marginBottom: 8, textAlign: 'right', paddingRight: 4 }}>
        {lang}
      </div>
    </div>
  );
}

export function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{
          width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, background: 'rgba(6,182,212,0.15)', color: 'var(--cp-cyan)', border: '1px solid rgba(6,182,212,0.3)',
        }}>{n}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cp-text)' }}>{title}</span>
      </div>
      <div style={{ paddingLeft: 34 }}>{children}</div>
    </div>
  );
}

export function Callout({ type, children }: { type: 'info' | 'tip' | 'warning'; children: React.ReactNode }) {
  const colors = type === 'tip'
    ? { bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.2)', label: 'TIP', labelColor: 'var(--cp-green)' }
    : type === 'warning'
    ? { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)', label: 'IMPORTANT', labelColor: '#f59e0b' }
    : { bg: 'rgba(6,182,212,0.06)', border: 'rgba(6,182,212,0.15)', label: 'NOTE', labelColor: 'var(--cp-cyan)' };
  return (
    <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 1.8, marginBottom: 20, padding: '10px 14px', background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 4 }}>
      <strong style={{ color: colors.labelColor, fontSize: 9, letterSpacing: 1 }}>{colors.label}</strong>
      <div style={{ marginTop: 4 }}>{children}</div>
    </div>
  );
}

export function SectionDivider() {
  return <div style={{ borderBottom: '1px solid var(--cp-border)', margin: '28px 0' }} />;
}

export function Paragraph({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 1.9, marginBottom: 16 }}>{children}</p>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="section-title" style={{ marginBottom: 12 }}>{children}</div>;
}

export function Strong({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: 'var(--cp-text)' }}>{children}</strong>;
}

export function SidebarGroup({ label }: { label: string }) {
  return (
    <div style={{
      padding: '14px 16px 6px',
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: 1.5,
      color: 'var(--cp-text-muted)',
    }}>
      {label}
    </div>
  );
}

export function Expandable({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 16, border: '1px solid var(--cp-border)', borderRadius: 4, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '10px 14px', fontSize: 11, fontWeight: 600,
          color: 'var(--cp-text)', background: 'var(--cp-bg)', border: 'none',
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        {title}
        <span style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', fontSize: 10, color: 'var(--cp-text-muted)' }}>▶</span>
      </button>
      {open && <div style={{ padding: '2px 14px 14px' }}>{children}</div>}
    </div>
  );
}
