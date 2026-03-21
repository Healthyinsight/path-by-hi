import { useCallback, useEffect, useState } from 'react';
import type { PostgrestError } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getProfile, upsertProfile, type UserProfile, type UserProfileUpsert } from '@/services/profileService';

export type { UserProfile };

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  const refetch = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      setError(null);
      setLoading(false);
      return;
    }
    const { data, error: e } = await getProfile(user.id);
    setProfile(data);
    setError(e);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const updateProfile = async (
    data: UserProfileUpsert,
    opts?: { quiet?: boolean },
  ): Promise<{ data: UserProfile | null; error: PostgrestError | null }> => {
    if (!user?.id) {
      toast.error('Inte inloggad.');
      return { data: null, error: null };
    }
    const { data: row, error: e } = await upsertProfile(user.id, data);
    if (e) {
      toast.error('Kunde inte uppdatera profilen.');
      return { data: null, error: e };
    }
    setProfile(row);
    if (!opts?.quiet) toast.success('Profil uppdaterad!');
    return { data: row, error: null };
  };

  return { profile, loading, error, updateProfile, refetch };
}
