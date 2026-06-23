
import React from 'react';
import { Star, MapPin, Heart, Clock, Zap } from 'lucide-react';
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
}

const ClinicCard: React.FC<ClinicCardProps> = ({
  id = "1",
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
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites();
  const favorited = isFavorite(id);

  const handleViewDetails = () => {
    navigate(`/clinic/${id}`);
    window.scrollTo(0, 0);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(id);
  };

  /* Generate a consistent pastel gradient per clinic */
  const gradients = [
    'from-violet-100 to-purple-50',
    'from-indigo-100 to-violet-50',
    'from-purple-100 to-fuchsia-50',
    'from-fuchsia-100 to-pink-50',
    'from-violet-100 to-indigo-50',
  ];
  const gradient = gradients[(id.charCodeAt(0) || 0) % gradients.length];

  return (
    <div
      onClick={handleViewDetails}
      className="group relative bg-card rounded-2xl border border-border/40 overflow-hidden cursor-pointer card-interactive shadow-depth-sm"
    >
      {/* Image / placeholder area */}
      <div className={`relative h-44 bg-gradient-to-br ${gradient} overflow-hidden`}>
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(139,92,246,0.3) 1px, transparent 0)', backgroundSize: '24px 24px' }}
        />

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 gradient-purple rounded-2xl flex items-center justify-center shadow-depth-md transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
            <Heart className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* Status badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {emergency && (
            <span className="inline-flex items-center gap-1 bg-red-500 text-white rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm pulse-emergency">
              <Zap className="w-3 h-3" />
              24h
            </span>
          )}
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium shadow-sm ${
            isOpen ? 'bg-emerald-500 text-white' : 'bg-background/80 text-muted-foreground backdrop-blur-sm'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-white' : 'bg-muted-foreground'}`} />
            {isOpen ? 'Open now' : 'Closed'}
          </span>
        </div>

        {/* Favorite button */}
        <button
          onClick={handleFavoriteClick}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center smooth-transition backdrop-blur-sm border ${
            favorited
              ? 'bg-red-50 border-red-200 text-red-500'
              : 'bg-background/70 border-border/40 text-muted-foreground hover:bg-background hover:border-border'
          }`}
          aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-3.5 h-3.5 ${favorited ? 'fill-current' : ''}`} />
        </button>

        {/* Distance pill */}
        {distance !== '-- km' && (
          <div className="absolute bottom-3 right-3 glass text-[11px] font-medium text-foreground/80 px-2.5 py-1 rounded-full">
            <MapPin className="inline w-3 h-3 mr-0.5 -mt-0.5" />
            {distance}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title + rating */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-semibold text-[15px] text-foreground leading-snug line-clamp-2 group-hover:text-primary smooth-transition">
            {name}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5">
            <Star className="w-3 h-3 text-amber-400 fill-current" />
            <span className="text-xs font-semibold text-amber-700">{rating}</span>
            <span className="text-[10px] text-amber-500/80">({reviews})</span>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start gap-1.5 text-muted-foreground mb-4">
          <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-muted-foreground/70" />
          <span className="text-xs leading-relaxed line-clamp-1">{address}</span>
        </div>

        {/* Specialties */}
        <div className="flex flex-wrap gap-1.5 mb-5 min-h-[24px]">
          {specialties.slice(0, 3).map((spec, i) => (
            <span
              key={i}
              className="text-[11px] font-medium bg-primary/6 text-primary/80 border border-primary/12 px-2.5 py-0.5 rounded-full"
            >
              {spec}
            </span>
          ))}
          {specialties.length > 3 && (
            <span className="text-[11px] text-muted-foreground px-2.5 py-0.5">
              +{specialties.length - 3} more
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={e => { e.stopPropagation(); handleViewDetails(); }}
            size="sm"
            className="flex-1 h-9 rounded-xl gradient-purple text-white text-sm font-medium hover:opacity-90 smooth-transition shadow-sm"
          >
            View details
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClinicCard;
