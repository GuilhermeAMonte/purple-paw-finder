
import React from 'react';
import Header from '@/components/Header';
import SearchSection from '@/components/SearchSection';
import FeaturedClinics from '@/components/FeaturedClinics';
import Features from '@/components/Features';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <SearchSection />
      <FeaturedClinics />
      <Features />
      <Footer />
    </div>
  );
};

export default Index;
