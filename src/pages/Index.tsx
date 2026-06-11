
import React from 'react';
import Header from '@/components/Header';
import SearchSection from '@/components/SearchSection';
import FeaturedClinics from '@/components/FeaturedClinics';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <SearchSection />
        <FeaturedClinics />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
