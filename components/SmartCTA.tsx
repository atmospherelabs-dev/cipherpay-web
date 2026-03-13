'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useIsLoggedIn } from './NavLinks';

export function SmartCTA({ children, className, style }: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const isLoggedIn = useIsLoggedIn();
  const t = useTranslations('landing');
  const href = isLoggedIn ? '/dashboard' : '/dashboard/register';

  return (
    <Link href={href} className={className} style={style}>
      {isLoggedIn ? t('ctaDashboard') : children}
    </Link>
  );
}
