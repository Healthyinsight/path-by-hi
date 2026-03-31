export * from './utils'
export * from './profileService'
export * from './goalsService'
export * from './usersService'
export * from './scheduleService'
export * from './metricsService'
export { toFiniteNumber, getCurrentUserId } from '@/services/utils';
export { getProfile, upsertProfile, type UserProfile, type UserProfileUpsert } from '@/services/profileService';
export { getGoals, upsertGoals, type UserGoals, type UpsertGoalsInput } from '@/services/goalsService';
export { getUser, updateUser, type User, type UserUpdate } from '@/services/usersService';
export {
  getSchedule,
  getScheduleForDate,
  updateScheduleRow,
  upsertSchedule,
  deleteSchedule,
  type ScheduleRow,
  type ScheduleEntry,
  type ScheduleUpdate,
} from '@/services/scheduleService';
export { getNutritionPlan, type NutritionPlanRow } from '@/services/nutritionService';
export {
  getLatestMetrics,
  addMetrics,
  getMetricsHistory,
  type BodyMetrics,
  type BodyMetricsInsert,
} from '@/services/metricsService';
