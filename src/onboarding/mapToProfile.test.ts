import { describe, expect, it } from 'vitest';
import type { Database } from '@/integrations/supabase/types';
import i18n from '@/i18n/config';
import { mapQuizStateToSaveBundle, ONBOARDING_PROFILE_PAYLOAD_KEYS } from './mapToProfile';
import { initialQuizState } from './quizTypes';

type Insert = Database['public']['Tables']['user_profiles']['Insert'];

describe('mapQuizStateToSaveBundle', () => {
  const tSv = i18n.getFixedT('sv');

  it('throws when archetype missing', () => {
    expect(() => mapQuizStateToSaveBundle('u1', { ...initialQuizState }, tSv)).toThrow(/archetype/);
  });

  it('maps triathlon half to expected profile and goal (Swedish)', () => {
    const state = {
      ...initialQuizState,
      display_name: 'A',
      archetype: 'triathlon' as const,
      tri_distance: 'half' as const,
      has_race: false as const,
      tri_level: 'intermediate' as const,
    };
    const { profile, goal, displayNameForUsersTable } = mapQuizStateToSaveBundle('user-1', state, tSv);
    expect(profile.user_id).toBe('user-1');
    expect(profile.archetype).toBe('triathlon');
    expect(profile.goal_name).toBe('Ironman 70.3');
    expect(profile.disciplines).toEqual(['swim', 'bike', 'run', 'strength']);
    expect(profile.onboarding_completed).toBe(true);
    expect(goal.goal_name).toBe(profile.goal_name);
    expect(goal.disciplines).toEqual(profile.disciplines);
    expect(displayNameForUsersTable).toBe('A');
  });

  it('maps strength path with equipment and training days', () => {
    const state = {
      ...initialQuizState,
      display_name: 'B',
      archetype: 'strength' as const,
      equipment: 'full_gym' as const,
      has_injuries: 'no' as const,
      strength_days: 3,
    };
    const { profile } = mapQuizStateToSaveBundle('u2', state, tSv);
    expect(profile.archetype).toBe('strength');
    expect(profile.equipment).toBe('full_gym');
    expect(profile.disciplines).toEqual(['strength']);
    expect(profile.training_days_per_week).toBe(3);
    expect(profile.has_injuries).toBeNull();
    expect(profile.goal_name).toBe('Bli starkare');
  });

  it('payload keys are assignable to user_profiles Insert keys', () => {
    const keys: (keyof Insert)[] = [...ONBOARDING_PROFILE_PAYLOAD_KEYS];
    expect(keys).toContain('user_id');
    expect(keys).toContain('archetype');
  });

  it('uses English strings when t is English', () => {
    const tEn = i18n.getFixedT('en');
    const state = {
      ...initialQuizState,
      archetype: 'strength' as const,
      equipment: 'full_gym' as const,
      has_injuries: 'no' as const,
      strength_days: 4,
    };
    const { profile } = mapQuizStateToSaveBundle('u', state, tEn);
    expect(profile.goal_name).toBe('Get stronger');
  });
});
