import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Brand Assets — CipherPay',
  description: 'Download CipherPay logos and icons for press, integrations, and partner listings.',
};

const ASSETS = [
  { key: 'logoFull', href: '/logo-1200.png', preview: '/logo-1200.png', kind: 'logo' },
  { key: 'logoDark', href: '/logo-dark-bg.png', preview: '/logo-dark-bg.png', kind: 'logo' },
  { key: 'logoMark', href: '/logo-mark.png', preview: '/logo-mark.png', kind: 'logo' },
  { key: 'icon192', href: '/icon-192.png', preview: '/icon-192.png', kind: 'icon' },
  { key: 'icon512', href: '/icon-512.png', preview: '/icon-512.png', kind: 'icon' },
  { key: 'favicon', href: '/favicon.png', preview: '/favicon.png', kind: 'icon' },
] as const;

export default async function BrandPage() {
  const t = await getTranslations('brand');
  const logos = ASSETS.filter((a) => a.kind === 'logo');
  const icons = ASSETS.filter((a) => a.kind === 'icon');

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, lineHeight: 1.6 }}>
      <SiteHeader />

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{t('title')}</h1>
        <p style={{ color: 'var(--cp-text-muted)', fontSize: 12, marginBottom: 40 }}>
          {t('subtitle')}
        </p>

        <Section title={t('logosTitle')}>
          <AssetGrid assets={logos} t={t} />
        </Section>

        <Section title={t('iconsTitle')}>
          <AssetGrid assets={icons} t={t} />
        </Section>

        <Section title={t('usageTitle')}>
          <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.8, marginBottom: 8 }}>{t('usage1')}</p>
          <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.8, marginBottom: 8 }}>{t('usage2')}</p>
          <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.8 }}>{t('usage3')}</p>
        </Section>
      </main>

      <SiteFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{ fontSize: 14, fontWeight: 600, letterSpacing: 1, marginBottom: 20, color: 'var(--cp-cyan)' }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function AssetGrid({
  assets,
  t,
}: {
  assets: readonly { key: string; href: string; preview: string }[];
  t: (key: string) => string;
}) {
  return (
    <div className="brand-asset-grid">
      {assets.map((asset) => (
        <div key={asset.key} className="brand-asset-card panel">
          <div className="brand-asset-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset.preview} alt="" />
          </div>
          <div className="brand-asset-meta">
            <span style={{ fontSize: 11, color: 'var(--cp-text)' }}>{t(`assets.${asset.key}`)}</span>
            <a href={asset.href} download className="btn" style={{ fontSize: 10, padding: '6px 12px' }}>
              {t('download')}
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
