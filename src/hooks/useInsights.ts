import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { UserProfile } from '@/services/profileService';

export interface KnowledgeRule {
  id: string;
  trigger_type: string;
  trigger_condition: Record<string, any>;
  category: 'recovery' | 'training' | 'nutrition';
  severity: 'positive' | 'info' | 'warning';
  insight_title: string;
  insight_body: string;
  action_text: string | null;
  source_name: string | null;
  source_url: string | null;
  applicable_archetypes: string[];
  applicable_disciplines: string[];
  priority: number;
  is_active: boolean;
}

const fmtDate = (d: Date) => d.toISOString().split('T')[0];

interface TodayMetrics {
  body_battery: number | null;
  sleep_hours: number | null;
  sleep_quality_score: number | null;
  hrv_rmssd: number | null;
}

export function useInsights(profile: UserProfile | null) {
  const { user } = useAuth();
  const [rules, setRules] = useState<KnowledgeRule[]>([]);
  const [todayTraining, setTodayTraining] = useState<{ planned_type: string; planned_subtype: string | null } | null>(null);
  const [todayMetrics, setTodayMetrics] = useState<TodayMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch rules + today's training + today's resolved metrics in parallel
  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const today = fmtDate(new Date());

    Promise.all([
      supabase
        .from('knowledge_rules' as any)
        .select('*')
        .eq('is_active', true),
      supabase
        .from('training_schedule')
        .select('planned_type, planned_subtype')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle(),
      (supabase as any)
        .from('daily_metrics_resolved')
        .select('body_battery, sleep_hours, sleep_quality_score, hrv_rmssd')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle(),
    ]).then(([rulesRes, trainingRes, metricsRes]) => {
      if (rulesRes.data) setRules(rulesRes.data as unknown as KnowledgeRule[]);
      if (trainingRes.data) setTodayTraining(trainingRes.data);
      if (metricsRes.data) setTodayMetrics(metricsRes.data as TodayMetrics);
      setLoading(false);
    });
  }, [user]);

  const insights = useMemo(() => {
    if (!profile || rules.length === 0) return [];

    const userArchetype = profile.archetype || 'wellness';
    const userDisciplines = profile.disciplines || ['run', 'strength'];
    const goalDate = profile.goal_date;

    return rules
      .filter((rule) => {
        // Filter by archetype
        if (!rule.applicable_archetypes.includes(userArchetype)) return false;

        // Filter by disciplines — at least one overlap
        const hasOverlap = rule.applicable_disciplines.some((d) => userDisciplines.includes(d));
        if (!hasOverlap) return false;

        // Evaluate trigger
        const cond = rule.trigger_condition || {};

        switch (rule.trigger_type) {
          case 'training_type_today': {
            if (!todayTraining) return false;
            const matchType = cond.match_type;
            return (
              todayTraining.planned_type === matchType ||
              todayTraining.planned_subtype === matchType
            );
          }

          case 'time_of_day': {
            const hour = new Date().getHours();
            if (cond.period === 'morning') return hour >= 5 && hour < 10;
            if (cond.period === 'evening') return hour >= 17 && hour < 22;
            return false;
          }

          case 'days_to_goal': {
            if (!goalDate) return false;
            const daysLeft = Math.ceil(
              (new Date(goalDate).getTime() - Date.now()) / 86400000
            );
            const threshold = cond.threshold as number;
            const op = cond.operator as string;
            if (op === '<=') return daysLeft <= threshold;
            if (op === '>=') return daysLeft >= threshold;
            if (op === '<') return daysLeft < threshold;
            if (op === '>') return daysLeft > threshold;
            return false;
          }

          case 'always':
            return true;

          case 'body_battery_low': {
            const bb = todayMetrics?.body_battery;
            return bb != null && bb < (cond.threshold as number);
          }

          case 'body_battery_high': {
            const bb = todayMetrics?.body_battery;
            return bb != null && bb >= (cond.threshold as number);
          }

          case 'sleep_deficit': {
            const sh = todayMetrics?.sleep_hours;
            return sh != null && sh < (cond.threshold as number);
          }

          default:
            return false;
        }
      })
      .sort((a, b) => b.priority - a.priority);
  }, [rules, profile, todayTraining, todayMetrics]);

  return { insights, loading };
}
