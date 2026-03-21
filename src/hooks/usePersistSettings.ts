import { useState } from 'react';
import { toast } from 'sonner';
import { getCurrentUserId } from '@/services/utils';
import { updateUser, type UserUpdate } from '@/services/usersService';
import { upsertGoals, type UpsertGoalsInput } from '@/services/goalsService';
import { upsertProfile, type UserProfileUpsert } from '@/services/profileService';

type SavePayload = {
  userPatch: UserUpdate;
  goalsInput: UpsertGoalsInput;
  profilePatch: UserProfileUpsert;
};

/**
 * Samlar users + user_goals + user_profiles vid "Spara inställningar" med en gemensam toast.
 */
export function usePersistSettings(options: {
  refetchProfile: () => Promise<void>;
  refetchGoals: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);

  const saveSettings = async (payload: SavePayload): Promise<boolean> => {
    setSaving(true);
    try {
      const uid = await getCurrentUserId();
      const [u, g, p] = await Promise.all([
        updateUser(uid, payload.userPatch),
        upsertGoals(uid, payload.goalsInput),
        upsertProfile(uid, payload.profilePatch),
      ]);
      if (u.error || g.error || p.error) {
        toast.error('Kunde inte spara. Försök igen.');
        return false;
      }
      toast.success('Inställningar sparade!');
      await Promise.all([options.refetchProfile(), options.refetchGoals()]);
      return true;
    } catch {
      toast.error('Kunde inte spara. Försök igen.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { saveSettings, saving };
}
