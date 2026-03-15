import { getTodayRecovery, type RecoveryData } from '@/data/mockRecoveryData';

const statusStyles: Record<RecoveryData['status'], { border: string; bg: string; dot: string }> = {
  green: {
    border: 'border-rest/40',
    bg: 'bg-rest/5',
    dot: 'bg-rest',
  },
  yellow: {
    border: 'border-warning/40',
    bg: 'bg-warning/5',
    dot: 'bg-warning',
  },
  red: {
    border: 'border-destructive/40',
    bg: 'bg-destructive/5',
    dot: 'bg-destructive',
  },
};

export function RecoveryCard() {
  const recovery = getTodayRecovery();
  const styles = statusStyles[recovery.status];

  return (
    <div className={`card-athletic border-2 ${styles.border} ${styles.bg} space-y-3`}>
      <div className="flex items-center gap-2">
        <span className={`h-3 w-3 rounded-full ${styles.dot}`} />
        <h3 className="text-base font-bold">{recovery.statusLabel}</h3>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">{recovery.summary}</p>

      <div className="flex gap-4 text-xs text-muted-foreground font-data-num">
        <span>Sömn {recovery.sleepHours}h</span>
        <span>HRV {recovery.hrvMs}ms</span>
        <span>Body Battery {recovery.bodyBattery}</span>
      </div>

      <p className="text-[11px] italic text-muted-foreground">
        Mock-data – Garmin-synk kommer snart
      </p>
    </div>
  );
}
