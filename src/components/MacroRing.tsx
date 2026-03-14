interface MacroRingProps {
  label: string;
  current: number;
  target: number;
  unit: string;
  color: string;
  size?: number;
  showTarget?: boolean;
}

export function MacroRing({ label, current, target, unit, color, size = 80, showTarget = true }: MacroRingProps) {
  const percentage = Math.min((current / target) * 100, 100);
  const isOver = current > target;
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const displayColor = isOver ? 'hsl(0 62.8% 50%)' : color;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={4}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={displayColor}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-sm font-bold">{current}</span>
          {showTarget && (
            <span className="text-[9px] text-muted-foreground">/ {target}{unit}</span>
          )}
        </div>
      </div>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}
