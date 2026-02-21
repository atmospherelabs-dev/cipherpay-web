export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const config = {
    sm: { icon: 14, text: 14, gap: 5 },
    md: { icon: 18, text: 18, gap: 6 },
    lg: { icon: 26, text: 26, gap: 8 },
  }[size];

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: config.gap }}>
      <LogoMark size={config.icon} />
      <span style={{ fontSize: config.text, fontWeight: 700, letterSpacing: -0.5 }}>
        <span style={{ color: 'var(--cp-cyan)' }}>Cipher</span>
        <span style={{ color: 'var(--cp-text)' }}>Pay</span>
      </span>
    </span>
  );
}

export function LogoMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M8 4L18 12L8 20"
        stroke="var(--cp-cyan)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
