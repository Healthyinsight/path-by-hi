import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type Archetype = 'triathlon' | 'running' | 'strength' | 'weight_loss' | 'wellness' | 'custom';

interface QuizState {
  display_name: string;
  archetype: Archetype | '';
  // triathlon
  tri_distance: string;
  has_race: boolean | null;
  race_name: string;
  race_date: Date | undefined;
  tri_level: string;
  // running
  run_distance: string;
  run_has_race: boolean | null;
  run_race_name: string;
  run_race_date: Date | undefined;
  run_frequency: string;
  // strength
  equipment: string;
  has_injuries: string;
  injury_text: string;
  strength_days: number;
  // weight loss
  weight: string;
  target_weight: string;
  wl_activity: string;
  // wellness
  wellness_focuses: string[];
  wellness_activity: string;
  // custom
  custom_goal: string;
  custom_archetype: string;
  custom_date: Date | undefined;
  custom_no_date: boolean;
}

const initialState: QuizState = {
  display_name: '',
  archetype: '',
  tri_distance: '', has_race: null, race_name: '', race_date: undefined, tri_level: '',
  run_distance: '', run_has_race: null, run_race_name: '', run_race_date: undefined, run_frequency: '',
  equipment: '', has_injuries: '', injury_text: '', strength_days: 4,
  weight: '', target_weight: '', wl_activity: '',
  wellness_focuses: [], wellness_activity: '',
  custom_goal: '', custom_archetype: '', custom_date: undefined, custom_no_date: false,
};

function addMonths(months: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d;
}

function fmtDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<QuizState>(initialState);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('left');
  const [saving, setSaving] = useState(false);

  const set = useCallback(<K extends keyof QuizState>(key: K, val: QuizState[K]) => {
    setState(s => ({ ...s, [key]: val }));
  }, []);

  // Compute steps based on archetype
  const getSteps = (): string[] => {
    const base = ['name', 'goal'];
    const arch = state.archetype;
    if (arch === 'triathlon') return [...base, 'tri_distance', 'tri_race', 'tri_level', 'summary'];
    if (arch === 'running') return [...base, 'run_distance', 'run_race', 'run_frequency', 'summary'];
    if (arch === 'strength') return [...base, 'str_equipment', 'str_injuries', 'str_days', 'summary'];
    if (arch === 'weight_loss') return [...base, 'wl_weight', 'wl_target', 'wl_activity', 'summary'];
    if (arch === 'wellness') return [...base, 'well_focus', 'well_activity', 'summary'];
    if (arch === 'custom') return [...base, 'cust_describe', 'cust_map', 'cust_date', 'summary'];
    return base;
  };

  const steps = getSteps();
  const totalSteps = steps.length;
  const currentStepName = steps[step] || 'name';
  const progress = ((step + 1) / totalSteps) * 100;

  const goNext = () => { setDirection('left'); setStep(s => Math.min(s + 1, totalSteps - 1)); };
  const goBack = () => { setDirection('right'); setStep(s => Math.max(s - 1, 0)); };

  const canProceed = (): boolean => {
    switch (currentStepName) {
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
      default: return true;
    }
  };

  // Build final profile data
  const buildProfileData = () => {
    const arch = state.archetype as Archetype;
    let goal_name = '';
    let goal_date = fmtDateStr(addMonths(3));
    let goal_emoji = '✨';
    let level = 'intermediate';
    let disciplines: string[] = ['run', 'strength'];
    let training_days = 4;
    let show_nutrition = true;
    let show_race_countdown = false;
    let show_recomp = false;
    let weight: number | null = null;
    let target_weight: number | null = null;
    let has_injuries: string | null = null;
    let equipment = 'full_gym';
    let wellness_focuses: string[] | null = null;

    if (arch === 'triathlon') {
      const distLabels: Record<string, string> = { sprint: 'Sprint Triathlon', olympic: 'Olympisk Triathlon', half: 'Ironman 70.3', full: 'Full Ironman' };
      goal_name = state.has_race && state.race_name ? state.race_name : distLabels[state.tri_distance] || 'Triathlon';
      goal_date = state.has_race && state.race_date ? fmtDateStr(state.race_date) : fmtDateStr(addMonths(6));
      goal_emoji = '🏊';
      disciplines = ['swim', 'bike', 'run', 'strength'];
      show_race_countdown = true;
      const levelMap: Record<string, { level: string; days: number }> = {
        beginner: { level: 'beginner', days: 4 },
        intermediate: { level: 'intermediate', days: 5 },
        advanced: { level: 'advanced', days: 6 },
      };
      const lm = levelMap[state.tri_level] || levelMap.intermediate;
      level = lm.level;
      training_days = lm.days;
    } else if (arch === 'running') {
      const distLabels: Record<string, string> = { '5k': '5K', '10k': '10K', half: 'Halvmarathon', marathon: 'Marathon', ultra: 'Ultramarathon' };
      goal_name = state.run_has_race && state.run_race_name ? state.run_race_name : (distLabels[state.run_distance] || 'Löplopp');
      goal_date = state.run_has_race && state.run_race_date ? fmtDateStr(state.run_race_date) : fmtDateStr(addMonths(4));
      goal_emoji = '🏃';
      disciplines = ['run', 'strength'];
      show_race_countdown = !!state.run_has_race;
      const freqMap: Record<string, { level: string; days: number }> = {
        low: { level: 'beginner', days: 3 },
        medium: { level: 'intermediate', days: 4 },
        high: { level: 'advanced', days: 5 },
      };
      const fm = freqMap[state.run_frequency] || freqMap.medium;
      level = fm.level;
      training_days = fm.days;
    } else if (arch === 'strength') {
      goal_name = 'Bli starkare';
      goal_emoji = '💪';
      disciplines = ['strength'];
      show_race_countdown = false;
      show_nutrition = true;
      equipment = state.equipment;
      has_injuries = state.has_injuries === 'yes' ? state.injury_text : null;
      training_days = state.strength_days;
      level = 'intermediate';
    } else if (arch === 'weight_loss') {
      goal_name = 'Viktnedgång';
      goal_emoji = '🎯';
      goal_date = fmtDateStr(addMonths(4));
      disciplines = ['run', 'strength'];
      show_recomp = true;
      show_nutrition = true;
      weight = state.weight ? Number(state.weight) : null;
      target_weight = state.target_weight ? Number(state.target_weight) : (weight ? weight * 0.9 : null);
      const actMap: Record<string, { level: string; days: number; disc: string[] }> = {
        regular: { level: 'intermediate', days: 4, disc: ['run', 'strength'] },
        sometimes: { level: 'beginner', days: 3, disc: ['run', 'strength'] },
        none: { level: 'beginner', days: 3, disc: ['strength'] },
      };
      const am = actMap[state.wl_activity] || actMap.sometimes;
      level = am.level;
      training_days = am.days;
      disciplines = am.disc;
    } else if (arch === 'wellness') {
      goal_name = 'Hälsosammare livsstil';
      goal_emoji = '🌿';
      goal_date = fmtDateStr(addMonths(3));
      show_race_countdown = false;
      wellness_focuses = state.wellness_focuses;
      show_nutrition = state.wellness_focuses.includes('kost');
      const discMap: string[] = [];
      if (state.wellness_focuses.includes('rörelse')) discMap.push('run');
      if (state.wellness_focuses.includes('kost')) discMap.push('strength');
      if (discMap.length === 0) discMap.push('run');
      disciplines = discMap;
      const actMap: Record<string, { level: string; days: number }> = {
        sedentary: { level: 'beginner', days: 3 },
        light: { level: 'intermediate', days: 4 },
        active: { level: 'intermediate', days: 5 },
      };
      const wm = actMap[state.wellness_activity] || actMap.light;
      level = wm.level;
      training_days = wm.days;
    } else if (arch === 'custom') {
      goal_name = state.custom_goal;
      goal_emoji = '✨';
      goal_date = state.custom_no_date || !state.custom_date ? fmtDateStr(addMonths(3)) : fmtDateStr(state.custom_date);
      // Remap archetype for app config
      const remap: Record<string, Archetype> = {
        endurance: 'running', strength: 'strength', weight_loss: 'weight_loss', wellness: 'wellness',
      };
      const mapped = remap[state.custom_archetype] || 'wellness';
      // We'll store the original 'custom' but apply settings from mapped
      if (mapped === 'running') { disciplines = ['run', 'strength']; show_race_countdown = true; }
      else if (mapped === 'strength') { disciplines = ['strength']; }
      else if (mapped === 'weight_loss') { disciplines = ['run', 'strength']; show_recomp = true; show_nutrition = true; }
      else { disciplines = ['run', 'strength']; }
    }

    return {
      user_id: user!.id,
      display_name: state.display_name,
      archetype: arch,
      goal_name,
      goal_date,
      goal_emoji,
      level,
      disciplines,
      training_days_per_week: training_days,
      weight,
      target_weight,
      body_fat_pct: null,
      has_injuries: has_injuries,
      equipment,
      show_nutrition,
      show_race_countdown,
      show_recomp,
      onboarding_completed: true,
      wellness_focuses: wellness_focuses,
    };
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    const profileData = buildProfileData();

    const { error: profileError } = await (supabase as any).from('user_profiles').insert(profileData);
    if (profileError) {
      toast.error('Kunde inte spara profil');
      setSaving(false);
      return;
    }

    // Also save to user_goals for mountain timeline
    await supabase.from('user_goals').upsert({
      user_id: user.id,
      goal_name: profileData.goal_name || 'Mitt mål',
      goal_date: profileData.goal_date,
      goal_emoji: profileData.goal_emoji,
      disciplines: profileData.disciplines,
    }, { onConflict: 'user_id' });

    // Update users table with name
    await supabase.from('users').update({ name: profileData.display_name }).eq('id', user.id);

    setSaving(false);
    navigate('/', { replace: true });
  };

  // Summary data
  const getSummary = () => {
    const d = buildProfileData();
    const archLabels: Record<string, string> = {
      triathlon: 'Triathlon', running: 'Löpning', strength: 'Styrka',
      weight_loss: 'Viktnedgång', wellness: 'Hälsa', custom: 'Eget mål',
    };
    return {
      goal: d.goal_name,
      date: d.goal_date,
      type: archLabels[d.archetype] || d.archetype,
      days: d.training_days_per_week,
    };
  };

  const renderStep = () => {
    switch (currentStepName) {
      case 'name':
        return (
          <StepContainer title="Hej! Vad heter du?">
            <Input
              value={state.display_name}
              onChange={e => set('display_name', e.target.value)}
              placeholder="Ditt förnamn"
              className="h-[52px] text-lg rounded-lg"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && canProceed() && goNext()}
            />
          </StepContainer>
        );

      case 'goal':
        return (
          <StepContainer title="Vad vill du uppnå?">
            <div className="space-y-3">
              {([
                { key: 'triathlon', emoji: '🏊', title: 'Triathlon / Ironman', desc: 'Träna för ett triathlon-lopp' },
                { key: 'running', emoji: '🏃', title: 'Löplopp', desc: 'Från 5K till ultramarathon' },
                { key: 'strength', emoji: '💪', title: 'Bli starkare', desc: 'Bygga muskler och styrka' },
                { key: 'weight_loss', emoji: '🎯', title: 'Gå ner i vikt', desc: 'Tappa fett, få bättre hälsa' },
                { key: 'wellness', emoji: '🌿', title: 'Bli hälsosammare', desc: 'Bättre vanor, mer energi' },
                { key: 'custom', emoji: '✨', title: 'Eget mål', desc: 'Beskriv ditt eget mål' },
              ] as const).map(opt => (
                <OptionCard
                  key={opt.key}
                  emoji={opt.emoji}
                  title={opt.title}
                  description={opt.desc}
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
          <StepContainer title="Vilken distans?">
            <div className="space-y-3">
              {[
                { key: 'sprint', label: 'Sprint', desc: '750m / 20km / 5km' },
                { key: 'olympic', label: 'Olympisk', desc: '1.5km / 40km / 10km' },
                { key: 'half', label: '70.3 / Halv-Ironman', desc: '1.9km / 90km / 21.1km' },
                { key: 'full', label: 'Full Ironman', desc: '3.8km / 180km / 42.2km' },
              ].map(opt => (
                <OptionCard key={opt.key} title={opt.label} description={opt.desc}
                  selected={state.tri_distance === opt.key}
                  onClick={() => { set('tri_distance', opt.key); setTimeout(goNext, 200); }} />
              ))}
            </div>
          </StepContainer>
        );

      case 'tri_race':
        return (
          <StepContainer title="Har du ett race inbokat?">
            <div className="space-y-3">
              <OptionCard title="Ja" description="Jag har ett specifikt lopp"
                selected={state.has_race === true} onClick={() => set('has_race', true)} />
              <OptionCard title="Nej, jag tränar generellt" description="Inget specifikt lopp ännu"
                selected={state.has_race === false} onClick={() => { set('has_race', false); setTimeout(goNext, 200); }} />
            </div>
            {state.has_race && (
              <div className="mt-4 space-y-3">
                <div className="space-y-1">
                  <Label className="text-sm">Loppets namn</Label>
                  <Input value={state.race_name} onChange={e => set('race_name', e.target.value)}
                    placeholder="t.ex. Ironman 70.3 Jönköping" className="h-[52px] rounded-lg" />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Datum</Label>
                  <DatePickerField date={state.race_date} onSelect={d => set('race_date', d)} />
                </div>
              </div>
            )}
          </StepContainer>
        );

      case 'tri_level':
        return (
          <StepContainer title="Hur är din nuvarande form?">
            <div className="space-y-3">
              {[
                { key: 'beginner', emoji: '🌱', label: 'Nybörjare', desc: 'Ny inom triathlon' },
                { key: 'intermediate', emoji: '📊', label: 'Medel', desc: 'Har tränat ett tag' },
                { key: 'advanced', emoji: '🔥', label: 'Erfaren', desc: 'Gjort flera lopp' },
              ].map(opt => (
                <OptionCard key={opt.key} emoji={opt.emoji} title={opt.label} description={opt.desc}
                  selected={state.tri_level === opt.key}
                  onClick={() => { set('tri_level', opt.key); setTimeout(goNext, 200); }} />
              ))}
            </div>
          </StepContainer>
        );

      // RUNNING
      case 'run_distance':
        return (
          <StepContainer title="Vilken distans siktar du på?">
            <div className="space-y-3">
              {['5K', '10K', 'Halvmarathon', 'Marathon', 'Ultra'].map(d => (
                <OptionCard key={d} title={d} selected={state.run_distance === d.toLowerCase().replace('halvmarathon','half')}
                  onClick={() => { set('run_distance', d.toLowerCase().replace('halvmarathon','half')); setTimeout(goNext, 200); }} />
              ))}
            </div>
          </StepContainer>
        );

      case 'run_race':
        return (
          <StepContainer title="Har du ett lopp inbokat?">
            <div className="space-y-3">
              <OptionCard title="Ja" description="Jag har ett specifikt lopp"
                selected={state.run_has_race === true} onClick={() => set('run_has_race', true)} />
              <OptionCard title="Nej" description="Tränar utan specifikt lopp"
                selected={state.run_has_race === false} onClick={() => { set('run_has_race', false); setTimeout(goNext, 200); }} />
            </div>
            {state.run_has_race && (
              <div className="mt-4 space-y-3">
                <div className="space-y-1">
                  <Label className="text-sm">Loppets namn</Label>
                  <Input value={state.run_race_name} onChange={e => set('run_race_name', e.target.value)}
                    placeholder="t.ex. Stockholm Marathon" className="h-[52px] rounded-lg" />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Datum</Label>
                  <DatePickerField date={state.run_race_date} onSelect={d => set('run_race_date', d)} />
                </div>
              </div>
            )}
          </StepContainer>
        );

      case 'run_frequency':
        return (
          <StepContainer title="Hur ofta springer du nu?">
            <div className="space-y-3">
              {[
                { key: 'low', label: '0-1 gånger/vecka', emoji: '🌱' },
                { key: 'medium', label: '2-3 gånger/vecka', emoji: '📊' },
                { key: 'high', label: '4+ gånger/vecka', emoji: '🔥' },
              ].map(opt => (
                <OptionCard key={opt.key} emoji={opt.emoji} title={opt.label}
                  selected={state.run_frequency === opt.key}
                  onClick={() => { set('run_frequency', opt.key); setTimeout(goNext, 200); }} />
              ))}
            </div>
          </StepContainer>
        );

      // STRENGTH
      case 'str_equipment':
        return (
          <StepContainer title="Vad har du tillgång till?">
            <div className="space-y-3">
              {[
                { key: 'full_gym', emoji: '🏋️', label: 'Fullt gym' },
                { key: 'home_gym', emoji: '🏠', label: 'Hemmagym / Grundutrustning' },
                { key: 'bodyweight', emoji: '🧘', label: 'Bara kroppsvikt' },
              ].map(opt => (
                <OptionCard key={opt.key} emoji={opt.emoji} title={opt.label}
                  selected={state.equipment === opt.key}
                  onClick={() => { set('equipment', opt.key); setTimeout(goNext, 200); }} />
              ))}
            </div>
          </StepContainer>
        );

      case 'str_injuries':
        return (
          <StepContainer title="Har du några skador eller begränsningar?">
            <div className="space-y-3">
              <OptionCard title="Nej, allt är bra" emoji="✅"
                selected={state.has_injuries === 'no'}
                onClick={() => { set('has_injuries', 'no'); setTimeout(goNext, 200); }} />
              <OptionCard title="Ja" emoji="⚠️"
                selected={state.has_injuries === 'yes'}
                onClick={() => set('has_injuries', 'yes')} />
            </div>
            {state.has_injuries === 'yes' && (
              <div className="mt-4 space-y-1">
                <Label className="text-sm">Beskriv kort</Label>
                <Textarea value={state.injury_text} onChange={e => set('injury_text', e.target.value)}
                  placeholder="t.ex. diskbråck L4-L5, undviker tunga marklyft" className="rounded-lg" rows={3} />
              </div>
            )}
          </StepContainer>
        );

      case 'str_days':
        return (
          <StepContainer title="Hur ofta vill du träna?">
            <div className="space-y-3">
              {[3, 4, 5, 6].map(d => (
                <OptionCard key={d} title={`${d} dagar/vecka`}
                  selected={state.strength_days === d}
                  onClick={() => { set('strength_days', d); setTimeout(goNext, 200); }} />
              ))}
            </div>
          </StepContainer>
        );

      // WEIGHT LOSS
      case 'wl_weight':
        return (
          <StepContainer title="Ungefär vad väger du idag?">
            <div className="space-y-2">
              <div className="relative">
                <Input type="number" value={state.weight} onChange={e => set('weight', e.target.value)}
                  placeholder="80" className="h-[52px] text-lg rounded-lg pr-12" autoFocus />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">kg</span>
              </div>
              <p className="text-sm text-muted-foreground">Du behöver inte svara exakt</p>
            </div>
          </StepContainer>
        );

      case 'wl_target':
        return (
          <StepContainer title="Vad är din målvikt?">
            <div className="space-y-3">
              <div className="relative">
                <Input type="number" value={state.target_weight} onChange={e => set('target_weight', e.target.value)}
                  placeholder={state.weight ? String(Math.round(Number(state.weight) * 0.9)) : '72'}
                  className="h-[52px] text-lg rounded-lg pr-12" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">kg</span>
              </div>
              <button onClick={() => { set('target_weight', ''); goNext(); }}
                className="w-full rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground hover:border-primary/40 transition-colors">
                Vet inte än
              </button>
            </div>
          </StepContainer>
        );

      case 'wl_activity':
        return (
          <StepContainer title="Tränar du idag?">
            <div className="space-y-3">
              {[
                { key: 'regular', emoji: '💪', label: 'Ja, regelbundet' },
                { key: 'sometimes', emoji: '🚶', label: 'Lite, ibland' },
                { key: 'none', emoji: '❌', label: 'Nej, vill börja' },
              ].map(opt => (
                <OptionCard key={opt.key} emoji={opt.emoji} title={opt.label}
                  selected={state.wl_activity === opt.key}
                  onClick={() => { set('wl_activity', opt.key); setTimeout(goNext, 200); }} />
              ))}
            </div>
          </StepContainer>
        );

      // WELLNESS
      case 'well_focus':
        return (
          <StepContainer title="Vad vill du fokusera på?" subtitle="Välj 1–3 alternativ">
            <div className="space-y-3">
              {[
                { key: 'rörelse', emoji: '🏃', label: 'Mer rörelse' },
                { key: 'kost', emoji: '🍎', label: 'Bättre kost' },
                { key: 'sömn', emoji: '😴', label: 'Bättre sömn' },
                { key: 'stress', emoji: '🧘', label: 'Mindre stress' },
              ].map(opt => {
                const sel = state.wellness_focuses.includes(opt.key);
                return (
                  <OptionCard key={opt.key} emoji={opt.emoji} title={opt.label} selected={sel}
                    onClick={() => {
                      const next = sel
                        ? state.wellness_focuses.filter(f => f !== opt.key)
                        : [...state.wellness_focuses, opt.key].slice(0, 3);
                      set('wellness_focuses', next);
                    }} />
                );
              })}
            </div>
          </StepContainer>
        );

      case 'well_activity':
        return (
          <StepContainer title="Hur aktiv är du idag?">
            <div className="space-y-3">
              {[
                { key: 'sedentary', label: 'Stillasittande' },
                { key: 'light', label: 'Lite aktiv' },
                { key: 'active', label: 'Aktiv' },
              ].map(opt => (
                <OptionCard key={opt.key} title={opt.label}
                  selected={state.wellness_activity === opt.key}
                  onClick={() => { set('wellness_activity', opt.key); setTimeout(goNext, 200); }} />
              ))}
            </div>
          </StepContainer>
        );

      // CUSTOM
      case 'cust_describe':
        return (
          <StepContainer title="Beskriv ditt mål">
            <Textarea value={state.custom_goal} onChange={e => set('custom_goal', e.target.value)}
              placeholder="T.ex. 'Jag vill kunna springa 5 km utan att stanna' eller 'Förbereda mig för en fjällvandring i sommar'"
              className="rounded-lg min-h-[120px] text-base" autoFocus />
          </StepContainer>
        );

      case 'cust_map':
        return (
          <StepContainer title="Mitt mål liknar mest...">
            <div className="space-y-3">
              {[
                { key: 'endurance', emoji: '🏃', label: 'Uthållighet / Kondition' },
                { key: 'strength', emoji: '💪', label: 'Styrka / Muskler' },
                { key: 'weight_loss', emoji: '🎯', label: 'Viktnedgång' },
                { key: 'wellness', emoji: '🌿', label: 'Allmän hälsa' },
              ].map(opt => (
                <OptionCard key={opt.key} emoji={opt.emoji} title={opt.label}
                  selected={state.custom_archetype === opt.key}
                  onClick={() => { set('custom_archetype', opt.key); setTimeout(goNext, 200); }} />
              ))}
            </div>
          </StepContainer>
        );

      case 'cust_date':
        return (
          <StepContainer title="När vill du nå ditt mål?">
            <div className="space-y-3">
              <DatePickerField date={state.custom_date} onSelect={d => set('custom_date', d)} />
              <button onClick={() => { set('custom_no_date', true); goNext(); }}
                className="w-full rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground hover:border-primary/40 transition-colors">
                Inget specifikt datum
              </button>
            </div>
          </StepContainer>
        );

      // SUMMARY
      case 'summary': {
        const summary = getSummary();
        return (
          <StepContainer title={`Redo att börja, ${state.display_name}! 🚀`}>
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <SummaryRow label="Mål" value={summary.goal || '–'} />
              <SummaryRow label="Datum" value={summary.date ? new Date(summary.date).toLocaleDateString('sv-SE') : 'Inget specifikt datum'} />
              <SummaryRow label="Typ" value={summary.type} />
              <SummaryRow label="Träningsdagar" value={`${summary.days} per vecka`} />
            </div>
            <Button onClick={handleFinish} disabled={saving}
              className="w-full h-[52px] text-base font-semibold rounded-lg mt-4">
              {saving ? 'Sparar...' : 'Starta min resa →'}
            </Button>
          </StepContainer>
        );
      }

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
            <ArrowLeft className="h-4 w-4" /> Tillbaka
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

      {/* Next button (except for summary and auto-advance steps) */}
      {currentStepName !== 'summary' && currentStepName !== 'goal' && (
        <div className="sticky bottom-0 px-4 pb-6 pt-2 bg-gradient-to-t from-background/80 to-transparent">
          <div className="mx-auto max-w-[480px]">
            <Button onClick={goNext} disabled={!canProceed()}
              className="w-full h-[52px] text-base font-semibold rounded-lg">
              Nästa →
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

function OptionCard({ emoji, title, description, selected, onClick }: {
  emoji?: string; title: string; description?: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
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

function DatePickerField({ date, onSelect }: { date: Date | undefined; onSelect: (d: Date | undefined) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("w-full h-[52px] justify-start text-left font-normal rounded-lg",
          !date && "text-muted-foreground")}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP', { locale: sv }) : 'Välj datum'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={onSelect}
          disabled={d => d < new Date()}
          initialFocus className={cn("p-3 pointer-events-auto")} />
      </PopoverContent>
    </Popover>
  );
}
