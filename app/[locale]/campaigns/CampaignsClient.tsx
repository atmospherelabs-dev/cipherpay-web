'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { currencySymbol } from '@/lib/currency';
import type { CampaignEntry } from '@/lib/api';

interface CampaignsClientProps {
  campaigns: CampaignEntry[];
  zecRate: number | null;
}

export default function CampaignsClient({ campaigns, zecRate }: CampaignsClientProps) {
  const t = useTranslations('campaigns');
  const [search, setSearch] = useState('');

  const filtered = campaigns.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.campaign_name?.toLowerCase().includes(q)) ||
      (c.name?.toLowerCase().includes(q)) ||
      (c.merchant_name?.toLowerCase().includes(q)) ||
      (c.mission?.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--cp-bg, #0a0a0f)',
      color: 'var(--cp-text, #e0e0e0)',
      fontFamily: 'var(--font-sans, Inter, system-ui, sans-serif)',
    }}>
      <SiteHeader />

      {/* Hero */}
      <div style={{
        textAlign: 'center',
        padding: '48px 24px 32px',
        maxWidth: 640,
        margin: '0 auto',
      }}>
        <h1 style={{
          fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em',
          marginBottom: 12,
          background: 'linear-gradient(135deg, #5B9CF6, #56D4C8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          {t('title')}
        </h1>
        <p style={{
          fontSize: 14, color: 'var(--cp-text-muted)', lineHeight: 1.6,
          maxWidth: 480, margin: '0 auto',
        }}>
          {t('subtitle')}
        </p>
      </div>

      {/* Search */}
      <div style={{
        maxWidth: 520, margin: '0 auto 32px', padding: '0 24px',
      }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="input"
          style={{
            width: '100%', padding: '10px 14px',
            fontSize: 13, borderRadius: 8,
          }}
        />
      </div>

      {/* Grid */}
      <div style={{
        maxWidth: 960, margin: '0 auto', padding: '0 24px 60px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 20,
      }}>
        {filtered.length === 0 && (
          <div style={{
            gridColumn: '1 / -1', textAlign: 'center',
            padding: '60px 20px', color: 'var(--cp-text-muted)', fontSize: 14,
          }}>
            {search.trim() ? t('noResults') : t('noCampaigns')}
          </div>
        )}

        {filtered.map(campaign => (
          <CampaignCard key={campaign.slug} campaign={campaign} zecRate={zecRate} />
        ))}
      </div>

      <SiteFooter />
    </div>
  );
}

function CampaignCard({ campaign, zecRate }: { campaign: CampaignEntry; zecRate: number | null }) {
  const t = useTranslations('campaigns');
  const name = campaign.campaign_name || campaign.name || 'Untitled';
  const currency = campaign.currency || 'USD';
  const sym = currencySymbol(currency);
  const raised = campaign.total_raised / 100;
  const hasGoal = campaign.campaign_goal && campaign.campaign_goal > 0;
  const goalAmount = hasGoal ? campaign.campaign_goal! / 100 : 0;
  const progress = hasGoal ? Math.min((raised / goalAmount) * 100, 100) : 0;

  return (
    <a
      href={campaign.donate_url}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div style={{
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
        overflow: 'hidden',
        transition: 'border-color 0.15s, transform 0.15s',
        cursor: 'pointer',
      }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(91,156,246,0.3)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {/* Cover image */}
        {campaign.cover_image_url && (
          <div style={{ height: 140, overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={campaign.cover_image_url}
              alt=""
              referrerPolicy="no-referrer"
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).parentElement!.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '16px 18px' }}>
          <h3 style={{
            fontSize: 15, fontWeight: 600, marginBottom: 4,
            lineHeight: 1.3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {name}
          </h3>

          {campaign.merchant_name && (
            <div style={{ fontSize: 11, color: 'var(--cp-text-muted)', marginBottom: 8 }}>
              {t('by')} {campaign.merchant_name}
            </div>
          )}

          {campaign.mission && (
            <p style={{
              fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.5,
              marginBottom: 12,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {campaign.mission}
            </p>
          )}

          {/* Progress bar */}
          <div style={{ marginBottom: 8 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 11, marginBottom: 4,
            }}>
              <span style={{ fontWeight: 600, color: 'var(--cp-cyan, #56D4C8)' }}>
                {sym}{raised.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} {t('raised')}
              </span>
              {hasGoal && (
                <span style={{ color: 'var(--cp-text-dim)' }}>
                  {t('goalOf')} {sym}{goalAmount.toLocaleString()}
                </span>
              )}
            </div>
            {hasGoal && (
              <div style={{
                width: '100%', height: 4, borderRadius: 2,
                background: 'rgba(255,255,255,0.06)',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${progress}%`, height: '100%', borderRadius: 2,
                  background: 'linear-gradient(90deg, #5B9CF6, #56D4C8)',
                  transition: 'width 0.3s',
                }} />
              </div>
            )}
          </div>

          {/* Stats row */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontSize: 10, color: 'var(--cp-text-dim)',
          }}>
            <span>
              {campaign.total_confirmed} {campaign.total_confirmed === 1 ? t('donor') : t('donors')}
            </span>
            {zecRate && campaign.total_raised_zatoshis > 0 && (
              <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>
                {(campaign.total_raised_zatoshis / 100_000_000).toFixed(4)} ZEC
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}
