// ============================================================================
// Camada de acesso a dados das clínicas (Supabase)
// ----------------------------------------------------------------------------
// Toda escrita é feita na linha cujo id = auth.uid() (garantido pela RLS).
// A identidade vem do JWT — o userId passado aqui é só para o .eq(), e a RLS
// recusaria qualquer tentativa de escrever em linha de outra clínica.
// ============================================================================

import { supabase } from '@/lib/supabase';
import { stripCNPJ } from '@/lib/cnpj';
import { geocodeAddress } from '@/lib/geocode';
import type { ClinicRow, SpeciesType, Json } from '@/types/database';
import type { ClinicSetupInput } from '@/schemas/clinic.schemas';

export interface DaySchedule {
  open: string;
  close: string;
  isOpen: boolean;
}
export type WeekSchedule = Record<string, DaySchedule>;

/** Busca a clínica do usuário autenticado (para pré-preencher formulários). */
export async function getClinic(clinicId: string): Promise<ClinicRow | null> {
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .eq('id', clinicId)
    .maybeSingle();

  if (error) {
    console.warn('[clinics] Falha ao carregar clínica');
    return null;
  }
  return data;
}

/**
 * Persiste a configuração inicial da clínica (Req 11.5).
 * Atualiza a tabela clinics e o telefone no profiles, e marca o perfil
 * como completo. Os dados já devem ter passado pelo clinicSetupSchema.
 */
export async function saveClinicSetup(
  clinicId: string,
  data: ClinicSetupInput,
): Promise<void> {
  const isEmergency = data.is24Hours || data.specialties.includes('Emergência');

  // Geocodifica o endereço para permitir busca por proximidade (best-effort).
  const geo = await geocodeAddress({
    street: data.address,
    city: data.city,
    state: data.state,
    zipCode: data.cep,
  });

  const { error: clinicError } = await supabase
    .from('clinics')
    .update({
      clinic_name: data.clinicName,
      cnpj: stripCNPJ(data.cnpj),
      phone: data.phone,
      street: data.address,
      city: data.city || null,
      state: data.state || null,
      zip_code: data.cep || null,
      description: data.description || null,
      is_24_hours: data.is24Hours,
      specialties: data.specialties,
      animal_types: data.animalTypes as SpeciesType[],
      is_emergency_available: isEmergency,
      latitude: geo?.latitude ?? null,
      longitude: geo?.longitude ?? null,
    })
    .eq('id', clinicId);

  if (clinicError) {
    console.error('[clinics] Erro ao salvar setup:', clinicError.message);
    throw new Error(clinicError.message);
  }

  // Marca o perfil como completo.
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ is_profile_complete: true })
    .eq('id', clinicId);

  if (profileError) {
    console.error('[clinics] Erro ao atualizar perfil:', profileError.message);
    throw new Error(profileError.message);
  }
}

/**
 * Persiste a configuração visual: horários de funcionamento e flag 24h
 * (Req 17.5). Imagens e cor são tratadas em etapa separada (upload de Storage).
 */
export async function saveClinicVisual(
  clinicId: string,
  schedules: WeekSchedule,
  is24Hours: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('clinics')
    .update({
      schedules: schedules as unknown as Json,
      is_24_hours: is24Hours,
    })
    .eq('id', clinicId);

  if (error) {
    console.error('[clinics] Erro ao salvar visual:', error.message);
    throw new Error('Não foi possível salvar a configuração visual');
  }
}
