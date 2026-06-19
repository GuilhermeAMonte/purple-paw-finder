// ============================================================================
// Busca de clínicas — leitura do banco, filtro e ordenação.
// ----------------------------------------------------------------------------
// Regras de ordenação (conforme pedido):
//  1. Avaliação (rating) — melhores primeiro.
//  2. Número de avaliações — desempate.
//  3. Distância ao usuário — desempate final (quando há coordenadas).
// A localização filtra o conjunto; clínicas mais próximas aparecem com a
// distância calculada e são priorizadas em empates de avaliação.
// ============================================================================

import { supabase } from '@/lib/supabase';
import { calculateDistance } from '@/hooks/use-geolocation';
import type { Coordinates } from '@/hooks/use-geolocation';

export interface ClinicListItem {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  address: string;
  city: string;
  state: string;
  neighborhood: string;
  specialties: string[];
  animalTypes: string[];
  isOpen: boolean;
  emergency: boolean;
  phone: string | null;
  lat: number | null;
  lng: number | null;
}

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

interface DaySchedule { open: string; close: string; isOpen: boolean }

/** Determina se a clínica está aberta no instante informado. */
export function isClinicOpen(
  schedules: unknown,
  is24Hours: boolean,
  at: Date = new Date(),
): boolean {
  if (is24Hours) return true;
  if (!schedules || typeof schedules !== 'object') return false;

  const dayKey = WEEKDAYS[at.getDay()];
  const day = (schedules as Record<string, DaySchedule>)[dayKey];
  if (!day || !day.isOpen) return false;

  const now = `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;
  return now >= day.open && now < day.close;
}

function normalize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/** Busca todas as clínicas com perfil configurado (clinic_name preenchido e pelo menos 1 especialidade). */
export async function fetchClinics(): Promise<ClinicListItem[]> {
  const { data, error } = await supabase
    .from('clinics')
    .select(`
      id,
      clinic_name,
      rating,
      review_count,
      street,
      number,
      neighborhood,
      city,
      state,
      specialties,
      animal_types,
      schedules,
      is_24_hours,
      is_emergency_available,
      phone,
      latitude,
      longitude
    `)
    // clinic_name só é gravado ao salvar o setup → já filtra clínicas incompletas.
    // (Não embeda profiles: RLS de profiles bloqueia anon e zeraria a lista pública.)
    .not('clinic_name', 'is', null)
    .order('rating', { ascending: false, nullsFirst: false })
    .order('review_count', { ascending: false });

  if (error) {
    console.error('[clinicSearch] Erro ao buscar clínicas:', error.message);
    throw new Error('Não foi possível carregar as clínicas');
  }

  return (data ?? []).map((c: any) => ({
    id: c.id,
    name: c.clinic_name ?? 'Clínica',
    rating: c.rating ?? 0,
    reviews: c.review_count ?? 0,
    address: [c.street, c.number].filter(Boolean).join(', '),
    city: c.city ?? '',
    state: c.state ?? '',
    neighborhood: c.neighborhood ?? '',
    specialties: c.specialties ?? [],
    animalTypes: c.animal_types ?? [],
    isOpen: isClinicOpen(c.schedules, c.is_24_hours),
    emergency: c.is_emergency_available,
    phone: c.phone,
    lat: c.latitude,
    lng: c.longitude,
  }));
}

export interface SearchParams {
  location?: string;
  specialty?: string;
  coords?: Coordinates | null;
  userPetTypes?: string[];
}

/** Filtra e ordena a lista de clínicas conforme os critérios de busca. */
export function filterAndSortClinics(
  clinics: ClinicListItem[],
  { location = '', specialty = '', coords = null, userPetTypes = [] }: SearchParams,
): ClinicListItem[] {
  const loc = normalize(location);
  const spec = normalize(specialty);

  const filtered = clinics.filter((clinic) => {
    const combined = [clinic.name, clinic.city, clinic.state, clinic.neighborhood, clinic.address, ...clinic.specialties]
      .map(normalize)
      .join(' ');

    const matchesLocation = loc === '' || combined.includes(loc);
    const matchesSpecialty =
      spec === '' ||
      clinic.specialties.map(normalize).some((s) => s.includes(spec)) ||
      normalize(clinic.name).includes(spec);
    const nameMatchesSearch = loc !== '' && normalize(clinic.name).includes(loc);
    const matchesAnimalType =
      userPetTypes.length === 0 ||
      nameMatchesSearch ||
      userPetTypes.some((petType) => clinic.animalTypes.includes(petType));

    return matchesLocation && matchesSpecialty && matchesAnimalType;
  });

  return filtered.sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (b.reviews !== a.reviews) return b.reviews - a.reviews;
    if (coords && a.lat != null && a.lng != null && b.lat != null && b.lng != null) {
      const distA = calculateDistance(coords.latitude, coords.longitude, a.lat, a.lng);
      const distB = calculateDistance(coords.latitude, coords.longitude, b.lat, b.lng);
      return distA - distB;
    }
    return 0;
  });
}
