import { supabase } from '@/integrations/supabase/client';
import type { InsightWithReason } from '@/hooks/useInsights';

interface FormatContext {
  user_name: string;
  archetype: string;
  training_phase: string | null;
  today_training: { type: string; subtype: string | null; sport: string | null } | null;
  today_metrics: { body_battery: number | null; sleep_hours: number | null } | null;
  days_to_goal: number | null;
  goal_name: string | null;
}

export async function formatInsights(
  insights: InsightWithReason[],
  context: FormatContext,
): Promise<InsightWithReason[]> {
  if (insights.length === 0) return insights;

  const { data, error } = await supabase.functions.invoke('format-insights', {
    body: {
      insights: insights.map((r) => ({
        id: r.id,
        insight_title: r.insight_title,
        insight_body: r.insight_body,
        category: r.category,
        severity: r.severity,
      })),
      context,
    },
  });

  if (error || !data?.formatted) return insights;

  return insights.map((rule) => {
    const f = (data.formatted as { id: string; insight_body: string }[]).find(
      (x) => x.id === rule.id,
    );
    return f ? { ...rule, insight_body: f.insight_body } : rule;
  });
}
