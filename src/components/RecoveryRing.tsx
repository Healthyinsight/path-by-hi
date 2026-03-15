import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getTodayRecovery, type RecoveryData } from '@/data/mockRecoveryData';

const RING_SIZE = 200;
const STROKE_WIDTH = 14;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const gradientIds: Record<RecoveryData['status'], string> = {
  green: 'recovery-grad-green',
  yellow: 'recovery-grad-yellow',
  red: 'recovery-grad-red',
};

const gradientColors: Record<RecoveryData['status'], [string, string]> = {
  green: ['#839F8D', '#5095AC'],
  yellow: ['#D4E67C', '#DAA520'],
  red: ['#E07A5F', '#DC3545'],
};

export function RecoveryRing() {
  const recovery = getTodayRecovery();
  const [animatedScore, setAnimatedScore] = useState(0);
  const pct = recovery.score / 100;
  const offset = CIRCUMFERENCE * (1 - pct);

  // Animate number counting up
  useEffect(() => {
    let frame: number;
    const duration = 1500;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * recovery.score));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [recovery.score]);

  const colors = gradientColors[recovery.status];
  const gId = gradientIds[recovery.status];

  return (
    <div className="card-athletic flex flex-col items-center gap-4 py-6">
      {/* SVG Ring */}
      <div className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          className="block"
        >
          <defs>
            <linearGradient id={gId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors[0]} />
              <stop offset="100%" stopColor={colors[1]} />
            </linearGradient>
          </defs>

          {/* Background track */}
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={STROKE_WIDTH}
          />

          {/* Animated progress arc */}
          <motion.circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={`url(#${gId})`}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: [0.33, 1, 0.68, 1] }}
            style={{
              transformOrigin: 'center',
              transform: 'rotate(-90deg)',
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-data text-4xl font-bold tracking-tight"
            style={{ fontFeatureSettings: "'tnum' 1" }}
          >
            {animatedScore}
          </span>
          <span className="text-[11px] text-muted-foreground font-sans">
            Återhämtning
          </span>
        </div>
      </div>

      {/* Status label */}
      <div className="text-center space-y-1">
        <p className="text-sm font-bold">{recovery.statusLabel}</p>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-[280px]">
          {recovery.summary}
        </p>
      </div>

      {/* Metrics row */}
      <div className="flex gap-6 text-xs text-muted-foreground font-data-num">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-foreground font-semibold">{recovery.sleepHours}h</span>
          <span>Sömn</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-foreground font-semibold">{recovery.hrvMs}ms</span>
          <span>HRV</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-foreground font-semibold">{recovery.bodyBattery}</span>
          <span>Body Battery</span>
        </div>
      </div>

      <p className="text-[10px] italic text-muted-foreground">
        Mock-data – Garmin-synk kommer snart
      </p>
    </div>
  );
}
