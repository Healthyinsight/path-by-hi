export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          avg_hr: number | null
          avg_pace: string | null
          avg_power: number | null
          calories: number | null
          created_at: string
          distance_meters: number | null
          duration_seconds: number | null
          garmin_activity_id: string | null
          id: string
          max_hr: number | null
          source: string | null
          start_time: string | null
          strava_activity_id: string | null
          training_zones: Json | null
          type: string
          user_id: string
        }
        Insert: {
          avg_hr?: number | null
          avg_pace?: string | null
          avg_power?: number | null
          calories?: number | null
          created_at?: string
          distance_meters?: number | null
          duration_seconds?: number | null
          garmin_activity_id?: string | null
          id?: string
          max_hr?: number | null
          source?: string | null
          start_time?: string | null
          strava_activity_id?: string | null
          training_zones?: Json | null
          type: string
          user_id: string
        }
        Update: {
          avg_hr?: number | null
          avg_pace?: string | null
          avg_power?: number | null
          calories?: number | null
          created_at?: string
          distance_meters?: number | null
          duration_seconds?: number | null
          garmin_activity_id?: string | null
          id?: string
          max_hr?: number | null
          source?: string | null
          start_time?: string | null
          strava_activity_id?: string | null
          training_zones?: Json | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      body_metrics: {
        Row: {
          body_battery: number | null
          body_fat_pct: number | null
          created_at: string
          date: string
          garmin_measured_at: string | null
          hrv_rmssd: number | null
          id: string
          mood_score: number | null
          resting_hr: number | null
          sleep_hours: number | null
          sleep_quality_score: number | null
          source: string | null
          stress_level: number | null
          user_id: string
          vo2max_bike: number | null
          vo2max_run: number | null
          weight: number | null
        }
        Insert: {
          body_battery?: number | null
          body_fat_pct?: number | null
          created_at?: string
          date: string
          garmin_measured_at?: string | null
          hrv_rmssd?: number | null
          id?: string
          mood_score?: number | null
          resting_hr?: number | null
          sleep_hours?: number | null
          sleep_quality_score?: number | null
          source?: string | null
          stress_level?: number | null
          user_id: string
          vo2max_bike?: number | null
          vo2max_run?: number | null
          weight?: number | null
        }
        Update: {
          body_battery?: number | null
          body_fat_pct?: number | null
          created_at?: string
          date?: string
          garmin_measured_at?: string | null
          hrv_rmssd?: number | null
          id?: string
          mood_score?: number | null
          resting_hr?: number | null
          sleep_hours?: number | null
          sleep_quality_score?: number | null
          source?: string | null
          stress_level?: number | null
          user_id?: string
          vo2max_bike?: number | null
          vo2max_run?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "body_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_metrics: {
        Row: {
          body_battery: number | null
          created_at: string
          date: string
          hrv_rmssd: number | null
          raw_payload: Json | null
          rhr: number | null
          sleep_hours: number | null
          sleep_quality_score: number | null
          source: string
          steps: number | null
          user_id: string
        }
        Insert: {
          body_battery?: number | null
          created_at?: string
          date: string
          hrv_rmssd?: number | null
          raw_payload?: Json | null
          rhr?: number | null
          sleep_hours?: number | null
          sleep_quality_score?: number | null
          source: string
          steps?: number | null
          user_id: string
        }
        Update: {
          body_battery?: number | null
          created_at?: string
          date?: string
          hrv_rmssd?: number | null
          raw_payload?: Json | null
          rhr?: number | null
          sleep_hours?: number | null
          sleep_quality_score?: number | null
          source?: string
          steps?: number | null
          user_id?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          category: string | null
          equipment: string | null
          id: string
          instructions: string | null
          is_disc_safe: boolean | null
          muscle_group: string | null
          name: string
        }
        Insert: {
          category?: string | null
          equipment?: string | null
          id?: string
          instructions?: string | null
          is_disc_safe?: boolean | null
          muscle_group?: string | null
          name: string
        }
        Update: {
          category?: string | null
          equipment?: string | null
          id?: string
          instructions?: string | null
          is_disc_safe?: boolean | null
          muscle_group?: string | null
          name?: string
        }
        Relationships: []
      }
      garmin_webhook_events: {
        Row: {
          dedupe_key: string
          error: string | null
          event_type: string
          id: string
          payload_json: Json
          processed_at: string | null
          received_at: string
        }
        Insert: {
          dedupe_key: string
          error?: string | null
          event_type: string
          id?: string
          payload_json: Json
          processed_at?: string | null
          received_at?: string
        }
        Update: {
          dedupe_key?: string
          error?: string | null
          event_type?: string
          id?: string
          payload_json?: Json
          processed_at?: string | null
          received_at?: string
        }
        Relationships: []
      }
      knowledge_rules: {
        Row: {
          action_text: string | null
          applicable_archetypes: string[] | null
          applicable_disciplines: string[] | null
          category: string
          created_at: string | null
          id: string
          insight_body: string
          insight_title: string
          is_active: boolean | null
          priority: number | null
          severity: string | null
          source_name: string | null
          source_url: string | null
          trigger_condition: Json
          trigger_type: string
        }
        Insert: {
          action_text?: string | null
          applicable_archetypes?: string[] | null
          applicable_disciplines?: string[] | null
          category: string
          created_at?: string | null
          id?: string
          insight_body: string
          insight_title: string
          is_active?: boolean | null
          priority?: number | null
          severity?: string | null
          source_name?: string | null
          source_url?: string | null
          trigger_condition: Json
          trigger_type: string
        }
        Update: {
          action_text?: string | null
          applicable_archetypes?: string[] | null
          applicable_disciplines?: string[] | null
          category?: string
          created_at?: string | null
          id?: string
          insight_body?: string
          insight_title?: string
          is_active?: boolean | null
          priority?: number | null
          severity?: string | null
          source_name?: string | null
          source_url?: string | null
          trigger_condition?: Json
          trigger_type?: string
        }
        Relationships: []
      }
      nutrition_plan: {
        Row: {
          actual_carbs: number | null
          actual_fat: number | null
          actual_kcal: number | null
          actual_protein: number | null
          created_at: string
          date: string
          id: string
          meals: Json | null
          planned_sport: string | null
          planned_subtype: string | null
          target_carbs: number | null
          target_fat: number | null
          target_kcal: number | null
          target_protein: number | null
          training_type: string | null
          user_id: string
        }
        Insert: {
          actual_carbs?: number | null
          actual_fat?: number | null
          actual_kcal?: number | null
          actual_protein?: number | null
          created_at?: string
          date: string
          id?: string
          meals?: Json | null
          planned_sport?: string | null
          planned_subtype?: string | null
          target_carbs?: number | null
          target_fat?: number | null
          target_kcal?: number | null
          target_protein?: number | null
          training_type?: string | null
          user_id: string
        }
        Update: {
          actual_carbs?: number | null
          actual_fat?: number | null
          actual_kcal?: number | null
          actual_protein?: number | null
          created_at?: string
          date?: string
          id?: string
          meals?: Json | null
          planned_sport?: string | null
          planned_subtype?: string | null
          target_carbs?: number | null
          target_fat?: number | null
          target_kcal?: number | null
          target_protein?: number | null
          training_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_plan_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      training_schedule: {
        Row: {
          activity_id: string | null
          completed: boolean | null
          created_at: string
          date: string
          id: string
          notes: string | null
          planned_details: string | null
          planned_sport: string | null
          planned_subtype: string | null
          planned_type: string
          source: string | null
          user_id: string
          week_start_date: string | null
        }
        Insert: {
          activity_id?: string | null
          completed?: boolean | null
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          planned_details?: string | null
          planned_sport?: string | null
          planned_subtype?: string | null
          planned_type: string
          source?: string | null
          user_id: string
          week_start_date?: string | null
        }
        Update: {
          activity_id?: string | null
          completed?: boolean | null
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          planned_details?: string | null
          planned_sport?: string | null
          planned_subtype?: string | null
          planned_type?: string
          source?: string | null
          user_id?: string
          week_start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_schedule_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_schedule_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_goals: {
        Row: {
          created_at: string | null
          disciplines: string[] | null
          goal_date: string | null
          goal_emoji: string | null
          goal_name: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          disciplines?: string[] | null
          goal_date?: string | null
          goal_emoji?: string | null
          goal_name?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string | null
          disciplines?: string[] | null
          goal_date?: string | null
          goal_emoji?: string | null
          goal_name?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          archetype: string
          body_fat_pct: number | null
          created_at: string | null
          disciplines: string[] | null
          display_name: string | null
          equipment: string | null
          goal_date: string | null
          goal_emoji: string | null
          goal_name: string | null
          has_injuries: string | null
          height_cm: number | null
          id: string
          level: string | null
          onboarding_completed: boolean | null
          show_nutrition: boolean | null
          show_race_countdown: boolean | null
          show_recomp: boolean | null
          target_weight: number | null
          trail_name: string | null
          training_days_per_week: number | null
          updated_at: string | null
          user_id: string | null
          weight: number | null
          wellness_focuses: string[] | null
        }
        Insert: {
          archetype?: string
          body_fat_pct?: number | null
          created_at?: string | null
          disciplines?: string[] | null
          display_name?: string | null
          equipment?: string | null
          goal_date?: string | null
          goal_emoji?: string | null
          goal_name?: string | null
          has_injuries?: string | null
          height_cm?: number | null
          id?: string
          level?: string | null
          onboarding_completed?: boolean | null
          show_nutrition?: boolean | null
          show_race_countdown?: boolean | null
          show_recomp?: boolean | null
          target_weight?: number | null
          trail_name?: string | null
          training_days_per_week?: number | null
          updated_at?: string | null
          user_id?: string | null
          weight?: number | null
          wellness_focuses?: string[] | null
        }
        Update: {
          archetype?: string
          body_fat_pct?: number | null
          created_at?: string | null
          disciplines?: string[] | null
          display_name?: string | null
          equipment?: string | null
          goal_date?: string | null
          goal_emoji?: string | null
          goal_name?: string | null
          has_injuries?: string | null
          height_cm?: number | null
          id?: string
          level?: string | null
          onboarding_completed?: boolean | null
          show_nutrition?: boolean | null
          show_race_countdown?: boolean | null
          show_recomp?: boolean | null
          target_weight?: number | null
          trail_name?: string | null
          training_days_per_week?: number | null
          updated_at?: string | null
          user_id?: string | null
          weight?: number | null
          wellness_focuses?: string[] | null
        }
        Relationships: []
      }
      users: {
        Row: {
          body_fat_pct: number | null
          created_at: string
          current_weight: number | null
          email: string
          ftp_watts: number | null
          garmin_access_secret: string | null
          garmin_access_token: string | null
          garmin_user_id: string | null
          height_cm: number | null
          id: string
          name: string | null
          run_threshold_pace: string | null
          sahha_connected_at: string | null
          sahha_profile_token: string | null
          sahha_user_id: string | null
          strava_access_token: string | null
          strava_athlete_id: string | null
          strava_refresh_token: string | null
          strava_token_expires_at: string | null
          training_phase: string | null
          vo2max_estimate: number | null
        }
        Insert: {
          body_fat_pct?: number | null
          created_at?: string
          current_weight?: number | null
          email: string
          ftp_watts?: number | null
          garmin_access_secret?: string | null
          garmin_access_token?: string | null
          garmin_user_id?: string | null
          height_cm?: number | null
          id: string
          name?: string | null
          run_threshold_pace?: string | null
          sahha_connected_at?: string | null
          sahha_profile_token?: string | null
          sahha_user_id?: string | null
          strava_access_token?: string | null
          strava_athlete_id?: string | null
          strava_refresh_token?: string | null
          strava_token_expires_at?: string | null
          training_phase?: string | null
          vo2max_estimate?: number | null
        }
        Update: {
          body_fat_pct?: number | null
          created_at?: string
          current_weight?: number | null
          email?: string
          ftp_watts?: number | null
          garmin_access_secret?: string | null
          garmin_access_token?: string | null
          garmin_user_id?: string | null
          height_cm?: number | null
          id?: string
          name?: string | null
          run_threshold_pace?: string | null
          sahha_connected_at?: string | null
          sahha_profile_token?: string | null
          sahha_user_id?: string | null
          strava_access_token?: string | null
          strava_athlete_id?: string | null
          strava_refresh_token?: string | null
          strava_token_expires_at?: string | null
          training_phase?: string | null
          vo2max_estimate?: number | null
        }
        Relationships: []
      }
      workout_logs: {
        Row: {
          activity_id: string | null
          created_at: string
          exercise_id: string | null
          id: string
          reps: number | null
          rpe: number | null
          sets: number | null
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          activity_id?: string | null
          created_at?: string
          exercise_id?: string | null
          id?: string
          reps?: number | null
          rpe?: number | null
          sets?: number | null
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          activity_id?: string | null
          created_at?: string
          exercise_id?: string | null
          id?: string
          reps?: number | null
          rpe?: number | null
          sets?: number | null
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      daily_metrics_resolved: {
        Row: {
          body_battery: number | null
          created_at: string | null
          date: string | null
          hrv_rmssd: number | null
          rhr: number | null
          sleep_hours: number | null
          sleep_quality_score: number | null
          source: string | null
          steps: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      merge_body_battery_from_garmin: {
        Args: {
          p_body_battery: number
          p_date: string
          p_garmin_measured_at: string
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
