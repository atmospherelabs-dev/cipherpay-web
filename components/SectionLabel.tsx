interface SectionLabelProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function SectionLabel({ children, style }: SectionLabelProps) {
  return (
    <div className="section-label" style={style}>
      {children}
    </div>
  );
}
