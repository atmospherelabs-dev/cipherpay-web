export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const config = {
    sm: { icon: 8, text: 14, gap: 4 },
    md: { icon: 11, text: 17, gap: 5 },
    lg: { icon: 16, text: 24, gap: 6 },
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

export function LogoMark({ size = 10 }: { size?: number }) {
  return (
    <img
      src="/logo-mark.png"
      alt="CipherPay"
      width={size}
      height={Math.round(size * 1.4)}
      style={{ display: 'block' }}
    />
  );
}
