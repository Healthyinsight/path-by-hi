import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BottomNav } from '@/components/BottomNav';
import { Scale, Percent, Heart, Activity } from 'lucide-react';
import type { BodyMetric } from '@/types/database';

export default function Progress() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<BodyMetric | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('body_metrics').select('*').eq('user_id', user.id)
      .order('date', { ascending: false }).limit(1).single()
      .then(({ data }) => { if (data) setMetrics(data); });
  }, [user]);

  const stats = [
    { label: 'Vikt', value: metrics?.weight, unit: 'kg', icon: Scale },
    { label: 'Kroppsfett', value: metrics?.body_fat_pct, unit: '%', icon: Percent },
    { label: 'VO2max', value: metrics?.vo2max_run, unit: '', icon: Activity },
    { label: 'Vilopuls', value: metrics?.resting_hr, unit: 'bpm', icon: Heart },
  ];

  return (
    <div className="app-container pt-6">
      <h1 className="mb-2 text-xl tracking-tight">Progress</h1>
      <div className="tip-callout mb-6">
        <p className="text-sm text-primary">Trendgrafer och analytics kommer i nästa fas</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, unit, icon: Icon }) => (
          <div key={label} className="card-athletic flex flex-col items-center gap-2 py-6">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <span className="stat-number">{value ?? '–'}</span>
            <span className="text-xs text-muted-foreground">
              {label} {unit && `(${unit})`}
            </span>
          </div>
        ))}
      </div>

      {metrics && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Senast uppdaterad: {new Date(metrics.date).toLocaleDateString('sv-SE')}
        </p>
      )}

      <BottomNav />
    </div>
  );
}
