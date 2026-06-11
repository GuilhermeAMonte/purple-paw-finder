import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Star, MapPin, Clock, Phone, Shield, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getClinic } from '@/lib/clinics';
import { isClinicOpen } from '@/lib/clinicSearch';

const WEEKDAY_LABELS: Array<[string, string]> = [
  ['monday', 'Segunda'],
  ['tuesday', 'Terça'],
  ['wednesday', 'Quarta'],
  ['thursday', 'Quinta'],
  ['friday', 'Sexta'],
  ['saturday', 'Sábado'],
  ['sunday', 'Domingo'],
];

const ClinicDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: clinic, isLoading, isError } = useQuery({
    queryKey: ['clinic', id],
    queryFn: () => getClinic(id!),
    enabled: !!id,
  });

  // ── Carregando ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 max-w-7xl mx-auto px-6 py-8">
          <div className="h-10 w-32 skeleton mb-8" />
          <div className="flex gap-4 mb-8">
            <div className="h-12 w-48 skeleton" />
            <div className="h-12 w-40 skeleton" />
          </div>
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
              <div className="h-64 skeleton rounded-3xl" />
              <div className="h-40 skeleton rounded-3xl" />
            </div>
            <div className="space-y-6">
              <div className="h-56 skeleton rounded-3xl" />
              <div className="h-44 skeleton rounded-3xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Não encontrada (Req 4.5) ────────────────────────────────────────────
  if (isError || !clinic || !clinic.clinic_name) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 max-w-3xl mx-auto px-6 py-24 text-center animate-fade-in-up">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-3">Clínica não encontrada</h1>
          <p className="text-muted-foreground mb-8">
            Não localizamos essa clínica. Ela pode ter saído do ar ou o link está incorreto.
          </p>
          <Button onClick={() => navigate('/')} className="bg-primary text-white hover-glow rounded-xl">
            Voltar à busca
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const open = isClinicOpen(clinic.schedules, clinic.is_24_hours);
  const hasRating = (clinic.rating ?? 0) > 0;
  const address = [clinic.street, clinic.neighborhood, clinic.city, clinic.state]
    .filter(Boolean)
    .join(', ');
  const schedules = (clinic.schedules ?? {}) as Record<string, { open: string; close: string; isOpen: boolean }>;
  const services = clinic.services?.length ? clinic.services : clinic.specialties;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 -ml-2 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Voltar
          </Button>

          {/* Botões de contato */}
          <div className="mb-8 flex flex-wrap gap-4 animate-fade-in-up">
            <Button
              onClick={() => navigate(`/clinic/${id}/create-ticket`)}
              className="bg-primary text-white hover:bg-primary/90 hover-glow px-8 py-3 rounded-2xl text-lg font-medium apple-shadow smooth-transition"
            >
              Contato Normal
            </Button>
            {clinic.is_emergency_available && (
              <Button
                onClick={() => navigate(`/clinic/${id}/create-ticket?emergency=true`)}
                className="bg-red-500 text-white hover:bg-red-600 px-8 py-3 rounded-2xl text-lg font-medium apple-shadow smooth-transition pulse-emergency"
              >
                <AlertCircle className="w-5 h-5 mr-2" />
                Emergência
              </Button>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Coluna principal */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-card rounded-3xl p-8 apple-shadow border border-border/40 card-interactive animate-fade-in-up">
                <div className="flex items-start justify-between mb-6 gap-4">
                  <div>
                    <h1 className="text-3xl font-semibold text-foreground mb-2">{clinic.clinic_name}</h1>
                    <div className="flex items-center gap-4">
                      {hasRating ? (
                        <div className="flex items-center gap-1">
                          <Star className="w-5 h-5 text-yellow-500 fill-current" />
                          <span className="font-semibold text-foreground">{clinic.rating}</span>
                          <span className="text-muted-foreground">({clinic.review_count} avaliações)</span>
                        </div>
                      ) : (
                        <Badge className="bg-primary/10 text-primary rounded-full px-3 py-1 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Nova na plataforma
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {clinic.is_24_hours && (
                      <Badge className="bg-red-500 text-white rounded-full px-3 py-1">24h</Badge>
                    )}
                    <Badge
                      className={`rounded-full px-3 py-1 ${open ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {open ? 'Aberto' : 'Fechado'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-muted-foreground mb-6">
                  <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>{address || 'Endereço não informado'}</span>
                </div>

                {clinic.description && (
                  <p className="text-muted-foreground leading-relaxed">{clinic.description}</p>
                )}
              </div>

              {/* Especialidades */}
              {clinic.specialties?.length > 0 && (
                <div className="bg-card rounded-3xl p-8 apple-shadow border border-border/40 card-interactive animate-fade-in-up">
                  <h2 className="text-2xl font-semibold text-foreground mb-6">Especialidades</h2>
                  <div className="flex flex-wrap gap-3 stagger">
                    {clinic.specialties.map((specialty, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-sm rounded-full bg-muted/50 text-foreground px-4 py-2 hover:bg-primary/10 hover:text-primary smooth-transition cursor-default"
                      >
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Serviços */}
              {services?.length > 0 && (
                <div className="bg-card rounded-3xl p-8 apple-shadow border border-border/40 card-interactive animate-fade-in-up">
                  <h2 className="text-2xl font-semibold text-foreground mb-6">Serviços Oferecidos</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {services.map((service, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted/40 smooth-transition"
                      >
                        <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-muted-foreground">{service}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6 lg:sticky lg:top-24 self-start">
              {/* Horários */}
              <div className="bg-card rounded-3xl p-6 apple-shadow border border-border/40 card-interactive animate-fade-in-up">
                <h3 className="text-xl font-semibold text-foreground mb-4">Horários de Funcionamento</h3>
                {clinic.is_24_hours ? (
                  <p className="text-green-600 font-medium">Aberto 24 horas, todos os dias</p>
                ) : (
                  <div className="space-y-2">
                    {WEEKDAY_LABELS.map(([key, label]) => {
                      const day = schedules[key];
                      const text = day && day.isOpen ? `${day.open} - ${day.close}` : 'Fechado';
                      return (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="text-foreground font-medium">{text}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Contato */}
              <div className="bg-card rounded-3xl p-6 apple-shadow border border-border/40 card-interactive animate-fade-in-up">
                <h3 className="text-xl font-semibold text-foreground mb-4">Contato</h3>
                {clinic.phone ? (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <Phone className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">{clinic.phone}</span>
                    </div>
                    <Button
                      onClick={() => window.open(`tel:${clinic.phone}`, '_self')}
                      className="w-full mt-4 bg-primary text-white hover:bg-primary/90 hover-glow rounded-xl smooth-transition"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Ligar Agora
                    </Button>
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">Telefone não informado</p>
                )}
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
