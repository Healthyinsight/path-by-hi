import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogOut, Watch, Check, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import type { UserProfile } from '@/types/database';

const PHASES = ['base', 'build', 'peak', 'taper'];

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('users').select('*').eq('id', user.id).single()
      .then(({ data }) => { if (data) setProfile(data); });
  }, [user]);

  const update = (field: string, value: string | number) => {
    setProfile((p) => ({ ...p, [field]: value }));
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('users').update({
      name: profile.name, current_weight: Number(profile.current_weight),
      height_cm: Number(profile.height_cm), body_fat_pct: Number(profile.body_fat_pct),
      ftp_watts: Number(profile.ftp_watts), run_threshold_pace: profile.run_threshold_pace,
      vo2max_estimate: Number(profile.vo2max_estimate), training_phase: profile.training_phase,
    }).eq('id', user.id);
    if (error) toast.error('Kunde inte spara');
    else toast.success('Inställningar sparade!');
    setSaving(false);
  };

  return (
    <div className="app-container pt-6">
      <h1 className="mb-6 text-xl tracking-tight">Inställningar</h1>

      <div className="space-y-6">
        {/* User email */}
        <div className="card-athletic">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Inloggad som</p>
              <p className="text-sm font-medium">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Profile */}
        <div className="card-athletic space-y-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Profil</p>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Namn</Label>
              <Input value={profile.name || ''} onChange={(e) => update('name', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Vikt (kg)</Label><Input type="number" value={profile.current_weight || ''} onChange={(e) => update('current_weight', e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Längd (cm)</Label><Input type="number" value={profile.height_cm || ''} onChange={(e) => update('height_cm', e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Kroppsfett %</Label><Input type="number" value={profile.body_fat_pct || ''} onChange={(e) => update('body_fat_pct', e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">FTP (watt)</Label><Input type="number" value={profile.ftp_watts || ''} onChange={(e) => update('ftp_watts', e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Löptempo (min/km)</Label><Input value={profile.run_threshold_pace || ''} onChange={(e) => update('run_threshold_pace', e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">VO2max</Label><Input type="number" value={profile.vo2max_estimate || ''} onChange={(e) => update('vo2max_estimate', e.target.value)} /></div>
            </div>
          </div>
        </div>

        {/* Training Phase */}
        <div className="card-athletic space-y-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Träningsfas</p>
          <div className="flex gap-2">
            {PHASES.map((phase) => (
              <button
                key={phase}
                onClick={() => update('training_phase', phase)}
                className={`touch-target flex-1 rounded-xl border py-2 text-sm font-medium capitalize transition-all duration-200 ${
                  profile.training_phase === phase
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card hover:border-primary/40'
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
              <span className="text-sm text-rest">Ansluten</span>
              <span className="text-xs text-muted-foreground">({profile.garmin_user_id})</span>
            </div>
          ) : (
            <div>
              <Button disabled variant="outline" className="touch-target w-full opacity-50">Anslut Garmin</Button>
              <p className="mt-2 text-xs text-muted-foreground">Garmin-integration kommer snart</p>
            </div>
          )}
        </div>

        {/* Race */}
        <div className="card-athletic">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Tävling</p>
          <p className="mt-1 text-sm font-medium">Ironman 70.3 Jönköping</p>
          <p className="text-sm text-muted-foreground">5 juli 2026</p>
        </div>

        <Button onClick={save} className="w-full touch-target" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Spara inställningar
        </Button>

        <Button onClick={signOut} variant="outline" className="w-full touch-target text-destructive hover:text-destructive">
          <LogOut className="mr-2 h-4 w-4" /> Logga ut
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
