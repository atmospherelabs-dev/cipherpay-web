interface HelpTextProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function HelpText({ children, style }: HelpTextProps) {
  return (
    <div className="help-text" style={style}>
      {children}
    </div>
  );
}
