import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BottomNav } from '@/components/BottomNav';
import { MacroRing } from '@/components/MacroRing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Utensils, Lightbulb, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';
import {
  getNutritionTargets, getTrainingLabelI18n, getBalanceTextI18n, getMealSuggestions,
  type MealSuggestion,
} from '@/lib/nutritionEngine';
import { generateForToday } from '@/services/nutritionService';

interface Meal {
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export default function Nutrition() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [plan, setPlan] = useState<any>(null);
  const [schedule, setSchedule] = useState<any>(null);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [mealName, setMealName] = useState('');
  const [mealKcal, setMealKcal] = useState('');
  const [mealProtein, setMealProtein] = useState('');
  const [mealCarbs, setMealCarbs] = useState('');
  const [mealFat, setMealFat] = useState('');
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => { if (user) loadData(); }, [user]);

  const loadData = async () => {
    if (!user) return;
    const [{ data: schedData }, { data: planData }] = await Promise.all([
      supabase.from('training_schedule').select('*').eq('user_id', user.id).eq('date', today).single(),
      supabase.from('nutrition_plan').select('*').eq('user_id', user.id).eq('date', today).single(),
    ]);
    setSchedule(schedData);
    if (planData) { setPlan(planData); }
    else {
      await generateForToday(user.id);
      const { data: newPlan } = await supabase.from('nutrition_plan').select('*').eq('user_id', user.id).eq('date', today).single();
      if (newPlan) setPlan(newPlan);
    }
  };

  const getMeals = (): Meal[] => {
    if (!plan?.meals) return [];
    return (Array.isArray(plan.meals) ? plan.meals : []) as Meal[];
  };

  const saveMeals = async (updatedMeals: Meal[]) => {
    if (!plan) return;
    const newActuals = updatedMeals.reduce(
      (acc, m) => ({ actual_kcal: acc.actual_kcal + m.kcal, actual_protein: acc.actual_protein + m.protein, actual_carbs: acc.actual_carbs + m.carbs, actual_fat: acc.actual_fat + m.fat }),
      { actual_kcal: 0, actual_protein: 0, actual_carbs: 0, actual_fat: 0 }
    );
    const { error } = await supabase.from('nutrition_plan').update({ meals: updatedMeals as unknown as Json, ...newActuals }).eq('id', plan.id);
    if (error) { toast.error(t('nutrition.toastSaveFail')); }
    else { setPlan({ ...plan, meals: updatedMeals, ...newActuals }); }
  };

  const addMeal = async () => {
    if (!plan || !mealName) return;
    const meal: Meal = { name: mealName, kcal: Number(mealKcal) || 0, protein: Number(mealProtein) || 0, carbs: Number(mealCarbs) || 0, fat: Number(mealFat) || 0 };
    await saveMeals([...getMeals(), meal]);
    clearForm();
    toast.success(t('nutrition.toastMealAdded'));
  };

  const deleteMeal = async (index: number) => {
    const meals = getMeals();
    meals.splice(index, 1);
    await saveMeals(meals);
    toast.success(t('nutrition.toastMealRemoved'));
  };

  const prefillSuggestion = (s: MealSuggestion) => {
    setMealName(s.name); setMealKcal(String(s.kcal)); setMealProtein(String(s.protein));
    setMealCarbs(String(s.carbs)); setMealFat(String(s.fat));
    setShowAddMeal(true); setSuggestionsOpen(false);
  };

  const clearForm = () => {
    setMealName(''); setMealKcal(''); setMealProtein(''); setMealCarbs(''); setMealFat('');
    setShowAddMeal(false);
  };

  const meals = getMeals();
  const targets = getNutritionTargets(schedule?.planned_type, schedule?.planned_subtype);
  const trainingLabel = getTrainingLabelI18n(t, schedule?.planned_type, schedule?.planned_subtype, schedule?.planned_sport);
  const suggestions = getMealSuggestions(schedule?.planned_subtype, i18n.language === 'en' ? 'en' : 'sv');

  const remaining = {
    kcal: Math.max(0, (plan?.target_kcal || targets.kcal) - (plan?.actual_kcal || 0)),
    protein: Math.max(0, (plan?.target_protein || targets.protein) - (plan?.actual_protein || 0)),
    carbs: Math.max(0, (plan?.target_carbs || targets.carbs) - (plan?.actual_carbs || 0)),
    fat: Math.max(0, (plan?.target_fat || targets.fat) - (plan?.actual_fat || 0)),
  };

  const hour = new Date().getHours();

  return (
    <div className="app-container pt-6">
      <h1 className="mb-1 text-xl tracking-tight">{t('nutrition.title')}</h1>
      <div className="mb-1 flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{trainingLabel}</span>
        <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-medium text-secondary">
          {getBalanceTextI18n(t, targets.balance)}
        </span>
      </div>
      <p className="mb-5 text-xs text-muted-foreground">{today}</p>

      {/* 2x2 Macro Rings */}
      <div className="card-athletic mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex justify-center">
            <MacroRing label={t('today.calories')} current={plan?.actual_kcal || 0} target={plan?.target_kcal || targets.kcal} unit="" color="hsl(var(--primary))" size={90} />
          </div>
          <div className="flex justify-center">
            <MacroRing label={t('today.protein')} current={plan?.actual_protein || 0} target={plan?.target_protein || targets.protein} unit="g" color="hsl(var(--nutrition-protein))" size={90} />
          </div>
          <div className="flex justify-center">
            <MacroRing label={t('today.carbs')} current={plan?.actual_carbs || 0} target={plan?.target_carbs || targets.carbs} unit="g" color="hsl(var(--nutrition-carbs))" size={90} />
          </div>
          <div className="flex justify-center">
            <MacroRing label={t('today.fat')} current={plan?.actual_fat || 0} target={plan?.target_fat || targets.fat} unit="g" color="hsl(var(--nutrition-fat))" size={90} />
          </div>
        </div>
      </div>

      {/* Daily Tip */}
      <div className="tip-callout mb-4 flex items-start gap-3">
        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p className="text-sm text-foreground">{t(`nutrition.tips.${targets.tipKey}` as 'nutrition.tips.rest')}</p>
      </div>

      {/* Add Meal */}
      {showAddMeal ? (
        <div className="card-athletic mb-4 space-y-3">
          <p className="font-semibold">{t('nutrition.addMeal')}</p>
          <div className="space-y-2">
            <Label>{t('nutrition.mealName')}</Label>
            <Input value={mealName} onChange={(e) => setMealName(e.target.value)} placeholder={t('nutrition.mealPlaceholder')} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1"><Label className="text-xs">kcal</Label><Input type="number" value={mealKcal} onChange={(e) => setMealKcal(e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">{t('today.protein')} (g)</Label><Input type="number" value={mealProtein} onChange={(e) => setMealProtein(e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">{t('today.carbs')} (g)</Label><Input type="number" value={mealCarbs} onChange={(e) => setMealCarbs(e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">{t('today.fat')} (g)</Label><Input type="number" value={mealFat} onChange={(e) => setMealFat(e.target.value)} /></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={addMeal} className="flex-1 touch-target">{t('common.save')}</Button>
            <Button variant="outline" onClick={clearForm} className="touch-target">{t('common.cancel')}</Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setShowAddMeal(true)} variant="outline" className="mb-4 w-full touch-target">
          <Plus className="mr-2 h-4 w-4" /> {t('nutrition.addMeal')}
        </Button>
      )}

      {/* Meal List */}
      {meals.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('nutrition.mealsToday')}</p>
          {meals.map((meal, i) => (
            <div key={i} className="card-athletic flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Utensils className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{meal.name}</p>
                  <div className="flex gap-2 font-data text-[10px] text-muted-foreground" style={{ fontFeatureSettings: "'tnum' 1" }}>
                    <span>{meal.kcal} kcal</span><span>{meal.protein}p</span><span>{meal.carbs}c</span><span>{meal.fat}f</span>
                  </div>
                </div>
              </div>
              <button onClick={() => deleteMeal(i)} className="touch-target flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors duration-200">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Remaining */}
      <div className="card-athletic mb-4">
        <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">{t('nutrition.remainingTitle')}</p>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div><p className="font-data text-lg font-bold" style={{ fontFeatureSettings: "'tnum' 1" }}>{remaining.kcal}</p><p className="text-[10px] text-muted-foreground">kcal</p></div>
          <div><p className="font-data text-lg font-bold text-nutrition-protein" style={{ fontFeatureSettings: "'tnum' 1" }}>{remaining.protein}</p><p className="text-[10px] text-muted-foreground">protein</p></div>
          <div><p className="font-data text-lg font-bold text-nutrition-carbs" style={{ fontFeatureSettings: "'tnum' 1" }}>{remaining.carbs}</p><p className="text-[10px] text-muted-foreground">carbs</p></div>
          <div><p className="font-data text-lg font-bold text-nutrition-fat" style={{ fontFeatureSettings: "'tnum' 1" }}>{remaining.fat}</p><p className="text-[10px] text-muted-foreground">fett</p></div>
        </div>
        {hour >= 18 && remaining.protein > 30 && (
          <p className="mt-3 text-xs text-primary">{t('nutrition.eveningTip')}</p>
        )}
      </div>

      {/* Meal Suggestions */}
      <Collapsible open={suggestionsOpen} onOpenChange={setSuggestionsOpen}>
        <div className="card-athletic mb-4">
          <CollapsibleTrigger className="flex w-full items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('nutrition.suggestionsTitle')}</p>
            {suggestionsOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-2">
            {suggestions.map((s, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3">
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="font-data text-[10px] text-muted-foreground" style={{ fontFeatureSettings: "'tnum' 1" }}>{s.kcal} kcal · {s.protein}p · {s.carbs}c · {s.fat}f</p>
                </div>
                <button onClick={() => prefillSuggestion(s)} className="touch-target flex items-center justify-center rounded-lg bg-primary/10 p-2 text-primary transition-colors duration-200 hover:bg-primary/20">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            ))}
          </CollapsibleContent>
        </div>
      </Collapsible>

      <BottomNav />
    </div>
  );
}
