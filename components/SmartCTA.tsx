'use client';

import Link from 'next/link';
import { useIsLoggedIn } from './NavLinks';

export function SmartCTA({ children, className, style }: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const isLoggedIn = useIsLoggedIn();
  const href = isLoggedIn ? '/dashboard' : '/dashboard/register';

  return (
    <Link href={href} className={className} style={{ textDecoration: 'none', ...style }}>
      {isLoggedIn ? 'GO TO DASHBOARD' : children}
    </Link>
  );
}
