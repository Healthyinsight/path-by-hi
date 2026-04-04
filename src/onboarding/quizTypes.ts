export type Archetype =
  | 'triathlon'
  | 'running'
  | 'strength'
  | 'weight_loss'
  | 'wellness'
  | 'custom';

export type TriDistanceKey = 'sprint' | 'olympic' | 'half' | 'full';

export type RunDistanceKey = '5k' | '10k' | 'half' | 'marathon' | 'ultra';

export type TriLevelKey = 'beginner' | 'intermediate' | 'advanced';

export type RunFrequencyKey = 'low' | 'medium' | 'high';

export type StrengthEquipmentKey = 'full_gym' | 'home_gym' | 'bodyweight';

export type WlActivityKey = 'regular' | 'sometimes' | 'none';

export type WellnessFocusKey = 'rörelse' | 'kost' | 'sömn' | 'stress';

export type WellnessActivityKey = 'sedentary' | 'light' | 'active';

export type CustomMapKey = 'endurance' | 'strength' | 'weight_loss' | 'wellness';

export interface QuizState {
  display_name: string;
  trail_name: string;
  archetype: Archetype | '';
  tri_distance: TriDistanceKey | '';
  has_race: boolean | null;
  race_name: string;
  race_date: Date | undefined;
  race_autofilled: boolean;
  tri_level: TriLevelKey | '';
  run_distance: RunDistanceKey | '';
  run_has_race: boolean | null;
  run_race_name: string;
  run_race_date: Date | undefined;
  run_race_autofilled: boolean;
  run_frequency: RunFrequencyKey | '';
  equipment: StrengthEquipmentKey | '';
  has_injuries: 'yes' | 'no' | '';
  injury_text: string;
  strength_days: number;
  weight: string;
  target_weight: string;
  wl_activity: WlActivityKey | '';
  wellness_focuses: WellnessFocusKey[];
  wellness_activity: WellnessActivityKey | '';
  custom_goal: string;
  custom_archetype: CustomMapKey | '';
  custom_date: Date | undefined;
  custom_no_date: boolean;
}

export const initialQuizState: QuizState = {
  display_name: '',
  trail_name: '',
  archetype: '',
  tri_distance: '',
  has_race: null,
  race_name: '',
  race_date: undefined,
  race_autofilled: false,
  tri_level: '',
  run_distance: '',
  run_has_race: null,
  run_race_name: '',
  run_race_date: undefined,
  run_race_autofilled: false,
  run_frequency: '',
  equipment: '',
  has_injuries: '',
  injury_text: '',
  strength_days: 4,
  weight: '',
  target_weight: '',
  wl_activity: '',
  wellness_focuses: [],
  wellness_activity: '',
  custom_goal: '',
  custom_archetype: '',
  custom_date: undefined,
  custom_no_date: false,
};
