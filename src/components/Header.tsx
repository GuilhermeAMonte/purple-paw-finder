
import React from 'react';
import { Search, MapPin, Heart, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b border-purple-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 gradient-purple rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
              VetFind
            </h1>
          </div>

          {/* Location Display */}
          <div className="hidden md:flex items-center space-x-2 text-gray-600">
            <MapPin className="w-5 h-5 text-purple-500" />
            <span className="text-sm">São Paulo, SP</span>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-purple-600">
              <Heart className="w-5 h-5 mr-2" />
              Favoritos
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-purple-600">
              <User className="w-5 h-5 mr-2" />
              Entrar
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
