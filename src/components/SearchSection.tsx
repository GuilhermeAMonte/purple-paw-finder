import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin } from 'lucide-react';
import { CLINIC_SPECIALTIES, clinics } from './FeaturedClinics';

const SearchSection = () => {
  const [location, setLocation] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [noResults, setNoResults] = useState(false);

  // Função para normalizar texto
  const normalize = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  // Gera todas as sugestões possíveis
  const allLocations = Array.from(new Set(
    clinics.flatMap((c: any) => [
      c.neighborhood && c.city && c.state ? `${c.neighborhood} - ${c.city}, ${c.state}` : '',
      c.city && c.state ? `${c.city} - ${c.state}` : '',
      c.city ? c.city : '',
      c.state ? c.state : '',
      c.neighborhood ? c.neighborhood : '',
    ]).filter((v): v is string => typeof v === 'string' && v.length > 0)
  ));

  // Função para verificar se o termo de busca corresponde à localização da clínica
  const matchLocation = (searchTerm: string, clinic: any) => {
    const searchNorm = normalize(searchTerm);
    const clinicFull = normalize(
      [clinic.neighborhood, clinic.city, clinic.state].filter(Boolean).join(' ')
    );
    return clinicFull.includes(searchNorm);
  };

  // Atualiza sugestões conforme digitação
  useEffect(() => {
    if (!location.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      setNoResults(false);
      return;
    }

    const matchingClinics = clinics.filter(clinic =>
      matchLocation(location, clinic)
    );

    if (matchingClinics.length === 0) {
      const generic = allLocations.filter(loc =>
        normalize(loc).includes(normalize(location))
      );
      setSuggestions(generic);
      setShowSuggestions(generic.length > 0);
      setNoResults(true);
      return;
    }

    const clinicSuggestions = Array.from(new Set(
      matchingClinics.flatMap(c => [
        c.neighborhood && c.city && c.state ? `${c.neighborhood} - ${c.city}, ${c.state}` : '',
        c.city && c.state ? `${c.city} - ${c.state}` : '',
        c.city ? c.city : '',
        c.state ? c.state : '',
        c.neighborhood ? c.neighborhood : ''
      ]).filter(v => v)
    ));

    setSuggestions(clinicSuggestions);
    setShowSuggestions(clinicSuggestions.length > 0);
    setNoResults(false);
  }, [location]);

  // Escuta mudanças no localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const savedLocation = localStorage.getItem('search_location') || '';
      const savedSpecialty = localStorage.getItem('search_specialty') || '';
      setLocation(savedLocation);
      setSpecialty(savedSpecialty);
    };

    window.addEventListener('localStorageChange', handleStorageChange);
    return () => window.removeEventListener('localStorageChange', handleStorageChange);
  }, []);

  // Callback para busca
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('search_location', location);
    localStorage.setItem('search_specialty', specialty);

    const event = new Event('localStorageChange');
    window.dispatchEvent(event);

    const featuredSection = document.querySelector('#featured-clinics');
    if (featuredSection) {
      featuredSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

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

        <form className="glass-effect rounded-2xl p-8 max-w-3xl mx-auto animate-slide-up border border-border/20" onSubmit={handleSearch}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Sua localização (bairro, cidade ou estado)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onFocus={() => setShowSuggestions(suggestions.length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                autoComplete="off"
                className="pl-12 h-14 rounded-xl border-border/30 bg-background/80 text-lg font-light focus:ring-2 focus:ring-primary/20 focus:border-primary/40 smooth-transition"
              />
              {showSuggestions && (
                <ul className="absolute left-0 right-0 top-full mt-2 bg-white border rounded-xl shadow-lg z-20 max-h-60 overflow-auto text-left">
                  {suggestions.map((s, idx) => (
                    <li
                      key={s + idx}
                      className="px-4 py-2 cursor-pointer hover:bg-primary/10"
                      onMouseDown={() => {
                        setLocation(s);
                        setShowSuggestions(false);
                      }}
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              )}
              {!showSuggestions && noResults && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Nenhuma clínica cadastrada na região
                </p>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <select
                value={specialty}
                onChange={e => setSpecialty(e.target.value)}
                className="pl-12 h-14 rounded-xl border border-border/30 bg-background/80 text-lg font-light w-full focus:ring-2 focus:ring-primary/20 focus:border-primary/40 smooth-transition"
              >
                <option value="">Todas as especialidades</option>
                {CLINIC_SPECIALTIES.map((spec) => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
          </div>
          <Button 
            size="lg" 
            type="submit"
            className="w-full h-14 text-lg font-medium rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl smooth-transition hover-lift"
          >
            <Search className="w-5 h-5 mr-3" />
            Buscar clínicas veterinárias
          </Button>
        </form>
      </div>
    </section>
  );
};

export default SearchSection;