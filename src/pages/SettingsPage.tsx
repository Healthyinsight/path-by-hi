import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogOut, Watch, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { UserProfile } from '@/types/database';

const PHASES = ['base', 'build', 'peak', 'taper'];

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data);
      });
  }, [user]);

  const update = (field: string, value: string | number) => {
    setProfile((p) => ({ ...p, [field]: value }));
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('users')
      .update({
        name: profile.name,
        current_weight: Number(profile.current_weight),
        height_cm: Number(profile.height_cm),
        body_fat_pct: Number(profile.body_fat_pct),
        ftp_watts: Number(profile.ftp_watts),
        run_threshold_pace: profile.run_threshold_pace,
        vo2max_estimate: Number(profile.vo2max_estimate),
        training_phase: profile.training_phase,
      })
      .eq('id', user.id);

    if (error) toast.error('Failed to save');
    else toast.success('Settings saved!');
    setSaving(false);
  };

  return (
    <div className="app-container pt-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Settings</h1>

      <div className="space-y-6">
        {/* Profile */}
        <div className="card-athletic space-y-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Profile</p>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input value={profile.name || ''} onChange={(e) => update('name', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Weight (kg)</Label>
                <Input type="number" value={profile.current_weight || ''} onChange={(e) => update('current_weight', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Height (cm)</Label>
                <Input type="number" value={profile.height_cm || ''} onChange={(e) => update('height_cm', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Body Fat %</Label>
                <Input type="number" value={profile.body_fat_pct || ''} onChange={(e) => update('body_fat_pct', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">FTP (watts)</Label>
                <Input type="number" value={profile.ftp_watts || ''} onChange={(e) => update('ftp_watts', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Run Pace (min/km)</Label>
                <Input value={profile.run_threshold_pace || ''} onChange={(e) => update('run_threshold_pace', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">VO2max</Label>
                <Input type="number" value={profile.vo2max_estimate || ''} onChange={(e) => update('vo2max_estimate', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Training Phase */}
        <div className="card-athletic space-y-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Training Phase</p>
          <div className="flex gap-2">
            {PHASES.map((phase) => (
              <button
                key={phase}
                onClick={() => update('training_phase', phase)}
                className={`touch-target flex-1 rounded-xl border py-2 text-sm font-medium capitalize transition-colors ${
                  profile.training_phase === phase
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card'
                }`}
              >
                {phase}
              </button>
            ))}
          </div>
        </div>

        {/* Garmin */}
        <div className="card-athletic space-y-3">
          <div className="flex items-center gap-2">
            <Watch className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Garmin Connect</p>
          </div>
          {profile.garmin_user_id ? (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-rest" />
              <span className="text-sm text-rest">Connected</span>
              <span className="text-xs text-muted-foreground">({profile.garmin_user_id})</span>
            </div>
          ) : (
            <div>
              <Button disabled variant="outline" className="touch-target w-full opacity-50">
                Connect Garmin
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                Garmin integration coming soon – will be added after initial setup
              </p>
            </div>
          )}
        </div>

        {/* Race */}
        <div className="card-athletic">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Race</p>
          <p className="mt-1 text-sm font-medium">Ironman 70.3 Jönköping</p>
          <p className="text-sm text-muted-foreground">July 5, 2026</p>
        </div>

        <Button onClick={save} className="w-full touch-target" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>

        <Button onClick={signOut} variant="outline" className="w-full touch-target text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
