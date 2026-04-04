import type { Archetype } from './quizTypes';

export type QuizStepName =
  | 'name'
  | 'goal'
  | 'tri_distance'
  | 'tri_race'
  | 'tri_level'
  | 'run_distance'
  | 'run_race'
  | 'run_frequency'
  | 'str_equipment'
  | 'str_injuries'
  | 'str_days'
  | 'wl_weight'
  | 'wl_target'
  | 'wl_activity'
  | 'well_focus'
  | 'well_activity'
  | 'cust_describe'
  | 'cust_map'
  | 'cust_date'
  | 'summary'
  | 'trail_name';

const baseSteps: QuizStepName[] = ['name', 'goal'];

export function getStepsForArchetype(archetype: Archetype | ''): QuizStepName[] {
  if (archetype === 'triathlon') {
    return [...baseSteps, 'tri_distance', 'tri_race', 'tri_level', 'summary', 'trail_name'];
  }
  if (archetype === 'running') {
    return [...baseSteps, 'run_distance', 'run_race', 'run_frequency', 'summary', 'trail_name'];
  }
  if (archetype === 'strength') {
    return [...baseSteps, 'str_equipment', 'str_injuries', 'str_days', 'summary', 'trail_name'];
  }
  if (archetype === 'weight_loss') {
    return [...baseSteps, 'wl_weight', 'wl_target', 'wl_activity', 'summary', 'trail_name'];
  }
  if (archetype === 'wellness') {
    return [...baseSteps, 'well_focus', 'well_activity', 'summary', 'trail_name'];
  }
  if (archetype === 'custom') {
    return [...baseSteps, 'cust_describe', 'cust_map', 'cust_date', 'summary', 'trail_name'];
  }
  return baseSteps;
}

/** Logical keys only; labels from i18n `onboarding.goals.*`. */
export const GOAL_OPTIONS = [
  { key: 'triathlon' as const, emoji: '🏊' },
  { key: 'running' as const, emoji: '🏃' },
  { key: 'strength' as const, emoji: '💪' },
  { key: 'weight_loss' as const, emoji: '🎯' },
  { key: 'wellness' as const, emoji: '🌿' },
  { key: 'custom' as const, emoji: '✨' },
];

export const TRI_DISTANCE_KEYS = ['sprint', 'olympic', 'half', 'full'] as const;

export const TRI_LEVEL_OPTIONS = [
  { key: 'beginner' as const, emoji: '🌱' },
  { key: 'intermediate' as const, emoji: '📊' },
  { key: 'advanced' as const, emoji: '🔥' },
];

export const RUN_DISTANCE_KEYS = ['5k', '10k', 'half', 'marathon', 'ultra'] as const;

export const RUN_FREQUENCY_OPTIONS = [
  { key: 'low' as const, emoji: '🌱' },
  { key: 'medium' as const, emoji: '📊' },
  { key: 'high' as const, emoji: '🔥' },
];

export const STRENGTH_EQUIPMENT_OPTIONS = [
  { key: 'full_gym' as const, emoji: '🏋️' },
  { key: 'home_gym' as const, emoji: '🏠' },
  { key: 'bodyweight' as const, emoji: '🧘' },
];

export const WL_ACTIVITY_OPTIONS = [
  { key: 'regular' as const, emoji: '💪' },
  { key: 'sometimes' as const, emoji: '🚶' },
  { key: 'none' as const, emoji: '❌' },
];

export const WELLNESS_FOCUS_OPTIONS = [
  { key: 'rörelse' as const, emoji: '🏃' },
  { key: 'kost' as const, emoji: '🍎' },
  { key: 'sömn' as const, emoji: '😴' },
  { key: 'stress' as const, emoji: '🧘' },
];

export const WELLNESS_ACTIVITY_OPTIONS = [
  { key: 'sedentary' as const },
  { key: 'light' as const },
  { key: 'active' as const },
];

export const CUSTOM_MAP_OPTIONS = [
  { key: 'endurance' as const, emoji: '🏃' },
  { key: 'strength' as const, emoji: '💪' },
  { key: 'weight_loss' as const, emoji: '🎯' },
  { key: 'wellness' as const, emoji: '🌿' },
];

/** Stable selectors for E2E; keys match quiz option keys where applicable. */
export const onboardingTestId = {
  goal: (key: Archetype) => `onboarding-goal-${key}`,
  triDistance: (key: string) => `onboarding-tri-distance-${key}`,
  triLevel: (key: string) => `onboarding-tri-level-${key}`,
  runDistance: (key: string) => `onboarding-run-distance-${key}`,
  runFrequency: (key: string) => `onboarding-run-frequency-${key}`,
  strengthEquipment: (key: string) => `onboarding-strength-equipment-${key}`,
  strengthInjuryNo: () => 'onboarding-strength-injury-no',
  strengthInjuryYes: () => 'onboarding-strength-injury-yes',
  strengthDays: (days: number) => `onboarding-strength-days-${days}`,
  wlActivity: (key: string) => `onboarding-wl-activity-${key}`,
  wellnessFocus: (key: string) => `onboarding-wellness-focus-${key}`,
  wellnessActivity: (key: string) => `onboarding-wellness-activity-${key}`,
  customMap: (key: string) => `onboarding-custom-map-${key}`,
  triRaceYes: () => 'onboarding-tri-race-yes',
  triRaceNo: () => 'onboarding-tri-race-no',
  runRaceYes: () => 'onboarding-run-race-yes',
  runRaceNo: () => 'onboarding-run-race-no',
} as const;
