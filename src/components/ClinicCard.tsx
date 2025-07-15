
import React from 'react';
import { Star, MapPin, Clock, Phone, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ClinicCardProps {
  name: string;
  rating: number;
  reviews: number;
  distance: string;
  address: string;
  specialties: string[];
  isOpen: boolean;
  image: string;
  emergency?: boolean;
}

const ClinicCard: React.FC<ClinicCardProps> = ({
  name,
  rating,
  reviews,
  distance,
  address,
  specialties,
  isOpen,
  image,
  emergency = false,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover-lift cursor-pointer">
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-purple-100 to-purple-50">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 gradient-purple rounded-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-white" />
          </div>
        </div>
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {emergency && (
            <Badge className="bg-red-500 text-white">24h</Badge>
          )}
          <Badge variant={isOpen ? "default" : "secondary"} className={isOpen ? "bg-green-500" : ""}>
            {isOpen ? "Aberto" : "Fechado"}
          </Badge>
        </div>

        {/* Favorite Button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-3 right-3 w-8 h-8 p-0 bg-white/80 hover:bg-white"
        >
          <Heart className="w-4 h-4 text-gray-600" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-lg text-gray-900 leading-tight">{name}</h3>
          <div className="flex items-center gap-1 text-sm">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="font-medium">{rating}</span>
            <span className="text-gray-500">({reviews})</span>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-center gap-2 text-gray-600 mb-3">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{address}</span>
          <span className="text-purple-600 font-medium text-sm">• {distance}</span>
        </div>

        {/* Specialties */}
        <div className="flex flex-wrap gap-2 mb-4">
          {specialties.slice(0, 3).map((specialty, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {specialty}
            </Badge>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button className="flex-1 gradient-purple hover:opacity-90">
            Ver detalhes
          </Button>
          <Button variant="outline" size="icon" className="border-purple-200 text-purple-600">
            <Phone className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClinicCard;
