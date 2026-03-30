// MOCK DATA – Replace with Garmin API data when integration is ready

export interface RecoveryData {
  status: 'green' | 'yellow' | 'red';
  score: number;
  sleepHours: number;
  hrvMs: number;
  bodyBattery: number;
  currentStreak: number;
}

const RECOVERY_STATES: RecoveryData[] = [
  {
    status: 'green',
    score: 78,
    sleepHours: 7.2,
    hrvMs: 58,
    bodyBattery: 72,
    currentStreak: 5,
  },
  {
    status: 'yellow',
    score: 52,
    sleepHours: 6.4,
    hrvMs: 42,
    bodyBattery: 55,
    currentStreak: 3,
  },
  {
    status: 'red',
    score: 28,
    sleepHours: 5.1,
    hrvMs: 28,
    bodyBattery: 32,
    currentStreak: 1,
  },
];

export function getStreakMilestone(streak: number): 30 | 14 | 7 | null {
  if (streak >= 30) return 30;
  if (streak >= 14) return 14;
  if (streak >= 7) return 7;
  return null;
}

/** @deprecated use getStreakMilestone + i18n */
export function getStreakMessage(streak: number): string | null {
  const m = getStreakMilestone(streak);
  if (m === 30) return '🏆 EN MÅNAD! Legend.';
  if (m === 14) return '🔥🔥 Två veckor non-stop! Du är unstoppable!';
  if (m === 7) return '🌟 En hel vecka! Otroligt!';
  return null;
}

// MOCK: Returns a deterministic recovery state based on day of month
export function getTodayRecovery(): RecoveryData {
  const dayOfMonth = new Date().getDate();
  const index = dayOfMonth % RECOVERY_STATES.length;
  return RECOVERY_STATES[index];
}
