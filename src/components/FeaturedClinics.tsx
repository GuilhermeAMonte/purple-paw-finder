import React, { useState, useEffect } from 'react';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ClinicCard from './ClinicCard';
import LocationPermissionDialog from './LocationPermissionDialog';
import { useGeolocation, calculateDistance } from '@/hooks/use-geolocation';

export const clinics = [
  {
    id: "1",
    name: "Pet Care Veterinary Clinic",
    lat: -23.5558,
    lng: -46.6396,
    rating: 4.8,
    reviews: 247,
    address: "123 Flowers Street - Vila Madalena",
    city: "São Paulo",
    state: "SP",
    neighborhood: "Vila Madalena",
    specialties: ["General Practice", "Surgery", "Dermatology"],
    isOpen: true,
    image: "",
    emergency: true,
    phone: "(11) 1234-5678",
    profileCompleteness: 85,
    animalTypes: ['dog', 'cat'],
  },
  {
    id: "2",
    name: "Animal Life Veterinary Hospital",
    lat: -23.5631,
    lng: -46.6544,
    rating: 4.9,
    reviews: 156,
    address: "567 Paulista Avenue - Cerqueira César",
    city: "São Paulo",
    state: "SP",
    neighborhood: "Cerqueira César",
    specialties: ["Emergency", "Cardiology", "Neurology"],
    isOpen: true,
    image: "",
    emergency: true,
    phone: "(11) 2345-6789",
    profileCompleteness: 95,
    animalTypes: ['dog', 'cat', 'bird', 'rabbit'],
  },
  {
    id: "3",
    name: "VetClinic Premium",
    lat: -23.5614,
    lng: -46.6702,
    rating: 4.7,
    reviews: 89,
    address: "999 Faria Lima Avenue - Itaim Bibi",
    city: "São Paulo",
    state: "SP",
    neighborhood: "Itaim Bibi",
    specialties: ["General Practice", "Orthopedics"],
    isOpen: false,
    image: "",
    emergency: false,
    phone: "(11) 3456-7890",
    profileCompleteness: 70,
    animalTypes: ['dog', 'cat'],
  },
  {
    id: "4",
    name: "Animal Hospital São Paulo",
    lat: -23.5587,
    lng: -46.6612,
    rating: 4.9,
    reviews: 423,
    address: "1567 Rebouças Avenue - Pinheiros",
    city: "São Paulo",
    state: "SP",
    neighborhood: "Pinheiros",
    specialties: ["ICU", "Surgery", "Emergency"],
    isOpen: true,
    image: "",
    emergency: true,
    phone: "(11) 6789-0123",
    profileCompleteness: 90,
    animalTypes: ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other'],
  }
];

export const CLINIC_SPECIALTIES = Array.from(new Set(clinics.flatMap(c => c.specialties)));

const FeaturedClinics = () => {
  const { favorites } = useFavorites();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [forceUpdate, setForceUpdate] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { coordinates, requestLocation } = useGeolocation();

  useEffect(() => {
    const handleStorageChange = () => {
      setForceUpdate(prev => !prev);
      setHasSearched(true);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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

  function normalize(str: string) {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  function getFilteredClinics() {
    const rawLocation = localStorage.getItem('search_location') || '';
    const rawSpecialty = localStorage.getItem('search_specialty') || '';
    const loc = normalize(rawLocation);
    const spec = normalize(rawSpecialty);

    const userPets = user?.id ? JSON.parse(localStorage.getItem(`pets_${user.id}`) || '[]') : [];
    const userPetTypes = userPets.map((pet: any) => pet.species);

    let filtered = clinics.filter(clinic => {
      const combined = [
        clinic.name,
        clinic.city,
        clinic.state,
        clinic.neighborhood,
        clinic.address,
        ...clinic.specialties,
      ]
        .map(normalize)
        .join(' ');

      const matchesLocation = loc === '' || combined.includes(loc);
      const matchesSpecialty = spec === '' ||
        clinic.specialties.map(normalize).some(s => s.includes(spec)) ||
        normalize(clinic.name).includes(spec);

      const matchesAnimalType = user?.userType !== 'client' || userPetTypes.length === 0 ||
        userPetTypes.some((petType: string) => clinic.animalTypes.includes(petType));

      return matchesLocation && matchesSpecialty && matchesAnimalType;
    });

    if (user?.userType === 'client') {
      filtered = filtered.sort((a, b) => {
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        if (b.profileCompleteness !== a.profileCompleteness) {
          return b.profileCompleteness - a.profileCompleteness;
        }
        if (coordinates) {
          const distA = calculateDistance(coordinates.latitude, coordinates.longitude, a.lat, a.lng);
          const distB = calculateDistance(coordinates.latitude, coordinates.longitude, b.lat, b.lng);
          return distA - distB;
        }
        return 0;
      });
    }

    return filtered;
  }

  const filteredClinics = getFilteredClinics();

  const handleClearFilters = () => {
    localStorage.removeItem('search_location');
    localStorage.removeItem('search_specialty');
    setHasSearched(false);
    setForceUpdate(prev => !prev);
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

          {filteredClinics.length === 0 ? (
            <p className="text-center mt-8 text-lg">
              Nenhuma clínica encontrada para os critérios selecionados
            </p>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredClinics.map(clinic => {
                const distance = coordinates
                  ? calculateDistance(coordinates.latitude, coordinates.longitude, clinic.lat, clinic.lng)
                  : null;
                const distanceText = distance ? `${distance.toFixed(1)} km` : '-- km';

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
                    image={clinic.image}
                    emergency={clinic.emergency}
                    phone={clinic.phone}
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
