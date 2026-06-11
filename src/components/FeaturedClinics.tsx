import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import ClinicCard from './ClinicCard';
import LocationPermissionDialog from './LocationPermissionDialog';
import { useGeolocation, calculateDistance } from '@/hooks/use-geolocation';
import { fetchClinics, filterAndSortClinics } from '@/lib/clinicSearch';

const FeaturedClinics = () => {
  const { user } = useAuth();
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
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

  // Reage à submissão de busca (disparada pelo SearchSection).
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

  // Pede permissão de localização para clientes na primeira visita.
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

  const userPets = user?.id
    ? JSON.parse(localStorage.getItem(`pets_${user.id}`) || '[]')
    : [];
  const userPetTypes = user?.userType === 'client'
    ? userPets.map((pet: { species: string }) => pet.species)
    : [];

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

  return (
    <>
      <LocationPermissionDialog
        open={showLocationDialog}
        onOpenChange={setShowLocationDialog}
        onAccept={handleAcceptLocation}
        onDecline={handleDeclineLocation}
      />
      {hasSearched && (
        <section id="clinics-results" className="py-6 px-4 md:px-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Clínicas encontradas: {filteredClinics.length}
            </h2>
            <button
              onClick={handleClearFilters}
              className="text-sm text-blue-600 underline hover:text-blue-800 transition"
            >
              Limpar busca
            </button>
          </div>

          {isLoading ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-80 rounded-2xl bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : filteredClinics.length === 0 ? (
            <p className="text-center mt-8 text-lg">
              Nenhuma clínica encontrada para os critérios selecionados
            </p>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 stagger">
              {filteredClinics.map((clinic) => {
                const distance =
                  coordinates && clinic.lat != null && clinic.lng != null
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
