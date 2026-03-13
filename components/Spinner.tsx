interface SpinnerProps {
  size?: number;
}

export function Spinner({ size = 20 }: SpinnerProps) {
  return (
    <div
      className="spinner"
      style={{ width: size, height: size }}
    />
  );
}
