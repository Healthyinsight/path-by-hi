export interface ReadinessBreakdown {
  training: number;
  nutrition: number;
  consistency: number;
  bodyComp: number;
  total: number;
}

interface ScheduleEntry {
  date: string;
  completed: boolean | null;
  planned_type: string;
}

interface NutritionEntry {
  date: string;
  actual_kcal: number | null;
  target_kcal: number | null;
}

interface BodyMetric {
  date: string;
  weight: number | null;
}

export function calculateReadiness(
  scheduleEntries: ScheduleEntry[],
  nutritionEntries: NutritionEntry[],
  bodyMetrics: BodyMetric[],
  goalDate: string,
  targetWeight = 79,
): ReadinessBreakdown {
  const today = new Date();
  const goal = new Date(goalDate);
  const totalDays = Math.max(1, Math.ceil((goal.getTime() - today.getTime()) / 86400000) + scheduleEntries.length);

  // Only consider entries up to today
  const todayStr = today.toISOString().split('T')[0];
  const pastSchedule = scheduleEntries.filter(s => s.date <= todayStr);
  const pastNutrition = nutritionEntries.filter(n => n.date <= todayStr);

  // 1. Training Compliance (40%)
  const planned = pastSchedule.length;
  const completed = pastSchedule.filter(s => s.completed).length;
  const training = planned > 0 ? Math.min(100, Math.round((completed / planned) * 100)) : 0;

  // 2. Nutrition Adherence (25%) - days within 85-115% of target
  let goodNutritionDays = 0;
  for (const n of pastNutrition) {
    if (n.target_kcal && n.target_kcal > 0 && n.actual_kcal) {
      const ratio = n.actual_kcal / n.target_kcal;
      if (ratio >= 0.85 && ratio <= 1.15) goodNutritionDays++;
    }
  }
  const nutrition = pastNutrition.length > 0 ? Math.min(100, Math.round((goodNutritionDays / pastNutrition.length) * 100)) : 0;

  // 3. Consistency (20%) - current streak + gap penalty
  let currentStreak = 0;
  const sortedSchedule = [...pastSchedule].sort((a, b) => b.date.localeCompare(a.date));
  for (const s of sortedSchedule) {
    if (s.completed) currentStreak++;
    else break;
  }
  // Expected streak at this point (rough: 5 days per week)
  const weeksIn = Math.max(1, pastSchedule.length / 7);
  const expectedStreak = Math.min(7, Math.round(weeksIn * 2));
  let consistencyScore = Math.min(100, Math.round((currentStreak / Math.max(1, expectedStreak)) * 100));

  // Penalize gaps > 3 days
  let maxGap = 0;
  let gapCount = 0;
  for (const s of sortedSchedule) {
    if (!s.completed) gapCount++;
    else { maxGap = Math.max(maxGap, gapCount); gapCount = 0; }
  }
  if (maxGap > 3) consistencyScore = Math.max(0, consistencyScore - (maxGap - 3) * 10);
  const consistency = Math.max(0, Math.min(100, consistencyScore));

  // 4. Body Composition (15%) - trending toward target
  let bodyComp = 70; // default
  if (bodyMetrics.length >= 2) {
    const sorted = [...bodyMetrics].filter(m => m.weight).sort((a, b) => a.date.localeCompare(b.date));
    if (sorted.length >= 2) {
      const first = sorted[0].weight!;
      const last = sorted[sorted.length - 1].weight!;
      if (last <= first && last >= targetWeight) {
        bodyComp = Math.min(100, 70 + Math.round(((first - last) / (first - targetWeight + 0.1)) * 30));
      } else if (last > first) {
        bodyComp = Math.max(30, 70 - Math.round((last - first) * 5));
      }
    }
  }
  bodyComp = Math.max(0, Math.min(100, bodyComp));

  const total = Math.min(100, Math.round(
    training * 0.4 + nutrition * 0.25 + consistency * 0.2 + bodyComp * 0.15
  ));

  return { training, nutrition, consistency, bodyComp, total };
}

export function getReadinessColor(score: number): string {
  if (score <= 40) return 'hsl(var(--destructive))';
  if (score <= 65) return 'hsl(var(--warning))';
  if (score <= 85) return 'hsl(var(--primary))';
  return 'hsl(var(--success))';
}
