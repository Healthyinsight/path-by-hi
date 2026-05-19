import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { connectStrava, validateStravaState } from '@/services/stravaService';

export default function StravaCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const stravaError = searchParams.get('error');

    if (stravaError) {
      setError('Strava access denied.');
      return;
    }

    if (!validateStravaState(state)) {
      setError('Invalid OAuth state. Please try connecting again.');
      return;
    }

    if (!code) {
      setError('No authorization code received from Strava.');
      return;
    }

    connectStrava(code)
      .then(({ imported }) => {
        toast.success(`Strava connected! ${imported} activities imported.`);
        navigate('/settings', { replace: true });
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(`Could not connect Strava: ${msg}`);
      });
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-destructive">{error}</p>
        <button
          className="text-sm text-primary underline"
          onClick={() => navigate('/settings', { replace: true })}
        >
          Back to Settings
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
