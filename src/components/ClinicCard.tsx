
import React from 'react';
import { Star, MapPin, Phone, Heart, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '@/contexts/FavoritesContext';

interface ClinicCardProps {
  id?: string;
  name: string;
  rating: number;
  reviews: number;
  distance: string;
  address: string;
  specialties: string[];
  isOpen: boolean;
  image: string;
  emergency?: boolean;
  phone?: string;
}

const ClinicCard: React.FC<ClinicCardProps> = ({
  id = "1", // valor padrão para compatibilidade
  name,
  rating,
  reviews,
  distance,
  address,
  specialties,
  isOpen,
  image,
  emergency = false,
  phone,
}) => {
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites();

  const handleViewDetails = () => {
    navigate(`/clinic/${id}`);
    window.scrollTo(0, 0);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(id);
  };

  const handlePhoneClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    }
  };

  return (
    <div 
      onClick={handleViewDetails}
      className="bg-card rounded-2xl apple-shadow hover-lift smooth-transition border border-border/40 overflow-hidden cursor-pointer group"
    >
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-muted/50 to-muted/20">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-foreground rounded-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-background" />
          </div>
        </div>
        
        {/* Status Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          {emergency && (
            <Badge className="bg-red-500 text-white rounded-full px-3 py-1 text-xs font-medium">
              24h
            </Badge>
          )}
          <Badge 
            variant={isOpen ? "default" : "secondary"} 
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              isOpen 
                ? "bg-green-500 text-white" 
                : "bg-muted text-muted-foreground"
            }`}
          >
            <Clock className="w-3 h-3 mr-1" />
            {isOpen ? "Aberto" : "Fechado"}
          </Badge>
        </div>

        {/* Like Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFavoriteClick}
          className={`absolute top-4 right-4 w-9 h-9 p-0 glass-effect rounded-full hover:bg-background/80 smooth-transition ${
            isFavorite(id) ? 'text-red-500' : 'text-muted-foreground'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorite(id) ? 'fill-current' : ''}`} />
        </Button>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-semibold text-lg text-foreground leading-tight line-clamp-2 group-hover:text-foreground/80 smooth-transition">
            {name}
          </h3>
          <div className="flex items-center gap-1 text-sm ml-2 flex-shrink-0">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="font-semibold text-foreground">{rating}</span>
            <span className="text-muted-foreground">({reviews})</span>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start gap-2 text-muted-foreground mb-4">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <span>{address}</span>
            <span className="text-foreground font-medium ml-1">• {distance}</span>
          </div>
        </div>

        {/* Specialties */}
        <div className="flex flex-wrap gap-2 mb-6">
          {specialties.slice(0, 3).map((specialty, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className="text-xs rounded-full bg-muted/50 text-muted-foreground px-3 py-1"
            >
              {specialty}
            </Badge>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails();
            }}
            className="flex-1 bg-foreground text-background hover:bg-foreground/90 rounded-xl smooth-transition font-medium"
          >
            Ver detalhes
          </Button>
          {phone && (
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handlePhoneClick}
              className="w-12 h-12 border-border/50 rounded-xl hover:border-foreground smooth-transition"
            >
              <Phone className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClinicCard;
