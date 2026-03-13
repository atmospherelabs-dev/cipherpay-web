interface BannerProps {
  variant: 'warning' | 'error';
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const variantStyles: Record<BannerProps['variant'], { bg: string; border: string; color: string }> = {
  warning: {
    bg: 'rgba(245,158,11,0.1)',
    border: '1px solid rgba(245,158,11,0.4)',
    color: 'var(--cp-yellow)',
  },
  error: {
    bg: 'rgba(239,68,68,0.15)',
    border: '1px solid rgba(239,68,68,0.5)',
    color: 'var(--cp-red)',
  },
};

export function Banner({ variant, title, description, action }: BannerProps) {
  const s = variantStyles[variant];

  return (
    <div style={{
      background: s.bg,
      border: s.border,
      padding: '14px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: s.color, letterSpacing: 1 }}>
          {title}
        </div>
        {description && (
          <div style={{ fontSize: 10, color: 'var(--cp-text-muted)', marginTop: 4 }}>
            {description}
          </div>
        )}
      </div>
      {action}
    </div>
  );
}
