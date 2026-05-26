'use client';

import { useTranslations } from 'next-intl';
import { LogoMark } from '@/components/Logo';
import { AnimatedSection } from '@/components/AnimatedSection';
import { motion } from 'framer-motion';

const PRIVACY_ROWS = ['Row1', 'Row2', 'Row3', 'Row4', 'Row5'] as const;

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0 },
};

export function CheckoutPrivacySection() {
  const t = useTranslations('landing.privacy');

  return (
    <section id="privacy" style={{ borderTop: '1px solid var(--cp-border)', padding: '80px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <AnimatedSection>
          <div
            className="section-title"
            style={{
              textAlign: 'center',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <LogoMark size={8} /> {t('title')}
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, textAlign: 'center', marginBottom: 12 }}>
            {t('subtitle')}
          </h2>
          <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', textAlign: 'center', maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.8 }}>
            {t('intro')}
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.08}>
          <div className="privacy-compare">
            {/* Header */}
            <div className="privacy-compare-header">
              <span className="privacy-compare-label">&nbsp;</span>
              <span className="privacy-compare-col privacy-compare-col--exposed">{t('typicalCheckout')}</span>
              <span className="privacy-compare-col privacy-compare-col--shielded">{t('cipherpayCheckout')}</span>
            </div>

            {/* Rows */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              variants={stagger}
            >
              {PRIVACY_ROWS.map((row, i) => (
                <motion.div
                  key={row}
                  variants={rowVariants}
                  transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
                  className={`privacy-compare-row ${i === PRIVACY_ROWS.length - 1 ? 'privacy-compare-row--last' : ''}`}
                >
                  <span className="privacy-compare-label">{t(row)}</span>
                  <span className="privacy-compare-cell privacy-compare-cell--exposed">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <circle cx="7" cy="7" r="6" stroke="#ef4444" strokeWidth="1.5" opacity="0.3" />
                      <path d="M4.5 4.5L9.5 9.5M9.5 4.5L4.5 9.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span>{t('exposed')}</span>
                  </span>
                  <span className="privacy-compare-cell privacy-compare-cell--shielded">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <circle cx="7" cy="7" r="6" stroke="var(--cp-cyan)" strokeWidth="1.5" opacity="0.3" />
                      <path d="M4 7L6.5 9.5L10 4.5" stroke="var(--cp-cyan)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>{t('hidden')}</span>
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
