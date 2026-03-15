// MOCK DATA – Replace with Garmin API data when integration is ready

export interface RecoveryData {
  status: 'green' | 'yellow' | 'red';
  score: number;
  statusLabel: string;
  statusAdvice: string;
  summary: string;
  sleepHours: number;
  hrvMs: number;
  bodyBattery: number;
  currentStreak: number;
}

const RECOVERY_STATES: RecoveryData[] = [
  {
    status: 'green',
    score: 78,
    statusLabel: 'Redo – Kör som planerat',
    statusAdvice: 'Alla system go. Dags att prestera!',
    summary: 'Du sov 7.2h med bra djupsömn. HRV stabil. Kör som planerat.',
    sleepHours: 7.2,
    hrvMs: 58,
    bodyBattery: 72,
    currentStreak: 5,
  },
  {
    status: 'yellow',
    score: 52,
    statusLabel: 'Måttlig – Lyssna på kroppen',
    statusAdvice: 'Du kan träna men anpassa intensiteten.',
    summary: 'Sömnen var okej men HRV lite lägre än vanligt. Undvik maxinsatser idag.',
    sleepHours: 6.4,
    hrvMs: 42,
    bodyBattery: 55,
    currentStreak: 3,
  },
  {
    status: 'red',
    score: 28,
    statusLabel: 'Vila – Prioritera återhämtning',
    statusAdvice: 'Kroppen behöver vila. Byt till lättare aktivitet.',
    summary: 'Dålig sömn och låg HRV. Prioritera återhämtning idag – promenad eller yoga.',
    sleepHours: 5.1,
    hrvMs: 28,
    bodyBattery: 32,
    currentStreak: 1,
  },
];

// MOCK: streak milestone messages
export function getStreakMessage(streak: number): string | null {
  if (streak >= 30) return '🏆 EN MÅNAD! Legend.';
  if (streak >= 14) return '🔥🔥 Två veckor non-stop! Du är unstoppable!';
  if (streak >= 7) return '🌟 En hel vecka! Otroligt!';
  return null;
}

// MOCK: Returns a deterministic recovery state based on day of month
export function getTodayRecovery(): RecoveryData {
  const dayOfMonth = new Date().getDate();
  const index = dayOfMonth % RECOVERY_STATES.length;
  return RECOVERY_STATES[index];
}
