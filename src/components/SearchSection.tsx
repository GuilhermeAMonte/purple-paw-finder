
import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const SearchSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');

  return (
    <section className="relative py-24 md:py-32 bg-gradient-to-b from-background to-muted/30 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-muted rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-muted rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-hero text-foreground mb-6 max-w-4xl mx-auto">
            Encontre cuidados veterinários excepcionais
          </h1>
          <p className="text-large text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Conecte-se com os melhores profissionais veterinários da sua região. Simples, rápido e confiável.
          </p>
        </div>

        {/* Search Form */}
        <div className="max-w-4xl mx-auto animate-slide-up">
          <div className="glass-effect rounded-2xl p-8 apple-shadow-lg">
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Buscar clínicas, veterinários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-14 text-base border-border/50 bg-background/50 rounded-xl smooth-transition focus:border-foreground focus:ring-1 focus:ring-foreground"
                />
              </div>

              {/* Location Input */}
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Sua localização"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-12 h-14 text-base border-border/50 bg-background/50 rounded-xl smooth-transition focus:border-foreground focus:ring-1 focus:ring-foreground"
                />
              </div>
            </div>

            {/* Search Button */}
            <Button className="w-full h-14 text-base font-medium bg-foreground text-background hover:bg-foreground/90 rounded-xl smooth-transition apple-shadow">
              <Search className="w-5 h-5 mr-2" />
              Buscar agora
            </Button>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-border/30">
              <span className="text-sm text-muted-foreground font-medium">Busca rápida:</span>
              <Button variant="outline" size="sm" className="rounded-full border-border/50 text-muted-foreground hover:text-foreground hover:border-foreground smooth-transition">
                Emergência 24h
              </Button>
              <Button variant="outline" size="sm" className="rounded-full border-border/50 text-muted-foreground hover:text-foreground hover:border-foreground smooth-transition">
                Próximo a mim
              </Button>
              <Button variant="outline" size="sm" className="rounded-full border-border/50 text-muted-foreground hover:text-foreground hover:border-foreground smooth-transition">
                Melhor avaliado
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SearchSection;
