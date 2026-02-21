const statusConfig = {
  pending: { label: 'Pending', color: 'bg-cp-yellow/15 text-cp-yellow border-cp-yellow/30' },
  detected: { label: 'Detected', color: 'bg-cp-purple/15 text-cp-purple border-cp-purple/30' },
  confirmed: { label: 'Confirmed', color: 'bg-cp-green/15 text-cp-green border-cp-green/30' },
  expired: { label: 'Expired', color: 'bg-cp-red/15 text-cp-red border-cp-red/30' },
  shipped: { label: 'Shipped', color: 'bg-cp-cyan/15 text-cp-cyan border-cp-cyan/30' },
} as const;

export function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${cfg.color}`}
    >
      {status === 'detected' && (
        <span className="w-1.5 h-1.5 rounded-full bg-cp-purple animate-pulse-slow" />
      )}
      {status === 'confirmed' && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      {cfg.label}
    </span>
  );
}
