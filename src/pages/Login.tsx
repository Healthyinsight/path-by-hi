import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, CheckCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { AnimatedTitle } from '@/components/AnimatedTitle';

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      setCooldown(60);
      const interval = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) { clearInterval(interval); return 0; }
          return c - 1;
        });
      }, 1000);
    }
    setLoading(false);
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{
        background: `
          radial-gradient(ellipse at 50% 30%, rgba(80, 149, 172, 0.06) 0%, transparent 70%),
          linear-gradient(180deg, hsl(195 38% 94%) 0%, hsl(210 20% 98%) 100%)
        `,
      }}
    >
      <div className="w-full flex flex-col items-center space-y-6">
        <div className="w-full max-w-[480px] flex flex-col items-center">
          <AnimatedTitle idle={!email} />

          {/* Tagline – fades in after title animation settles */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 8, duration: 0.8 }}
            style={{
              fontFamily: "'Merriweather Sans', sans-serif",
              fontStyle: 'italic',
              fontSize: '14px',
              color: '#6B7B84',
              marginTop: '12px',
              textAlign: 'center',
            }}
          >
            Din väg. Dina mål. Dina insikter.
          </motion.p>
        </div>

        <div className="w-full max-w-[480px]">
          {sent ? (
            <div className="card-glass p-6 md:px-12 md:py-10 space-y-4 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-primary" />
              <div>
                <p className="text-lg font-semibold" style={{ color: '#1A2B32' }}>Kolla din inkorg!</p>
                <p className="mt-1 text-sm" style={{ color: '#6B7B84' }}>
                  Vi har skickat en inloggningslänk till <strong style={{ color: '#1A2B32' }}>{email}</strong>.
                </p>
              </div>
              <button
                onClick={handleMagicLink}
                disabled={cooldown > 0}
                style={{
                  fontFamily: "'Merriweather Sans', sans-serif",
                  fontSize: '13px',
                  fontWeight: 600,
                  color: cooldown > 0 ? '#8E9BA3' : '#5095AC',
                  background: 'none',
                  border: 'none',
                  cursor: cooldown > 0 ? 'default' : 'pointer',
                  textDecoration: cooldown > 0 ? 'none' : 'underline',
                }}
              >
                {cooldown > 0 ? `Skicka igen (${cooldown}s)` : 'Skicka igen'}
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleMagicLink}
              className="card-glass p-6 md:px-12 md:py-10 space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium" style={{ color: '#3D4F58' }}>Din e-postadress</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="din@email.se"
                  required
                  className="h-[52px] text-base rounded-lg ring-offset-background focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-[52px] text-base font-semibold rounded-[10px]"
                disabled={loading}
                style={{
                  fontFamily: "'Merriweather Sans', sans-serif",
                  fontWeight: 600,
                }}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                Skicka inloggningslänk →
              </Button>
              <p
                className="flex items-center justify-center gap-1.5 text-center"
                style={{
                  fontFamily: "'Merriweather Sans', sans-serif",
                  fontSize: '13px',
                  color: '#8E9BA3',
                }}
              >
                <Lock className="h-3.5 w-3.5" />
                Inget lösenord behövs. Vi skickar en säker länk till din email.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
