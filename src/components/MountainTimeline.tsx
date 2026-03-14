import { useMemo } from 'react';

interface MountainTimelineProps {
  goalName: string;
  goalEmoji: string;
  goalDate: string;
  completedWorkouts: number;
  totalWorkouts: number;
  rotatingStat: string;
}

const MILESTONES = [
  { pct: 25, label: 'Grundfas klar', emoji: '🏋️' },
  { pct: 50, label: 'Halvvägs!', emoji: '⚡' },
  { pct: 75, label: 'Race-form', emoji: '🔥' },
  { pct: 90, label: 'Taper', emoji: '🧘' },
];

// Path points along the mountain trail (x%, y%) 
const PATH_POINTS = [
  { x: 5, y: 88 },
  { x: 15, y: 78 },
  { x: 25, y: 70 },
  { x: 35, y: 60 },
  { x: 45, y: 52 },
  { x: 55, y: 42 },
  { x: 65, y: 34 },
  { x: 75, y: 24 },
  { x: 85, y: 16 },
  { x: 95, y: 8 },
];

function getPointOnPath(pct: number): { x: number; y: number } {
  const progress = Math.max(0, Math.min(1, pct / 100));
  const idx = progress * (PATH_POINTS.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.min(PATH_POINTS.length - 1, lower + 1);
  const t = idx - lower;
  return {
    x: PATH_POINTS[lower].x + (PATH_POINTS[upper].x - PATH_POINTS[lower].x) * t,
    y: PATH_POINTS[lower].y + (PATH_POINTS[upper].y - PATH_POINTS[lower].y) * t,
  };
}

export function MountainTimeline({
  goalName, goalEmoji, goalDate, completedWorkouts, totalWorkouts, rotatingStat,
}: MountainTimelineProps) {
  const today = new Date();
  const goal = new Date(goalDate);
  // Assume training started ~16 weeks before goal
  const trainingStart = new Date(goal);
  trainingStart.setDate(trainingStart.getDate() - 16 * 7);
  const totalDays = Math.max(1, (goal.getTime() - trainingStart.getTime()) / 86400000);
  const elapsed = Math.max(0, (today.getTime() - trainingStart.getTime()) / 86400000);
  const progressPct = Math.min(100, (elapsed / totalDays) * 100);
  const daysLeft = Math.max(0, Math.ceil((goal.getTime() - today.getTime()) / 86400000));

  const currentPos = useMemo(() => getPointOnPath(progressPct), [progressPct]);

  const pathD = PATH_POINTS.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="card-athletic mb-4 overflow-hidden">
      <div className="relative" style={{ height: 200 }}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="mountainGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="hsl(195 50% 94%)" />
              <stop offset="100%" stopColor="hsl(210 20% 98%)" />
            </linearGradient>
          </defs>
          {/* Mountain shape */}
          <polygon
            points="0,100 20,65 35,50 50,35 65,22 80,12 95,5 100,3 100,100"
            fill="url(#mountainGrad)"
            stroke="hsl(195 38% 50%)"
            strokeWidth="0.5"
          />
          {/* Trail path */}
          <path d={pathD} fill="none" stroke="hsl(147 12% 57%)" strokeWidth="0.8" strokeDasharray="2 1.5" opacity="0.7" />
          {/* Milestone flags */}
          {MILESTONES.map((m) => {
            const pos = getPointOnPath(m.pct);
            const passed = progressPct >= m.pct;
            return (
              <g key={m.pct}>
                <line x1={pos.x} y1={pos.y} x2={pos.x} y2={pos.y - 6} stroke={passed ? 'hsl(195 38% 50%)' : 'hsl(200 12% 75%)'} strokeWidth="0.4" />
                <circle cx={pos.x} cy={pos.y - 6} r="1.5" fill={passed ? 'hsl(195 38% 50%)' : 'hsl(210 14% 95%)'} stroke={passed ? 'hsl(195 38% 50%)' : 'hsl(200 12% 75%)'} strokeWidth="0.3" />
              </g>
            );
          })}
          {/* Goal at peak */}
          <circle cx={95} cy={8} r="2" fill="hsl(72 65% 70%)" stroke="hsl(195 38% 50%)" strokeWidth="0.4" />
          {/* Current position - pulsating dot */}
          <circle cx={currentPos.x} cy={currentPos.y} r="2.5" fill="hsl(195 38% 50%)" opacity="0.3">
            <animate attributeName="r" values="2.5;4;2.5" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={currentPos.x} cy={currentPos.y} r="1.8" fill="hsl(195 38% 50%)" />
        </svg>

        {/* Milestone labels */}
        {MILESTONES.map((m) => {
          const pos = getPointOnPath(m.pct);
          const passed = progressPct >= m.pct;
          return (
            <div
              key={m.pct}
              className={`absolute text-[8px] leading-tight ${passed ? 'text-primary font-medium' : 'text-muted-foreground/60'}`}
              style={{ left: `${pos.x}%`, top: `${Math.max(2, pos.y - 18)}%`, transform: 'translateX(-50%)' }}
            >
              <span>{m.emoji}</span>
            </div>
          );
        })}

        {/* Goal label at peak */}
        <div className="absolute text-[9px] font-medium text-primary" style={{ right: '2%', top: '2%' }}>
          {goalEmoji}
        </div>

        {/* "Du är här" label */}
        <div
          className="absolute flex items-center gap-0.5"
          style={{ left: `${currentPos.x + 3}%`, top: `${currentPos.y - 2}%`, transform: 'translateY(-50%)' }}
        >
          <span className="whitespace-nowrap rounded-full bg-primary/10 px-1.5 py-0.5 text-[8px] font-medium text-primary">
            Du är här
          </span>
        </div>
      </div>

      {/* Stats overlay */}
      <div className="flex items-center justify-between border-t border-border pt-3">
        <div>
          <p className="stat-number text-primary">{daysLeft}</p>
          <p className="text-[10px] text-muted-foreground">dagar kvar</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">{rotatingStat}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-lg font-bold">{completedWorkouts}/{totalWorkouts}</p>
          <p className="text-[10px] text-muted-foreground">pass genomförda</p>
        </div>
      </div>
    </div>
  );
}
