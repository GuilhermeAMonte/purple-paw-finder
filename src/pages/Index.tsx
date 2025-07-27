
import React from 'react';
import Header from '@/components/Header';
import SearchSection from '@/components/SearchSection';
import FeaturedClinics from '@/components/FeaturedClinics';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <SearchSection />
      {/* Meus Chamados e TicketsList agora aparecem apenas na aba Tickets do FeaturedClinics */}
      <FeaturedClinics />
      <Footer />
    </div>
  );
};

export default Index;
