import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signInWithMagicLink: async () => ({ error: null }),
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        hypothesisId: 'H1',
        location: 'AuthContext.tsx:useEffect:getSession',
        message: 'AuthProvider mounted, starting getSession',
        data: {},
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion agent log
    // Set up auth state listener FIRST (before getSession)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      // Do NOT set loading=false here on first call; getSession handles that
    });

    // Then get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);
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
          hypothesisId: 'H1',
          location: 'AuthContext.tsx:useEffect:getSession:then',
          message: 'getSession resolved',
          data: { hasSession: !!initialSession },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion agent log
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signInWithMagicLink, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
