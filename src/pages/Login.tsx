import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import type { AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import i18n from '@/i18n/config';
import { Loader as Loader2, Mail, CircleCheck as CheckCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { AnimatedTitle } from '@/components/AnimatedTitle';

const LAST_LOGIN_EMAIL_KEY = 'pathTracker.last_login_email';

type Phase = 'idle' | 'sending' | 'sent';
type ErrorKind = 'generic' | 'rate' | 'invalid';

function readStoredEmail(): string {
  try {
    return localStorage.getItem(LAST_LOGIN_EMAIL_KEY)?.trim() ?? '';
  } catch {
    return '';
  }
}

function writeStoredEmail(email: string) {
  try {
    if (email) localStorage.setItem(LAST_LOGIN_EMAIL_KEY, email);
    else localStorage.removeItem(LAST_LOGIN_EMAIL_KEY);
  } catch {
    /* ignore */
  }
}

function isProbablyValidEmail(raw: string): boolean {
  const e = raw.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function classifyAuthError(err: AuthError | null): ErrorKind {
  if (!err) return 'generic';
  const m = (err.message || '').toLowerCase();
  const status = err.status;
  if (status === 429 || m.includes('rate') || m.includes('too many') || m.includes('over_email')) {
    return 'rate';
  }
  if (m.includes('invalid') && m.includes('email')) return 'invalid';
  if (m.includes('email')) return 'invalid';
  return 'generic';
}

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [lastUsedEmail, setLastUsedEmail] = useState('');
  const [showLastHint, setShowLastHint] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [sentToEmail, setSentToEmail] = useState('');
  const [magicLoading, setMagicLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null);
  const [sentErrorKind, setSentErrorKind] = useState<ErrorKind | null>(null);

  useEffect(() => {
    const stored = readStoredEmail();
    if (stored) {
      setEmail(stored);
      setLastUsedEmail(stored);
      setShowLastHint(true);
    }
  }, []);

  const startCooldown = useCallback(() => {
    setCooldown(60);
    const interval = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }, []);

  const handleMagicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorKind(null);
    setSentErrorKind(null);
    if (cooldown > 0) return;
    const trimmed = email.trim();
    if (!isProbablyValidEmail(trimmed)) {
      setErrorKind('invalid');
      return;
    }
    setMagicLoading(true);
    setPhase('sending');
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: window.location.origin },
    });
    setMagicLoading(false);
    if (error) {
      setPhase('idle');
      setErrorKind(classifyAuthError(error as AuthError));
      return;
    }
    writeStoredEmail(trimmed);
    setLastUsedEmail(trimmed);
    setShowLastHint(true);
    setSentToEmail(trimmed);
    setPhase('sent');
    startCooldown();
  };

  const handleResend = async () => {
    if (cooldown > 0 || magicLoading || !sentToEmail) return;
    setSentErrorKind(null);
    setMagicLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: sentToEmail,
      options: { emailRedirectTo: window.location.origin },
    });
    setMagicLoading(false);
    if (error) {
      setSentErrorKind(classifyAuthError(error as AuthError));
      return;
    }
    startCooldown();
  };

  const handleWrongEmail = () => {
    setPhase('idle');
    setErrorKind(null);
    setSentErrorKind(null);
    setCooldown(0);
    setEmail(sentToEmail);
  };

  const handleSwitchAccount = () => {
    writeStoredEmail('');
    setEmail('');
    setLastUsedEmail('');
    setShowLastHint(false);
    setErrorKind(null);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      toast.error(t('login.googleFailed'));
      setGoogleLoading(false);
    }
  };

  const errorMessage = (kind: ErrorKind | null) => {
    if (!kind) return null;
    if (kind === 'rate') return t('login.errorRateLimit');
    if (kind === 'invalid') return t('login.errorInvalidEmail');
    return t('login.errorGeneric');
  };

  const googleButton = (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={googleLoading}
      className="w-full h-[52px] rounded-[10px] transition-shadow duration-200"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E0E0E0',
        fontFamily: "'Merriweather Sans', sans-serif",
        fontSize: '15px',
        fontWeight: 600,
        color: '#3D4F58',
        cursor: googleLoading ? 'default' : 'pointer',
        opacity: googleLoading ? 0.7 : 1,
      }}
      onMouseEnter={(e) => {
        if (!googleLoading) {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {googleLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z"
            fill="#4285F4"
          />
          <path
            d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z"
            fill="#34A853"
          />
          <path
            d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z"
            fill="#FBBC05"
          />
          <path
            d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.19 5.736 7.395 3.977 10 3.977z"
            fill="#EA4335"
          />
        </svg>
      )}
      {t('login.continueGoogle')}
    </button>
  );

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-start pt-6 sm:pt-10 px-4"
      style={{
        background: `
          radial-gradient(ellipse at 50% 30%, rgba(80, 149, 172, 0.06) 0%, transparent 70%),
          linear-gradient(180deg, hsl(195 38% 94%) 0%, hsl(210 20% 98%) 100%)
        `,
      }}
    >
      <div className="w-full flex flex-col items-center space-y-3">
        <div
          className="w-full max-w-[480px]"
          style={{
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '16px',
            boxShadow: '0 4px 24px rgba(26,43,50,0.06)',
            padding: '20px 32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <AnimatedTitle idle={!email} />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 8, duration: 0.8 }}
            style={{
              fontFamily: "'Merriweather Sans', sans-serif",
              fontStyle: 'italic',
              fontSize: '14px',
              color: '#4A5B65',
              marginTop: '12px',
              textAlign: 'center',
            }}
          >
            {t('login.tagline')}
          </motion.p>
        </div>

        <div className="w-full max-w-[480px]">
          {phase === 'sent' ? (
            <div className="card-glass p-6 md:px-12 md:py-10 space-y-4 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-primary" />
              <div>
                <p className="text-lg font-semibold" style={{ color: '#1A2B32' }}>
                  {t('login.checkInbox')}
                </p>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: '#6B7B84' }}>
                  {t('login.linkSentLine1', { email: sentToEmail })}
                </p>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: '#6B7B84' }}>
                  {t('login.linkSentLine2')}
                </p>
              </div>
              {sentErrorKind && (
                <p className="text-sm text-center" style={{ color: '#B45309' }}>
                  {errorMessage(sentErrorKind)}
                </p>
              )}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleResend()}
                  disabled={cooldown > 0 || magicLoading}
                  style={{
                    fontFamily: "'Merriweather Sans', sans-serif",
                    fontSize: '13px',
                    fontWeight: 600,
                    color: cooldown > 0 || magicLoading ? '#8E9BA3' : '#5095AC',
                    background: 'none',
                    border: 'none',
                    cursor: cooldown > 0 || magicLoading ? 'default' : 'pointer',
                    textDecoration: cooldown > 0 || magicLoading ? 'none' : 'underline',
                  }}
                >
                  {magicLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      …
                    </span>
                  ) : cooldown > 0 ? (
                    t('login.resendCooldown', { seconds: cooldown })
                  ) : (
                    t('login.resend')
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleWrongEmail}
                  style={{
                    fontFamily: "'Merriweather Sans', sans-serif",
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#8E9BA3',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  {t('login.wrongEmail')}
                </button>
              </div>
            </div>
          ) : (
            <div className="card-glass p-6 md:px-12 md:py-10 space-y-5">
              {googleButton}

              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-border" />
                <span
                  style={{
                    fontFamily: "'Merriweather Sans', sans-serif",
                    fontSize: '13px',
                    color: '#6B7B84',
                  }}
                >
                  {t('common.or')}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={(e) => void handleMagicSubmit(e)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium" style={{ color: '#3D4F58' }}>
                    {t('login.yourEmail')}
                  </Label>
                  {showLastHint && lastUsedEmail && (
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs" style={{ color: '#8E9BA3' }}>
                      <span>{t('login.lastUsed', { email: lastUsedEmail })}</span>
                      <button
                        type="button"
                        onClick={handleSwitchAccount}
                        className="font-semibold underline decoration-primary/50"
                        style={{ color: '#5095AC' }}
                      >
                        {t('login.switchAccount')}
                      </button>
                    </div>
                  )}
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorKind(null);
                    }}
                    placeholder={t('login.emailPlaceholder')}
                    autoComplete="email"
                    disabled={phase === 'sending'}
                    className="h-[52px] text-base rounded-lg ring-offset-background focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>

                {errorKind && (
                  <p className="text-sm" style={{ color: '#B45309' }}>
                    {errorMessage(errorKind)}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full h-[52px] text-base font-semibold rounded-[10px] bg-[#2A7A94] hover:bg-[#236C85] text-white"
                  disabled={magicLoading || phase === 'sending'}
                  style={{
                    fontFamily: "'Merriweather Sans', sans-serif",
                    fontWeight: 600,
                  }}
                >
                  {magicLoading || phase === 'sending' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  {t('login.sendMagicLink')}
                </Button>
                <p
                  className="mt-2 flex items-center justify-center gap-1.5 text-center"
                  style={{
                    fontFamily: "'Merriweather Sans', sans-serif",
                    fontSize: '13px',
                    color: '#6B7B84',
                  }}
                >
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  {t('login.noPasswordHint')}
                </p>
              </form>
            </div>
          )}
        </div>
      </div>

      <footer
        style={{
          marginTop: 'auto',
          paddingTop: '24px',
          paddingBottom: '16px',
          textAlign: 'center',
        }}
      >
        <a
          href="/privacy"
          style={{
            fontFamily: "'Merriweather Sans', sans-serif",
            fontSize: '12px',
            color: '#8E9BA3',
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
          onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
        >
          {t('login.privacyPolicy')}
        </a>
      </footer>
    </div>
  );
}
