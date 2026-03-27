'use client';

import { motion } from 'framer-motion';
import { type ReactNode } from 'react';

interface PrivacyTableProps {
  header: { label: ReactNode; publicLabel: ReactNode; zcashLabel: ReactNode };
  rows: { label: ReactNode; publicText: ReactNode; privateText: ReactNode }[];
}

const rowVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.15 } },
};

export function PrivacyTable({ header, rows }: PrivacyTableProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
      {/* Exposed card */}
      <div className="panel" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--cp-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--cp-text-muted)', fontWeight: 600 }}>
            {header.publicLabel}
          </span>
          <span style={{
            fontSize: 9, letterSpacing: 1, fontWeight: 600, textTransform: 'uppercase',
            color: '#ef4444', background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            padding: '3px 8px', borderRadius: 3,
          }}>
            Exposed
          </span>
        </div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={stagger}
          style={{ padding: 0 }}
        >
          {rows.map((row, i) => (
            <motion.div
              key={i}
              variants={rowVariants}
              transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '11px 18px',
                borderBottom: i < rows.length - 1 ? '1px solid var(--cp-border)' : 'none',
                fontSize: 11,
              }}
            >
              <span style={{ color: 'var(--cp-text-muted)' }}>{row.label}</span>
              <span style={{ color: '#ef4444', fontWeight: 600, fontSize: 10, letterSpacing: 0.5 }}>{row.publicText}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Shielded card */}
      <div className="panel" style={{ borderColor: 'rgba(0, 212, 255, 0.25)', boxShadow: '0 0 24px rgba(0, 212, 255, 0.06)' }}>
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--cp-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--cp-cyan)', fontWeight: 600 }}>
            {header.zcashLabel}
          </span>
          <span style={{
            fontSize: 9, letterSpacing: 1, fontWeight: 600, textTransform: 'uppercase',
            color: 'var(--cp-cyan)', background: 'rgba(0, 212, 255, 0.1)',
            border: '1px solid rgba(0, 212, 255, 0.25)',
            padding: '3px 8px', borderRadius: 3,
          }}>
            Shielded
          </span>
        </div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={stagger}
          style={{ padding: 0 }}
        >
          {rows.map((row, i) => (
            <motion.div
              key={i}
              variants={rowVariants}
              transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '11px 18px',
                borderBottom: i < rows.length - 1 ? '1px solid var(--cp-border)' : 'none',
                fontSize: 11,
              }}
            >
              <span style={{ color: 'var(--cp-text-muted)' }}>{row.label}</span>
              <span style={{ color: 'var(--cp-cyan)', fontWeight: 600, fontSize: 10, letterSpacing: 0.5 }}>{row.privateText}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
