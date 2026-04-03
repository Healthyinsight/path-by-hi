/**
 * Single reference for where `user_profiles` fields are populated.
 * Onboarding mapper must only write columns marked `onboarding`; do not clear integration-only fields on upsert without merging.
 */
export type ProfileFieldOrigin = 'onboarding' | 'settings' | 'garmin' | 'system' | 'unused';

export const USER_PROFILE_FIELD_ORIGINS: Record<string, ProfileFieldOrigin> = {
  id: 'system',
  user_id: 'onboarding',
  created_at: 'system',
  updated_at: 'system',
  display_name: 'onboarding',
  trail_name: 'onboarding',
  archetype: 'onboarding',
  disciplines: 'onboarding',
  level: 'onboarding',
  training_days_per_week: 'onboarding',
  goal_name: 'onboarding',
  goal_date: 'onboarding',
  goal_emoji: 'onboarding',
  weight: 'onboarding',
  target_weight: 'onboarding',
  body_fat_pct: 'settings',
  height_cm: 'settings',
  equipment: 'onboarding',
  has_injuries: 'onboarding',
  wellness_focuses: 'onboarding',
  show_nutrition: 'onboarding',
  show_race_countdown: 'onboarding',
  show_recomp: 'onboarding',
  onboarding_completed: 'onboarding',
};
