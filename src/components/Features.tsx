
import React from 'react';
import { MapPin, Clock, Star, Phone, Heart, Shield } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: MapPin,
      title: "Localização precisa",
      description: "Encontre clínicas próximas com precisão de GPS e navegação integrada"
    },
    {
      icon: Clock,
      title: "Informações atualizadas",
      description: "Horários de funcionamento e disponibilidade em tempo real"
    },
    {
      icon: Star,
      title: "Avaliações verificadas",
      description: "Reviews autênticas de tutores reais para sua escolha informada"
    },
    {
      icon: Phone,
      title: "Contato direto",
      description: "Comunicação instantânea com as clínicas por telefone ou mensagem"
    },
    {
      icon: Heart,
      title: "Lista personalizada",
      description: "Salve suas clínicas favoritas para acesso rápido quando precisar"
    },
    {
      icon: Shield,
      title: "Emergência garantida",
      description: "Identificação rápida de clínicas de plantão e atendimento 24 horas"
    }
  ];

  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-semibold text-foreground mb-6 leading-tight">
            Por que escolher o VetFind?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            A plataforma mais completa e confiável para encontrar cuidados veterinários de excelência
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-slide-up">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index} 
                className="text-center p-8 rounded-2xl bg-background/60 glass-effect hover-lift smooth-transition border border-border/40 group"
              >
                <div className="w-16 h-16 bg-foreground rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 smooth-transition">
                  <Icon className="w-8 h-8 text-background" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4 leading-tight">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
