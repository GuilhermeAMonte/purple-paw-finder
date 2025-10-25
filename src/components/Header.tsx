
import React from 'react';
import { PawPrint, User, LogOut, Settings, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };

  return (
    <header className="glass-effect sticky top-0 z-50 border-b border-border/40">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-3 smooth-transition hover:opacity-80"
            onClick={() => {
              // Limpa os filtros no localStorage
              localStorage.removeItem('search_location');
              localStorage.removeItem('search_specialty');
              
              // Dispara evento para atualizar os componentes
              window.dispatchEvent(new Event('localStorageChange'));
              
              // Rola para o topo da página
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="w-9 h-9 bg-foreground rounded-full flex items-center justify-center">
              <PawPrint className="w-5 h-5 text-background" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">
              Paw Connect
            </h1>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a 
              href="#search" 
              onClick={(e) => {
                e.preventDefault();
                document.querySelector('#search')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground smooth-transition cursor-pointer"
            >
              Buscar
            </a>
            <a 
              href="#emergency" 
              onClick={(e) => {
                e.preventDefault();
                const event = new CustomEvent('setClinicTab', { detail: 'emergency' });
                document.dispatchEvent(event);
                document.querySelector('#clinics')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground smooth-transition cursor-pointer"
            >
              Emergência
            </a>
            <a 
              href="#tickets" 
              onClick={(e) => {
                e.preventDefault();
                const event = new CustomEvent('setClinicTab', { detail: 'tickets' });
                document.dispatchEvent(event);
                document.querySelector('#clinics')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground smooth-transition cursor-pointer"
            >
              Tickets
            </a>
            <a 
              href="#favorites" 
              onClick={(e) => {
                e.preventDefault();
                const event = new CustomEvent('setClinicTab', { detail: 'favorites' });
                document.dispatchEvent(event);
                document.querySelector('#clinics')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground smooth-transition cursor-pointer"
            >
              Favoritos
            </a>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-foreground hover:bg-muted/50 smooth-transition rounded-full px-4 py-2"
                  >
                    <User className="w-4 h-4 mr-2" />
                    {getFirstName(user!.name)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="glass-effect border-border/40 rounded-xl shadow-lg"
                >
                  <DropdownMenuItem asChild>
                    <Link 
                      to="/profile"
                      className="text-sm rounded-lg smooth-transition cursor-pointer"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={logout}
                    className="text-sm rounded-lg smooth-transition"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-foreground hover:bg-muted/50 smooth-transition rounded-full px-4 py-2"
                >
                  <User className="w-4 h-4 mr-2" />
                  Entrar
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
