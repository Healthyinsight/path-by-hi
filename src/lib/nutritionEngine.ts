import type { TFunction } from 'i18next';

export interface NutritionTargets {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  balance: number;
  tipKey: 'strength' | 'long_distance' | 'vo2max' | 'long_swim' | 'technique_intervals' | 'rest';
}

export interface MealSuggestion {
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

const TARGETS: Record<string, NutritionTargets> = {
  strength: {
    kcal: 2400,
    protein: 175,
    carbs: 250,
    fat: 75,
    balance: -200,
    tipKey: 'strength',
  },
  long_distance: {
    kcal: 2700,
    protein: 170,
    carbs: 340,
    fat: 70,
    balance: 0,
    tipKey: 'long_distance',
  },
  vo2max: {
    kcal: 2500,
    protein: 170,
    carbs: 290,
    fat: 72,
    balance: -100,
    tipKey: 'vo2max',
  },
  long_swim: {
    kcal: 2550,
    protein: 170,
    carbs: 310,
    fat: 70,
    balance: -100,
    tipKey: 'long_swim',
  },
  technique_intervals: {
    kcal: 2350,
    protein: 175,
    carbs: 260,
    fat: 70,
    balance: -250,
    tipKey: 'technique_intervals',
  },
  rest: {
    kcal: 2200,
    protein: 180,
    carbs: 200,
    fat: 75,
    balance: -400,
    tipKey: 'rest',
  },
};

export function getNutritionTargets(
  plannedType?: string | null,
  plannedSubtype?: string | null,
): NutritionTargets {
  if (!plannedType || plannedType === 'rest') return TARGETS.rest;
  if (plannedSubtype && TARGETS[plannedSubtype]) return TARGETS[plannedSubtype];
  if (plannedType === 'strength') return TARGETS.strength;
  return TARGETS.rest;
}

/** @deprecated use getTrainingLabelI18n */
export function getTrainingLabel(
  plannedType?: string | null,
  plannedSubtype?: string | null,
  plannedSport?: string | null,
): string {
  if (!plannedType || plannedType === 'rest') return 'Vila';
  const sportLabels: Record<string, string> = {
    bike: 'Cykling',
    run: 'Löpning',
    swim: 'Simning',
    strength: 'Styrka',
  };
  const subtypeLabels: Record<string, string> = {
    long_distance: 'Långdistans',
    vo2max: 'VO2max',
    upper: 'Överkropp',
    lower: 'Underkropp',
    long_swim: 'Långsim',
    technique_intervals: 'Teknik & Intervaller',
  };
  const sport = sportLabels[plannedSport || ''] || plannedType;
  const sub = subtypeLabels[plannedSubtype || ''] || '';
  return sub ? `${sport} – ${sub}` : sport;
}

export function getTrainingLabelI18n(
  t: TFunction,
  plannedType?: string | null,
  plannedSubtype?: string | null,
  plannedSport?: string | null,
): string {
  if (!plannedType || plannedType === 'rest') return t('nutritionEngine.restLabel');
  const sportKeys = ['bike', 'run', 'swim', 'strength'] as const;
  const sport =
    plannedSport && sportKeys.includes(plannedSport as (typeof sportKeys)[number])
      ? t(`sports.${plannedSport}`)
      : plannedType;
  const subKeys = ['long_distance', 'vo2max', 'upper', 'lower', 'long_swim', 'technique_intervals'] as const;
  const sub =
    plannedSubtype && subKeys.includes(plannedSubtype as (typeof subKeys)[number])
      ? t(`subtypes.${plannedSubtype}`)
      : '';
  return sub ? `${sport} – ${sub}` : sport;
}

/** @deprecated use getBalanceTextI18n */
export function getBalanceText(balance: number): string {
  if (balance === 0) return 'Underhåll (maintenance)';
  return `${balance} kcal underskott`;
}

export function getBalanceTextI18n(t: TFunction, balance: number): string {
  if (balance === 0) return t('nutrition.balance.maintenance');
  return t('nutrition.balance.deficit', { balance });
}

const STRENGTH_SV: MealSuggestion[] = [
  { name: 'Havregrynsgröt + proteinpulver + bär', kcal: 400, protein: 35, carbs: 50, fat: 8 },
  { name: 'Kycklingfilé + ris + grönsaker', kcal: 550, protein: 45, carbs: 55, fat: 12 },
  { name: 'Post-workout proteinshake + banan', kcal: 300, protein: 30, carbs: 35, fat: 5 },
  { name: 'Lax + sötpotatis + sallad', kcal: 600, protein: 40, carbs: 50, fat: 18 },
  { name: 'Kvarg + nötter', kcal: 250, protein: 25, carbs: 15, fat: 10 },
];

const STRENGTH_EN: MealSuggestion[] = [
  { name: 'Oats + protein powder + berries', kcal: 400, protein: 35, carbs: 50, fat: 8 },
  { name: 'Chicken + rice + vegetables', kcal: 550, protein: 45, carbs: 55, fat: 12 },
  { name: 'Post-workout shake + banana', kcal: 300, protein: 30, carbs: 35, fat: 5 },
  { name: 'Salmon + sweet potato + salad', kcal: 600, protein: 40, carbs: 50, fat: 18 },
  { name: 'Skyr + nuts', kcal: 250, protein: 25, carbs: 15, fat: 10 },
];

const LONG_SV: MealSuggestion[] = [
  { name: 'Stor havregrynsgröt + honung + banan', kcal: 500, protein: 25, carbs: 80, fat: 10 },
  { name: 'Pre-workout energy bar', kcal: 200, protein: 5, carbs: 35, fat: 6 },
  { name: 'Pasta + kycklinggryta (post-workout)', kcal: 700, protein: 45, carbs: 85, fat: 15 },
  { name: 'Ris + protein + grönsaker', kcal: 600, protein: 40, carbs: 70, fat: 12 },
  { name: 'Kvarg + granola', kcal: 300, protein: 25, carbs: 35, fat: 8 },
];

const LONG_EN: MealSuggestion[] = [
  { name: 'Large oatmeal + honey + banana', kcal: 500, protein: 25, carbs: 80, fat: 10 },
  { name: 'Pre-workout energy bar', kcal: 200, protein: 5, carbs: 35, fat: 6 },
  { name: 'Pasta + chicken (post-workout)', kcal: 700, protein: 45, carbs: 85, fat: 15 },
  { name: 'Rice + protein + vegetables', kcal: 600, protein: 40, carbs: 70, fat: 12 },
  { name: 'Skyr + granola', kcal: 300, protein: 25, carbs: 35, fat: 8 },
];

const VO2_SV: MealSuggestion[] = [
  { name: 'Äggmuffins + smoothie', kcal: 400, protein: 30, carbs: 40, fat: 12 },
  { name: 'Balanserad lunchmåltid', kcal: 500, protein: 35, carbs: 50, fat: 14 },
  { name: 'Post-workout proteinshake + frukt', kcal: 300, protein: 30, carbs: 30, fat: 5 },
  { name: 'Fisk + potatis + grönsaker', kcal: 550, protein: 40, carbs: 50, fat: 14 },
  { name: 'Kvarg', kcal: 200, protein: 25, carbs: 12, fat: 4 },
];

const VO2_EN: MealSuggestion[] = [
  { name: 'Egg muffins + smoothie', kcal: 400, protein: 30, carbs: 40, fat: 12 },
  { name: 'Balanced lunch', kcal: 500, protein: 35, carbs: 50, fat: 14 },
  { name: 'Post-workout shake + fruit', kcal: 300, protein: 30, carbs: 30, fat: 5 },
  { name: 'Fish + potatoes + vegetables', kcal: 550, protein: 40, carbs: 50, fat: 14 },
  { name: 'Skyr', kcal: 200, protein: 25, carbs: 12, fat: 4 },
];

const REST_SV: MealSuggestion[] = [
  { name: 'Ägg + avokado + fullkornsbröd', kcal: 400, protein: 25, carbs: 30, fat: 22 },
  { name: 'Kyckling + sallad + olivolja', kcal: 450, protein: 40, carbs: 15, fat: 25 },
  { name: 'Kvarg + bär + nötter', kcal: 300, protein: 30, carbs: 20, fat: 12 },
  { name: 'Lax + grönsaker', kcal: 500, protein: 38, carbs: 15, fat: 28 },
  { name: 'Proteinshake', kcal: 200, protein: 30, carbs: 10, fat: 3 },
];

const REST_EN: MealSuggestion[] = [
  { name: 'Eggs + avocado + wholegrain bread', kcal: 400, protein: 25, carbs: 30, fat: 22 },
  { name: 'Chicken + salad + olive oil', kcal: 450, protein: 40, carbs: 15, fat: 25 },
  { name: 'Skyr + berries + nuts', kcal: 300, protein: 30, carbs: 20, fat: 12 },
  { name: 'Salmon + vegetables', kcal: 500, protein: 38, carbs: 15, fat: 28 },
  { name: 'Protein shake', kcal: 200, protein: 30, carbs: 10, fat: 3 },
];

export function getMealSuggestions(plannedSubtype: string | null | undefined, locale: 'sv' | 'en'): MealSuggestion[] {
  const en = locale === 'en';
  switch (plannedSubtype) {
    case 'long_distance':
    case 'long_swim':
      return en ? LONG_EN : LONG_SV;
    case 'vo2max':
      return en ? VO2_EN : VO2_SV;
    case 'upper':
    case 'lower':
      return en ? STRENGTH_EN : STRENGTH_SV;
    default:
      return en ? REST_EN : REST_SV;
  }
}
