import { Logo } from '@/components/Logo';
import { NavLinks } from '@/components/NavLinks';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ — CipherPay',
  description: 'Frequently asked questions about CipherPay, privacy, security, and self-hosting.',
};

const sectionDefs = [
  { id: '01', key: 's1', questionCount: 4 },
  { id: '02', key: 's2', questionCount: 4 },
  { id: '03', key: 's3', questionCount: 4 },
  { id: '04', key: 's4', questionCount: 3 },
  { id: '05', key: 's5', questionCount: 4 },
  { id: '06', key: 's6', questionCount: 5 },
];

export default async function FAQPage() {
  const t = await getTranslations('faq');

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, lineHeight: 1.6 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--cp-border)' }}>
        <Link href="/"><Logo size="md" /></Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <NavLinks />
        </div>
      </header>

      <main style={{ maxWidth: 700, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{t('title')}</h1>
        <p style={{ color: 'var(--cp-text-muted)', fontSize: 12, marginBottom: 40 }}>
          {t('subtitle')}
        </p>

        {sectionDefs.map((section) => (
          <div key={section.id} style={{ marginBottom: 40 }}>
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">{section.id} // {t(`${section.key}Title`)}</span>
              </div>

              {Array.from({ length: section.questionCount }, (_, i) => (
                <div key={i} style={{ padding: '16px 18px', borderBottom: i < section.questionCount - 1 ? '1px solid var(--cp-border)' : 'none' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cp-text)', marginBottom: 8 }}>
                    {t(`${section.key}q${i + 1}`)}
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--cp-text-muted)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                    {t(`${section.key}a${i + 1}`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>

      <footer style={{ borderTop: '1px solid var(--cp-border)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: 'var(--cp-text-muted)' }}>
          <Logo size="sm" />
          <span>{t('footerPoweredBy')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 10 }}>
          <Link href="/" style={{ color: 'var(--cp-text-muted)', textDecoration: 'none' }}>{t('footerHome')}</Link>
          <a href="https://cipherscan.app" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cp-text-muted)', textDecoration: 'none' }}>CipherScan</a>
        </div>
      </footer>
    </div>
  );
}
