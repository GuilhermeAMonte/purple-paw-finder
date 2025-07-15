
import React from 'react';
import { MapPin, Clock, Star, Phone, Heart, Shield } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: MapPin,
      title: "Busca por localização",
      description: "Encontre clínicas próximas a você com precisão e facilidade"
    },
    {
      icon: Clock,
      title: "Horários atualizados",
      description: "Informações em tempo real sobre funcionamento das clínicas"
    },
    {
      icon: Star,
      title: "Avaliações reais",
      description: "Reviews e notas de outros tutores para sua escolha informada"
    },
    {
      icon: Phone,
      title: "Contato direto",
      description: "Ligue ou mande mensagem diretamente para a clínica"
    },
    {
      icon: Heart,
      title: "Lista de favoritos",
      description: "Salve suas clínicas preferidas para acesso rápido"
    },
    {
      icon: Shield,
      title: "Emergência 24h",
      description: "Identifique rapidamente clínicas de plantão"
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Por que escolher o VetFind?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            A plataforma mais completa para encontrar cuidados veterinários de qualidade
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 gradient-purple rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
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
