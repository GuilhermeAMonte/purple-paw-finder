
import React, { useState, useEffect } from 'react';
import { PawPrint, User, LogOut, Settings, Calendar, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const getFirstName = (fullName: string) => fullName.split(' ')[0];

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass-effect shadow-depth-sm border-b border-border/50'
          : 'bg-background/95 border-b border-border/30'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-[60px]">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group"
            onClick={() => {
              localStorage.removeItem('search_location');
              localStorage.removeItem('search_specialty');
              window.dispatchEvent(new Event('localStorageChange'));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="relative w-8 h-8 flex-shrink-0">
              <div className="absolute inset-0 gradient-purple rounded-xl opacity-90 group-hover:opacity-100 transition-opacity" />
              <PawPrint className="absolute inset-0 m-auto w-4 h-4 text-white" />
            </div>
            <span className="text-[17px] font-semibold tracking-tight text-foreground">
              Paw<span className="text-primary">Connect</span>
            </span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {isAuthenticated && user?.userType === 'client' && (
              <Link to="/my-appointments">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-medium hover:bg-primary/8 hover:text-primary smooth-transition"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">Agendamentos</span>
                </Button>
              </Link>
            )}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 h-9 px-3 rounded-xl hover:bg-muted/60 smooth-transition"
                  >
                    {/* Avatar */}
                    <div className="w-6 h-6 rounded-full gradient-purple flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-semibold text-white leading-none">
                        {getInitials(user!.name)}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-foreground hidden sm:block">
                      {getFirstName(user!.name)}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="w-52 glass-effect border-border/40 rounded-2xl shadow-xl p-1.5 animate-fade-in-down"
                >
                  {/* User info header */}
                  <div className="px-3 py-2.5 mb-1">
                    <p className="text-sm font-semibold text-foreground truncate">{user!.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user?.userType}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-border/50 my-1" />

                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm smooth-transition cursor-pointer">
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      <span>My Profile</span>
                    </Link>
                  </DropdownMenuItem>

                  {user?.userType === 'client' && (
                    <DropdownMenuItem asChild>
                      <Link to="/my-appointments" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm smooth-transition cursor-pointer">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>My Appointments</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {user?.userType === 'clinic' && (
                    <DropdownMenuItem asChild>
                      <Link to="/clinic-dashboard" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm smooth-transition cursor-pointer">
                        <Sparkles className="w-4 h-4 text-muted-foreground" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator className="bg-border/50 my-1" />

                  <DropdownMenuItem
                    onClick={logout}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-destructive focus:text-destructive focus:bg-destructive/8 smooth-transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-4 rounded-xl text-sm font-medium hover:bg-muted/60 smooth-transition"
                  >
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    size="sm"
                    className="h-9 px-4 rounded-xl text-sm font-medium gradient-purple text-white hover:opacity-90 smooth-transition shadow-sm hover-glow"
                  >
                    Get started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
