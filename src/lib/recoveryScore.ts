export interface RecoveryData {
  status: 'green' | 'yellow' | 'red';
  score: number;
  sleepHours: number | null;
  hrvMs: number | null;
  bodyBattery: number | null;
}

export function calculateRecoveryScore(metrics: {
  body_battery: number | null;
  sleep_hours: number | null;
  hrv_rmssd: number | null;
  rhr: number | null;
}): RecoveryData | null {
  if (metrics.body_battery == null && metrics.sleep_hours == null) return null;

  const bb = metrics.body_battery ?? 50;
  const sl = Math.min((metrics.sleep_hours ?? 7) / 9, 1) * 100;
  const hasHrv = metrics.hrv_rmssd != null;
  const hrv = hasHrv ? Math.min(Math.max((metrics.hrv_rmssd! - 20) / 60, 0), 1) * 100 : 50;
  const hasRhr = metrics.rhr != null;
  const rhr = hasRhr ? Math.max(0, Math.min((80 - metrics.rhr!) / 40, 1)) * 100 : 50;

  // Redistribute weight for missing signals onto body_battery
  const score = Math.round(
    bb * (0.40 + (!hasHrv ? 0.20 : 0) + (!hasRhr ? 0.10 : 0)) +
    sl * 0.30 +
    (hasHrv ? hrv * 0.20 : 0) +
    (hasRhr ? rhr * 0.10 : 0),
  );

  return {
    score: Math.min(100, Math.max(0, score)),
    status: score >= 70 ? 'green' : score >= 40 ? 'yellow' : 'red',
    sleepHours: metrics.sleep_hours,
    hrvMs: metrics.hrv_rmssd,
    bodyBattery: metrics.body_battery,
  };
}
