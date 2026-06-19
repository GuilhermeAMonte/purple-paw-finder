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

/**
 * Mapeia erros do Supabase (Postgres) ao salvar dados da clínica para
 * mensagens user-friendly sem expor internals do banco.
 */
function mapClinicSaveError(message: string, code?: string): string {
  const lower = message.toLowerCase();

  // Violação de unicidade (ex: CNPJ duplicado)
  if (code === '23505' || lower.includes('duplicate') || lower.includes('unique')) {
    if (lower.includes('cnpj')) {
      return 'Esse CNPJ já está cadastrado em outra clínica.';
    }
    if (lower.includes('phone')) {
      return 'Esse telefone já está em uso por outra clínica.';
    }
    return 'Alguns dos dados informados já estão em uso por outra clínica. Verifique CNPJ e telefone.';
  }

  // Violação de check constraint
  if (code === '23514' || lower.includes('check') || lower.includes('violates')) {
    return 'Alguns campos possuem valores fora do permitido. Verifique os dados e tente novamente.';
  }

  // Permissão negada (RLS)
  if (code === '42501' || lower.includes('permission denied') || lower.includes('rls')) {
    return 'Você não tem permissão para realizar essa ação. Faça login novamente.';
  }

  // Sem linhas afetadas (clínica não encontrada)
  if (lower.includes('no rows') || lower.includes('0 rows')) {
    return 'Não foi possível localizar o perfil da clínica. Faça logout e entre novamente.';
  }

  // Timeout / conexão
  if (lower.includes('timeout') || lower.includes('network') || lower.includes('fetch')) {
    return 'Erro de conexão com o servidor. Verifique sua internet e tente novamente.';
  }

  return 'Não foi possível salvar as alterações. Tente novamente em alguns instantes.';
}

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
    street: [data.street, data.number].filter(Boolean).join(', '),
    city: data.city,
    state: data.state,
    zipCode: data.cep,
  });

  const { data: updatedRows, error: clinicError } = await supabase
    .from('clinics')
    .update({
      clinic_name: data.clinicName,
      cnpj: stripCNPJ(data.cnpj),
      phone: data.phone,
      street: data.street,
      number: data.number,
      neighborhood: data.neighborhood || null,
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
    .eq('id', clinicId)
    .select();

  if (clinicError) {
    console.error('[clinics] Erro ao salvar setup:', clinicError.message);
    throw new Error(mapClinicSaveError(clinicError.message, clinicError.code));
  }

  if (!updatedRows || updatedRows.length === 0) {
    throw new Error('Sua sessão expirou ou o perfil da clínica não foi encontrado. Faça logout e entre novamente.');
  }

  // Marca o perfil como completo.
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ is_profile_complete: true })
    .eq('id', clinicId);

  if (profileError) {
    console.error('[clinics] Erro ao atualizar perfil:', profileError.message);
    throw new Error(mapClinicSaveError(profileError.message, profileError.code));
  }
}

/**
 * Atualiza o perfil editável da clínica a partir do dialog do Dashboard.
 * Salva na tabela clinics (nome, telefone, endereço, descrição, 24h, especialidades)
 * e atualiza o nome no profiles para manter consistência.
 */
export async function updateClinicProfile(
  clinicId: string,
  data: {
    clinicName: string;
    phone: string;
    address: string;
    description: string;
    is24Hours: boolean;
    specialties: string[];
  },
): Promise<void> {
  const isEmergency = data.is24Hours || data.specialties.includes('Emergência') || data.specialties.includes('Emergency');

  const { error: clinicError } = await supabase
    .from('clinics')
    .update({
      clinic_name: data.clinicName || null,
      phone: data.phone || null,
      street: data.address || null,
      description: data.description || null,
      is_24_hours: data.is24Hours,
      specialties: data.specialties,
      is_emergency_available: isEmergency,
    })
    .eq('id', clinicId);

  if (clinicError) {
    console.error('[clinics] Erro ao atualizar perfil da clínica:', clinicError.message);
    throw new Error(mapClinicSaveError(clinicError.message, clinicError.code));
  }

  // Atualiza o nome também no profiles para manter consistência.
  if (data.clinicName) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ name: data.clinicName })
      .eq('id', clinicId);

    if (profileError) {
      console.error('[clinics] Erro ao sincronizar nome no profiles:', profileError.message);
      // Não falha — o dado principal (clinics) já foi salvo.
    }
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

/**
 * Downgrade/cancelamento de plano (cancelar = voltar para 'free').
 * O RLS trava alteração direta de `plan`; usa o RPC que só permite rebaixar.
 */
export async function changeClinicPlan(plan: ClinicRow['plan']): Promise<ClinicRow['plan']> {
  const { data, error } = await supabase.rpc('change_clinic_plan', { p_plan: plan });
  if (error) {
    console.error('[clinics] Erro ao alterar plano:', error.message);
    throw new Error(error.message);
  }
  return data as ClinicRow['plan'];
}
