import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/** Tela de carregamento enquanto a sessão é resolvida (evita redirect prematuro). */
function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-purple-light">
      <div className="w-10 h-10 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
    </div>
  );
}

/**
 * Protege rotas que exigem qualquer autenticação.
 * Não autenticado → /login.
 */
export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <AuthLoading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/**
 * Protege rotas exclusivas de cliente.
 * Não autenticado → /login; autenticado mas não-cliente → /.
 */
export function ClientRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  if (loading) return <AuthLoading />;
  if (!isAuthenticated) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }
  if (user?.userType !== 'client') return <Navigate to="/" replace />;
  return <>{children}</>;
}

/**
 * Protege rotas exclusivas de clínica.
 * Não autenticado → /login; autenticado mas não-clínica → /.
 * Clínica sem perfil completo → /clinic-setup (exceto se já está nessa rota).
 */
export function ClinicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <AuthLoading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.userType !== 'clinic') return <Navigate to="/" replace />;
  // Se o perfil não está completo e não está na rota de setup, redireciona.
  if (!user.isProfileComplete && window.location.pathname !== '/clinic-setup') {
    return <Navigate to="/clinic-setup" replace />;
  }
  return <>{children}</>;
}
