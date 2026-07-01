
import React from 'react';
import Header from '@/components/Header';
import SearchSection from '@/components/SearchSection';
import FeaturedClinics from '@/components/FeaturedClinics';
import ClientAppointmentsSection from '@/components/ClientAppointmentsSection';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Agende consultas veterinárias perto de você"
        description="Encontre clínicas veterinárias, agende consultas e acompanhe o atendimento do seu pet em um só lugar."
      />
      <Header />
      <main>
        <SearchSection />
        <ClientAppointmentsSection />
        <FeaturedClinics />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
