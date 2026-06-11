import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const ForgotPassword = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-background border border-border/50 rounded-2xl shadow-depth-sm p-8">

          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 gradient-purple rounded-xl flex items-center justify-center">
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <span className="font-semibold text-foreground">Paw<span className="text-primary">Connect</span></span>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-emerald-600" />
              </div>
              <h1 className="text-xl font-semibold text-foreground mb-2">E-mail enviado!</h1>
              <p className="text-sm text-muted-foreground mb-6">
                Enviamos um link para <span className="font-medium text-foreground">{email}</span>.
                Verifique sua caixa de entrada e spam.
              </p>
              <Link to="/login">
                <Button variant="outline" className="w-full rounded-xl">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-foreground mb-1">Esqueceu a senha?</h1>
              <p className="text-sm text-muted-foreground mb-6">
                Informe seu e-mail e enviaremos um link para redefinir sua senha.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="pl-9 h-11 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl gradient-purple text-white hover:opacity-90">
                  {loading ? 'Enviando…' : 'Enviar link de redefinição'}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <Link to="/login" className="text-sm text-muted-foreground hover:text-primary smooth-transition flex items-center justify-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" />Voltar ao login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
