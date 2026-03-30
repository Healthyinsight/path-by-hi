import type { TFunction } from 'i18next';
import type { KnowledgeRule } from '@/hooks/useInsights';

/** Synthetic rule when no knowledge_rules match — same shape as DB rows for InsightCard. */
export function buildFallbackTodayInsight(t: TFunction): KnowledgeRule {
  return {
    id: 'fallback-today-tip',
    trigger_type: 'always',
    trigger_condition: {},
    category: 'training',
    severity: 'positive',
    insight_title: t('today.fallbackInsight.title'),
    insight_body: t('today.fallbackInsight.body'),
    action_text: t('today.fallbackInsight.action'),
    source_name: 'Healthy Insight',
    source_url: null,
    applicable_archetypes: ['wellness', 'ironman', 'recomp'],
    applicable_disciplines: ['run', 'bike', 'swim', 'strength'],
    priority: 0,
    is_active: true,
  };
}
