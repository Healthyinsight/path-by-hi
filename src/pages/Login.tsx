import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, CheckCircle } from 'lucide-react';
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-[380px] space-y-8">
        <AnimatedTitle />

        {sent ? (
          <div className="card-athletic space-y-4 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-primary" />
            <div>
              <p className="text-lg font-semibold text-foreground">Kolla din inkorg!</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Vi har skickat en inloggningslänk till <strong className="text-foreground">{email}</strong>.
              </p>
            </div>
            <button
              onClick={handleMagicLink}
              disabled={cooldown > 0}
              className="text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
            >
              {cooldown > 0 ? `Skicka igen (${cooldown}s)` : 'Skicka igen'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="card-athletic space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Din e-postadress</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="namn@example.com"
                required
              />
            </div>
            <Button type="submit" className="w-full touch-target" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Skicka inloggningslänk
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Inget lösenord behövs. Vi skickar en säker länk till din email.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
