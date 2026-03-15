import { useNavigate } from 'react-router-dom';
import type { Insight } from '@/data/mockInsights';

const typeStyles: Record<Insight['type'], { circleBg: string; iconColor: string; accent: string }> = {
  positive: { circleBg: 'rgba(131, 159, 141, 0.15)', iconColor: '#839F8D', accent: '#839F8D' },
  warning: { circleBg: 'rgba(245, 158, 11, 0.15)', iconColor: '#D97706', accent: '#D97706' },
  suggestion: { circleBg: 'rgba(80, 149, 172, 0.15)', iconColor: '#5095AC', accent: '#5095AC' },
  milestone: { circleBg: 'rgba(212, 230, 124, 0.2)', iconColor: '#8BA83E', accent: '#D4E67C' },
};

export function InsightCard({ insight }: { insight: Insight }) {
  const navigate = useNavigate();
  const s = typeStyles[insight.type];

  return (
    <div className="card-glass relative overflow-hidden">
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0"
        style={{ height: '2px', background: s.accent, borderRadius: '16px 16px 0 0' }}
      />

      <div className="flex items-start gap-3 pt-1">
        {/* Icon circle */}
        <div
          className="flex-shrink-0 flex items-center justify-center"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: s.circleBg,
          }}
        >
          <span style={{ fontSize: '18px' }}>{insight.icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <p style={{ fontFamily: "'Merriweather', serif", fontSize: '15px', fontWeight: 600, color: '#1A2B32' }}>
            {insight.title}
          </p>
          <p style={{ fontFamily: "'Merriweather Sans', sans-serif", fontSize: '13px', color: '#3D4F58', lineHeight: 1.5 }}>
            {insight.body}
          </p>

          {insight.source && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                alignSelf: 'flex-start',
                background: '#F0F4F5',
                borderRadius: '8px',
                padding: '2px 8px',
                fontFamily: "'Merriweather Sans', sans-serif",
                fontSize: '11px',
                color: '#6B7B84',
              }}
            >
              📚 {insight.source}
            </span>
          )}

          {insight.action && (
            <button
              onClick={() => insight.action?.route && navigate(insight.action.route)}
              style={{
                background: 'none',
                border: 'none',
                padding: '6px 0',
                fontFamily: "'Merriweather Sans', sans-serif",
                fontSize: '13px',
                fontWeight: 600,
                color: '#5095AC',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              {insight.action.label} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
