import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BottomNav } from '@/components/BottomNav';
import { MacroRing } from '@/components/MacroRing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Utensils } from 'lucide-react';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

interface Meal {
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

const MACRO_TARGETS: Record<string, { kcal: number; protein: number; carbs: number; fat: number }> = {
  strength: { kcal: 2400, protein: 175, carbs: 250, fat: 75 },
  long_distance: { kcal: 2700, protein: 170, carbs: 340, fat: 70 },
  vo2max: { kcal: 2500, protein: 170, carbs: 290, fat: 72 },
  long_swim: { kcal: 2550, protein: 170, carbs: 310, fat: 70 },
  technique: { kcal: 2350, protein: 175, carbs: 260, fat: 70 },
  rest: { kcal: 2200, protein: 170, carbs: 230, fat: 70 },
};

export default function Nutrition() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<any>(null);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [mealName, setMealName] = useState('');
  const [mealKcal, setMealKcal] = useState('');
  const [mealProtein, setMealProtein] = useState('');
  const [mealCarbs, setMealCarbs] = useState('');
  const [mealFat, setMealFat] = useState('');
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user) return;
    loadPlan();
  }, [user]);

  const loadPlan = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('nutrition_plan')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    if (data) {
      setPlan(data);
    } else {
      // Auto-create plan based on today's training
      const { data: sched } = await supabase
        .from('training_schedule')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      const trainingType = sched?.planned_subtype || sched?.planned_type || 'rest';
      const targets = MACRO_TARGETS[trainingType] || MACRO_TARGETS.rest;

      const { data: newPlan } = await supabase
        .from('nutrition_plan')
        .insert({
          user_id: user.id,
          date: today,
          training_type: trainingType,
          target_kcal: targets.kcal,
          target_protein: targets.protein,
          target_carbs: targets.carbs,
          target_fat: targets.fat,
          actual_kcal: 0,
          actual_protein: 0,
          actual_carbs: 0,
          actual_fat: 0,
          meals: [] as unknown as Json,
        })
        .select()
        .single();

      if (newPlan) setPlan(newPlan);
    }
  };

  const getMeals = (): Meal[] => {
    if (!plan?.meals) return [];
    return (Array.isArray(plan.meals) ? plan.meals : []) as Meal[];
  };

  const addMeal = async () => {
    if (!plan || !mealName) return;
    const meal: Meal = {
      name: mealName,
      kcal: Number(mealKcal) || 0,
      protein: Number(mealProtein) || 0,
      carbs: Number(mealCarbs) || 0,
      fat: Number(mealFat) || 0,
    };

    const updatedMeals = [...getMeals(), meal];
    const newActuals = {
      actual_kcal: (plan.actual_kcal || 0) + meal.kcal,
      actual_protein: (plan.actual_protein || 0) + meal.protein,
      actual_carbs: (plan.actual_carbs || 0) + meal.carbs,
      actual_fat: (plan.actual_fat || 0) + meal.fat,
    };

    const { error } = await supabase
      .from('nutrition_plan')
      .update({ meals: updatedMeals as unknown as Json, ...newActuals })
      .eq('id', plan.id);

    if (error) {
      toast.error('Failed to add meal');
    } else {
      setPlan({ ...plan, meals: updatedMeals, ...newActuals });
      setMealName('');
      setMealKcal('');
      setMealProtein('');
      setMealCarbs('');
      setMealFat('');
      setShowAddMeal(false);
      toast.success('Meal added!');
    }
  };

  const meals = getMeals();

  return (
    <div className="app-container pt-6">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">Nutrition</h1>
      <p className="mb-6 text-sm text-muted-foreground capitalize">
        {plan?.training_type?.replace(/_/g, ' ') || 'Rest'} day targets
      </p>

      {/* Macro rings */}
      <div className="card-athletic mb-4">
        <div className="flex items-center justify-around">
          <MacroRing
            label="Kcal"
            current={plan?.actual_kcal || 0}
            target={plan?.target_kcal || 2200}
            unit=""
            color="hsl(var(--primary))"
            size={72}
          />
          <MacroRing
            label="Protein"
            current={plan?.actual_protein || 0}
            target={plan?.target_protein || 170}
            unit="g"
            color="hsl(var(--strength))"
            size={72}
          />
          <MacroRing
            label="Carbs"
            current={plan?.actual_carbs || 0}
            target={plan?.target_carbs || 250}
            unit="g"
            color="hsl(var(--cardio))"
            size={72}
          />
          <MacroRing
            label="Fat"
            current={plan?.actual_fat || 0}
            target={plan?.target_fat || 70}
            unit="g"
            color="hsl(var(--swim))"
            size={72}
          />
        </div>
      </div>

      {/* Add meal */}
      {showAddMeal ? (
        <div className="card-athletic mb-4 space-y-3">
          <p className="font-semibold">Add Meal</p>
          <div className="space-y-2">
            <Label>Meal name</Label>
            <Input value={mealName} onChange={(e) => setMealName(e.target.value)} placeholder="e.g. Lunch" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Kcal</Label>
              <Input type="number" value={mealKcal} onChange={(e) => setMealKcal(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Protein (g)</Label>
              <Input type="number" value={mealProtein} onChange={(e) => setMealProtein(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Carbs (g)</Label>
              <Input type="number" value={mealCarbs} onChange={(e) => setMealCarbs(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fat (g)</Label>
              <Input type="number" value={mealFat} onChange={(e) => setMealFat(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={addMeal} className="flex-1 touch-target">Save</Button>
            <Button variant="outline" onClick={() => setShowAddMeal(false)} className="touch-target">Cancel</Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setShowAddMeal(true)} variant="outline" className="mb-4 w-full touch-target">
          <Plus className="mr-2 h-4 w-4" />
          Add Meal
        </Button>
      )}

      {/* Meal list */}
      <div className="space-y-2">
        {meals.map((meal, i) => (
          <div key={i} className="card-athletic flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Utensils className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{meal.name}</p>
                <p className="text-xs text-muted-foreground">
                  {meal.protein}p · {meal.carbs}c · {meal.fat}f
                </p>
              </div>
            </div>
            <span className="font-mono text-sm font-semibold">{meal.kcal}</span>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
