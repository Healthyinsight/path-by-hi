/**
 * Maps `user_profiles.archetype` (quiz / DB string) to the internal schedule planner id.
 * Keep in sync with {@link generateProfileWeeklySchedule} consumers and tests.
 */
export type ScheduleArchetypeId =
  | 'IRONMAN'
  | 'COMPETITOR'
  | 'RECOMP'
  | 'WELLNESS'
  | 'COMEBACK'
  | 'EXPLORER';

export function toScheduleArchetypeId(rawProfileArchetype: string): ScheduleArchetypeId | string {
  const rawArch = (rawProfileArchetype || '').toLowerCase();
  switch (rawArch) {
    case 'triathlon':
    case 'triathlete':
    case 'ironman':
      return 'IRONMAN';
    case 'running':
      return 'COMPETITOR';
    case 'strength':
    case 'weight_loss':
      return 'RECOMP';
    case 'wellness':
      return 'WELLNESS';
    case 'comeback':
      return 'COMEBACK';
    case 'explorer':
      return 'EXPLORER';
    default:
      return rawArch.toUpperCase();
  }
}
