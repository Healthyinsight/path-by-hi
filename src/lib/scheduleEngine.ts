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

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
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
        date: formatDate(d),
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
            date: formatDate(d),
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
            date: formatDate(d),
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
