export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  garmin_user_id: string | null;
  garmin_access_token: string | null;
  garmin_access_secret: string | null;
  current_weight: number;
  height_cm: number;
  body_fat_pct: number;
  ftp_watts: number;
  run_threshold_pace: string;
  vo2max_estimate: number;
  training_phase: string;
  created_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  garmin_activity_id: string | null;
  type: 'run' | 'bike' | 'swim' | 'strength';
  start_time: string;
  duration_seconds: number;
  distance_meters: number | null;
  avg_hr: number | null;
  max_hr: number | null;
  calories: number | null;
  avg_pace: string | null;
  avg_power: number | null;
  training_zones: Record<string, unknown> | null;
  source: string;
  created_at: string;
}

export interface TrainingSchedule {
  id: string;
  user_id: string;
  date: string;
  planned_type: 'cardio' | 'strength' | 'swim' | 'rest';
  planned_subtype: string | null;
  planned_sport: string | null;
  planned_details: string | null;
  completed: boolean;
  activity_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface NutritionPlan {
  id: string;
  user_id: string;
  date: string;
  training_type: string | null;
  target_kcal: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  actual_kcal: number;
  actual_protein: number;
  actual_carbs: number;
  actual_fat: number;
  meals: Meal[];
  created_at: string;
}

export interface Meal {
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface BodyMetric {
  id: string;
  user_id: string;
  date: string;
  weight: number | null;
  body_fat_pct: number | null;
  resting_hr: number | null;
  hrv_rmssd: number | null;
  vo2max_run: number | null;
  vo2max_bike: number | null;
  sleep_hours: number | null;
  sleep_quality_score: number | null;
  body_battery: number | null;
  stress_level: number | null;
  source: string;
  garmin_measured_at: string | null;
  created_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string | null;
  equipment: string | null;
  category: string | null;
  is_disc_safe: boolean;
  instructions: string | null;
}

export interface WorkoutLog {
  id: string;
  user_id: string;
  activity_id: string | null;
  exercise_id: string;
  sets: number;
  reps: number;
  weight_kg: number | null;
  rpe: number | null;
  created_at: string;
}
