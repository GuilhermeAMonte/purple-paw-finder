import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Captura erros de render em qualquer página e exibe uma tela amigável
 * em vez de derrubar toda a aplicação (tela branca). Não expõe detalhes
 * técnicos ao usuário (Req 13.6) — o stack vai apenas para o console.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[ErrorBoundary] Erro não tratado na UI:', error);
  }

  private handleReload = () => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-purple-light p-4">
          <div className="max-w-md text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Algo deu errado</h1>
            <p className="text-gray-600">
              Encontramos um problema inesperado ao exibir esta página. Tente voltar ao início.
            </p>
            <Button onClick={this.handleReload} className="gradient-purple text-white">
              Voltar ao início
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
