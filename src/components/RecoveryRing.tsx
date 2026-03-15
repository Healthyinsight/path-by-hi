import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getTodayRecovery, type RecoveryData } from '@/data/mockRecoveryData';

const RING_SIZE = 220;
const STROKE = 10;
const R = 90;
const CX = RING_SIZE / 2;
const CY = RING_SIZE / 2;

const gradientColors: Record<RecoveryData['status'], [string, string]> = {
  green: ['#839F8D', '#5095AC'],
  yellow: ['#D4E67C', '#DAA520'],
  red: ['#E07A5F', '#DC3545'],
};

const glowShadow: Record<RecoveryData['status'], string> = {
  green: '0 0 30px rgba(80, 149, 172, 0.3)',
  yellow: '0 0 30px rgba(212, 230, 124, 0.3)',
  red: '0 0 30px rgba(224, 122, 95, 0.3)',
};

const statusEmoji: Record<RecoveryData['status'], string> = {
  green: '🟢',
  yellow: '🟡',
  red: '🔴',
};

export function RecoveryRing() {
  const recovery = getTodayRecovery();
  const [animatedScore, setAnimatedScore] = useState(0);
  const pct = recovery.score / 100;
  const colors = gradientColors[recovery.status];
  const gId = `recovery-grad-${recovery.status}`;

  // Animate the number counting up
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
      {/* Ring with glow */}
      <div
        className="relative animate-ring-glow"
        style={{
          width: RING_SIZE,
          height: RING_SIZE,
          margin: '0 auto',
          boxShadow: glowShadow[recovery.status],
          borderRadius: '50%',
        }}
      >
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          style={{ transform: 'rotate(-90deg)' }}
        >
          <defs>
            <linearGradient id={gId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors[0]} />
              <stop offset="100%" stopColor={colors[1]} />
            </linearGradient>
          </defs>

          {/* Background track */}
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke="#E8EDEF"
            strokeWidth={STROKE}
          />

          {/* Animated progress ring using pathLength */}
          <motion.circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke={`url(#${gId})`}
            strokeWidth={STROKE}
            strokeLinecap="round"
            pathLength={1}
            initial={{ strokeDasharray: '1 1', strokeDashoffset: 1 }}
            animate={{ strokeDashoffset: 1 - pct }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>

        {/* Center content – counter-rotate to keep text upright */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ transform: 'rotate(0deg)' }}
        >
          <span
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '48px',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              color: '#1A2B32',
            }}
          >
            {animatedScore}
          </span>
          <span className="metric-label" style={{ letterSpacing: '1.5px', fontSize: '12px' }}>
            Återhämtning
          </span>
        </div>
      </div>

      {/* Metric pills */}
      <div className="flex gap-2 relative z-10">
        <span className="metric-pill">Sömn {recovery.sleepHours}h</span>
        <span className="metric-pill">HRV {recovery.hrvMs}ms</span>
        <span className="metric-pill">Body Battery {recovery.bodyBattery}</span>
      </div>

      {/* Status text */}
      <p
        className="text-center relative z-10"
        style={{
          fontFamily: "'Merriweather Sans', sans-serif",
          fontSize: '14px',
          color: colors[1],
        }}
      >
        {statusEmoji[recovery.status]} {recovery.statusLabel}
      </p>

      {/* Mock data label */}
      <p
        className="text-center relative z-10"
        style={{
          fontFamily: "'Merriweather Sans', sans-serif",
          fontSize: '11px',
          fontStyle: 'italic',
          color: '#B0B8BF',
        }}
      >
        Mock-data – Garmin-synk kommer snart
      </p>
    </div>
  );
}
