import React, { useState, useEffect } from 'react';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ClinicCard from './ClinicCard';

export const clinics = [
  {
    id: "1",
    name: "Clínica Veterinária Pet Care",
    lat: -23.5558,
    lng: -46.6396,
    rating: 4.8,
    reviews: 247,
    address: "Rua das Flores, 123 - Vila Madalena",
    city: "São Paulo",
    state: "SP",
    neighborhood: "Vila Madalena",
    specialties: ["Clínica Geral", "Cirurgia", "Dermatologia"],
    isOpen: true,
    image: "",
    emergency: true,
    phone: "(11) 1234-5678",
  },
  {
    id: "2",
    name: "Hospital Veterinário Animal Life",
    lat: -23.5631,
    lng: -46.6544,
    rating: 4.9,
    reviews: 156,
    address: "Av. Paulista, 567 - Cerqueira César",
    city: "São Paulo",
    state: "SP",
    neighborhood: "Cerqueira César",
    specialties: ["Emergência", "Cardiologia", "Neurologia"],
    isOpen: true,
    image: "",
    emergency: true,
    phone: "(11) 2345-6789",
  },
  {
    id: "3",
    name: "VetClinic Premium",
    lat: -23.5614,
    lng: -46.6702,
    rating: 4.7,
    reviews: 89,
    address: "Av. Faria Lima, 999 - Itaim Bibi",
    city: "São Paulo",
    state: "SP",
    neighborhood: "Itaim Bibi",
    specialties: ["Clínica Geral", "Ortopedia"],
    isOpen: false,
    image: "",
    emergency: false,
    phone: "(11) 3456-7890"
  },
  {
    id: "4",
    name: "Animal Hospital São Paulo",
    lat: -23.5587,
    lng: -46.6612,
    rating: 4.9,
    reviews: 423,
    address: "Av. Rebouças, 1567 - Pinheiros",
    city: "São Paulo",
    state: "SP",
    neighborhood: "Pinheiros",
    specialties: ["UTI", "Cirurgia", "Emergência"],
    isOpen: true,
    image: "",
    emergency: true,
    phone: "(11) 6789-0123"
  }
];

export const CLINIC_SPECIALTIES = Array.from(new Set(clinics.flatMap(c => c.specialties)));

const FeaturedClinics = () => {
  const { favorites } = useFavorites();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [forceUpdate, setForceUpdate] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => setForceUpdate(prev => !prev);
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Normaliza strings: remove acentos, caracteres especiais e unifica espaços
  function normalize(str: string) {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')       // remove acentos
      .replace(/[^a-zA-Z0-9]/g, ' ')           // não alfanuméricos para espaço
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  function getFilteredClinics() {
    const rawLocation = localStorage.getItem('search_location') || '';
    const rawSpecialty = localStorage.getItem('search_specialty') || '';
    const loc = normalize(rawLocation);
    const spec = normalize(rawSpecialty);

    return clinics.filter(clinic => {
      // Junta campos relevantes para busca
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

      // Filtro de localização inteligente
      const matchesLocation = loc === '' || combined.includes(loc);

      // Filtro de especialidade ou nome
      const matchesSpecialty = spec === '' ||
        clinic.specialties.map(normalize).some(s => s.includes(spec)) ||
        normalize(clinic.name).includes(spec);

      return matchesLocation && matchesSpecialty;
    });
  }

  const filteredClinics = getFilteredClinics();

  const handleClearFilters = () => {
    localStorage.removeItem('search_location');
    localStorage.removeItem('search_specialty');
    setForceUpdate(prev => !prev);
  };

  return (
    <section className="py-6 px-4 md:px-8">
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
          Nenhuma clínica cadastrada na região
        </p>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredClinics.map(clinic => (
            <ClinicCard
              key={clinic.id}
              id={clinic.id}
              name={clinic.name}
              rating={clinic.rating}
              reviews={clinic.reviews}
              address={clinic.address}
              distance="-- km"
              specialties={clinic.specialties}
              isOpen={clinic.isOpen}
              image={clinic.image}
              emergency={clinic.emergency}
              phone={clinic.phone}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default FeaturedClinics;
