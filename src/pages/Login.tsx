
import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, PawPrint, ArrowLeft, Shield, Sparkles, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { loginSchema } from '@/schemas/auth.schemas';
import HCaptchaWidget from '@/components/HCaptchaWidget';
import type HCaptcha from '@hcaptcha/react-hcaptcha';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const captchaRef = useRef<HCaptcha>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  const captchaRequired = !!import.meta.env.VITE_HCAPTCHA_SITE_KEY;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast({
        title: "Please check your details",
        description: parsed.error.issues[0]?.message ?? "Fill in the fields correctly.",
        variant: "destructive",
      });
      return;
    }

    if (captchaRequired && !captchaToken) {
      toast({ title: 'Complete a verificação de segurança', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const loggedUser = await login(email, password, captchaToken || undefined);
      toast({ title: "Welcome back!", description: "Login successful." });

      if (loggedUser?.userType === 'clinic') {
        // Se o perfil da clínica não está completo, direciona para o setup.
        if (!loggedUser.isProfileComplete) {
          navigate('/clinic-setup');
        } else {
          navigate('/clinic-dashboard');
        }
      } else {
        navigate('/');
      }
    } catch (error: any) {
      captchaRef.current?.resetCaptcha();
      setCaptchaToken('');
      toast({
        title: "Authentication failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex">

      {/* Left panel — branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:flex-col lg:w-[46%] xl:w-[42%] relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-12 text-white">
        {/* Noise overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
        />
        {/* Blobs */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 animate-blob" />
        <div className="absolute bottom-12 -left-12 w-48 h-48 rounded-full bg-white/8 animate-blob" style={{ animationDelay: '4s' }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3 mb-auto">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30">
            <PawPrint className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight">PawConnect</span>
        </div>

        {/* Copy */}
        <div className="relative z-10 mb-auto">
          <h2 className="text-3xl font-bold mb-4 leading-tight">
            Your pet deserves<br />the best care
          </h2>
          <p className="text-white/70 leading-relaxed">
            Connect with verified veterinary clinics near you. Fast, reliable and always available.
          </p>
        </div>

        {/* Trust badges */}
        <div className="relative z-10 space-y-3">
          {[
            { icon: Shield, text: 'End-to-end encrypted' },
            { icon: Sparkles, text: 'Verified clinics only' },
            { icon: Heart, text: 'Trusted by 10,000+ pet owners' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-sm text-white/80">
              <div className="w-7 h-7 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-3.5 h-3.5 text-white" />
              </div>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 gradient-purple rounded-xl flex items-center justify-center">
              <PawPrint className="w-4 h-4 text-white" />
            </div>
            <span className="text-[17px] font-semibold text-foreground">Paw<span className="text-primary">Connect</span></span>
          </div>

          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground smooth-transition mb-8 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to home
          </Link>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to continue to PawConnect</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground/90">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11 rounded-xl border-border/60 bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary/50 smooth-transition text-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-foreground/90">
                  Password
                </Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:text-primary/80 smooth-transition">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-11 rounded-xl border-border/60 bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary/50 smooth-transition text-sm pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground smooth-transition p-0.5"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <HCaptchaWidget
              ref={captchaRef}
              onVerify={setCaptchaToken}
              onExpire={() => setCaptchaToken('')}
            />

            <Button
              type="submit"
              disabled={isLoading || (captchaRequired && !captchaToken)}
              className="w-full h-11 rounded-xl gradient-purple text-white font-medium hover:opacity-90 smooth-transition shadow-sm hover-glow disabled:opacity-60"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign in'}
            </Button>
          </form>

          {/* Sign up link */}
          <p className="text-sm text-muted-foreground text-center mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:text-primary/80 smooth-transition">
              Create account
            </Link>
          </p>

          {/* Security note */}
          <div className="flex items-center gap-2 mt-8 text-xs text-muted-foreground/60 justify-center">
            <Shield className="w-3.5 h-3.5" />
            Protected with end-to-end encryption
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
