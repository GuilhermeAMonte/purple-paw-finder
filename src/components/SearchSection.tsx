
import React, { useState } from 'react';
import { Search, MapPin, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const SearchSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');

  return (
    <section className="gradient-purple py-16 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full"></div>
        <div className="absolute top-32 right-20 w-20 h-20 bg-white rounded-full"></div>
        <div className="absolute bottom-20 left-1/3 w-16 h-16 bg-white rounded-full"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Encontre a melhor clínica veterinária
          </h2>
          <p className="text-purple-100 text-lg max-w-2xl mx-auto">
            Cuidado especializado para seu pet está a poucos cliques de distância
          </p>
        </div>

        {/* Search Form */}
        <div className="max-w-4xl mx-auto animate-slide-up">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Buscar clínicas, veterinários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-14 text-lg border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              {/* Location Input */}
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Sua localização"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-12 h-14 text-lg border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              {/* Search Button */}
              <Button className="h-14 text-lg font-semibold gradient-purple hover:opacity-90 transition-opacity">
                <Search className="w-5 h-5 mr-2" />
                Buscar
              </Button>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-100">
              <span className="text-sm text-gray-600 font-medium">Filtros rápidos:</span>
              <Button variant="outline" size="sm" className="text-purple-600 border-purple-200 hover:bg-purple-50">
                <Filter className="w-4 h-4 mr-1" />
                24h
              </Button>
              <Button variant="outline" size="sm" className="text-purple-600 border-purple-200 hover:bg-purple-50">
                Emergência
              </Button>
              <Button variant="outline" size="sm" className="text-purple-600 border-purple-200 hover:bg-purple-50">
                Próximo a mim
              </Button>
              <Button variant="outline" size="sm" className="text-purple-600 border-purple-200 hover:bg-purple-50">
                Melhor avaliado
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SearchSection;
