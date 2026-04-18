'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Spinner } from '@/components/Spinner';
import { currencySymbol } from '@/lib/currency';
import type { DonationLinkInfo } from '@/lib/api';
import { createDonationCheckout } from './actions';

const ALLOWED_POSITIONS = new Set(['center top', 'center center', 'center bottom']);

interface DonateClientProps {
  info: DonationLinkInfo;
  slug: string;
  locale: string;
}

export default function DonateClient({ info, slug, locale }: DonateClientProps) {
  const t = useTranslations('donate');
  const tc = useTranslations('common');
  const router = useRouter();
  const config = info.donation_config;
  const currency = config?.currency || 'USD';
  const sym = currencySymbol(currency);
  const suggested = config?.suggested_amounts || [];
  const minCents = config?.min_amount || 100;
  const maxCents = config?.max_amount || 1000000;

  const [selectedCents, setSelectedCents] = useState<number | null>(
    suggested.length > 0 ? suggested[0] : null
  );
  const [customInput, setCustomInput] = useState('');
  const [isCustom, setIsCustom] = useState(suggested.length === 0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveAmount = isCustom
    ? Math.round(parseFloat(customInput || '0') * 100)
    : (selectedCents || 0);

  const isValid = effectiveAmount >= minCents && effectiveAmount <= maxCents;

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const result = await createDonationCheckout(slug, effectiveAmount, currency);

      if (result.error) {
        setError(result.error);
        return;
      }

      router.push(`/${locale}/pay/${result.invoice_id}`);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const progress = config?.campaign_goal
    ? Math.min(100, (info.total_raised / config.campaign_goal) * 100)
    : null;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: 'var(--cp-bg, #0a0a0f)',
      color: 'var(--cp-text, #e0e0e0)',
      fontFamily: 'var(--font-sans, system-ui)',
    }}>
      {/* Header */}
      <div style={{
        width: '100%', maxWidth: 600, display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', padding: '16px 20px',
      }}>
        <Logo size="sm" />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      {/* Main card */}
      <div style={{
        width: '100%', maxWidth: 480, margin: '20px auto', padding: '0 20px',
      }}>
        <div className="panel" style={{ overflow: 'hidden' }}>
          {/* Cover image */}
          {config?.cover_image_url && (
            <div style={{ width: '100%', height: 200, overflow: 'hidden' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={config.cover_image_url}
                alt=""
                referrerPolicy="no-referrer"
                loading="lazy"
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  objectPosition: ALLOWED_POSITIONS.has(config.cover_image_position ?? '') ? config.cover_image_position! : 'center top',
                }}
              />
            </div>
          )}

          <div className="panel-body" style={{ padding: '24px 24px 28px' }}>
            {/* Campaign name — emotional headline */}
            {config?.campaign_name && (
              <h1 style={{
                fontSize: 22, fontWeight: 700, margin: 0,
                color: 'var(--cp-text)', lineHeight: 1.3,
              }}>
                {config.campaign_name}
              </h1>
            )}

            {/* Byline: org name + website */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
              marginTop: config?.campaign_name ? 8 : 0,
            }}>
              <span style={{
                fontSize: config?.campaign_name ? 12 : 18,
                fontWeight: config?.campaign_name ? 500 : 700,
                color: config?.campaign_name ? 'var(--cp-text-muted)' : 'var(--cp-text)',
              }}>
                {config?.campaign_name ? `by ${info.name || info.merchant_name}` : (info.name || info.merchant_name)}
              </span>
              {config?.website_url && /^https?:\/\//.test(config.website_url) && (
                <>
                  <span style={{ fontSize: 10, color: 'var(--cp-text-dim)' }}>·</span>
                  <a
                    href={config.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 11, color: 'var(--cp-accent)',
                      textDecoration: 'none',
                    }}
                  >
                    {config.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </a>
                </>
              )}
            </div>

            {/* Mission */}
            {config?.mission && (
              <p style={{
                fontSize: 13, color: 'var(--cp-text-dim)', margin: '12px 0 0',
                lineHeight: 1.6,
              }}>
                {config.mission}
              </p>
            )}

            {/* Campaign progress */}
            {progress !== null && config?.campaign_goal && (
              <div style={{ marginTop: 20 }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', fontSize: 11,
                  color: 'var(--cp-text-muted)', marginBottom: 6,
                }}>
                  <span>{sym}{(info.total_raised / 100).toLocaleString()} {t('raised')}</span>
                  <span>{t('goalOf')} {sym}{(config.campaign_goal / 100).toLocaleString()}</span>
                </div>
                <div style={{
                  height: 6, borderRadius: 3,
                  background: 'rgba(255,255,255,0.06)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, var(--cp-accent-blue, #5B9CF6), var(--cp-accent-cyan, #56D4C8))',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            )}

            {/* Amount selection */}
            <div style={{ marginTop: 24 }}>
              <div style={{
                fontSize: 10, letterSpacing: 1, color: 'var(--cp-text-muted)',
                marginBottom: 10, fontWeight: 600,
              }}>
                {t('selectAmount')}
              </div>

              {suggested.length > 0 && (
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                  gap: 8, marginBottom: 12,
                }}>
                  {suggested.map((cents) => (
                    <button
                      key={cents}
                      onClick={() => { setSelectedCents(cents); setIsCustom(false); }}
                      style={{
                        padding: '10px 8px', borderRadius: 6, border: '1px solid',
                        borderColor: !isCustom && selectedCents === cents
                          ? 'var(--cp-accent-blue, #5B9CF6)'
                          : 'rgba(255,255,255,0.08)',
                        background: !isCustom && selectedCents === cents
                          ? 'rgba(91,156,246,0.1)'
                          : 'rgba(255,255,255,0.02)',
                        color: 'var(--cp-text)',
                        fontSize: 14, fontWeight: 600, cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {sym}{(cents / 100).toLocaleString()}
                    </button>
                  ))}
                </div>
              )}

              {/* Custom amount */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <button
                  onClick={() => setIsCustom(true)}
                  style={{
                    padding: '8px 12px', borderRadius: 6, border: '1px solid',
                    borderColor: isCustom ? 'var(--cp-accent-blue)' : 'rgba(255,255,255,0.08)',
                    background: isCustom ? 'rgba(91,156,246,0.1)' : 'transparent',
                    color: 'var(--cp-text-muted)', fontSize: 11, cursor: 'pointer',
                    whiteSpace: 'nowrap', fontWeight: 500,
                  }}
                >
                  {t('custom')}
                </button>
                {isCustom && (
                  <div style={{ flex: 1, position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--cp-text-muted)', fontSize: 14,
                    }}>
                      {sym}
                    </span>
                    <input
                      type="number"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder={(minCents / 100).toFixed(2)}
                      min={(minCents / 100).toFixed(2)}
                      max={(maxCents / 100).toFixed(2)}
                      step="0.01"
                      style={{
                        width: '100%', padding: '10px 12px 10px 28px', borderRadius: 6,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.03)',
                        color: 'var(--cp-text)', fontSize: 14,
                        outline: 'none',
                      }}
                      autoFocus
                    />
                  </div>
                )}
              </div>

              {/* Validation hint */}
              {effectiveAmount > 0 && !isValid && (
                <div style={{
                  fontSize: 11, color: '#f97316', marginTop: 8,
                }}>
                  {effectiveAmount < minCents
                    ? t('minAmount', { amount: `${sym}${(minCents / 100).toFixed(2)}` })
                    : t('maxAmount', { amount: `${sym}${(maxCents / 100).toFixed(2)}` })
                  }
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div style={{
                marginTop: 12, padding: '10px 14px', borderRadius: 6,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                fontSize: 12, color: '#ef4444',
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!isValid || submitting}
              style={{
                width: '100%', marginTop: 20, padding: '14px 0',
                borderRadius: 8, border: 'none',
                background: isValid
                  ? 'linear-gradient(135deg, var(--cp-accent-blue, #5B9CF6), var(--cp-accent-cyan, #56D4C8))'
                  : 'rgba(255,255,255,0.06)',
                color: isValid ? '#fff' : 'var(--cp-text-dim)',
                fontSize: 14, fontWeight: 700, letterSpacing: 0.5,
                cursor: isValid && !submitting ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Spinner size={14} /> {t('processing')}
                </span>
              ) : (
                isValid
                  ? `${t('donate')} ${sym}${(effectiveAmount / 100).toFixed(2)}`
                  : t('donate')
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center', marginTop: 16, fontSize: 10,
          color: 'var(--cp-text-dim)',
        }}>
          {t('poweredBy')}
        </div>
      </div>
    </div>
  );
}
