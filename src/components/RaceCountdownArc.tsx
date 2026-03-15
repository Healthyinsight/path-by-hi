import { motion } from 'framer-motion';

const ARC_SIZE = 160;
const STROKE = 10;
const R = (ARC_SIZE - STROKE) / 2;
// Semi-circle arc (π radians)
const SEMI_CIRC = Math.PI * R;

interface Props {
  currentWeek: number;
  totalWeeks: number;
  daysLeft: number;
  goalName: string;
}

export function RaceCountdownArc({ currentWeek, totalWeeks, daysLeft, goalName }: Props) {
  const pct = Math.min(1, currentWeek / totalWeeks);
  const offset = SEMI_CIRC * (1 - pct);

  return (
    <div className="card-glass flex flex-col items-center gap-3 py-5">
      <div className="relative" style={{ width: ARC_SIZE, height: ARC_SIZE / 2 + 20 }}>
        <svg
          width={ARC_SIZE}
          height={ARC_SIZE / 2 + STROKE}
          viewBox={`0 0 ${ARC_SIZE} ${ARC_SIZE / 2 + STROKE}`}
        >
          <defs>
            <linearGradient id="race-arc-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#5095AC" />
              <stop offset="100%" stopColor="#839F8D" />
            </linearGradient>
          </defs>

          {/* Background track */}
          <path
            d={`M ${STROKE / 2} ${ARC_SIZE / 2} A ${R} ${R} 0 0 1 ${ARC_SIZE - STROKE / 2} ${ARC_SIZE / 2}`}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={STROKE}
            strokeLinecap="round"
            opacity={0.4}
          />

          {/* Progress arc */}
          <motion.path
            d={`M ${STROKE / 2} ${ARC_SIZE / 2} A ${R} ${R} 0 0 1 ${ARC_SIZE - STROKE / 2} ${ARC_SIZE / 2}`}
            fill="none"
            stroke="url(#race-arc-grad)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={SEMI_CIRC}
            initial={{ strokeDashoffset: SEMI_CIRC }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          />

          {/* Flag at end */}
          <text
            x={ARC_SIZE - STROKE / 2 - 2}
            y={ARC_SIZE / 2 - STROKE - 2}
            fontSize="14"
            textAnchor="end"
          >
            🏁
          </text>
        </svg>

        {/* Center percentage */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-0">
          <span className="font-data text-2xl font-bold" style={{ fontFeatureSettings: "'tnum' 1" }}>
            {Math.round(pct * 100)}%
          </span>
        </div>
      </div>

      <div className="text-center space-y-0.5">
        <p className="text-xs text-muted-foreground font-data-num">
          Vecka {currentWeek} av {totalWeeks} · {daysLeft} dagar kvar
        </p>
        <p className="text-xs font-semibold">{goalName}</p>
      </div>
    </div>
  );
}
