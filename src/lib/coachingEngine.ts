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

export type CoachingMessage = {
  emoji: string;
  messageKey: string;
  params?: Record<string, string | number | undefined>;
};

function fmtDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function getDailyCoachingMessage(
  schedule: ScheduleEntry[],
  nutrition: NutritionEntry[],
  goal: GoalInfo,
  today: ScheduleEntry | null,
): CoachingMessage {
  const todayStr = fmtDate(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = fmtDate(yesterdayDate);

  const sorted = [...schedule].filter((s) => s.date <= todayStr).sort((a, b) => b.date.localeCompare(a.date));

  let streak = 0;
  for (const s of sorted) {
    if (s.completed) streak++;
    else break;
  }

  const recent3 = sorted.filter((s) => s.date < todayStr).slice(0, 3);
  const allRecentCompleted = recent3.length >= 3 && recent3.every((s) => s.completed);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  const nextScheduled = schedule.filter((s) => s.date === fmtDate(tomorrow) || s.date === fmtDate(dayAfter));
  const noRestSoon = nextScheduled.length > 0 && nextScheduled.every((s) => s.planned_type !== 'rest');

  if (allRecentCompleted && noRestSoon) {
    return { emoji: '🧘', messageKey: 'coaching.hardBlock', params: { days: recent3.length } };
  }

  if (streak >= 14) {
    return { emoji: '💪', messageKey: 'coaching.streak14', params: { streak } };
  }
  if (streak >= 7) {
    return { emoji: '🔥', messageKey: 'coaching.streak7', params: { streak } };
  }

  const yesterday = sorted.find((s) => s.date === yesterdayStr);
  if (yesterday && !yesterday.completed) {
    const sportKey = today?.planned_sport || 'run';
    return { emoji: '💪', messageKey: 'coaching.missed', params: { sportKey } };
  }

  const yesterdayNut = nutrition.find((n) => n.date === yesterdayStr);
  if (yesterdayNut) {
    if (
      yesterdayNut.target_protein &&
      yesterdayNut.actual_protein &&
      yesterdayNut.actual_protein < yesterdayNut.target_protein * 0.8
    ) {
      return {
        emoji: '🥩',
        messageKey: 'coaching.proteinLow',
        params: { actual: yesterdayNut.actual_protein, target: yesterdayNut.target_protein },
      };
    }
    if (yesterdayNut.target_kcal && yesterdayNut.actual_kcal && yesterdayNut.actual_kcal < yesterdayNut.target_kcal * 0.7) {
      const ydSched = schedule.find((s) => s.date === yesterdayStr);
      if (ydSched?.planned_subtype === 'long_distance') {
        return { emoji: '⚡', messageKey: 'coaching.underfuelLong' };
      }
    }
  }

  const milestones: { pct: number; labelKey: string }[] = [
    { pct: 25, labelKey: 'm25' },
    { pct: 50, labelKey: 'm50' },
    { pct: 75, labelKey: 'm75' },
    { pct: 90, labelKey: 'm90' },
  ];
  for (const m of milestones) {
    if (goal.progressPct < m.pct) {
      const totalDays = goal.daysRemaining / (1 - goal.progressPct / 100);
      const daysToMilestone = Math.round(((m.pct - goal.progressPct) / 100) * totalDays);
      if (daysToMilestone <= 3 && daysToMilestone >= 0) {
        return {
          emoji: '🏔️',
          messageKey: 'coaching.milestoneSoon',
          params: { days: daysToMilestone, labelKey: m.labelKey },
        };
      }
      break;
    }
  }

  if (goal.daysRemaining <= 7) {
    return {
      emoji: '🏆',
      messageKey: 'coaching.raceWeek',
      params: { goalName: goal.goalName, days: goal.daysRemaining },
    };
  }
  if (goal.daysRemaining <= 30) {
    return {
      emoji: '🏁',
      messageKey: 'coaching.raceMonth',
      params: { goalName: goal.goalName, days: goal.daysRemaining },
    };
  }

  if (today) {
    const key = `${today.planned_type}_${today.planned_subtype}_${today.planned_sport}`;
    const trainingMsgs: Record<string, { emoji: string; messageKey: string }> = {
      'strength_upper_': { emoji: '💪', messageKey: 'coaching.strengthUpper' },
      'strength_lower_': { emoji: '🦵', messageKey: 'coaching.strengthLower' },
      cardio_long_distance_bike: { emoji: '🚴', messageKey: 'coaching.longBike' },
      cardio_long_distance_run: { emoji: '🏃', messageKey: 'coaching.longRun' },
      cardio_vo2max_bike: { emoji: '⚡', messageKey: 'coaching.vo2Bike' },
      cardio_vo2max_run: { emoji: '🫁', messageKey: 'coaching.vo2Run' },
      swim_long_swim_swim: { emoji: '🏊', messageKey: 'coaching.longSwim' },
      swim_technique_intervals_swim: { emoji: '🏊', messageKey: 'coaching.swimTech' },
      rest__: { emoji: '😴', messageKey: 'coaching.restDay' },
    };
    const hit = trainingMsgs[key] || trainingMsgs[`${today.planned_type}_${today.planned_subtype}_`];
    if (hit) return { emoji: hit.emoji, messageKey: hit.messageKey };
  }

  return { emoji: '🏔️', messageKey: 'coaching.default' };
}
