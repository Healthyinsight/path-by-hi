import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen } from 'lucide-react';
import type { Insight } from '@/data/mockInsights';

const typeStyles: Record<Insight['type'], { bg: string; border: string }> = {
  positive: { bg: 'bg-secondary/15', border: 'bg-secondary' },
  warning: { bg: 'bg-warning/15', border: 'bg-warning' },
  suggestion: { bg: 'bg-primary/15', border: 'bg-primary' },
  milestone: { bg: 'bg-accent/30', border: 'bg-accent' },
};

export function InsightCard({ insight }: { insight: Insight }) {
  const navigate = useNavigate();
  const styles = typeStyles[insight.type];

  return (
    <div className="card-glass relative overflow-hidden">
      {/* Top gradient accent */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${styles.border}`} />

      <div className="flex items-start gap-3 pt-1">
        {/* Icon circle */}
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${styles.bg}`}>
          <span className="text-lg">{insight.icon}</span>
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <p className="font-semibold text-sm leading-tight">{insight.title}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{insight.body}</p>

          {insight.source && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground">
              <BookOpen className="h-2.5 w-2.5" />
              {insight.source}
            </span>
          )}

          {insight.action && (
            <Button
              variant="ghost"
              size="sm"
              className="px-0 h-auto text-xs text-primary hover:text-primary/80 gap-1"
              onClick={() => insight.action?.route && navigate(insight.action.route)}
            >
              {insight.action.label}
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
