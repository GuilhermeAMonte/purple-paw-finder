
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Clock, Phone, Heart, Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const ClinicDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data - na aplicação real viria de uma API
  const clinic = {
    id: id,
    name: "Clínica Veterinária Pet Care",
    rating: 4.8,
    reviews: 247,
    distance: "1.2 km",
    address: "Rua das Flores, 123 - Vila Madalena, São Paulo - SP",
    phone: "(11) 99999-9999",
    email: "contato@petcare.com.br",
    website: "www.petcare.com.br",
    specialties: ["Clínica Geral", "Cirurgia", "Dermatologia", "Radiologia", "Cardiologia"],
    isOpen: true,
    emergency: true,
    description: "A Clínica Veterinária Pet Care oferece cuidados completos para seu pet com uma equipe altamente qualificada e equipamentos modernos. Atendemos desde consultas de rotina até cirurgias complexas.",
    hours: {
      "Segunda": "08:00 - 18:00",
      "Terça": "08:00 - 18:00", 
      "Quarta": "08:00 - 18:00",
      "Quinta": "08:00 - 18:00",
      "Sexta": "08:00 - 18:00",
      "Sábado": "08:00 - 14:00",
      "Domingo": "Fechado"
    },
    services: [
      "Consultas de rotina",
      "Vacinação",
      "Cirurgias",
      "Exames laboratoriais",
      "Radiologia",
      "Ultrassonografia",
      "Dermatologia",
      "Cardiologia",
      "Atendimento de emergência"
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Header com botão voltar */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          {/* Botões de Contato */}
          <div className="mb-8 flex gap-4">
            <Button
              onClick={() => navigate(`/clinic/${id}/create-ticket`)}
              className="bg-primary text-white hover:bg-primary/90 px-8 py-3 rounded-2xl text-lg font-medium apple-shadow"
            >
              Contato Normal
            </Button>
            <Button
              onClick={() => navigate(`/clinic/${id}/chat?emergency=true`)}
              className="bg-red-500 text-white hover:bg-red-600 px-8 py-3 rounded-2xl text-lg font-medium apple-shadow"
            >
              <AlertCircle className="w-5 h-5 mr-2" />
              Emergência
            </Button>
          </div>

          {/* Informações principais */}
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Coluna principal */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header da clínica */}
              <div className="bg-card rounded-3xl p-8 apple-shadow border border-border/40">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-semibold text-foreground mb-2">
                      {clinic.name}
                    </h1>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 text-yellow-500 fill-current" />
                        <span className="font-semibold text-foreground">{clinic.rating}</span>
                        <span className="text-muted-foreground">({clinic.reviews} avaliações)</span>
                      </div>
                      <span className="text-muted-foreground">• {clinic.distance}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {clinic.emergency && (
                      <Badge className="bg-red-500 text-white rounded-full px-3 py-1">
                        24h
                      </Badge>
                    )}
                    <Badge 
                      variant={clinic.isOpen ? "default" : "secondary"} 
                      className={`rounded-full px-3 py-1 ${
                        clinic.isOpen 
                          ? "bg-green-500 text-white" 
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {clinic.isOpen ? "Aberto" : "Fechado"}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-muted-foreground mb-6">
                  <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>{clinic.address}</span>
                </div>

                <p className="text-muted-foreground leading-relaxed">
                  {clinic.description}
                </p>
              </div>

              {/* Especialidades */}
              <div className="bg-card rounded-3xl p-8 apple-shadow border border-border/40">
                <h2 className="text-2xl font-semibold text-foreground mb-6">
                  Especialidades
                </h2>
                <div className="flex flex-wrap gap-3">
                  {clinic.specialties.map((specialty, index) => (
                    <Badge 
                      key={index}
                      variant="secondary" 
                      className="text-sm rounded-full bg-muted/50 text-foreground px-4 py-2"
                    >
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Serviços */}
              <div className="bg-card rounded-3xl p-8 apple-shadow border border-border/40">
                <h2 className="text-2xl font-semibold text-foreground mb-6">
                  Serviços Oferecidos
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {clinic.services.map((service, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">{service}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Horários */}
              <div className="bg-card rounded-3xl p-6 apple-shadow border border-border/40">
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  Horários de Funcionamento
                </h3>
                <div className="space-y-2">
                  {Object.entries(clinic.hours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{day}</span>
                      <span className="text-foreground font-medium">{hours}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contato */}
              <div className="bg-card rounded-3xl p-6 apple-shadow border border-border/40">
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  Contato
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">{clinic.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Heart className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">{clinic.email}</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full mt-6 bg-primary text-white hover:bg-primary/90 rounded-xl"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Ligar Agora
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ClinicDetails;
