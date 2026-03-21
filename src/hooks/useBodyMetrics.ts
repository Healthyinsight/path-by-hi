import { useCallback, useEffect, useState } from 'react';
import type { PostgrestError } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getProfile, upsertProfile, type UserProfile, type UserProfileUpsert } from '@/services/profileService';

export type BodyMetricsForm = {
  weight: string;
  height_cm: string;
  target_weight: string;
  body_fat_pct: string;
};

function toNumOrNull(v: string): number | null {
  const s = v.trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * Kroppsmått i user_profiles (inte body_metrics – tidsserier kommer senare).
 * @param syncProfile – t.ex. refetch från useProfile så "Min profil" håller jämna steg.
 */
export function useBodyMetrics(syncProfile?: () => Promise<void>) {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [saving, setSaving] = useState(false);

  const refetch = useCallback(async () => {
    if (!user?.id) {
      setMetrics(null);
      setError(null);
      setLoading(false);
      return;
    }
    const { data, error: e } = await getProfile(user.id);
    setMetrics(data);
    setError(e);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const saveBodyMetrics = async (b: BodyMetricsForm): Promise<boolean> => {
    if (!user?.id) {
      toast.error('Inte inloggad.');
      return false;
    }

    const patch: UserProfileUpsert = {};
    if (b.weight.trim() !== '') {
      const w = toNumOrNull(b.weight);
      if (w != null) patch.weight = w;
    }
    if (b.height_cm.trim() !== '') {
      const h = toNumOrNull(b.height_cm);
      if (h != null) patch.height_cm = h;
    }
    if (b.target_weight.trim() !== '') {
      const tw = toNumOrNull(b.target_weight);
      if (tw != null) patch.target_weight = tw;
    }
    if (b.body_fat_pct.trim() !== '') {
      const bf = toNumOrNull(b.body_fat_pct);
      if (bf != null) patch.body_fat_pct = bf;
    }

    const has =
      patch.weight !== undefined ||
      patch.height_cm !== undefined ||
      patch.target_weight !== undefined ||
      patch.body_fat_pct !== undefined;

    if (!has) {
      toast.error('Fyll i minst ett kroppsmått.');
      return false;
    }

    setSaving(true);
    const { error: e } = await upsertProfile(user.id, patch);
    setSaving(false);

    if (e) {
      toast.error('Kunde inte spara. Försök igen.');
      return false;
    }

    toast.success('Kroppsmått sparade!');
    await refetch();
    if (syncProfile) await syncProfile();
    return true;
  };

  return { metrics, loading, error, saveBodyMetrics, saving, refetch };
}
