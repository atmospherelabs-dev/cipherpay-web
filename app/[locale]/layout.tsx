import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { DirectionSetter } from '@/components/DirectionSetter';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <DirectionSetter />
      {process.env.STAGING_MODE === 'true' && <aside style={{ background: '#fef3c7', color: '#78350f', padding: '10px 16px', textAlign: 'center', fontSize: 12 }}>
        PRIVATE STAGING · Test store only · Wallet payments use real funds
      </aside>}
      {children}
    </NextIntlClientProvider>
  );
}
