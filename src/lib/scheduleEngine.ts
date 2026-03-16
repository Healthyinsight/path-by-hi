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

export type ArchetypeId =
  | 'IRONMAN'
  | 'COMPETITOR'
  | 'RECOMP'
  | 'WELLNESS'
  | 'COMEBACK'
  | 'EXPLORER';

export interface ProfileInput {
  archetype: ArchetypeId | string;
  disciplines: string[] | null;
  goal_date: string | null;
}

const DAY_NAMES_SV = ['måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag', 'söndag'];

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

function archetypeDetails(
  archetype: ArchetypeId | string,
  dayIndex: number,
  sport: string | null
): ScheduleEntry {
  const date = new Date();
  const base: ScheduleEntry = {
    date: fmtDate(date),
    planned_type: 'rest',
    planned_subtype: 'rest',
    planned_sport: sport || 'rest',
    planned_details: '',
  };

  const dayName = DAY_NAMES_SV[dayIndex];

  switch (archetype) {
    case 'IRONMAN': {
      const map = [
        {
          type: 'strength',
          subtype: 'upper_core',
          details: `Styrka – överkropp & core (45–60 min).\nFokus på press, drag och stabilitet för simning och cykling.`,
        },
        {
          type: 'cardio',
          subtype: 'z2_run',
          details:
            'Löpning Zone 2 (45–60 min).\nSnacktempo, jämn andning. Bygg aerob bas utan att bli sliten.',
        },
        {
          type: 'swim',
          subtype: 'technique',
          details:
            'Simning teknik (30–45 min).\nDrillar, lugna längder och fokus på vattenläge, catch och rotation.',
        },
        {
          type: 'cardio',
          subtype: 'z2_bike',
          details:
            'Cykel Zone 2 (60–90 min).\nJämnt tempo, låg puls. Trampa runt lätt men kontrollerat.',
        },
        {
          type: 'strength',
          subtype: 'lower_core',
          details:
            'Styrka – underkropp & core (45–60 min).\nFokus på benstyrka, höfter och bål för löp- och cykelekonomi.',
        },
        {
          type: 'endurance_mix',
          subtype: 'long_run_or_bike',
          details:
            'Långpass (60–90 min löpning eller 90–120 min cykel).\nHåll lugnt tempo, fokus på uthållighet och nutrition.',
        },
        {
          type: 'rest',
          subtype: 'easy_recovery',
          details:
            'Vilodag eller mycket lätt aktivitet (promenad, lugn sim). Din kropp bygger styrka nu – håll det enkelt.',
        },
      ][dayIndex];
      return {
        ...base,
        planned_type: map.type,
        planned_subtype: map.subtype,
        planned_sport: sport || (map.type === 'strength' ? 'strength' : map.type === 'rest' ? 'rest' : 'run'),
        planned_details: `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} – ${map.details}`,
      };
    }
    case 'COMPETITOR': {
      const map = [
        {
          type: 'strength',
          subtype: 'full_body',
          details:
            'Styrka helkropp (45–60 min).\nFokus på basövningar, explosivitet och god teknik.',
        },
        {
          type: 'primary',
          subtype: 'intervals',
          details:
            'Intervallpass i din huvudgren.\nUppvärmning → 4–8 intervaller → nedvarvning. Hög men kontrollerad ansträngning.',
        },
        {
          type: 'secondary',
          subtype: 'easy',
          details:
            'Lätt pass i din sekundära gren (20–40 min).\nSnacktempo, fokus på rörelsekvalitet.',
        },
        {
          type: 'strength',
          subtype: 'full_body',
          details:
            'Styrka helkropp (45–60 min).\nLite tyngre än måndag, men lämna 1–2 reps i tanken.',
        },
        {
          type: 'primary',
          subtype: 'tempo',
          details:
            'Tempopass i din huvudgren (30–50 min effektiv tid).\nStrax under tävlingsfart, jämn och fokuserad ansträngning.',
        },
        {
          type: 'primary',
          subtype: 'long',
          details:
            'Långpass i din huvudgren.\nBygg uthållighet och testa pacing och energiintag.',
        },
        {
          type: 'rest',
          subtype: 'rest',
          details:
            'Vilodag. Fokus på sömn, mat och låg stress. En lugn promenad är ok om det känns bra.',
        },
      ][dayIndex];
      return {
        ...base,
        planned_type: map.type,
        planned_subtype: map.subtype,
        planned_sport: sport || (map.type === 'strength' ? 'strength' : map.type === 'rest' ? 'rest' : 'run'),
        planned_details: `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} – ${map.details}`,
      };
    }
    case 'RECOMP': {
      const map = [
        {
          type: 'strength',
          subtype: 'push',
          details:
            'Push-pass (bröst, axlar, triceps) 45–60 min.\nMedelvikt, kontrollerad teknik, 2–3 set per övning.',
        },
        {
          type: 'cardio',
          subtype: 'z2',
          details:
            'Lugn cardio 30–40 min (gång, cykel eller lätt löpning).\nSyfte: öka energiförbrukning utan att slita.',
        },
        {
          type: 'strength',
          subtype: 'pull',
          details:
            'Pull-pass (rygg, biceps) 45–60 min.\nFokus på kontakt, kontrollerade reps, 2–3 set per övning.',
        },
        {
          type: 'cardio',
          subtype: 'intervals',
          details:
            'Enkel intervallcardio 25–30 min totalt.\nKort uppvärmning → 6–10 snabba intervaller → nedvarvning.',
        },
        {
          type: 'strength',
          subtype: 'legs',
          details:
            'Benpass 45–60 min.\nKnäböj/benpress, höftdominanta övningar och lite bål i slutet.',
        },
        {
          type: 'recovery',
          subtype: 'active',
          details:
            'Aktiv återhämtning (promenad, lätt cykel, yoga) 20–40 min.\nLåg puls, fokus på att må bra i kroppen.',
        },
        {
          type: 'rest',
          subtype: 'rest',
          details:
            'Hel vilodag.\nSov gott, ät bra och ladda mentalt för kommande vecka.',
        },
      ][dayIndex];
      return {
        ...base,
        planned_type: map.type,
        planned_subtype: map.subtype,
        planned_sport: sport || (map.type === 'strength' ? 'strength' : map.type === 'rest' ? 'rest' : 'cardio'),
        planned_details: `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} – ${map.details}`,
      };
    }
    case 'WELLNESS': {
      const map = [
        {
          type: 'strength',
          subtype: 'full_body_short',
          details:
            'Styrka helkropp (ca 30 min).\n2–3 enkla övningar för överkropp, underkropp och core.',
        },
        {
          type: 'cardio',
          subtype: 'walk_light',
          details:
            'Promenad eller lätt cardio (30 min).\nTempo där du kan prata obehindrat.',
        },
        {
          type: 'mobility',
          subtype: 'yoga',
          details:
            'Yoga eller rörlighet (30 min).\nFokusera på höfter, bröstrygg och skuldror.',
        },
        {
          type: 'strength',
          subtype: 'full_body_short',
          details:
            'Styrka helkropp (ca 30 min).\nLätta vikter eller kroppsvikt, fokus på kvalitet före kvantitet.',
        },
        {
          type: 'cardio',
          subtype: 'free_choice',
          details:
            'Valfri kondition (30–45 min): cykel, gång, simning eller gruppklass.\nVälj något som känns kul.',
        },
        {
          type: 'outdoor',
          subtype: 'activity',
          details:
            'Utomhusaktivitet (t.ex. hike, simning, cykel, paddling).\nNjut av att vara ute, inte av att ta ut dig.',
        },
        {
          type: 'rest',
          subtype: 'rest',
          details:
            'Vilodag.\nKänn efter i kroppen, ta en lugn promenad om det känns bra – annars helt fri dag.',
        },
      ][dayIndex];
      return {
        ...base,
        planned_type: map.type,
        planned_subtype: map.subtype,
        planned_sport: sport || (map.type === 'strength' ? 'strength' : map.type === 'rest' ? 'rest' : 'cardio'),
        planned_details: `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} – ${map.details}`,
      };
    }
    case 'COMEBACK': {
      const map = [
        {
          type: 'strength',
          subtype: 'light_full_body',
          details:
            'Lätt styrka helkropp (20–30 min).\nMycket låg belastning, fokus på kontroll och rörelsekvalitet.',
        },
        {
          type: 'cardio',
          subtype: 'easy_walk',
          details:
            'Promenad eller mycket lätt cardio (20–30 min).\nDu ska kunna andas helt obehindrat.',
        },
        {
          type: 'rest',
          subtype: 'full_rest',
          details:
            'Hel vilodag.\nPrioritera sömn och låg stress. Lätt stretching om det känns skönt.',
        },
        {
          type: 'strength',
          subtype: 'light_full_body',
          details:
            'Lätt styrka helkropp (20–30 min).\nUpprepa övningar som kändes bra i måndags.',
        },
        {
          type: 'cardio',
          subtype: 'very_easy',
          details:
            'Mycket lätt cardio (20–30 min): lugn cykel, promenad eller vattenlöpning.\nAllt ska kännas kontrollerat.',
        },
        {
          type: 'outdoor',
          subtype: 'easy_activity',
          details:
            'Längre promenad eller enkel utomhusaktivitet.\nTa pauser ofta och avsluta medan du fortfarande känner dig pigg.',
        },
        {
          type: 'rest',
          subtype: 'full_rest',
          details:
            'Hel vilodag.\nReflektera över hur kroppen känns och justera kommande vecka vid behov.',
        },
      ][dayIndex];
      return {
        ...base,
        planned_type: map.type,
        planned_subtype: map.subtype,
        planned_sport: sport || (map.type === 'strength' ? 'strength' : 'rest'),
        planned_details: `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} – ${map.details}`,
      };
    }
    case 'EXPLORER': {
      const map = [
        {
          type: 'strength',
          subtype: 'explore_strength',
          details:
            'Styrkepass där du testar nya övningar.\nHelkropp, 30–45 min, lugnt tempo och nyfiket fokus.',
        },
        {
          type: 'explore',
          subtype: 'new_sport',
          details:
            'Testa något nytt: klättring, kampsport, dans eller gruppklass.\nMålet är upplevelse, inte prestation.',
        },
        {
          type: 'cardio',
          subtype: 'run_or_bike',
          details:
            'Löpning eller cykel (30–45 min).\nVälj det som känns mest lockande idag.',
        },
        {
          type: 'strength',
          subtype: 'explore_strength',
          details:
            'Styrka igen, men med andra övningar än måndagen.\nKort och lekfullt pass.',
        },
        {
          type: 'swim_or_class',
          subtype: 'group_or_swim',
          details:
            'Simning, gruppklass eller annan social aktivitet.\nTräning som känns mer som lek än som “jobb”.',
        },
        {
          type: 'outdoor',
          subtype: 'adventure',
          details:
            'Utomhusäventyr: vandring, cykeltur, paddling eller liknande.\nUtforska en ny plats om du kan.',
        },
        {
          type: 'rest',
          subtype: 'rest',
          details:
            'Vilodag.\nKänn efter vad du gillade mest den här veckan och vad du vill göra mer av.',
        },
      ][dayIndex];
      return {
        ...base,
        planned_type: map.type,
        planned_subtype: map.subtype,
        planned_sport:
          sport ||
          (map.type === 'strength'
            ? 'strength'
            : map.type === 'rest'
            ? 'rest'
            : map.type === 'cardio'
            ? 'run'
            : 'cardio'),
        planned_details: `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} – ${map.details}`,
      };
    }
    default:
      return makeRestEntry(date, 'Vilodag – lyssna på kroppen och ladda om.');
  }
}

/**
 * Generate a 7‑day schedule for a given profile starting from the provided date.
 * The start date is treated as "day 0" (vanligen måndag).
 */
export function generateProfileWeeklySchedule(
  profile: ProfileInput,
  startDate: Date
): ScheduleEntry[] {
  const archetype = (profile.archetype || '').toUpperCase() as ArchetypeId | string;
  const disciplines = profile.disciplines || [];

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
    let entry = archetypeDetails(archetype, i, sport);
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
          date: formatDate(d),
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
