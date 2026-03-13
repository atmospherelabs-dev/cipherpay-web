interface EmptyStateProps {
  icon?: string;
  message: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, message, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon && <div className="icon">{icon}</div>}
      <div>{message}</div>
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}
