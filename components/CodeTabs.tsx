'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface Tab {
  label: string;
  tag: string;
  code: string;
}

interface CodeTabsProps {
  tabs: Tab[];
}

export function CodeTabs({ tabs }: CodeTabsProps) {
  const [active, setActive] = useState(0);

  return (
    <div className="panel">
      <div className="panel-header" style={{ gap: 8 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => setActive(i)}
              style={{
                padding: '5px 12px',
                fontSize: 10,
                letterSpacing: 1,
                fontFamily: 'inherit',
                cursor: 'pointer',
                border: '1px solid',
                borderColor: active === i ? 'var(--cp-cyan)' : 'var(--cp-border)',
                borderRadius: 4,
                background: active === i ? 'rgba(0, 212, 255, 0.1)' : 'transparent',
                color: active === i ? 'var(--cp-cyan)' : 'var(--cp-text-muted)',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span className="tag">{tabs[active].tag}</span>
      </div>
      <div style={{ padding: 18, overflow: 'auto', position: 'relative', minHeight: 120 }}>
        <AnimatePresence mode="wait">
          <motion.pre
            key={active}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            style={{ margin: 0, fontSize: 11, lineHeight: 1.8, color: 'var(--cp-text)' }}
          >
            <code>{tabs[active].code}</code>
          </motion.pre>
        </AnimatePresence>
      </div>
    </div>
  );
}
