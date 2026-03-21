import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useGoals } from '@/hooks/useGoals';
import { useBodyMetrics } from '@/hooks/useBodyMetrics';
import { usePersistSettings } from '@/hooks/usePersistSettings';
import { getUser, type User } from '@/services/usersService';
import { upsertProfile } from '@/services/profileService';
import { getCurrentUserId, toFiniteNumber } from '@/services/utils';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogOut, Watch, Check, Loader2, Mail, Target, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const PHASES = ['base', 'build', 'peak', 'taper'];

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { profile: userProfile, refetch: refetchProfile } = useProfile();
  const { goals, refetch: refetchGoals } = useGoals();
  const { saveBodyMetrics, saving: savingBody } = useBodyMetrics(refetchProfile);
  const { saveSettings, saving } = usePersistSettings({ refetchProfile, refetchGoals });

  const [trainingUser, setTrainingUser] = useState<Partial<User>>({});
  const [goal, setGoal] = useState<{ goal_name: string; goal_date: string; goal_emoji: string }>({
    goal_name: '',
    goal_date: '',
    goal_emoji: '🏁',
  });
  const [body, setBody] = useState<{
    weight: string;
    height_cm: string;
    target_weight: string;
    body_fat_pct: string;
  }>({ weight: '', height_cm: '', target_weight: '', body_fat_pct: '' });

  const bodyRef = useRef(body);
  useEffect(() => {
    bodyRef.current = body;
  }, [body]);

  useEffect(() => {
    if (!user) return;
    void getUser(user.id).then(({ data }) => {
      if (data) setTrainingUser(data);
    });
  }, [user]);

  useEffect(() => {
    if (goals) {
      setGoal({
        goal_name: goals.goal_name,
        goal_date: goals.goal_date,
        goal_emoji: goals.goal_emoji || '🏁',
      });
    }
  }, [goals]);

  useEffect(() => {
    if (!userProfile) return;
    setBody({
      weight: userProfile.weight == null ? '' : String(userProfile.weight),
      height_cm: userProfile.height_cm == null ? '' : String(userProfile.height_cm),
      target_weight: userProfile.target_weight == null ? '' : String(userProfile.target_weight),
      body_fat_pct: userProfile.body_fat_pct == null ? '' : String(userProfile.body_fat_pct),
    });
  }, [userProfile]);

  const updateTraining = (field: keyof User | string, value: string | number) => {
    setTrainingUser((p) => ({ ...p, [field]: value }));
  };

  const updateBody = (field: keyof typeof body, value: string) => {
    setBody((b) => ({ ...b, [field]: value }));
  };

  const saveBodyProfile = () => saveBodyMetrics(bodyRef.current);

  const save = async () => {
    if (!user) return;

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

    const displayName =
      typeof trainingUser.name === 'string' && trainingUser.name.trim() !== ''
        ? trainingUser.name.trim()
        : null;

    await saveSettings({
      userPatch: {
        name: trainingUser.name ?? null,
        current_weight: toFiniteNumber(trainingUser.current_weight),
        height_cm: toFiniteNumber(trainingUser.height_cm),
        body_fat_pct: toFiniteNumber(trainingUser.body_fat_pct),
        ftp_watts: toFiniteNumber(trainingUser.ftp_watts),
        run_threshold_pace: trainingUser.run_threshold_pace ?? null,
        vo2max_estimate: toFiniteNumber(trainingUser.vo2max_estimate),
        training_phase: trainingUser.training_phase ?? null,
      },
      goalsInput: {
        goal_name: goalPayload.goal_name,
        goal_date: goal.goal_date?.trim() || '',
        goal_emoji: goalPayload.goal_emoji,
        profileGoalDate: userProfile?.goal_date ?? null,
      },
      profilePatch: {
        ...goalPayload,
        display_name: displayName,
      },
    });
  };

  const retakeQuiz = async () => {
    try {
      const uid = await getCurrentUserId();
      const { error } = await upsertProfile(uid, { onboarding_completed: false });
      if (error) {
        console.error('retakeQuiz failed:', error);
        toast.error('Kunde inte återställa quiz. Försök igen.');
        return;
      }
      navigate('/onboarding', { replace: true });
    } catch (e) {
      console.error('retakeQuiz failed:', e);
      toast.error('Kunde inte återställa quiz. Försök igen.');
    }
  };

  const archLabels: Record<string, string> = {
    triathlon: 'Triathlon', running: 'Löpning', strength: 'Styrka',
    weight_loss: 'Viktnedgång', wellness: 'Hälsa', custom: 'Eget mål',
  };

  return (
    <div className="app-container pt-6">
      <h1 className="mb-6 text-xl tracking-tight">Inställningar</h1>

      <div className="space-y-6">
        <div className="card-athletic">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Inloggad som</p>
              <p className="text-sm font-medium">{user?.email}</p>
            </div>
          </div>
        </div>

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

        <div className="card-athletic space-y-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Träningsdata</p>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Namn</Label>
              <Input value={trainingUser.name || ''} onChange={(e) => updateTraining('name', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Vikt (kg)</Label><Input type="number" value={trainingUser.current_weight ?? ''} onChange={(e) => updateTraining('current_weight', e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Längd (cm)</Label><Input type="number" value={trainingUser.height_cm ?? ''} onChange={(e) => updateTraining('height_cm', e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Kroppsfett %</Label><Input type="number" value={trainingUser.body_fat_pct ?? ''} onChange={(e) => updateTraining('body_fat_pct', e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">FTP (watt)</Label><Input type="number" value={trainingUser.ftp_watts ?? ''} onChange={(e) => updateTraining('ftp_watts', e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Löptempo (min/km)</Label><Input value={trainingUser.run_threshold_pace || ''} onChange={(e) => updateTraining('run_threshold_pace', e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">VO2max</Label><Input type="number" value={trainingUser.vo2max_estimate ?? ''} onChange={(e) => updateTraining('vo2max_estimate', e.target.value)} /></div>
            </div>
          </div>
        </div>

        <div className="card-athletic space-y-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Träningsfas</p>
          <div className="flex gap-2">
            {PHASES.map((phase) => (
              <button
                key={phase}
                onClick={() => updateTraining('training_phase', phase)}
                className={`touch-target flex-1 rounded-xl border py-2 text-sm font-medium capitalize transition-all duration-200 ${
                  trainingUser.training_phase === phase
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                {phase}
              </button>
            ))}
          </div>
        </div>

        <div className="card-athletic space-y-3">
          <div className="flex items-center gap-2">
            <Watch className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Garmin Connect</p>
          </div>
          {trainingUser.garmin_user_id ? (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-rest" />
              <span className="text-sm text-rest">Ansluten</span>
              <span className="text-xs text-muted-foreground">({trainingUser.garmin_user_id})</span>
            </div>
          ) : (
            <div>
              <Button disabled variant="outline" className="touch-target w-full opacity-50">Anslut Garmin</Button>
              <p className="mt-2 text-xs text-muted-foreground">Garmin-integration kommer snart</p>
            </div>
          )}
        </div>

        <div className="card-athletic space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Mitt mål</p>
          </div>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-xs">Målnamn</Label>
              <Input value={goal.goal_name} onChange={(e) => setGoal((g) => ({ ...g, goal_name: e.target.value }))} placeholder="t.ex. Ironman 70.3" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Måldatum</Label>
                <Input type="date" value={goal.goal_date} onChange={(e) => setGoal((g) => ({ ...g, goal_date: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Emoji</Label>
                <Input value={goal.goal_emoji} onChange={(e) => setGoal((g) => ({ ...g, goal_emoji: e.target.value }))} placeholder="🏁" />
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
