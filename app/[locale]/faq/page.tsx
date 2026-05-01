import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { FaqSection, FaqJumpLinks } from '@/components/FaqAccordion';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ — CipherPay',
  description: 'Frequently asked questions about CipherPay, privacy, security, and self-hosting.',
};

const sectionDefs = [
  { id: 'privacy', key: 's1', count: 4 },
  { id: 'wallet', key: 's2', count: 4 },
  { id: 'how', key: 's3', count: 4 },
  { id: 'security', key: 's4', count: 5 },
  { id: 'hosting', key: 's5', count: 4 },
  { id: 'x402', key: 's6', count: 5 },
  { id: 'integrations', key: 's7', count: 4 },
  { id: 'billing', key: 's8', count: 3 },
  { id: 'wallets', key: 's9', count: 3 },
  { id: 'general', key: 's10', count: 5 },
];

export default async function FAQPage() {
  const t = await getTranslations('faq');

  const sections = sectionDefs.map((s, i) => ({
    id: s.id,
    title: `${String(i + 1).padStart(2, '0')} // ${t(`${s.key}Title`)}`,
    label: t(`${s.key}Title`),
    items: Array.from({ length: s.count }, (_, j) => ({
      question: t(`${s.key}q${j + 1}`),
      answer: t(`${s.key}a${j + 1}`),
    })),
  }));

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, lineHeight: 1.6 }}>
      <SiteHeader />

      <main style={{ maxWidth: 700, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{t('title')}</h1>
        <p style={{ color: 'var(--cp-text-muted)', fontSize: 12, marginBottom: 32 }}>
          {t('subtitle')}
        </p>

        <FaqJumpLinks sections={sections.map((s) => ({ id: s.id, label: s.label }))} />

        {sections.map((section) => (
          <FaqSection key={section.id} {...section} />
        ))}
      </main>

      <SiteFooter />
    </div>
  );
}
