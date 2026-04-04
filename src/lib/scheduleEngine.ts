import { toScheduleArchetypeId, type ScheduleArchetypeId } from './archetypeScheduleMapping';
import {
  formatScheduleProfileDetail,
  getScheduleProfileBody,
  SCHEDULE_PROFILE_DEFAULT_REST,
  type ScheduleProfileLang,
} from './scheduleProfileBodies';

export type { ScheduleProfileLang } from './scheduleProfileBodies';

export interface RotatorState {
  dayTypeIndex: number;       // 0=cardio, 1=strength
  cardioSportIndex: number;   // 0=bike, 1=run
  bikeTypeIndex: number;      // 0=long_distance, 1=vo2max
  runTypeIndex: number;       // 0=long_distance, 1=vo2max
  strengthTypeIndex: number;  // 0=upper, 1=lower
  swimTypeIndex: number;      // 0=long_swim, 1=technique_intervals
  longSwimCount: number;      // tracks progression for long swim distances
}

export interface ScheduleEntry {
  date: string;
  planned_type: string;
  planned_subtype: string;
  planned_sport: string;
  planned_details: string;
}

export const DEFAULT_ROTATOR: RotatorState = {
  dayTypeIndex: 0,
  cardioSportIndex: 0,
  bikeTypeIndex: 0,
  runTypeIndex: 0,
  strengthTypeIndex: 0,
  swimTypeIndex: 0,
  longSwimCount: 0,
};

// -------------------------------
// Archetype‑driven weekly planner
// -------------------------------

export type ArchetypeId = ScheduleArchetypeId;

export interface ProfileInput {
  archetype: ArchetypeId | string;
  disciplines: string[] | null;
  goal_date: string | null;
}

function fmtDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function pickDiscipline(preferred: string[], disciplines: string[] | null): string | null {
  if (!disciplines || disciplines.length === 0) return preferred[0] || null;
  for (const p of preferred) {
    if (disciplines.includes(p)) return p;
  }
  return disciplines[0] || null;
}

function makeRestEntry(date: Date, label: string): ScheduleEntry {
  return {
    date: fmtDate(date),
    planned_type: 'rest',
    planned_subtype: 'rest',
    planned_sport: 'rest',
    planned_details: label,
  };
}

const IRONMAN_META = [
  { type: 'strength', subtype: 'upper_core' },
  { type: 'cardio', subtype: 'z2_run' },
  { type: 'swim', subtype: 'technique' },
  { type: 'cardio', subtype: 'z2_bike' },
  { type: 'strength', subtype: 'lower_core' },
  { type: 'endurance_mix', subtype: 'long_run_or_bike' },
  { type: 'rest', subtype: 'easy_recovery' },
] as const;

const COMPETITOR_META = [
  { type: 'strength', subtype: 'full_body' },
  { type: 'primary', subtype: 'intervals' },
  { type: 'secondary', subtype: 'easy' },
  { type: 'strength', subtype: 'full_body' },
  { type: 'primary', subtype: 'tempo' },
  { type: 'primary', subtype: 'long' },
  { type: 'rest', subtype: 'rest' },
] as const;

const RECOMP_META = [
  { type: 'strength', subtype: 'push' },
  { type: 'cardio', subtype: 'z2' },
  { type: 'strength', subtype: 'pull' },
  { type: 'cardio', subtype: 'intervals' },
  { type: 'strength', subtype: 'legs' },
  { type: 'recovery', subtype: 'active' },
  { type: 'rest', subtype: 'rest' },
] as const;

const WELLNESS_META = [
  { type: 'strength', subtype: 'full_body_short' },
  { type: 'cardio', subtype: 'walk_light' },
  { type: 'mobility', subtype: 'yoga' },
  { type: 'strength', subtype: 'full_body_short' },
  { type: 'cardio', subtype: 'free_choice' },
  { type: 'outdoor', subtype: 'activity' },
  { type: 'rest', subtype: 'rest' },
] as const;

const COMEBACK_META = [
  { type: 'strength', subtype: 'light_full_body' },
  { type: 'cardio', subtype: 'easy_walk' },
  { type: 'rest', subtype: 'full_rest' },
  { type: 'strength', subtype: 'light_full_body' },
  { type: 'cardio', subtype: 'very_easy' },
  { type: 'outdoor', subtype: 'easy_activity' },
  { type: 'rest', subtype: 'full_rest' },
] as const;

const EXPLORER_META = [
  { type: 'strength', subtype: 'explore_strength' },
  { type: 'explore', subtype: 'new_sport' },
  { type: 'cardio', subtype: 'run_or_bike' },
  { type: 'strength', subtype: 'explore_strength' },
  { type: 'swim_or_class', subtype: 'group_or_swim' },
  { type: 'outdoor', subtype: 'adventure' },
  { type: 'rest', subtype: 'rest' },
] as const;

function sportIronmanCompetitor(sport: string | null, mapType: string): string {
  return sport || (mapType === 'strength' ? 'strength' : mapType === 'rest' ? 'rest' : 'run');
}

function sportRecompWellness(sport: string | null, mapType: string): string {
  return sport || (mapType === 'strength' ? 'strength' : mapType === 'rest' ? 'rest' : 'cardio');
}

function sportComeback(sport: string | null, mapType: string): string {
  return sport || (mapType === 'strength' ? 'strength' : 'rest');
}

function sportExplorer(sport: string | null, mapType: string): string {
  return (
    sport ||
    (mapType === 'strength' ? 'strength' : mapType === 'rest' ? 'rest' : mapType === 'cardio' ? 'run' : 'cardio')
  );
}

function archetypeDetails(
  archetype: ArchetypeId | string,
  dayIndex: number,
  sport: string | null,
  lang: ScheduleProfileLang,
): ScheduleEntry {
  const date = new Date();
  const base: ScheduleEntry = {
    date: fmtDate(date),
    planned_type: 'rest',
    planned_subtype: 'rest',
    planned_sport: sport || 'rest',
    planned_details: '',
  };

  switch (archetype) {
    case 'IRONMAN': {
      const map = IRONMAN_META[dayIndex];
      const body = getScheduleProfileBody(lang, 'IRONMAN', dayIndex) ?? '';
      return {
        ...base,
        planned_type: map.type,
        planned_subtype: map.subtype,
        planned_sport: sportIronmanCompetitor(sport, map.type),
        planned_details: formatScheduleProfileDetail(lang, dayIndex, body),
      };
    }
    case 'COMPETITOR': {
      const map = COMPETITOR_META[dayIndex];
      const body = getScheduleProfileBody(lang, 'COMPETITOR', dayIndex) ?? '';
      return {
        ...base,
        planned_type: map.type,
        planned_subtype: map.subtype,
        planned_sport: sportIronmanCompetitor(sport, map.type),
        planned_details: formatScheduleProfileDetail(lang, dayIndex, body),
      };
    }
    case 'RECOMP': {
      const map = RECOMP_META[dayIndex];
      const body = getScheduleProfileBody(lang, 'RECOMP', dayIndex) ?? '';
      return {
        ...base,
        planned_type: map.type,
        planned_subtype: map.subtype,
        planned_sport: sportRecompWellness(sport, map.type),
        planned_details: formatScheduleProfileDetail(lang, dayIndex, body),
      };
    }
    case 'WELLNESS': {
      const map = WELLNESS_META[dayIndex];
      const body = getScheduleProfileBody(lang, 'WELLNESS', dayIndex) ?? '';
      return {
        ...base,
        planned_type: map.type,
        planned_subtype: map.subtype,
        planned_sport: sportRecompWellness(sport, map.type),
        planned_details: formatScheduleProfileDetail(lang, dayIndex, body),
      };
    }
    case 'COMEBACK': {
      const map = COMEBACK_META[dayIndex];
      const body = getScheduleProfileBody(lang, 'COMEBACK', dayIndex) ?? '';
      return {
        ...base,
        planned_type: map.type,
        planned_subtype: map.subtype,
        planned_sport: sportComeback(sport, map.type),
        planned_details: formatScheduleProfileDetail(lang, dayIndex, body),
      };
    }
    case 'EXPLORER': {
      const map = EXPLORER_META[dayIndex];
      const body = getScheduleProfileBody(lang, 'EXPLORER', dayIndex) ?? '';
      return {
        ...base,
        planned_type: map.type,
        planned_subtype: map.subtype,
        planned_sport: sportExplorer(sport, map.type),
        planned_details: formatScheduleProfileDetail(lang, dayIndex, body),
      };
    }
    default:
      return makeRestEntry(date, SCHEDULE_PROFILE_DEFAULT_REST[lang]);
  }
}

/**
 * Generate a 7‑day schedule for a given profile starting from the provided date.
 * The start date is treated as "day 0" (vanligen måndag).
 */
export function generateProfileWeeklySchedule(
  profile: ProfileInput,
  startDate: Date,
  lang: ScheduleProfileLang = 'sv',
): ScheduleEntry[] {
  const rawArch = (profile.archetype || '').toLowerCase();
  const archetype: ArchetypeId | string = toScheduleArchetypeId(profile.archetype || '');
  const disciplines = profile.disciplines || [];

  // Debug logging to verify profile-driven schedule generation
  // eslint-disable-next-line no-console
  console.log('[scheduleEngine] generateProfileWeeklySchedule', {
    rawArch,
    archetype,
    disciplines,
    startDate: fmtDate(startDate),
  });

  const entries: ScheduleEntry[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);

    let preferred: string[] = [];
    switch (archetype) {
      case 'IRONMAN':
        preferred = ['swim', 'bike', 'run', 'strength'];
        break;
      case 'COMPETITOR':
        preferred = i === 2 ? disciplines.slice(1) : disciplines.slice(0, 1);
        if (preferred.length === 0) preferred = disciplines;
        if (preferred.length === 0) preferred = ['run'];
        break;
      case 'RECOMP':
        preferred = i === 1 || i === 3 ? ['run', 'bike', 'walk'] : ['strength'];
        break;
      case 'WELLNESS':
        preferred = ['walk', 'run', 'bike', 'swim', 'strength'];
        break;
      case 'COMEBACK':
        preferred = i === 0 || i === 3 ? ['strength'] : ['walk', 'run', 'bike'];
        break;
      case 'EXPLORER':
        preferred = ['run', 'bike', 'swim', 'strength', 'climb', 'martial_arts', 'dance'];
        break;
      default:
        preferred = disciplines.length ? disciplines : ['run'];
        break;
    }

    const sport = pickDiscipline(preferred, disciplines);
    let entry = archetypeDetails(archetype, i, sport, lang);
    entry = { ...entry, date: fmtDate(d) };
    entries.push(entry);
  }

  return entries;
}

const WORKOUT_DETAILS: Record<string, string> = {
  bike_long_distance:
    '60-120 min Zone 2 (140-165W). Lugnt tempo, aerob basbyggnad. RPE 3-4.',
  bike_vo2max:
    'Uppvärmning 15 min Z2 → 4-6 × 4 min @ 250-270W (vila 3 min lätt tramp) → Nedvarvning 10 min Z1-2. Mål: Öka VO2max.',
  run_long_distance:
    '45-90 min Zone 2 (5:15-5:45/km, puls ~130-145). Konversationstempo, aerob bas.',
  run_vo2max:
    'Uppvärmning 15 min Z2 → 4-6 × 3 min @ 4:00-4:15/km (vila 2-3 min lätt jogg) → Nedvarvning 10 min Z1-2. Mål: Öka VO2max.',
  strength_upper:
    'Bröst: Hantelpress (flat bänk) 3×12-15, Incline hantelpress 3×12-15\nRygg: Chest-supported row 3×12-15, Lat pulldown 3×12-15, Cable face pull 3×12-15\nAxlar: Seated hantelpress (ryggstöd) 3×12-15, Sidolyft 3×12-15\nBiceps: Seated incline curl 3×12-15\nTriceps: Triceps pushdown 3×12-15\nCore: Pallof press 3×12/sida, Dead bugs 3×12/sida',
  strength_lower:
    'Quadriceps: Benpress (leg press) 3×12-15, Leg extension 3×12-15\nHamstrings & Glutes: Liggande bencurl 3×12-15, Hip thrust 3×12-15\nVader: Calf raises stående 3×12-15, Calf raises sittande 3×12-15\nCore: Plankan 3×45-60s, Side plank 3×30s/sida',
  swim_technique_intervals:
    'Uppvärmning 200m → Teknikblock 20 min (4×50m catch-up drill, 4×50m fingertip drag, 4×25m sighting drill) → Intervaller 6-10 × 50-100m hård (vila 20s) → Nedvarvning 100-200m',
};

function getLongSwimDetails(count: number): string {
  const distances = [800, 1000, 1200, 1400, 1600, 1800, 2000];
  const idx = Math.min(count, distances.length - 1);
  const dist = distances[idx];
  if (count === 0) return `Kontinuerligt ${dist}m - hitta ditt tempo`;
  if (dist >= 2000) return `Kontinuerligt ${dist}m+ (race distance)`;
  return `Kontinuerligt ${dist}m (+200m)`;
}

export function generateSchedule(
  startDate: Date,
  weeks: number,
  state: RotatorState = { ...DEFAULT_ROTATOR }
): { entries: ScheduleEntry[]; finalState: RotatorState } {
  const entries: ScheduleEntry[] = [];
  const s = { ...state };
  const totalDays = weeks * 7;

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dayOfWeek = d.getDay(); // 0=Sun

    if (dayOfWeek === 0) {
      // Sunday → swim
      const swimTypes = ['long_swim', 'technique_intervals'] as const;
      const subtype = swimTypes[s.swimTypeIndex % 2];
      const details =
        subtype === 'long_swim'
          ? getLongSwimDetails(s.longSwimCount)
          : WORKOUT_DETAILS.swim_technique_intervals;

      entries.push({
        date: fmtDate(d),
        planned_type: 'swim',
        planned_subtype: subtype,
        planned_sport: 'swim',
        planned_details: details,
      });

      if (subtype === 'long_swim') s.longSwimCount++;
      s.swimTypeIndex++;
    } else {
      // Mon-Sat
      const isCardio = s.dayTypeIndex % 2 === 0;

      if (isCardio) {
        const sports = ['bike', 'run'] as const;
        const sport = sports[s.cardioSportIndex % 2];

        if (sport === 'bike') {
          const subtypes = ['long_distance', 'vo2max'] as const;
          const subtype = subtypes[s.bikeTypeIndex % 2];
          entries.push({
        date: fmtDate(d),
            planned_type: 'cardio',
            planned_subtype: subtype,
            planned_sport: 'bike',
            planned_details: WORKOUT_DETAILS[`bike_${subtype}`],
          });
          s.bikeTypeIndex++;
        } else {
          const subtypes = ['long_distance', 'vo2max'] as const;
          const subtype = subtypes[s.runTypeIndex % 2];
          entries.push({
        date: fmtDate(d),
            planned_type: 'cardio',
            planned_subtype: subtype,
            planned_sport: 'run',
            planned_details: WORKOUT_DETAILS[`run_${subtype}`],
          });
          s.runTypeIndex++;
        }
        s.cardioSportIndex++;
      } else {
        const subtypes = ['upper', 'lower'] as const;
        const subtype = subtypes[s.strengthTypeIndex % 2];
        entries.push({
          date: fmtDate(d),
          planned_type: 'strength',
          planned_subtype: subtype,
          planned_sport: 'strength',
          planned_details: WORKOUT_DETAILS[`strength_${subtype}`],
        });
        s.strengthTypeIndex++;
      }
      s.dayTypeIndex++;
    }
  }

  return { entries, finalState: s };
}
