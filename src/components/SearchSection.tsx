
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin } from 'lucide-react';

const SearchSection = () => {
  const [location, setLocation] = useState('');
  const [specialty, setSpecialty] = useState('');

  return (
    <section id="search" className="relative min-h-[600px] flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background/80"></div>
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <div className="animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-light text-foreground mb-6 leading-tight tracking-tight">
            Cuidado veterinário
            <br />
            <span className="font-medium text-primary">próximo de você</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            Com o Paw Connect, encontre os melhores profissionais para o cuidado do seu pet
          </p>
        </div>

        <div className="glass-effect rounded-2xl p-8 max-w-3xl mx-auto animate-slide-up border border-border/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Sua localização"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-12 h-14 rounded-xl border-border/30 bg-background/80 text-lg font-light focus:ring-2 focus:ring-primary/20 focus:border-primary/40 smooth-transition"
              />
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Especialidade ou serviço"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="pl-12 h-14 rounded-xl border-border/30 bg-background/80 text-lg font-light focus:ring-2 focus:ring-primary/20 focus:border-primary/40 smooth-transition"
              />
            </div>
          </div>
          
          <Button 
            size="lg" 
            className="w-full h-14 text-lg font-medium rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl smooth-transition hover-lift"
          >
            <Search className="w-5 h-5 mr-3" />
            Buscar clínicas veterinárias
          </Button>
        </div>
      </div>
    </section>
  );
};

export default SearchSection;
