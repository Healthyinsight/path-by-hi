import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { Locale } from 'date-fns';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { sv as dateFnsSv } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { RaceSearchField } from '@/components/RaceSearchField';
import type { Archetype, QuizState } from '@/onboarding/quizTypes';
import { initialQuizState } from '@/onboarding/quizTypes';
import {
  CUSTOM_MAP_OPTIONS,
  getStepsForArchetype,
  GOAL_OPTIONS,
  onboardingTestId,
  RUN_DISTANCE_KEYS,
  RUN_FREQUENCY_OPTIONS,
  STRENGTH_EQUIPMENT_OPTIONS,
  TRI_DISTANCE_KEYS,
  TRI_LEVEL_OPTIONS,
  type QuizStepName,
  WL_ACTIVITY_OPTIONS,
  WELLNESS_ACTIVITY_OPTIONS,
  WELLNESS_FOCUS_OPTIONS,
} from '@/onboarding/quizConfig';
import { mapQuizStateToSaveBundle } from '@/onboarding/mapToProfile';

export default function Onboarding() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const dateLocale: Locale = i18n.language.startsWith('en') ? enUS : dateFnsSv;
  const dateLocaleStr = i18n.language.startsWith('en') ? 'en-US' : 'sv-SE';
  const [state, setState] = useState<QuizState>(initialQuizState);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('left');
  const [saving, setSaving] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  // Pre-fill form if profile already exists
  useEffect(() => {
    if (!user || prefilled) return;
    (async () => {
      const { data } = await (supabase as any)
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (data) {
        setState(s => ({
          ...s,
          display_name: data.display_name || '',
          trail_name: (data as any).trail_name || '',
          archetype: data.archetype || '',
        }));
      }
      setPrefilled(true);
    })();
  }, [user, prefilled]);

  const set = useCallback(<K extends keyof QuizState>(key: K, val: QuizState[K]) => {
    setState(s => ({ ...s, [key]: val }));
  }, []);

  const steps = getStepsForArchetype(state.archetype);
  const totalSteps = steps.length;
  const currentStepName = steps[step] || 'name';
  const progress = ((step + 1) / totalSteps) * 100;

  const goNext = () => { setDirection('left'); setStep(s => Math.min(s + 1, totalSteps - 1)); };
  const goBack = () => { setDirection('right'); setStep(s => Math.max(s - 1, 0)); };

  const canProceed = (): boolean => {
    switch (currentStepName as QuizStepName) {
      case 'name': return state.display_name.trim().length > 0;
      case 'goal': return state.archetype !== '';
      case 'tri_distance': return state.tri_distance !== '';
      case 'tri_race': return state.has_race !== null && (state.has_race === false || (state.race_name.trim().length > 0 && !!state.race_date));
      case 'tri_level': return state.tri_level !== '';
      case 'run_distance': return state.run_distance !== '';
      case 'run_race': return state.run_has_race !== null && (state.run_has_race === false || (state.run_race_name.trim().length > 0 && !!state.run_race_date));
      case 'run_frequency': return state.run_frequency !== '';
      case 'str_equipment': return state.equipment !== '';
      case 'str_injuries': return state.has_injuries !== '';
      case 'str_days': return state.strength_days >= 3;
      case 'wl_weight': return state.weight !== '';
      case 'wl_target': return true;
      case 'wl_activity': return state.wl_activity !== '';
      case 'well_focus': return state.wellness_focuses.length > 0;
      case 'well_activity': return state.wellness_activity !== '';
      case 'cust_describe': return state.custom_goal.trim().length > 0;
      case 'cust_map': return state.custom_archetype !== '';
      case 'cust_date': return true;
      case 'trail_name': return true;
      default: return true;
    }
  };

  const handleFinish = async () => {
    setSaving(true);

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      toast.error(t('onboarding.toastNotAuthenticated'));
      setSaving(false);
      navigate('/login', { replace: true });
      return;
    }

    try {
      const bundle = mapQuizStateToSaveBundle(authUser.id, state, t);
      const profilePayload = { ...bundle.profile, updated_at: new Date().toISOString() };

      const { error: profileError } = await (supabase as any)
        .from('user_profiles')
        .upsert(profilePayload, { onConflict: 'user_id' });

      if (profileError) {
        console.error('Profile save error:', profileError);
        toast.error(t('onboarding.toastProfileSaveFail'));
        return;
      }

      toast.success(t('onboarding.toastProfileSaved'));

      const { error: goalsError } = await supabase.from('user_goals').upsert(bundle.goal, { onConflict: 'user_id' });
      if (goalsError) {
        console.error('Goal save error:', goalsError);
        toast.error(t('onboarding.toastGoalSaveFail'));
      }

      const { error: nameError } = await supabase
        .from('users')
        .update({ name: bundle.displayNameForUsersTable })
        .eq('id', authUser.id);
      if (nameError) {
        console.error('Name update error:', nameError);
        toast.error(t('onboarding.toastNameUpdateFail'));
      }

      navigate('/', { replace: true });
    } catch (err) {
      console.error('handleFinish failed:', err);
      toast.error(t('onboarding.toastProfileSaveFail'));
    } finally {
      setSaving(false);
    }
  };

  const getSummary = () => {
    if (!user?.id || !state.archetype) {
      return { goal: '', date: '', type: '', days: 0 };
    }
    const d = mapQuizStateToSaveBundle(user.id, state, t).profile;
    const atype = d.archetype as Archetype;
    return {
      goal: d.goal_name,
      date: d.goal_date,
      type: t(`settings.archetypes.${atype}`, { defaultValue: String(d.archetype) }),
      days: d.training_days_per_week ?? 0,
    };
  };

  const renderStep = () => {
    switch (currentStepName) {
      case 'name':
        return (
          <StepContainer title={t('onboarding.nameTitle')}>
            <Input
              value={state.display_name}
              onChange={e => set('display_name', e.target.value)}
              placeholder={t('onboarding.namePlaceholder')}
              className="h-[52px] text-lg rounded-lg"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && canProceed() && goNext()}
            />
          </StepContainer>
        );

      case 'goal':
        return (
          <StepContainer title={t('onboarding.goalTitle')}>
            <div className="space-y-3">
              {GOAL_OPTIONS.map(opt => (
                <OptionCard
                  key={opt.key}
                  dataTestId={onboardingTestId.goal(opt.key)}
                  emoji={opt.emoji}
                  title={t(`onboarding.goals.${opt.key}.title`)}
                  description={t(`onboarding.goals.${opt.key}.desc`)}
                  selected={state.archetype === opt.key}
                  onClick={() => { set('archetype', opt.key); setTimeout(goNext, 200); }}
                />
              ))}
            </div>
          </StepContainer>
        );

      // TRIATHLON
      case 'tri_distance':
        return (
          <StepContainer title={t('onboarding.triDistanceTitle')}>
            <div className="space-y-3">
              {TRI_DISTANCE_KEYS.map((key) => (
                <OptionCard
                  key={key}
                  dataTestId={onboardingTestId.triDistance(key)}
                  title={t(`onboarding.triDistances.${key}.label`)}
                  description={t(`onboarding.triDistances.${key}.desc`)}
                  selected={state.tri_distance === key}
                  onClick={() => { set('tri_distance', key); setTimeout(goNext, 200); }}
                />
              ))}
            </div>
          </StepContainer>
        );

      case 'tri_race':
        return (
          <StepContainer title={t('onboarding.triRaceTitle')}>
            <div className="space-y-3">
              <OptionCard
                dataTestId={onboardingTestId.triRaceYes()}
                title={t('onboarding.triRaceYesTitle')}
                description={t('onboarding.triRaceYesDesc')}
                selected={state.has_race === true}
                onClick={() => set('has_race', true)}
              />
              <OptionCard
                dataTestId={onboardingTestId.triRaceNo()}
                title={t('onboarding.triRaceNoTitle')}
                description={t('onboarding.triRaceNoDesc')}
                selected={state.has_race === false}
                onClick={() => { set('has_race', false); setTimeout(goNext, 200); }}
              />
            </div>
            {state.has_race && (
              <div className="mt-4 space-y-3">
                <div className="space-y-1">
                  <Label className="text-sm">{t('onboarding.raceSearchLabel')}</Label>
                  <RaceSearchField
                    value={state.race_name}
                    primaryType="triathlon"
                    onSelect={(race) => {
                      set('race_name', race.name);
                      set('race_date', new Date(race.date));
                      set('race_autofilled', true);
                      setTimeout(goNext, 300);
                    }}
                    onManualChange={(name) => {
                      set('race_name', name);
                      set('race_autofilled', false);
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">{t('onboarding.dateLabel')}</Label>
                  {state.race_autofilled && state.race_date ? (
                    <p className="text-sm text-muted-foreground">
                      ✓ {state.race_name} – {format(state.race_date, 'PPP', { locale: dateLocale })}
                    </p>
                  ) : (
                    <DatePickerField
                      date={state.race_date}
                      onSelect={d => set('race_date', d)}
                      locale={dateLocale}
                      emptyLabel={t('onboarding.pickDate')}
                    />
                  )}
                </div>
              </div>
            )}
          </StepContainer>
        );

      case 'tri_level':
        return (
          <StepContainer title={t('onboarding.triLevelTitle')}>
            <div className="space-y-3">
              {TRI_LEVEL_OPTIONS.map(opt => (
                <OptionCard
                  key={opt.key}
                  dataTestId={onboardingTestId.triLevel(opt.key)}
                  emoji={opt.emoji}
                  title={t(`onboarding.triLevels.${opt.key}.label`)}
                  description={t(`onboarding.triLevels.${opt.key}.desc`)}
                  selected={state.tri_level === opt.key}
                  onClick={() => { set('tri_level', opt.key); setTimeout(goNext, 200); }}
                />
              ))}
            </div>
          </StepContainer>
        );

      // RUNNING
      case 'run_distance':
        return (
          <StepContainer title={t('onboarding.runDistanceTitle')}>
            <div className="space-y-3">
              {RUN_DISTANCE_KEYS.map((key) => (
                <OptionCard
                  key={key}
                  dataTestId={onboardingTestId.runDistance(key)}
                  title={t(`onboarding.runDistances.${key}.title`)}
                  selected={state.run_distance === key}
                  onClick={() => { set('run_distance', key); setTimeout(goNext, 200); }}
                />
              ))}
            </div>
          </StepContainer>
        );

      case 'run_race':
        return (
          <StepContainer title={t('onboarding.runRaceTitle')}>
            <div className="space-y-3">
              <OptionCard
                dataTestId={onboardingTestId.runRaceYes()}
                title={t('onboarding.runRaceYesTitle')}
                description={t('onboarding.runRaceYesDesc')}
                selected={state.run_has_race === true}
                onClick={() => set('run_has_race', true)}
              />
              <OptionCard
                dataTestId={onboardingTestId.runRaceNo()}
                title={t('onboarding.runRaceNoTitle')}
                description={t('onboarding.runRaceNoDesc')}
                selected={state.run_has_race === false}
                onClick={() => { set('run_has_race', false); setTimeout(goNext, 200); }}
              />
            </div>
            {state.run_has_race && (
              <div className="mt-4 space-y-3">
                <div className="space-y-1">
                  <Label className="text-sm">{t('onboarding.raceSearchLabel')}</Label>
                  <RaceSearchField
                    value={state.run_race_name}
                    primaryType="running"
                    onSelect={(race) => {
                      set('run_race_name', race.name);
                      set('run_race_date', new Date(race.date));
                      set('run_race_autofilled', true);
                      setTimeout(goNext, 300);
                    }}
                    onManualChange={(name) => {
                      set('run_race_name', name);
                      set('run_race_autofilled', false);
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">{t('onboarding.dateLabel')}</Label>
                  {state.run_race_autofilled && state.run_race_date ? (
                    <p className="text-sm text-muted-foreground">
                      ✓ {state.run_race_name} – {format(state.run_race_date, 'PPP', { locale: dateLocale })}
                    </p>
                  ) : (
                    <DatePickerField
                      date={state.run_race_date}
                      onSelect={d => set('run_race_date', d)}
                      locale={dateLocale}
                      emptyLabel={t('onboarding.pickDate')}
                    />
                  )}
                </div>
              </div>
            )}
          </StepContainer>
        );

      case 'run_frequency':
        return (
          <StepContainer title={t('onboarding.runFreqTitle')}>
            <div className="space-y-3">
              {RUN_FREQUENCY_OPTIONS.map(opt => (
                <OptionCard
                  key={opt.key}
                  dataTestId={onboardingTestId.runFrequency(opt.key)}
                  emoji={opt.emoji}
                  title={t(`onboarding.runFreq.${opt.key}.label`)}
                  selected={state.run_frequency === opt.key}
                  onClick={() => { set('run_frequency', opt.key); setTimeout(goNext, 200); }}
                />
              ))}
            </div>
          </StepContainer>
        );

      // STRENGTH
      case 'str_equipment':
        return (
          <StepContainer title={t('onboarding.strEquipmentTitle')}>
            <div className="space-y-3">
              {STRENGTH_EQUIPMENT_OPTIONS.map(opt => (
                <OptionCard
                  key={opt.key}
                  dataTestId={onboardingTestId.strengthEquipment(opt.key)}
                  emoji={opt.emoji}
                  title={t(`onboarding.strEquipment.${opt.key}.label`)}
                  selected={state.equipment === opt.key}
                  onClick={() => { set('equipment', opt.key); setTimeout(goNext, 200); }}
                />
              ))}
            </div>
          </StepContainer>
        );

      case 'str_injuries':
        return (
          <StepContainer title={t('onboarding.strInjuriesTitle')}>
            <div className="space-y-3">
              <OptionCard
                dataTestId={onboardingTestId.strengthInjuryNo()}
                title={t('onboarding.strInjuryNo')}
                emoji="✅"
                selected={state.has_injuries === 'no'}
                onClick={() => { set('has_injuries', 'no'); setTimeout(goNext, 200); }}
              />
              <OptionCard
                dataTestId={onboardingTestId.strengthInjuryYes()}
                title={t('onboarding.strInjuryYes')}
                emoji="⚠️"
                selected={state.has_injuries === 'yes'}
                onClick={() => set('has_injuries', 'yes')}
              />
            </div>
            {state.has_injuries === 'yes' && (
              <div className="mt-4 space-y-1">
                <Label className="text-sm">{t('onboarding.injuryDescribeLabel')}</Label>
                <Textarea value={state.injury_text} onChange={e => set('injury_text', e.target.value)}
                  placeholder={t('onboarding.injuryPlaceholder')} className="rounded-lg" rows={3} />
              </div>
            )}
          </StepContainer>
        );

      case 'str_days':
        return (
          <StepContainer title={t('onboarding.strDaysTitle')}>
            <div className="space-y-3">
              {[3, 4, 5, 6].map(d => (
                <OptionCard
                  key={d}
                  dataTestId={onboardingTestId.strengthDays(d)}
                  title={t('onboarding.strDaysOption', { count: d })}
                  selected={state.strength_days === d}
                  onClick={() => { set('strength_days', d); setTimeout(goNext, 200); }}
                />
              ))}
            </div>
          </StepContainer>
        );

      // WEIGHT LOSS
      case 'wl_weight':
        return (
          <StepContainer title={t('onboarding.wlWeightTitle')}>
            <div className="space-y-2">
              <div className="relative">
                <Input type="number" value={state.weight} onChange={e => set('weight', e.target.value)}
                  placeholder="80" className="h-[52px] text-lg rounded-lg pr-12" autoFocus />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">{t('onboarding.kg')}</span>
              </div>
              <p className="text-sm text-muted-foreground">{t('onboarding.wlWeightHint')}</p>
            </div>
          </StepContainer>
        );

      case 'wl_target':
        return (
          <StepContainer title={t('onboarding.wlTargetTitle')}>
            <div className="space-y-3">
              <div className="relative">
                <Input type="number" value={state.target_weight} onChange={e => set('target_weight', e.target.value)}
                  placeholder={state.weight ? String(Math.round(Number(state.weight) * 0.9)) : '72'}
                  className="h-[52px] text-lg rounded-lg pr-12" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">{t('onboarding.kg')}</span>
              </div>
              <button onClick={() => { set('target_weight', ''); goNext(); }}
                className="w-full rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground hover:border-primary/40 transition-colors">
                {t('onboarding.wlTargetUnknown')}
              </button>
            </div>
          </StepContainer>
        );

      case 'wl_activity':
        return (
          <StepContainer title={t('onboarding.wlActivityTitle')}>
            <div className="space-y-3">
              {WL_ACTIVITY_OPTIONS.map(opt => (
                <OptionCard
                  key={opt.key}
                  dataTestId={onboardingTestId.wlActivity(opt.key)}
                  emoji={opt.emoji}
                  title={t(`onboarding.wlActivity.${opt.key}.label`)}
                  selected={state.wl_activity === opt.key}
                  onClick={() => { set('wl_activity', opt.key); setTimeout(goNext, 200); }}
                />
              ))}
            </div>
          </StepContainer>
        );

      // WELLNESS
      case 'well_focus':
        return (
          <StepContainer title={t('onboarding.wellFocusTitle')} subtitle={t('onboarding.wellFocusSubtitle')}>
            <div className="space-y-3">
              {WELLNESS_FOCUS_OPTIONS.map(opt => {
                const sel = state.wellness_focuses.includes(opt.key);
                return (
                  <OptionCard
                    key={opt.key}
                    dataTestId={onboardingTestId.wellnessFocus(opt.key)}
                    emoji={opt.emoji}
                    title={t(`onboarding.wellFocus.${opt.key}.label`)}
                    selected={sel}
                    onClick={() => {
                      const next = sel
                        ? state.wellness_focuses.filter(f => f !== opt.key)
                        : [...state.wellness_focuses, opt.key].slice(0, 3);
                      set('wellness_focuses', next);
                    }}
                  />
                );
              })}
            </div>
          </StepContainer>
        );

      case 'well_activity':
        return (
          <StepContainer title={t('onboarding.wellActivityTitle')}>
            <div className="space-y-3">
              {WELLNESS_ACTIVITY_OPTIONS.map(opt => (
                <OptionCard
                  key={opt.key}
                  dataTestId={onboardingTestId.wellnessActivity(opt.key)}
                  title={t(`onboarding.wellActivity.${opt.key}.label`)}
                  selected={state.wellness_activity === opt.key}
                  onClick={() => { set('wellness_activity', opt.key); setTimeout(goNext, 200); }}
                />
              ))}
            </div>
          </StepContainer>
        );

      // CUSTOM
      case 'cust_describe':
        return (
          <StepContainer title={t('onboarding.customDescribeTitle')}>
            <Textarea value={state.custom_goal} onChange={e => set('custom_goal', e.target.value)}
              placeholder={t('onboarding.customDescribePlaceholder')}
              className="rounded-lg min-h-[120px] text-base" autoFocus />
          </StepContainer>
        );

      case 'cust_map':
        return (
          <StepContainer title={t('onboarding.customMapTitle')}>
            <div className="space-y-3">
              {CUSTOM_MAP_OPTIONS.map(opt => (
                <OptionCard
                  key={opt.key}
                  dataTestId={onboardingTestId.customMap(opt.key)}
                  emoji={opt.emoji}
                  title={t(`onboarding.customMap.${opt.key}.label`)}
                  selected={state.custom_archetype === opt.key}
                  onClick={() => { set('custom_archetype', opt.key); setTimeout(goNext, 200); }}
                />
              ))}
            </div>
          </StepContainer>
        );

      case 'cust_date':
        return (
          <StepContainer title={t('onboarding.customDateTitle')}>
            <div className="space-y-3">
              <DatePickerField
                date={state.custom_date}
                onSelect={d => set('custom_date', d)}
                locale={dateLocale}
                emptyLabel={t('onboarding.pickDate')}
              />
              <button onClick={() => { set('custom_no_date', true); goNext(); }}
                className="w-full rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground hover:border-primary/40 transition-colors">
                {t('onboarding.customDateSkip')}
              </button>
            </div>
          </StepContainer>
        );

      // SUMMARY
      case 'summary': {
        const summary = getSummary();
        return (
          <StepContainer title={t('onboarding.summaryReady', { name: state.display_name })}>
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <SummaryRow label={t('onboarding.summaryGoal')} value={summary.goal || '–'} />
              <SummaryRow
                label={t('onboarding.summaryDate')}
                value={
                  summary.date
                    ? new Date(summary.date).toLocaleDateString(dateLocaleStr)
                    : t('onboarding.summaryNoDate')
                }
              />
              <SummaryRow label={t('onboarding.summaryType')} value={summary.type} />
              <SummaryRow
                label={t('onboarding.summaryDays')}
                value={t('onboarding.summaryDaysValue', { count: summary.days })}
              />
            </div>
            <Button onClick={handleFinish} disabled={saving}
              className="w-full h-[52px] text-base font-semibold rounded-lg mt-4">
              {saving ? t('onboarding.saving') : t('onboarding.startJourney')}
            </Button>
          </StepContainer>
        );
      }

      case 'trail_name':
        return (
          <StepContainer
            title={t('onboarding.trailTitle')}
            subtitle={t('onboarding.trailSubtitle')}
          >
            <div className="space-y-4">
              <Input
                value={state.trail_name}
                onChange={e => set('trail_name', e.target.value.slice(0, 30))}
                placeholder={t('onboarding.trailPlaceholder')}
                maxLength={30}
                className="h-[52px] text-base rounded-lg"
              />
              <div className="flex flex-col items-stretch gap-2">
                <Button
                  onClick={handleFinish}
                  disabled={saving}
                  className="w-full h-[52px] text-base font-semibold rounded-[10px] bg-[#5095AC] hover:bg-[#468298]"
                >
                  {saving ? t('onboarding.saving') : t('onboarding.continueCta')}
                </Button>
                <button
                  type="button"
                  onClick={handleFinish}
                  className="text-xs text-[#8E9BA3] hover:text-[#6B7B84] underline-offset-2 hover:underline mx-auto"
                  style={{ fontFamily: "'Merriweather Sans', sans-serif" }}
                >
                  {t('onboarding.skipTrail')}
                </button>
              </div>
            </div>
          </StepContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(180deg, hsl(195 38% 94%) 0%, hsl(210 20% 98%) 100%)' }}>
      {/* Progress bar */}
      <div className="w-full h-1 bg-border">
        <div className="h-full bg-primary transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
      </div>

      {/* Back button */}
      <div className="px-4 pt-3">
        {step > 0 && (
          <button onClick={goBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors touch-target">
            <ArrowLeft className="h-4 w-4" /> {t('onboarding.back')}
          </button>
        )}
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-start justify-center px-4 pt-8 pb-12">
        <div className={cn(
          "w-full max-w-[480px] transition-all duration-300 ease-in-out",
          direction === 'left' ? 'animate-slide-in-left' : 'animate-slide-in-right'
        )} key={currentStepName}>
          {renderStep()}
        </div>
      </div>

      {/* Next button (except for summary, trail name and auto-advance steps) */}
      {currentStepName !== 'summary' && currentStepName !== 'goal' && currentStepName !== 'trail_name' && (
        <div className="sticky bottom-0 px-4 pb-6 pt-2 bg-gradient-to-t from-background/80 to-transparent">
          <div className="mx-auto max-w-[480px]">
            <Button onClick={goNext} disabled={!canProceed()}
              className="w-full h-[52px] text-base font-semibold rounded-lg">
              {t('onboarding.next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components

function StepContainer({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function OptionCard({ emoji, title, description, selected, onClick, dataTestId }: {
  emoji?: string;
  title: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  dataTestId?: string;
}) {
  return (
    <button type="button" data-testid={dataTestId} onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 touch-target",
        selected
          ? "border-primary bg-primary text-primary-foreground shadow-md"
          : "border-border bg-card hover:border-primary/40 shadow-sm"
      )}>
      {emoji && <span className="text-2xl shrink-0">{emoji}</span>}
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        {description && <p className={cn("text-sm mt-0.5", selected ? "text-primary-foreground/80" : "text-muted-foreground")}>{description}</p>}
      </div>
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function DatePickerField({
  date,
  onSelect,
  locale,
  emptyLabel,
}: {
  date: Date | undefined;
  onSelect: (d: Date | undefined) => void;
  locale: Locale;
  emptyLabel: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("w-full h-[52px] justify-start text-left font-normal rounded-lg",
          !date && "text-muted-foreground")}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP', { locale }) : emptyLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
          weekStartsOn={1}
          disabled={d => d < new Date()}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}
