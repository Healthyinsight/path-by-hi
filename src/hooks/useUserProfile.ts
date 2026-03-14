import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfileData {
  id: string;
  user_id: string;
  display_name: string | null;
  archetype: string;
  goal_name: string | null;
  goal_date: string | null;
  goal_emoji: string | null;
  level: string | null;
  disciplines: string[] | null;
  training_days_per_week: number | null;
  weight: number | null;
  target_weight: number | null;
  body_fat_pct: number | null;
  has_injuries: string | null;
  equipment: string | null;
  show_nutrition: boolean | null;
  show_race_countdown: boolean | null;
  show_recomp: boolean | null;
  onboarding_completed: boolean | null;
  wellness_focuses: string[] | null;
}

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await (supabase as any)
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    setProfile(data as UserProfileData | null);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return { profile, loading, refetch: fetchProfile };
}
