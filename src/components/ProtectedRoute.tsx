import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    // CRITICAL: Do NOT check onboarding while auth is still loading
    if (authLoading) return;
    if (!user) { setCheckingOnboarding(false); return; }

    (supabase as any)
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }: any) => {
        if (error) {
          console.error('Onboarding check failed:', error);
          setOnboardingCompleted(true);
          setCheckingOnboarding(false);
          return;
        }
        setOnboardingCompleted(data?.onboarding_completed ?? false);
        setCheckingOnboarding(false);
      })
      .catch((err: any) => {
        console.error('Onboarding check failed:', err);
        setOnboardingCompleted(true);
        setCheckingOnboarding(false);
      });
  }, [user, authLoading]);

  // Show spinner while auth OR onboarding check is in progress
  if (authLoading || (user && checkingOnboarding)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
