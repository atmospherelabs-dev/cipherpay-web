export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  return (
    <span className={`${sizes[size]} font-bold tracking-tight`}>
      <span className="text-cp-cyan">Cipher</span>
      <span className="text-cp-text">Pay</span>
    </span>
  );
}
