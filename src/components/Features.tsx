
import React from 'react';
import { MapPin, Clock, Star, Phone, Heart, Shield } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: MapPin,
      title: "Precise Location",
      description: "Find nearby clinics with GPS accuracy and integrated navigation"
    },
    {
      icon: Clock,
      title: "Updated Information",
      description: "Operating hours and real-time availability"
    },
    {
      icon: Star,
      title: "Verified Reviews",
      description: "Authentic reviews from real pet owners for informed choices"
    },
    {
      icon: Phone,
      title: "Direct Contact",
      description: "Instant communication with clinics via phone or message"
    },
    {
      icon: Heart,
      title: "Personalized List",
      description: "Save your favorite clinics for quick access when needed"
    },
    {
      icon: Shield,
      title: "Guaranteed Emergency",
      description: "Quick identification of on-call clinics and 24-hour service"
    }
  ];

  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-semibold text-foreground mb-6 leading-tight">
            Why choose VetFind?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            The most complete and reliable platform to find excellent veterinary care
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
