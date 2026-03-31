import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/** Visar innehåll endast för utloggade; loader under session-check; redirect till / om redan inloggad. */
export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    // #region agent log
    fetch('http://127.0.0.1:7940/ingest/5309d2c3-1f5a-4838-b83f-6f2c12bebaee', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': 'cf2fbf',
      },
      body: JSON.stringify({
        sessionId: 'cf2fbf',
        runId: 'initial',
        hypothesisId: 'H2',
        location: 'PublicOnlyRoute.tsx:loading',
        message: 'PublicOnlyRoute in loading state',
        data: {},
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion agent log
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    // #region agent log
    fetch('http://127.0.0.1:7940/ingest/5309d2c3-1f5a-4838-b83f-6f2c12bebaee', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': 'cf2fbf',
      },
      body: JSON.stringify({
        sessionId: 'cf2fbf',
        runId: 'initial',
        hypothesisId: 'H2',
        location: 'PublicOnlyRoute.tsx:user',
        message: 'PublicOnlyRoute redirecting authenticated user away from /login',
        data: { hasUser: !!user },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion agent log
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
