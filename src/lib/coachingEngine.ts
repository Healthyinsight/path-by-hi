interface ScheduleEntry {
  date: string;
  completed: boolean | null;
  planned_type: string;
  planned_subtype: string | null;
  planned_sport: string | null;
}

interface NutritionEntry {
  date: string;
  actual_protein: number | null;
  target_protein: number | null;
  actual_kcal: number | null;
  target_kcal: number | null;
}

interface GoalInfo {
  goalName: string;
  goalDate: string;
  daysRemaining: number;
  progressPct: number;
}

function fmtDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function getDailyCoachingMessage(
  schedule: ScheduleEntry[],
  nutrition: NutritionEntry[],
  goal: GoalInfo,
  today: ScheduleEntry | null,
): { emoji: string; message: string } {
  const todayStr = fmtDate(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = fmtDate(yesterdayDate);

  const sorted = [...schedule].filter(s => s.date <= todayStr).sort((a, b) => b.date.localeCompare(a.date));

  // Current streak
  let streak = 0;
  for (const s of sorted) {
    if (s.completed) streak++;
    else break;
  }

  // Recent completed (last 3 days excluding today)
  const recent3 = sorted.filter(s => s.date < todayStr).slice(0, 3);
  const allRecentCompleted = recent3.length >= 3 && recent3.every(s => s.completed);

  // Next 2 days
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  const nextScheduled = schedule.filter(s => s.date === fmtDate(tomorrow) || s.date === fmtDate(dayAfter));
  const noRestSoon = nextScheduled.length > 0 && nextScheduled.every(s => s.planned_type !== 'rest');

  // P1: Recovery warning
  if (allRecentCompleted && noRestSoon) {
    return { emoji: '🧘', message: `Du har kört hårt i ${recent3.length} dagar. Lyssna på kroppen – en extra vilodag kan göra dig starkare.` };
  }

  // P2: Streak celebration
  if (streak >= 14) {
    return { emoji: '💪', message: `${streak} dagars streak – imponerande dedication! Du bygger en solid bas för Ironman.` };
  }
  if (streak >= 7) {
    return { emoji: '🔥', message: `${streak} dagar i rad! Din disciplin bygger race-fitness varje dag. Fortsätt så.` };
  }

  // P3: Missed workout
  const yesterday = sorted.find(s => s.date === yesterdayStr);
  if (yesterday && !yesterday.completed) {
    const todayType = today?.planned_sport || today?.planned_type || 'passet';
    return { emoji: '💪', message: `Alla missar ett pass ibland. Det som räknas är att du är här idag. Kör dagens ${todayType}!` };
  }

  // P4: Nutrition gap
  const yesterdayNut = nutrition.find(n => n.date === yesterdayStr);
  if (yesterdayNut) {
    if (yesterdayNut.target_protein && yesterdayNut.actual_protein && yesterdayNut.actual_protein < yesterdayNut.target_protein * 0.8) {
      return { emoji: '🥩', message: `Proteinmålet nåddes inte igår (${yesterdayNut.actual_protein}g av ${yesterdayNut.target_protein}g). Prioritera protein idag – det skyddar musklerna under fettförlust.` };
    }
    if (yesterdayNut.target_kcal && yesterdayNut.actual_kcal && yesterdayNut.actual_kcal < yesterdayNut.target_kcal * 0.7) {
      const ydSched = schedule.find(s => s.date === yesterdayStr);
      if (ydSched?.planned_subtype === 'long_distance') {
        return { emoji: '⚡', message: 'Du åt för lite igår för ett långpass. Underfueling skadar prestanda och återhämtning. Fuel up idag!' };
      }
    }
  }

  // P5: Milestone approaching
  const milestones = [
    { pct: 25, label: 'Grundfas klar 🏋️' },
    { pct: 50, label: 'Halvvägs! ⚡' },
    { pct: 75, label: 'Race-form 🔥' },
    { pct: 90, label: 'Taper 🧘' },
  ];
  for (const m of milestones) {
    if (goal.progressPct < m.pct) {
      const totalDays = goal.daysRemaining / (1 - goal.progressPct / 100);
      const daysToMilestone = Math.round((m.pct - goal.progressPct) / 100 * totalDays);
      if (daysToMilestone <= 3 && daysToMilestone >= 0) {
        return { emoji: '🏔️', message: `Om ${daysToMilestone} dagar når du ${m.label}! Du har kommit så långt – varje pass räknas nu.` };
      }
      break;
    }
  }

  // P6: Race countdown
  if (goal.daysRemaining <= 7) {
    return { emoji: '🏆', message: `RACE WEEK! ${goal.goalName} om ${goal.daysRemaining} dagar. Du har gjort jobbet. Nu handlar det om vila, carbs och mental förberedelse.` };
  }
  if (goal.daysRemaining <= 30) {
    return { emoji: '🏁', message: `${goal.daysRemaining} dagar kvar till ${goal.goalName}. Taper-fasen börjar snart – lita på din träning.` };
  }

  // P7: Training type specific
  if (today) {
    const key = `${today.planned_type}_${today.planned_subtype}_${today.planned_sport}`;
    const msgs: Record<string, { emoji: string; message: string }> = {
      'strength_upper_': { emoji: '💪', message: 'Överkroppspass idag. Varje rep bygger stabilitet för simningen och löpningen.' },
      'strength_lower_': { emoji: '🦵', message: 'Benstyrka idag. Starka ben = snabbare km-tider och kraftfullare pedaltramp.' },
      'cardio_long_distance_bike': { emoji: '🚴', message: 'Långpass på cykeln. Bygg din uthållighet – varje km tar dig närmare Jönköping.' },
      'cardio_long_distance_run': { emoji: '🏃', message: 'Långpass löpning. Håll Zone 2, bygg basen. De snabba tiderna kommer som resultat.' },
      'cardio_vo2max_bike': { emoji: '⚡', message: 'VO2max cykling idag. Pusha i intervallerna – det här är passet som höjer taket.' },
      'cardio_vo2max_run': { emoji: '🫁', message: 'VO2max löpning. Intervallerna gör ont men de höjer din syreupptagning direkt.' },
      'swim_long_swim_swim': { emoji: '🏊', message: 'Långsim. Fokus på jämn teknik och andning. Vattentiden bygger din simform.' },
      'swim_technique_intervals_swim': { emoji: '🏊', message: 'Teknik + intervaller i vattnet. Effektiv simteknik sparar energi till cykeln.' },
      'rest__': { emoji: '😴', message: 'Vilodag. Kroppen bygger sig starkare nu. Ät bra, sov gott, och ladda batterierna.' },
    };

    // Try exact match first, then partial
    const exact = msgs[key] || msgs[`${today.planned_type}_${today.planned_subtype}_`];
    if (exact) return exact;
  }

  return { emoji: '🏔️', message: 'Varje dag är ett steg närmare målet. Fortsätt kämpa!' };
}
