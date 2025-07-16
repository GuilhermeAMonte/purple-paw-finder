
import React from 'react';
import { Button } from '@/components/ui/button';
import ClinicCard from './ClinicCard';

const FeaturedClinics = () => {
  const clinics = [
    {
      id: "1",
      name: "Clínica Veterinária Pet Care",
      rating: 4.8,
      reviews: 247,
      distance: "1.2 km",
      address: "Rua das Flores, 123 - Vila Madalena",
      specialties: ["Clínica Geral", "Cirurgia", "Dermatologia"],
      isOpen: true,
      image: "",
      emergency: true,
    },
    {
      id: "2",
      name: "Hospital Veterinário Animal Life",
      rating: 4.9,
      reviews: 156,
      distance: "2.8 km",
      address: "Av. Paulista, 567 - Cerqueira César",
      specialties: ["Emergência", "Cardiologia", "Neurologia"],
      isOpen: true,
      image: "",
      emergency: true,
    },
    {
      id: "3",
      name: "VetClinic Premium",
      rating: 4.7,
      reviews: 89,
      distance: "3.5 km",
      address: "Rua Oscar Freire, 890 - Jardins",
      specialties: ["Estética", "Odontologia", "Fisioterapia"],
      isOpen: false,
      image: "",
    },
    {
      id: "4",
      name: "Centro Veterinário Bicho Feliz",
      rating: 4.6,
      reviews: 312,
      distance: "4.1 km",
      address: "Rua Harmonia, 445 - Vila Madalena",
      specialties: ["Vacinação", "Clínica Geral", "Exames"],
      isOpen: true,
      image: "",
    },
    {
      id: "5",
      name: "Clínica Dr. Pets",
      rating: 4.8,
      reviews: 198,
      distance: "5.2 km",
      address: "Rua Augusta, 234 - Consolação",
      specialties: ["Oftalmologia", "Ortopedia", "Radiologia"],
      isOpen: true,
      image: "",
    },
    {
      id: "6",
      name: "Animal Hospital São Paulo",
      rating: 4.9,
      reviews: 423,
      distance: "6.0 km",
      address: "Av. Rebouças, 1567 - Pinheiros",
      specialties: ["UTI", "Cirurgia", "Emergência"],
      isOpen: true,
      image: "",
      emergency: true,
    },
  ];

  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-semibold text-foreground mb-6 leading-tight">
            Clínicas próximas a você
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Descubra os melhores cuidados veterinários na sua região com avaliações autênticas de outros tutores
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 animate-slide-up">
          {clinics.map((clinic, index) => (
            <ClinicCard
              key={index}
              {...clinic}
            />
          ))}
        </div>

        <div className="text-center">
          <Button 
            variant="outline" 
            size="lg" 
            className="px-8 py-4 text-base font-medium border-border/50 rounded-full hover:border-foreground hover:bg-muted/50 smooth-transition"
          >
            Ver todas as clínicas
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedClinics;
