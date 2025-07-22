
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MessageSquare, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ClinicCard from './ClinicCard';
import { useFavorites } from '@/contexts/FavoritesContext';

const FeaturedClinics = () => {
  const { favorites } = useFavorites();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'emergency' | 'tickets'>('all');
  const [userTickets, setUserTickets] = useState<any[]>([]);

  // Load user tickets from localStorage
  useEffect(() => {
    if (user?.id) {
      const tickets = JSON.parse(localStorage.getItem(`tickets_${user.id}`) || '[]');
      setUserTickets(tickets);
    }
  }, [user]);

  useEffect(() => {
    const handleSetTab = (event: CustomEvent) => {
      setActiveTab(event.detail);
    };

    document.addEventListener('setClinicTab', handleSetTab as EventListener);
    return () => {
      document.removeEventListener('setClinicTab', handleSetTab as EventListener);
    };
  }, []);

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
      phone: "(11) 1234-5678",
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
      phone: "(11) 2345-6789",
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
      phone: "(11) 3456-7890",
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
      phone: "(11) 4567-8901",
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
      phone: "(11) 5678-9012",
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
      phone: "(11) 6789-0123",
    },
  ];

  const getFilteredClinics = () => {
    switch (activeTab) {
      case 'favorites':
        return clinics.filter(clinic => favorites.includes(clinic.id));
      case 'emergency':
        return clinics.filter(clinic => clinic.emergency);
      case 'tickets':
        // For tickets tab, we'll show a different view
        return [];
      default:
        return clinics;
    }
  };

  const filteredClinics = getFilteredClinics();

  return (
    <section id="clinics" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-semibold text-foreground mb-6 leading-tight">
            Clínicas próximas a você
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Descubra os melhores cuidados veterinários na sua região com avaliações autênticas de outros tutores
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center mb-12">
          <div className="flex bg-muted/50 rounded-full p-1">
            <Button
              variant={activeTab === 'all' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('all')}
              className="rounded-full px-6 py-2 text-sm font-medium"
            >
              Todas
            </Button>
            <Button
              variant={activeTab === 'tickets' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('tickets')}
              className="rounded-full px-6 py-2 text-sm font-medium"
            >
              Tickets
            </Button>
            <Button
              variant={activeTab === 'favorites' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('favorites')}
              className="rounded-full px-6 py-2 text-sm font-medium"
            >
              Favoritos
            </Button>
            <Button
              variant={activeTab === 'emergency' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('emergency')}
              className="rounded-full px-6 py-2 text-sm font-medium"
            >
              Emergência
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 animate-slide-up">
          {activeTab === 'tickets' ? (
            userTickets.length > 0 ? (
              userTickets.map((ticket) => (
                <Card key={ticket.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{ticket.title}</CardTitle>
                      <Badge variant={ticket.status === 'open' ? 'default' : ticket.status === 'in_progress' ? 'secondary' : 'outline'}>
                        {ticket.status === 'open' ? 'Aberto' : ticket.status === 'in_progress' ? 'Em Andamento' : 'Fechado'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <User className="w-4 h-4 mr-2" />
                        {ticket.clinicName || 'Clínica Veterinária Pet Care'}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-2" />
                        {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {ticket.description}
                      </p>
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => navigate(`/chat/${ticket.id}`)}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Conversar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground text-lg">Você ainda não possui tickets abertos.</p>
              </div>
            )
          ) : filteredClinics.length > 0 ? (
            filteredClinics.map((clinic, index) => (
              <ClinicCard
                key={clinic.id}
                {...clinic}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground text-lg">
                {activeTab === 'favorites' 
                  ? 'Você ainda não tem clínicas favoritas.' 
                  : 'Nenhuma clínica de emergência encontrada.'
                }
              </p>
            </div>
          )}
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
