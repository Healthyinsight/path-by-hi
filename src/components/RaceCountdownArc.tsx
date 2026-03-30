import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const ARC_W = 140;
const ARC_H = 80;
const STROKE = 8;
const R = (ARC_W - STROKE) / 2;
const SEMI_CIRC = Math.PI * R;

interface Props {
  currentWeek: number;
  totalWeeks: number;
  daysLeft: number;
  goalName: string;
}

export function RaceCountdownArc({ currentWeek, totalWeeks, daysLeft, goalName }: Props) {
  const { t } = useTranslation();
  const pct = Math.min(1, currentWeek / totalWeeks);
  const offset = SEMI_CIRC * (1 - pct);
  // Split goal name at space before last word for two-line display
  const nameParts = goalName.split(' ');
  const mainName = nameParts.length > 1
    ? nameParts.slice(0, -1).join(' ')
    : goalName;
  const subName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

  return (
    <div className="card-glass flex items-center gap-4" style={{ minHeight: '120px' }}>
      {/* Left: Semi-circular arc */}
      <div className="relative flex-shrink-0" style={{ width: ARC_W, height: ARC_H + 10 }}>
        <svg
          width={ARC_W}
          height={ARC_H + STROKE}
          viewBox={`0 0 ${ARC_W} ${ARC_H + STROKE}`}
        >
          <defs>
            <linearGradient id="race-arc-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#5095AC" />
              <stop offset="100%" stopColor="#839F8D" />
            </linearGradient>
          </defs>

          {/* Background track */}
          <path
            d={`M ${STROKE / 2} ${ARC_H} A ${R} ${R} 0 0 1 ${ARC_W - STROKE / 2} ${ARC_H}`}
            fill="none"
            stroke="#E8EDEF"
            strokeWidth={STROKE}
            strokeLinecap="round"
          />

          {/* Progress arc */}
          <motion.path
            d={`M ${STROKE / 2} ${ARC_H} A ${R} ${R} 0 0 1 ${ARC_W - STROKE / 2} ${ARC_H}`}
            fill="none"
            stroke="url(#race-arc-grad)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={SEMI_CIRC}
            initial={{ strokeDashoffset: SEMI_CIRC }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          />

          {/* Flag at end of full arc */}
          <text
            x={ARC_W - STROKE / 2}
            y={ARC_H - STROKE - 4}
            fontSize="14"
            textAnchor="middle"
          >
            🏁
          </text>
        </svg>

        {/* Center percentage */}
        <div className="absolute inset-0 flex items-end justify-center" style={{ paddingBottom: '4px' }}>
          <span
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '24px',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              color: '#1A2B32',
            }}
          >
            {Math.round(pct * 100)}%
          </span>
        </div>
      </div>

      {/* Right: Text info */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <p style={{ fontFamily: "'Merriweather', serif", fontSize: '14px', fontWeight: 700, color: '#1A2B32' }}>
          {mainName}
        </p>
        {subName && (
          <p style={{ fontFamily: "'Merriweather Sans', sans-serif", fontSize: '13px', color: '#6B7B84' }}>
            {subName}
          </p>
        )}
        <p
          style={{
            fontFamily: "'Merriweather Sans', sans-serif",
            fontSize: '12px',
            color: '#8E9BA3',
            marginTop: '2px',
          }}
        >
          {t('raceCountdown.weekProgress', { current: currentWeek, total: totalWeeks, days: daysLeft })}
        </p>
      </div>
    </div>
  );
}
