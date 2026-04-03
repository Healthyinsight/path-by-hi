import { describe, expect, it } from 'vitest';
import { toScheduleArchetypeId } from './archetypeScheduleMapping';

describe('toScheduleArchetypeId', () => {
  it('maps quiz DB archetypes to schedule ids', () => {
    expect(toScheduleArchetypeId('triathlon')).toBe('IRONMAN');
    expect(toScheduleArchetypeId('strength')).toBe('RECOMP');
    expect(toScheduleArchetypeId('running')).toBe('COMPETITOR');
    expect(toScheduleArchetypeId('weight_loss')).toBe('RECOMP');
    expect(toScheduleArchetypeId('wellness')).toBe('WELLNESS');
  });

  it('uppercases unknown values', () => {
    expect(toScheduleArchetypeId('custom_tag')).toBe('CUSTOM_TAG');
  });
});
