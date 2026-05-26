'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { LogoMark } from '@/components/Logo';
import { AnimatedSection } from '@/components/AnimatedSection';
import { AgentTerminalVisual } from '@/components/AgentTerminalVisual';

const CYCLE_MS = 5000;

const USE_CASES = [
  {
    key: 'online' as const,
    href: '/docs',
    external: false,
    image: '/use-cases/shopify-store.png',
    imagePosition: 'top' as const,
  },
  {
    key: 'inPerson' as const,
    href: '/pos',
    external: false,
    image: '/use-cases/pos-retail.png',
    imagePosition: 'center' as const,
  },
  {
    key: 'agents' as const,
    href: '#agents',
    external: true,
    variant: 'terminal' as const,
  },
] as const;

export function UseCasesSection() {
  const t = useTranslations('landing.useCases');
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const startRef = useRef(Date.now());

  const advance = useCallback(() => {
    setActive((prev) => (prev + 1) % USE_CASES.length);
    setProgress(0);
    startRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (paused) return;
    startRef.current = Date.now();
    setProgress(0);

    const frame = () => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min(elapsed / CYCLE_MS, 1);
      setProgress(pct);
      if (pct >= 1) {
        advance();
      } else {
        rafId = requestAnimationFrame(frame);
      }
    };
    let rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [active, paused, advance]);

  const handleSelect = (idx: number) => {
    setActive(idx);
    setProgress(0);
    startRef.current = Date.now();
  };

  return (
    <section id="use-cases" className="uc-section">
      <div className="uc-container">
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
          <h2 className="uc-heading">{t('subtitle')}</h2>
          <p className="uc-intro">{t('intro')}</p>
        </AnimatedSection>

        <div
          className="uc-panel"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => {
            setPaused(false);
            startRef.current = Date.now() - progress * CYCLE_MS;
          }}
        >
          {/* Visual area */}
          <div className="uc-visual">
            {USE_CASES.map((uc, idx) => (
              <div
                key={uc.key}
                className={`uc-visual-slide ${idx === active ? 'uc-visual-slide--active' : ''}`}
              >
                {'variant' in uc && uc.variant === 'terminal' ? (
                  <div className="uc-visual-terminal-wrap">
                    <AgentTerminalVisual className="uc-terminal" />
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={'image' in uc ? uc.image : ''}
                    alt=""
                    className="uc-visual-img"
                    style={{
                      objectPosition: 'imagePosition' in uc && uc.imagePosition === 'center' ? 'center' : 'top center',
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Tab list */}
          <div className="uc-tabs" role="tablist" aria-label={t('tabsAriaLabel')}>
            {USE_CASES.map((uc, idx) => {
              const isActive = idx === active;
              return (
                <div
                  key={uc.key}
                  role="presentation"
                  className={`uc-tab ${isActive ? 'uc-tab--active' : ''}`}
                >
                  <div className="uc-tab-progress">
                    <div
                      className="uc-tab-progress-bar"
                      style={{ transform: `scaleX(${isActive ? progress : 0})` }}
                    />
                  </div>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className="uc-tab-trigger"
                    onClick={() => handleSelect(idx)}
                  >
                    <h3 className="uc-tab-title">{t(`${uc.key}Title`)}</h3>
                    <p className="uc-tab-desc">{t(`${uc.key}Desc`)}</p>
                  </button>
                  <span className="uc-tab-cta">
                    {uc.external ? (
                      <a href={uc.href}>{t('learnMore')}</a>
                    ) : (
                      <Link href={uc.href}>{t('learnMore')}</Link>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile card fallback */}
        <div className="uc-mobile-cards">
          {USE_CASES.map((uc) => {
            const card = (
              <article className="use-case-card">
                <div
                  className={`use-case-card-media ${'variant' in uc && uc.variant === 'terminal' ? 'use-case-card-media--terminal' : ''}`}
                >
                  {'variant' in uc && uc.variant === 'terminal' ? (
                    <AgentTerminalVisual className="use-case-card-terminal" />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={'image' in uc ? uc.image : ''}
                      alt=""
                      className="use-case-card-img"
                      style={{
                        objectPosition: 'imagePosition' in uc && uc.imagePosition === 'center' ? 'center' : 'top center',
                      }}
                    />
                  )}
                </div>
                <div className="use-case-body">
                  <h3 className="use-case-title">{t(`${uc.key}Title`)}</h3>
                  <p className="use-case-desc">{t(`${uc.key}Desc`)}</p>
                  <span className="use-case-cta">{t('learnMore')}</span>
                </div>
              </article>
            );
            return uc.external ? (
              <a key={uc.key} href={uc.href} className="use-case-card-link">{card}</a>
            ) : (
              <Link key={uc.key} href={uc.href} className="use-case-card-link">{card}</Link>
            );
          })}
        </div>

        <p className="uc-footnote">{t('checkoutNote')}</p>
      </div>
    </section>
  );
}
