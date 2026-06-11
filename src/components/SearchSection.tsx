import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Shield, Zap, Heart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { CLINIC_SPECIALTIES } from '@/constants/specialties';
import { fetchClinics } from '@/lib/clinicSearch';

const SearchSection = () => {
  const [location, setLocation] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [noResults, setNoResults] = useState(false);

  const { data: clinics = [] } = useQuery({
    queryKey: ['clinics'],
    queryFn: fetchClinics,
    staleTime: 30_000,
  });

  const normalize = (str: string) =>
    str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  const allLocations = Array.from(new Set(
    clinics.flatMap((c: any) => [
      c.neighborhood && c.city && c.state ? `${c.neighborhood} - ${c.city}, ${c.state}` : '',
      c.city && c.state ? `${c.city} - ${c.state}` : '',
      c.city ? c.city : '',
      c.state ? c.state : '',
      c.neighborhood ? c.neighborhood : '',
    ]).filter((v): v is string => typeof v === 'string' && v.length > 0)
  ));

  const matchLocation = (searchTerm: string, clinic: any) => {
    const searchNorm = normalize(searchTerm);
    const clinicFull = normalize(
      [clinic.neighborhood, clinic.city, clinic.state].filter(Boolean).join(' ')
    );
    return clinicFull.includes(searchNorm);
  };

  useEffect(() => {
    if (!location.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      setNoResults(false);
      return;
    }

    const matchingClinics = clinics.filter(clinic => matchLocation(location, clinic));

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

  useEffect(() => {
    const handleStorageChange = () => {
      setLocation(localStorage.getItem('search_location') || '');
      setSpecialty(localStorage.getItem('search_specialty') || '');
    };
    window.addEventListener('localStorageChange', handleStorageChange);
    return () => window.removeEventListener('localStorageChange', handleStorageChange);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('search_location', location);
    localStorage.setItem('search_specialty', specialty);
    window.dispatchEvent(new Event('localStorageChange'));
    setTimeout(() => {
      document.querySelector('#clinics-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const stats = [
    { icon: Heart, label: 'Verified clinics', value: `${clinics.length}+` },
    { icon: Zap, label: '24h Emergency', value: `${clinics.filter((c: any) => c.emergency).length}` },
    { icon: Shield, label: 'Trusted by pet owners', value: '10k+' },
  ];

  return (
    <section className="relative overflow-hidden gradient-hero min-h-[620px] flex flex-col items-center justify-center">

      {/* Decorative blobs */}
      <div
        aria-hidden
        className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full opacity-[0.06] animate-blob"
        style={{ background: 'radial-gradient(circle, hsl(262 83% 58%), transparent 70%)' }}
      />
      <div
        aria-hidden
        className="absolute -bottom-24 -right-24 w-[360px] h-[360px] rounded-full opacity-[0.05] animate-blob"
        style={{ background: 'radial-gradient(circle, hsl(290 70% 52%), transparent 70%)', animationDelay: '3s' }}
      />
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.025] pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(262 83% 68%), transparent 60%)' }}
      />

      <div className="relative z-10 w-full max-w-4xl mx-auto px-5 sm:px-8 py-20 text-center">

        {/* Eyebrow tag */}
        <div className="animate-fade-in-down inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-primary text-sm font-medium mb-8">
          <Zap className="w-3.5 h-3.5" />
          <span>Find veterinary care near you</span>
        </div>

        {/* Heading */}
        <h1 className="text-hero text-foreground mb-5 text-balance animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          Veterinary care,
          <br />
          <span className="bg-gradient-to-r from-primary via-violet-500 to-purple-400 bg-clip-text text-transparent">
            close to you
          </span>
        </h1>

        <p className="text-large text-muted-foreground mb-10 max-w-xl mx-auto text-balance animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          Find the best professionals for your pet's care with Paw Connect — fast, reliable, and always nearby.
        </p>

        {/* Search form */}
        <form
          onSubmit={handleSearch}
          className="glass-effect rounded-2xl p-2 max-w-3xl mx-auto animate-scale-in border border-white/60"
          style={{ animationDelay: '0.15s', boxShadow: '0 8px 40px rgba(139,92,246,0.12), 0 2px 8px rgba(0,0,0,0.06)' }}
        >
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Location input */}
            <div className="relative flex-1">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
              <Input
                placeholder="Neighborhood, city or state"
                value={location}
                onChange={e => setLocation(e.target.value)}
                onFocus={() => setShowSuggestions(suggestions.length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                autoComplete="off"
                className="pl-11 h-12 rounded-xl border-transparent bg-background/70 focus:bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 smooth-transition placeholder:text-muted-foreground/60"
              />
              {showSuggestions && (
                <ul className="absolute left-0 right-0 top-full mt-1.5 bg-popover border border-border/50 rounded-xl shadow-xl z-20 max-h-52 overflow-auto text-left divide-y divide-border/30 animate-fade-in-down">
                  {suggestions.map((s, idx) => (
                    <li
                      key={s + idx}
                      className="px-4 py-2.5 text-sm cursor-pointer hover:bg-primary/5 smooth-transition first:rounded-t-xl last:rounded-b-xl flex items-center gap-2"
                      onMouseDown={() => { setLocation(s); setShowSuggestions(false); }}
                    >
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              )}
              {!showSuggestions && noResults && (
                <p className="absolute left-0 top-full mt-1.5 text-xs text-muted-foreground px-2">
                  No clinics found in this region
                </p>
              )}
            </div>

            {/* Specialty select */}
            <div className="relative sm:w-[220px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none z-10" />
              <select
                value={specialty}
                onChange={e => setSpecialty(e.target.value)}
                className="pl-11 h-12 rounded-xl border border-transparent bg-background/70 text-sm w-full focus:ring-2 focus:ring-primary/20 focus:border-primary/30 smooth-transition appearance-none cursor-pointer text-foreground"
              >
                <option value="">All specialties</option>
                {CLINIC_SPECIALTIES.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            {/* Search button */}
            <Button
              size="lg"
              type="submit"
              className="h-12 px-6 rounded-xl gradient-purple text-white font-medium shadow-sm hover:opacity-90 smooth-transition hover-glow flex-shrink-0"
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </form>

        {/* Stats row */}
        {clinics.length > 0 && (
          <div className="flex items-center justify-center gap-8 mt-10 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {stats.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="w-4 h-4 text-primary/70" />
                <span className="font-semibold text-foreground">{value}</span>
                <span className="hidden sm:inline">{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default SearchSection;
