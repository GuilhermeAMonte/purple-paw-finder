
import React from 'react';
import Header from '@/components/Header';
import SearchSection from '@/components/SearchSection';
import FeaturedClinics from '@/components/FeaturedClinics';
import TicketsList from '@/components/TicketsList';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <SearchSection />
      <div className="max-w-4xl mx-auto w-full px-4 py-8">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Meus Chamados</h2>
        <TicketsList />
      </div>
      <FeaturedClinics />
      <Footer />
    </div>
  );
};

export default Index;
