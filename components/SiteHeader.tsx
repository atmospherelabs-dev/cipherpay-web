import { Link } from '@/i18n/navigation';
import { Logo } from '@/components/Logo';
import { NavLinks } from '@/components/NavLinks';

interface SiteHeaderProps {
  label?: string;
}

export function SiteHeader({ label }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Link href="/"><Logo size="sm" /></Link>
        {label && (
          <span style={{ fontSize: 11, fontWeight: 300, color: 'var(--cp-text-muted)', letterSpacing: 1.5 }}>
            {label}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <NavLinks />
      </div>
    </header>
  );
}
