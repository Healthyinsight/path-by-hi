import { useState } from 'react';
import { type ReadinessBreakdown, getReadinessColor } from '@/lib/raceReadiness';
import { Progress } from '@/components/ui/progress';

interface Props {
  breakdown: ReadinessBreakdown;
  hasEnoughData: boolean;
}

export function RaceReadinessGauge({ breakdown, hasEnoughData }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { total, training, nutrition, consistency, bodyComp } = breakdown;
  const color = getReadinessColor(total);
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (circumference * (hasEnoughData ? total : 0)) / 100;

  const subScores = [
    { label: 'Träning', value: training, color: 'bg-primary' },
    { label: 'Kost', value: nutrition, color: 'bg-nutrition-carbs' },
    { label: 'Kontinuitet', value: consistency, color: 'bg-secondary' },
    { label: 'Kroppskomposition', value: bodyComp, color: 'bg-accent' },
  ];

  return (
    <div className="card-athletic mb-4 cursor-pointer" onClick={() => setExpanded(e => !e)}>
      <div className="flex flex-col items-center gap-2">
        <div className="relative h-[120px] w-[120px]">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke={color} strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-2xl font-bold" style={{ color }}>
              {hasEnoughData ? `${total}%` : '–'}
            </span>
          </div>
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Race Readiness</p>

        {!hasEnoughData && (
          <p className="text-center text-xs text-muted-foreground">
            Samlar data... Scoren aktiveras efter 7 dagars träning.
          </p>
        )}
      </div>

      {expanded && hasEnoughData && (
        <div className="mt-4 space-y-2 border-t border-border pt-3">
          {subScores.map((s) => (
            <div key={s.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{s.label}</span>
                <span className="font-mono font-medium">{s.value}%</span>
              </div>
              <Progress value={s.value} className="h-1.5" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
