import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getTodayRecovery, type RecoveryData } from '@/data/mockRecoveryData';

const RING_SIZE = 200;
const STROKE_WIDTH = 14;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const gradientColors: Record<RecoveryData['status'], [string, string]> = {
  green: ['#839F8D', '#5095AC'],
  yellow: ['#D4E67C', '#DAA520'],
  red: ['#E07A5F', '#DC3545'],
};

const glowColors: Record<RecoveryData['status'], string> = {
  green: 'rgba(80, 149, 172, 0.25)',
  yellow: 'rgba(212, 230, 124, 0.25)',
  red: 'rgba(220, 53, 69, 0.2)',
};

export function RecoveryRing() {
  const recovery = getTodayRecovery();
  const [animatedScore, setAnimatedScore] = useState(0);
  const pct = recovery.score / 100;
  const offset = CIRCUMFERENCE * (1 - pct);
  const colors = gradientColors[recovery.status];
  const gId = `recovery-grad-${recovery.status}`;

  useEffect(() => {
    let frame: number;
    const duration = 1500;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * recovery.score));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [recovery.score]);

  return (
    <div className="card-glass flex flex-col items-center gap-4 py-6 relative overflow-hidden">
      {/* Subtle glow behind ring */}
      <div
        className="absolute animate-ring-glow rounded-full blur-3xl"
        style={{
          width: RING_SIZE + 40,
          height: RING_SIZE + 40,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -55%)',
          background: glowColors[recovery.status],
        }}
      />

      {/* SVG Ring */}
      <div className="relative z-10" style={{ width: RING_SIZE, height: RING_SIZE }}>
        <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
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
            opacity={0.5}
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
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-data text-5xl font-bold tracking-tight" style={{ fontFeatureSettings: "'tnum' 1" }}>
            {animatedScore}
          </span>
          <span className="metric-label mt-0.5">Återhämtning</span>
        </div>
      </div>

      {/* Status */}
      <div className="text-center space-y-1 relative z-10">
        <p className="text-sm font-bold">{recovery.statusLabel}</p>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-[280px]">{recovery.summary}</p>
      </div>

      {/* Metrics pills */}
      <div className="flex gap-3 relative z-10">
        {[
          { label: 'Sömn', value: `${recovery.sleepHours}h` },
          { label: 'HRV', value: `${recovery.hrvMs}ms` },
          { label: 'Battery', value: `${recovery.bodyBattery}` },
        ].map((m) => (
          <div key={m.label} className="flex flex-col items-center gap-0.5 rounded-xl bg-muted/50 px-3 py-1.5">
            <span className="font-data text-sm font-semibold" style={{ fontFeatureSettings: "'tnum' 1" }}>
              {m.value}
            </span>
            <span className="metric-label text-[9px]">{m.label}</span>
          </div>
        ))}
      </div>

      <p className="text-[10px] italic text-muted-foreground relative z-10">
        Mock-data – Garmin-synk kommer snart
      </p>
    </div>
  );
}
