
import React from 'react';
import ClinicCard from './ClinicCard';

const FeaturedClinics = () => {
  const clinics = [
    {
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
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Clínicas próximas a você
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Encontre os melhores cuidados veterinários na sua região com avaliações reais de outros tutores
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clinics.map((clinic, index) => (
            <ClinicCard
              key={index}
              {...clinic}
            />
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" size="lg" className="border-purple-200 text-purple-600 hover:bg-purple-50">
            Ver todas as clínicas
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedClinics;
