interface StatusDotProps {
  color: string;
  pulse?: boolean;
}

export function StatusDot({ color, pulse = false }: StatusDotProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-2.5 w-2.5 rounded-full ${pulse ? 'animate-pulse' : ''}`}
      style={{ backgroundColor: color }}
    />
  );
}
