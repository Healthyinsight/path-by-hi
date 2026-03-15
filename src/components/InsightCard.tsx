import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { Insight } from '@/data/mockInsights';

const borderColors: Record<Insight['type'], string> = {
  positive: 'border-l-secondary',
  warning: 'border-l-warning',
  suggestion: 'border-l-primary',
  milestone: 'border-l-accent',
};

export function InsightCard({ insight }: { insight: Insight }) {
  const navigate = useNavigate();

  return (
    <div
      className={`card-athletic border-l-4 ${borderColors[insight.type]} space-y-2`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl">{insight.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{insight.title}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{insight.body}</p>
          {insight.source && (
            <p className="text-[11px] italic text-muted-foreground mt-1">📖 {insight.source}</p>
          )}
          {insight.action && (
            <Button
              variant="link"
              size="sm"
              className="px-0 h-auto mt-1 text-xs"
              onClick={() => insight.action?.route && navigate(insight.action.route)}
            >
              {insight.action.label} →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
