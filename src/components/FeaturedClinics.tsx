import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import ClinicCard from './ClinicCard';
import LocationPermissionDialog from './LocationPermissionDialog';
import { useGeolocation, calculateDistance } from '@/hooks/use-geolocation';
import { fetchClinics, filterAndSortClinics } from '@/lib/clinicSearch';
import { Search, SlidersHorizontal, MapPin, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const SkeletonCard = () => (
  <div className="bg-card rounded-2xl border border-border/40 overflow-hidden shadow-depth-sm">
    <div className="h-44 skeleton" />
    <div className="p-5 space-y-3">
      <div className="flex justify-between gap-2">
        <div className="h-4 w-3/5 skeleton" />
        <div className="h-5 w-16 rounded-full skeleton" />
      </div>
      <div className="h-3 w-4/5 skeleton" />
      <div className="flex gap-1.5">
        <div className="h-5 w-20 rounded-full skeleton" />
        <div className="h-5 w-24 rounded-full skeleton" />
        <div className="h-5 w-16 rounded-full skeleton" />
      </div>
      <div className="h-9 rounded-xl skeleton" />
    </div>
  </div>
);

const FeaturedClinics = () => {
  const { user } = useAuth();
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [hasSearched, setHasSearched] = useState(
    () => !!(localStorage.getItem('search_location') || localStorage.getItem('search_specialty'))
  );
  const [searchParams, setSearchParams] = useState({
    location: localStorage.getItem('search_location') || '',
    specialty: localStorage.getItem('search_specialty') || '',
  });
  const { coordinates, requestLocation } = useGeolocation();

  const { data: clinics = [], isLoading } = useQuery({
    queryKey: ['clinics'],
    queryFn: fetchClinics,
    staleTime: 30_000,
  });

  useEffect(() => {
    const handleSearch = () => {
      setSearchParams({
        location: localStorage.getItem('search_location') || '',
        specialty: localStorage.getItem('search_specialty') || '',
      });
      setHasSearched(true);
    };
    window.addEventListener('localStorageChange', handleSearch);
    return () => window.removeEventListener('localStorageChange', handleSearch);
  }, []);

  useEffect(() => {
    const locationAsked = localStorage.getItem('location_permission_asked');
    if (user && user.userType === 'client' && !locationAsked && !coordinates) {
      setShowLocationDialog(true);
    }
  }, [user, coordinates]);

  const handleAcceptLocation = () => {
    localStorage.setItem('location_permission_asked', 'true');
    setShowLocationDialog(false);
    requestLocation();
  };

  const handleDeclineLocation = () => {
    localStorage.setItem('location_permission_asked', 'true');
    setShowLocationDialog(false);
  };

  const [userPetTypes, setUserPetTypes] = useState<string[]>([]);
  const petsFetched = useRef(false);

  useEffect(() => {
    if (!user?.id || user.userType !== 'client' || petsFetched.current) return;
    petsFetched.current = true;
    supabase
      .from('pets')
      .select('species')
      .eq('owner_id', user.id)
      .then(({ data }) => {
        if (data) setUserPetTypes(data.map((p: { species: string }) => p.species));
      });
  }, [user?.id, user?.userType]);

  const filteredClinics = filterAndSortClinics(clinics, {
    location: searchParams.location,
    specialty: searchParams.specialty,
    coords: coordinates,
    userPetTypes,
  });

  const handleClearFilters = () => {
    localStorage.removeItem('search_location');
    localStorage.removeItem('search_specialty');
    setSearchParams({ location: '', specialty: '' });
    setHasSearched(false);
  };

  const hasFilters = !!(searchParams.location || searchParams.specialty);

  return (
    <>
      <LocationPermissionDialog
        open={showLocationDialog}
        onOpenChange={setShowLocationDialog}
        onAccept={handleAcceptLocation}
        onDecline={handleDeclineLocation}
      />

      {hasSearched && (
        <section id="clinics-results" className="py-12 px-5 sm:px-8 max-w-7xl mx-auto animate-fade-in-up">

          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl gradient-purple flex items-center justify-center shadow-sm flex-shrink-0">
                <Search className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground leading-tight">
                  {isLoading ? 'Searching…' : (
                    filteredClinics.length > 0
                      ? `${filteredClinics.length} clinic${filteredClinics.length !== 1 ? 's' : ''} found`
                      : 'No clinics found'
                  )}
                </h2>
                {hasFilters && !isLoading && (
                  <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                    {searchParams.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {searchParams.location}
                      </span>
                    )}
                    {searchParams.location && searchParams.specialty && <span>·</span>}
                    {searchParams.specialty && <span>{searchParams.specialty}</span>}
                  </p>
                )}
              </div>
            </div>

            {hasFilters && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted border border-border/50 rounded-xl px-4 py-2 smooth-transition self-start sm:self-auto"
              >
                <X className="w-3.5 h-3.5" />
                Clear filters
              </button>
            )}
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : filteredClinics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                <SlidersHorizontal className="w-7 h-7 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No clinics found</h3>
              <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
                No clinics match the selected filters. Try a different location or specialty.
              </p>
              <button
                onClick={handleClearFilters}
                className="mt-6 text-sm font-medium text-primary hover:text-primary/80 underline underline-offset-4 smooth-transition"
              >
                Clear filters and show all
              </button>
            </div>
          ) : (
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 stagger">
              {filteredClinics.map((clinic) => {
                const distance = coordinates && clinic.lat != null && clinic.lng != null
                  ? calculateDistance(coordinates.latitude, coordinates.longitude, clinic.lat, clinic.lng)
                  : null;
                const distanceText = distance != null ? `${distance.toFixed(1)} km` : '-- km';

                return (
                  <ClinicCard
                    key={clinic.id}
                    id={clinic.id}
                    name={clinic.name}
                    rating={clinic.rating}
                    reviews={clinic.reviews}
                    address={clinic.address}
                    distance={distanceText}
                    specialties={clinic.specialties}
                    isOpen={clinic.isOpen}
                    image=""
                    emergency={clinic.emergency}
                    phone={clinic.phone ?? undefined}
                  />
                );
              })}
            </div>
          )}
        </section>
      )}
    </>
  );
};

export default FeaturedClinics;
