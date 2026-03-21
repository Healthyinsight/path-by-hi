import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogOut, Watch, Check, Loader2, Mail, Target, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { UserProfile } from '@/types/database';

const PHASES = ['base', 'build', 'peak', 'taper'];

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { profile: userProfile, refetch: refetchProfile } = useUserProfile();
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [goal, setGoal] = useState<{ goal_name: string; goal_date: string; goal_emoji: string }>({
    goal_name: '', goal_date: '', goal_emoji: '🏁',
  });
  const [saving, setSaving] = useState(false);
  const [savingBody, setSavingBody] = useState(false);
  const [body, setBody] = useState<{
    weight: string;
    height_cm: string;
    target_weight: string;
    body_fat_pct: string;
  }>({ weight: '', height_cm: '', target_weight: '', body_fat_pct: '' });

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('users').select('*').eq('id', user.id).single(),
      supabase.from('user_goals').select('*').eq('user_id', user.id).single(),
    ]).then(([profileRes, goalRes]) => {
      if (profileRes.data) setProfile(profileRes.data);
      if (goalRes.data) setGoal({ goal_name: goalRes.data.goal_name, goal_date: goalRes.data.goal_date, goal_emoji: goalRes.data.goal_emoji || '🏁' });
    });
  }, [user]);

  useEffect(() => {
    if (!userProfile) return;
    setBody({
      weight: userProfile.weight == null ? '' : String(userProfile.weight),
      height_cm: (userProfile as any).height_cm == null ? '' : String((userProfile as any).height_cm),
      target_weight: userProfile.target_weight == null ? '' : String(userProfile.target_weight),
      body_fat_pct: userProfile.body_fat_pct == null ? '' : String(userProfile.body_fat_pct),
    });
  }, [userProfile]);

  const update = (field: string, value: string | number) => {
    setProfile((p) => ({ ...p, [field]: value }));
  };

  const updateBody = (field: keyof typeof body, value: string) => {
    setBody((b) => ({ ...b, [field]: value }));
  };

  const toNumOrNull = (v: string): number | null => {
    const s = v.trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  /** Undvik NaN i Supabase-uppdateringar när Träningsdata-fält är tomma/ofyllda. */
  const toFiniteNumber = (v: unknown): number | null => {
    if (v === '' || v === undefined || v === null) return null;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const saveBodyProfile = async () => {
    if (!user) return;
    setSavingBody(true);
    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authData?.user) {
        toast.error('Kunde inte verifiera inloggning.');
        return;
      }
      const uid = authData.user.id;

      // Uppdatera bara fält användaren faktiskt fyllt i — skicka inte null för tomma inputs
      // (annars nollställs t.ex. vikt när man bara sparar längd, och tvärtom).
      const patch: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (body.weight.trim() !== '') patch.weight = toNumOrNull(body.weight);
      if (body.height_cm.trim() !== '') patch.height_cm = toNumOrNull(body.height_cm);
      if (body.target_weight.trim() !== '') patch.target_weight = toNumOrNull(body.target_weight);
      if (body.body_fat_pct.trim() !== '') patch.body_fat_pct = toNumOrNull(body.body_fat_pct);

      const hasBodyMetric = Object.keys(patch).some((k) => k !== 'updated_at');
      if (!hasBodyMetric) {
        toast.error('Fyll i minst ett kroppsmått.');
        return;
      }

      const { error: upErr } = await (supabase as any).from('user_profiles').update(patch).eq('user_id', uid);
      if (upErr) throw upErr;

      toast.success('Sparad!');
      await refetchProfile();
    } catch (err) {
      console.error('Body profile save failed:', err);
      toast.error('Kunde inte spara. Försök igen.');
    } finally {
      setSavingBody(false);
    }
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authData?.user) {
        toast.error('Kunde inte verifiera inloggning.');
        return;
      }
      const uid = authData.user.id;

      // user_goals.goal_date is NOT NULL — empty string fails the upsert; fall back to profil / default.
      const goalDateRaw = typeof goal.goal_date === 'string' ? goal.goal_date.trim() : '';
      const profileGoalDate =
        typeof userProfile?.goal_date === 'string' ? userProfile.goal_date.trim() : '';
      const goalDate =
        goalDateRaw !== ''
          ? goalDateRaw
          : profileGoalDate !== ''
            ? profileGoalDate
            : new Date(Date.now() + 86400000 * 180).toISOString().split('T')[0];

      const goalName = typeof goal.goal_name === 'string' ? goal.goal_name.trim() : '';
      const goalEmoji =
        typeof goal.goal_emoji === 'string' && goal.goal_emoji.trim() !== ''
          ? goal.goal_emoji.trim()
          : '🏁';

      const goalPayload = {
        goal_name: goalName || 'Mitt mål',
        goal_date: goalDate,
        goal_emoji: goalEmoji || '🏁',
      };

      const [profileRes, goalRes, profileGoalRes] = await Promise.all([
        supabase
          .from('users')
          .update({
            name: profile.name ?? null,
            current_weight: toFiniteNumber(profile.current_weight),
            height_cm: toFiniteNumber(profile.height_cm),
            body_fat_pct: toFiniteNumber(profile.body_fat_pct),
            ftp_watts: toFiniteNumber(profile.ftp_watts),
            run_threshold_pace: profile.run_threshold_pace ?? null,
            vo2max_estimate: toFiniteNumber(profile.vo2max_estimate),
            training_phase: profile.training_phase ?? null,
          })
          .eq('id', uid),
        supabase.from('user_goals').upsert(
          {
            user_id: uid,
            ...goalPayload,
          },
          { onConflict: 'user_id' },
        ),
        (supabase as any)
          .from('user_profiles')
          .update({
            ...goalPayload,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', uid),
      ]);

      if (profileRes.error) throw profileRes.error;
      if (goalRes.error) throw goalRes.error;
      if (profileGoalRes.error) throw profileGoalRes.error;

      toast.success('Inställningar sparade!');
      await refetchProfile();
    } catch (err) {
      console.error('Settings save failed:', err);
      toast.error('Kunde inte spara. Försök igen.');
    } finally {
      setSaving(false);
    }
  };

  const retakeQuiz = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    const { error } = await (supabase as any)
      .from('user_profiles')
      .update({ onboarding_completed: false })
      .eq('user_id', authUser.id);
    if (error) {
      console.error('retakeQuiz failed:', error);
      toast.error('Kunde inte återställa quiz. Försök igen.');
      return;
    }
    navigate('/onboarding', { replace: true });
  };

  const archLabels: Record<string, string> = {
    triathlon: 'Triathlon', running: 'Löpning', strength: 'Styrka',
    weight_loss: 'Viktnedgång', wellness: 'Hälsa', custom: 'Eget mål',
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

        {/* Onboarding profile summary */}
        {userProfile && (
          <div className="card-athletic space-y-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Min profil</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Namn</span><span className="font-medium">{userProfile.display_name || '–'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Typ</span><span className="font-medium">{archLabels[userProfile.archetype] || userProfile.archetype}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Mål</span><span className="font-medium">{userProfile.goal_name || '–'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Nivå</span><span className="font-medium capitalize">{userProfile.level || '–'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Träningsdagar</span><span className="font-medium">{userProfile.training_days_per_week}/vecka</span></div>
            </div>
            <Button variant="outline" size="sm" className="w-full gap-2" onClick={retakeQuiz}>
              <RefreshCw className="h-3.5 w-3.5" /> Kör quizen igen
            </Button>
          </div>
        )}

        {/* Body & Health (user_profiles) */}
        <div className="card-athletic space-y-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Kropp & hälsa</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Vikt (kg)</Label>
              <Input
                inputMode="decimal"
                type="number"
                value={body.weight}
                onChange={(e) => updateBody('weight', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Längd (cm)</Label>
              <Input
                inputMode="numeric"
                type="number"
                value={body.height_cm}
                onChange={(e) => updateBody('height_cm', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Målvikt (kg)</Label>
              <Input
                inputMode="decimal"
                type="number"
                value={body.target_weight}
                onChange={(e) => updateBody('target_weight', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Kroppsfett (%)</Label>
              <Input
                inputMode="decimal"
                type="number"
                value={body.body_fat_pct}
                onChange={(e) => updateBody('body_fat_pct', e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={saveBodyProfile}
            className="w-full touch-target"
            disabled={savingBody}
          >
            {savingBody && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Spara
          </Button>
        </div>

        {/* Profile */}
        <div className="card-athletic space-y-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Träningsdata</p>
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

        {/* Mitt mål */}
        <div className="card-athletic space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Mitt mål</p>
          </div>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-xs">Målnamn</Label>
              <Input value={goal.goal_name} onChange={(e) => setGoal(g => ({ ...g, goal_name: e.target.value }))} placeholder="t.ex. Ironman 70.3" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Måldatum</Label>
                <Input type="date" value={goal.goal_date} onChange={(e) => setGoal(g => ({ ...g, goal_date: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Emoji</Label>
                <Input value={goal.goal_emoji} onChange={(e) => setGoal(g => ({ ...g, goal_emoji: e.target.value }))} placeholder="🏁" />
              </div>
            </div>
          </div>
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
