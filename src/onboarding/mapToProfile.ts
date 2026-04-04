import type { TFunction } from 'i18next';
import type { Database } from '@/integrations/supabase/types';
import type { Archetype, QuizState } from './quizTypes';

type UserProfilesInsert = Database['public']['Tables']['user_profiles']['Insert'];
type UserGoalsInsert = Database['public']['Tables']['user_goals']['Insert'];

function addMonths(months: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d;
}

function fmtDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

/**
 * Maps completed quiz answers to rows written in Onboarding `handleFinish`.
 * Pass the active `t` so persisted goal names match the user’s language.
 */
export function mapQuizStateToSaveBundle(
  userId: string,
  state: QuizState,
  t: TFunction,
): {
  profile: UserProfilesInsert;
  goal: Pick<UserGoalsInsert, 'user_id' | 'goal_name' | 'goal_date' | 'goal_emoji' | 'disciplines'>;
  displayNameForUsersTable: string;
} {
  const arch = state.archetype;
  if (!arch) {
    throw new Error('mapQuizStateToSaveBundle: archetype is required');
  }

  let goal_name = '';
  let goal_date = fmtDateStr(addMonths(3));
  let goal_emoji = '✨';
  let level = 'intermediate';
  let disciplines: string[] = ['run', 'strength'];
  let training_days = 4;
  let show_nutrition = true;
  let show_race_countdown = false;
  let show_recomp = false;
  let weight: number | null = null;
  let target_weight: number | null = null;
  let has_injuries: string | null = null;
  let equipment = 'full_gym';
  let wellness_focuses: string[] | null = null;

  if (arch === 'triathlon') {
    const triDist = state.tri_distance;
    goal_name =
      state.has_race && state.race_name
        ? state.race_name
        : triDist
          ? t(`onboarding.defaults.triathlonDist.${triDist}`)
          : t('onboarding.defaults.triathlonGoalFallback');
    goal_date = state.has_race && state.race_date ? fmtDateStr(state.race_date) : fmtDateStr(addMonths(6));
    goal_emoji = '🏊';
    disciplines = ['swim', 'bike', 'run', 'strength'];
    show_race_countdown = true;
    const levelMap: Record<string, { level: string; days: number }> = {
      beginner: { level: 'beginner', days: 4 },
      intermediate: { level: 'intermediate', days: 5 },
      advanced: { level: 'advanced', days: 6 },
    };
    const lm = levelMap[state.tri_level] || levelMap.intermediate;
    level = lm.level;
    training_days = lm.days;
  } else if (arch === 'running') {
    const runDist = state.run_distance;
    goal_name =
      state.run_has_race && state.run_race_name
        ? state.run_race_name
        : runDist
          ? t(`onboarding.defaults.runningDist.${runDist}`)
          : t('onboarding.defaults.runningGoalFallback');
    goal_date =
      state.run_has_race && state.run_race_date
        ? fmtDateStr(state.run_race_date)
        : fmtDateStr(addMonths(4));
    goal_emoji = '🏃';
    disciplines = ['run', 'strength'];
    show_race_countdown = !!state.run_has_race;
    const freqMap: Record<string, { level: string; days: number }> = {
      low: { level: 'beginner', days: 3 },
      medium: { level: 'intermediate', days: 4 },
      high: { level: 'advanced', days: 5 },
    };
    const fm = freqMap[state.run_frequency] || freqMap.medium;
    level = fm.level;
    training_days = fm.days;
  } else if (arch === 'strength') {
    goal_name = t('onboarding.defaults.goalStrength');
    goal_emoji = '💪';
    disciplines = ['strength'];
    show_race_countdown = false;
    show_nutrition = true;
    equipment = state.equipment || equipment;
    has_injuries = state.has_injuries === 'yes' ? state.injury_text : null;
    training_days = state.strength_days;
    level = 'intermediate';
  } else if (arch === 'weight_loss') {
    goal_name = t('onboarding.defaults.goalWeightLoss');
    goal_emoji = '🎯';
    goal_date = fmtDateStr(addMonths(4));
    disciplines = ['run', 'strength'];
    show_recomp = true;
    show_nutrition = true;
    weight = state.weight ? Number(state.weight) : null;
    target_weight = state.target_weight
      ? Number(state.target_weight)
      : weight
        ? weight * 0.9
        : null;
    const actMap: Record<string, { level: string; days: number; disc: string[] }> = {
      regular: { level: 'intermediate', days: 4, disc: ['run', 'strength'] },
      sometimes: { level: 'beginner', days: 3, disc: ['run', 'strength'] },
      none: { level: 'beginner', days: 3, disc: ['strength'] },
    };
    const am = actMap[state.wl_activity] || actMap.sometimes;
    level = am.level;
    training_days = am.days;
    disciplines = am.disc;
  } else if (arch === 'wellness') {
    goal_name = t('onboarding.defaults.goalWellness');
    goal_emoji = '🌿';
    goal_date = fmtDateStr(addMonths(3));
    show_race_countdown = false;
    wellness_focuses = state.wellness_focuses;
    show_nutrition = state.wellness_focuses.includes('kost');
    const discMap: string[] = [];
    if (state.wellness_focuses.includes('rörelse')) discMap.push('run');
    if (state.wellness_focuses.includes('kost')) discMap.push('strength');
    if (discMap.length === 0) discMap.push('run');
    disciplines = discMap;
    const actMap: Record<string, { level: string; days: number }> = {
      sedentary: { level: 'beginner', days: 3 },
      light: { level: 'intermediate', days: 4 },
      active: { level: 'intermediate', days: 5 },
    };
    const wm = actMap[state.wellness_activity] || actMap.light;
    level = wm.level;
    training_days = wm.days;
  } else if (arch === 'custom') {
    goal_name = state.custom_goal;
    goal_emoji = '✨';
    goal_date =
      state.custom_no_date || !state.custom_date
        ? fmtDateStr(addMonths(3))
        : fmtDateStr(state.custom_date);
    const remap: Record<string, Archetype> = {
      endurance: 'running',
      strength: 'strength',
      weight_loss: 'weight_loss',
      wellness: 'wellness',
    };
    const mapped = remap[state.custom_archetype] || 'wellness';
    if (mapped === 'running') {
      disciplines = ['run', 'strength'];
      show_race_countdown = true;
    } else if (mapped === 'strength') {
      disciplines = ['strength'];
    } else if (mapped === 'weight_loss') {
      disciplines = ['run', 'strength'];
      show_recomp = true;
      show_nutrition = true;
    } else {
      disciplines = ['run', 'strength'];
    }
  }

  const profile: UserProfilesInsert = {
    user_id: userId,
    display_name: state.display_name,
    trail_name: state.trail_name || null,
    archetype: arch,
    goal_name,
    goal_date,
    goal_emoji,
    level,
    disciplines,
    training_days_per_week: training_days,
    weight,
    target_weight,
    body_fat_pct: null,
    has_injuries,
    equipment,
    show_nutrition,
    show_race_countdown,
    show_recomp,
    onboarding_completed: true,
    wellness_focuses: wellness_focuses,
  };

  return {
    profile,
    goal: {
      user_id: userId,
      goal_name: profile.goal_name || t('common.defaultGoalName'),
      goal_date: profile.goal_date,
      goal_emoji: profile.goal_emoji,
      disciplines: profile.disciplines,
    },
    displayNameForUsersTable: state.display_name,
  };
}

export const ONBOARDING_PROFILE_PAYLOAD_KEYS = [
  'user_id',
  'display_name',
  'trail_name',
  'archetype',
  'goal_name',
  'goal_date',
  'goal_emoji',
  'level',
  'disciplines',
  'training_days_per_week',
  'weight',
  'target_weight',
  'body_fat_pct',
  'has_injuries',
  'equipment',
  'show_nutrition',
  'show_race_countdown',
  'show_recomp',
  'onboarding_completed',
  'wellness_focuses',
] as const satisfies readonly (keyof UserProfilesInsert)[];
