export interface NutritionTargets {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  balance: number;
  tip: string;
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
    kcal: 2400, protein: 175, carbs: 250, fat: 75, balance: -200,
    tip: 'Fokus på protein efter passet. Proteinshake + snabb kolhydrat inom 2h.',
  },
  long_distance: {
    kcal: 2700, protein: 170, carbs: 340, fat: 70, balance: 0,
    tip: 'Fuel under passet! 30-60g carbs/h om >90 min. Stor portion carbs efter.',
  },
  vo2max: {
    kcal: 2500, protein: 170, carbs: 290, fat: 72, balance: -100,
    tip: 'Moderat carbs, bra recovery-måltid efter. Protein + frukt som post-workout.',
  },
  long_swim: {
    kcal: 2550, protein: 170, carbs: 310, fat: 70, balance: -100,
    tip: 'Liknande långpass. Ät bra från morgonen, recovery-måltid efter.',
  },
  technique_intervals: {
    kcal: 2350, protein: 175, carbs: 260, fat: 70, balance: -250,
    tip: 'Lättare dag kalomässigt. Håll proteinet högt!',
  },
  rest: {
    kcal: 2200, protein: 180, carbs: 200, fat: 75, balance: -400,
    tip: 'Vilodagar = återhämtning. Protein fortfarande högt, carbs lägre.',
  },
};

export function getNutritionTargets(
  plannedType?: string | null,
  plannedSubtype?: string | null
): NutritionTargets {
  if (!plannedType || plannedType === 'rest') return TARGETS.rest;
  if (plannedSubtype && TARGETS[plannedSubtype]) return TARGETS[plannedSubtype];
  if (plannedType === 'strength') return TARGETS.strength;
  return TARGETS.rest;
}

export function getTrainingLabel(
  plannedType?: string | null,
  plannedSubtype?: string | null,
  plannedSport?: string | null
): string {
  if (!plannedType || plannedType === 'rest') return 'Vila';
  const sportLabels: Record<string, string> = {
    bike: 'Cykling', run: 'Löpning', swim: 'Simning', strength: 'Styrka',
  };
  const subtypeLabels: Record<string, string> = {
    long_distance: 'Långdistans', vo2max: 'VO2max', upper: 'Överkropp',
    lower: 'Underkropp', long_swim: 'Långsim', technique_intervals: 'Teknik & Intervaller',
  };
  const sport = sportLabels[plannedSport || ''] || plannedType;
  const sub = subtypeLabels[plannedSubtype || ''] || '';
  return sub ? `${sport} – ${sub}` : sport;
}

export function getBalanceText(balance: number): string {
  if (balance === 0) return 'Underhåll (maintenance)';
  return `${balance} kcal underskott`;
}

const STRENGTH_SUGGESTIONS: MealSuggestion[] = [
  { name: 'Havregrynsgröt + proteinpulver + bär', kcal: 400, protein: 35, carbs: 50, fat: 8 },
  { name: 'Kycklingfilé + ris + grönsaker', kcal: 550, protein: 45, carbs: 55, fat: 12 },
  { name: 'Post-workout proteinshake + banan', kcal: 300, protein: 30, carbs: 35, fat: 5 },
  { name: 'Lax + sötpotatis + sallad', kcal: 600, protein: 40, carbs: 50, fat: 18 },
  { name: 'Kvarg + nötter', kcal: 250, protein: 25, carbs: 15, fat: 10 },
];

const LONG_DISTANCE_SUGGESTIONS: MealSuggestion[] = [
  { name: 'Stor havregrynsgröt + honung + banan', kcal: 500, protein: 25, carbs: 80, fat: 10 },
  { name: 'Pre-workout energibar', kcal: 200, protein: 5, carbs: 35, fat: 6 },
  { name: 'Pasta + kycklinggryta (post-workout)', kcal: 700, protein: 45, carbs: 85, fat: 15 },
  { name: 'Ris + protein + grönsaker', kcal: 600, protein: 40, carbs: 70, fat: 12 },
  { name: 'Kvarg + granola', kcal: 300, protein: 25, carbs: 35, fat: 8 },
];

const VO2MAX_SUGGESTIONS: MealSuggestion[] = [
  { name: 'Äggmuffins + smoothie', kcal: 400, protein: 30, carbs: 40, fat: 12 },
  { name: 'Balanserad lunchmåltid', kcal: 500, protein: 35, carbs: 50, fat: 14 },
  { name: 'Post-workout proteinshake + frukt', kcal: 300, protein: 30, carbs: 30, fat: 5 },
  { name: 'Fisk + potatis + grönsaker', kcal: 550, protein: 40, carbs: 50, fat: 14 },
  { name: 'Kvarg', kcal: 200, protein: 25, carbs: 12, fat: 4 },
];

const REST_SUGGESTIONS: MealSuggestion[] = [
  { name: 'Ägg + avokado + fullkornsbröd', kcal: 400, protein: 25, carbs: 30, fat: 22 },
  { name: 'Kyckling + sallad + olivolja', kcal: 450, protein: 40, carbs: 15, fat: 25 },
  { name: 'Kvarg + bär + nötter', kcal: 300, protein: 30, carbs: 20, fat: 12 },
  { name: 'Lax + grönsaker', kcal: 500, protein: 38, carbs: 15, fat: 28 },
  { name: 'Proteinshake', kcal: 200, protein: 30, carbs: 10, fat: 3 },
];

export function getMealSuggestions(plannedSubtype?: string | null): MealSuggestion[] {
  switch (plannedSubtype) {
    case 'long_distance':
    case 'long_swim':
      return LONG_DISTANCE_SUGGESTIONS;
    case 'vo2max':
      return VO2MAX_SUGGESTIONS;
    case 'upper':
    case 'lower':
      return STRENGTH_SUGGESTIONS;
    default:
      return REST_SUGGESTIONS;
  }
}
