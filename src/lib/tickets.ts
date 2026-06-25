// ============================================================================
// Tickets & Chat — Camada de acesso a dados
// ----------------------------------------------------------------------------
// Proteção IDOR:
//   • Backend: RLS garante que só participantes (user_id / clinic_id) podem
//     ler e modificar tickets e mensagens.
//   • Frontend: antes de cada mutation, verificamos que o usuário autenticado
//     é participante legítimo. Isso evita requests desnecessários ao banco e
//     dá feedback imediato ao usuário se algo estiver errado.
// ============================================================================

import { supabase } from './supabase';
import type { SpeciesType } from '@/types/database';
import { sanitizeLine, sanitizeMultiline } from './sanitize';

const db = supabase;

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type TicketStatus   = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type MessageSender  = 'client' | 'clinic' | 'system';

export interface Ticket {
  id: string;
  user_id: string;
  clinic_id: string;
  pet_id?: string | null;
  pet_name: string;
  pet_species: string;
  pet_breed: string;
  service: string;
  title: string;
  description: string;
  scheduled_date: string;
  scheduled_time: string;
  referral_file_url?: string | null;
  approval_status: ApprovalStatus;
  status: TicketStatus;
  rejection_reason?: string | null;
  is_emergency: boolean;
  created_at: string;
  // price confirmation flow
  pending_vet_id?: string | null;
  pending_price?: number | null;
  client_confirmation?: 'pending' | 'confirmed' | 'cancelled' | null;
  // completion
  completed_at?: string | null;
  final_amount?: number | null;
  treatment_summary?: string | null;
  payment_proof_url?: string | null;
  // joined
  clinic_name?: string;
  client_name?: string;
}

export interface ChatMessage {
  id: string;
  ticket_id: string;
  sender_id?: string | null;
  sender_type: MessageSender;
  text: string;
  type: 'text' | 'system';
  created_at: string;
}

export interface CreateTicketInput {
  user_id: string;
  clinic_id: string;
  pet_id?: string;
  pet_name: string;
  pet_species: string;
  pet_breed: string;
  service: string;
  title: string;
  description: string;
  scheduled_date: string;
  scheduled_time: string;
  referral_file_url?: string | null;
  is_emergency?: boolean;
}

// ─── Helpers internos ────────────────────────────────────────────────────────

/** Retorna o ID do usuário autenticado ou null se não há sessão. */
async function getAuthUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Verifica se o usuário autenticado é participante (user_id ou clinic_id)
 * do ticket. Lança erro se não for.
 */
async function assertTicketParticipant(ticketId: string): Promise<Ticket> {
  const userId = await getAuthUserId();
  if (!userId) throw new Error('Sessão expirada. Faça login novamente.');

  const { data: ticket, error } = await db
    .from('tickets')
    .select('id, user_id, clinic_id, approval_status, status')
    .eq('id', ticketId)
    .maybeSingle();

  if (error || !ticket) {
    throw new Error('Ticket não encontrado ou acesso negado.');
  }

  if (ticket.user_id !== userId && ticket.clinic_id !== userId) {
    throw new Error('Você não tem permissão para acessar este ticket.');
  }

  return ticket as Ticket;
}

/**
 * Verifica que o usuário autenticado é a clínica dona do ticket.
 * Necessário para approve/reject.
 */
async function assertTicketClinic(ticketId: string): Promise<Ticket> {
  const userId = await getAuthUserId();
  if (!userId) throw new Error('Sessão expirada. Faça login novamente.');

  const { data: ticket, error } = await db
    .from('tickets')
    .select('id, user_id, clinic_id, approval_status, status')
    .eq('id', ticketId)
    .maybeSingle();

  if (error || !ticket) {
    throw new Error('Ticket não encontrado ou acesso negado.');
  }

  if (ticket.clinic_id !== userId) {
    throw new Error('Apenas a clínica pode aprovar ou rejeitar este ticket.');
  }

  return ticket as Ticket;
}

// ─── Tickets ─────────────────────────────────────────────────────────────────

export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  const userId = await getAuthUserId();
  if (!userId) throw new Error('Sessão expirada. Faça login novamente.');

  if (input.user_id !== userId) {
    throw new Error('Não é permitido criar tickets em nome de outro usuário.');
  }

  const petName    = sanitizeLine(input.pet_name);
  const petSpecies = sanitizeLine(input.pet_species);
  const petBreed   = sanitizeLine(input.pet_breed);
  const service    = sanitizeLine(input.service);
  const title      = sanitizeLine(input.title);
  const description = sanitizeMultiline(input.description);

  if (!petName || !petSpecies || !service || !title || !description) {
    throw new Error('Campos obrigatórios do chamado não podem ser vazios.');
  }
  if (!input.scheduled_date || !input.scheduled_time) {
    throw new Error('Data e horário da consulta são obrigatórios.');
  }

  const { data, error } = await db
    .from('tickets')
    .insert({
      ...input,
      pet_name:    petName,
      pet_species: petSpecies as SpeciesType,
      pet_breed:   petBreed,
      service,
      title,
      description,
      approval_status: 'pending',
      status: 'pending',
    })
    .select()
    .single();
  if (error) throw error;
  return data as Ticket;
}

export async function fetchClientTickets(userId: string): Promise<Ticket[]> {
  // Valida que o caller está pedindo seus próprios tickets
  const authId = await getAuthUserId();
  if (!authId || authId !== userId) {
    throw new Error('Acesso negado: não é possível listar tickets de outro usuário.');
  }

  const { data, error } = await db
    .from('tickets')
    .select('*, clinics(clinic_name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as any[]).map((row: any) => ({
    ...row,
    clinic_name: row.clinics?.clinic_name ?? 'Clínica',
  }));
}

export async function fetchClinicTickets(clinicId: string): Promise<Ticket[]> {
  // Valida que a clínica está pedindo seus próprios tickets
  const authId = await getAuthUserId();
  if (!authId || authId !== clinicId) {
    throw new Error('Acesso negado: não é possível listar tickets de outra clínica.');
  }

  const { data, error } = await db
    .from('tickets')
    .select('*, profiles(name)')
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as any[]).map((row: any) => ({
    ...row,
    client_name: row.profiles?.name ?? 'Cliente',
  }));
}

export async function approveTicket(ticketId: string): Promise<void> {
  // Somente a clínica dona pode aprovar
  await assertTicketClinic(ticketId);

  const { error } = await db
    .from('tickets')
    .update({ approval_status: 'approved', status: 'confirmed' })
    .eq('id', ticketId);
  if (error) throw error;
}

export async function rejectTicket(ticketId: string, reason: string): Promise<void> {
  await assertTicketClinic(ticketId);

  const { error } = await db
    .from('tickets')
    .update({ approval_status: 'rejected', status: 'cancelled', rejection_reason: sanitizeLine(reason) })
    .eq('id', ticketId);
  if (error) throw error;
}

export async function cancelTicket(ticketId: string): Promise<void> {
  const userId = await getAuthUserId();
  if (!userId) throw new Error('Sessão expirada. Faça login novamente.');

  const ticket = await assertTicketParticipant(ticketId);

  if (ticket.user_id === userId) {
    // Cliente: usa SECURITY DEFINER RPC — evita UPDATE direto sem restrição de coluna
    const { error } = await (db as any).rpc('cancel_ticket', { p_ticket_id: ticketId });
    if (error) throw error;
  } else {
    // Clínica: UPDATE direto coberto pela policy "tickets: clinic updates"
    const { error } = await db
      .from('tickets')
      .update({ status: 'cancelled', approval_status: 'rejected' })
      .eq('id', ticketId);
    if (error) throw error;
  }
}

export async function proposeAppointmentPrice(
  ticketId: string,
  vetId: string,
  price?: number,
): Promise<void> {
  await assertTicketClinic(ticketId);

  const { error } = await (db as any)
    .from('tickets')
    .update({
      pending_vet_id: vetId,
      pending_price: price ?? null,
      client_confirmation: 'pending',
    })
    .eq('id', ticketId);
  if (error) throw error;
}

export async function clientConfirmAppointment(ticketId: string): Promise<void> {
  const { error } = await (db as any).rpc('client_confirm_appointment', { p_ticket_id: ticketId });
  if (error) throw error;
}

export async function clientCancelAppointment(ticketId: string): Promise<void> {
  const { error } = await (db as any).rpc('client_cancel_appointment', { p_ticket_id: ticketId });
  if (error) throw error;
}

export async function completeTicket(
  ticketId: string,
  data: { finalAmount?: number; treatmentSummary?: string; paymentProofUrl?: string },
): Promise<void> {
  await assertTicketClinic(ticketId);

  const { error } = await (db as any)
    .from('tickets')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      final_amount: data.finalAmount ?? null,
      treatment_summary: data.treatmentSummary ?? null,
      payment_proof_url: data.paymentProofUrl ?? null,
    })
    .eq('id', ticketId);
  if (error) throw error;

  // Best-effort: mark linked vet_appointment as completed
  await (db as any)
    .from('vet_appointments')
    .update({ status: 'completed' })
    .eq('ticket_id', ticketId)
    .neq('status', 'cancelled');
}

// ─── Chat messages ───────────────────────────────────────────────────────────

export async function fetchMessages(ticketId: string): Promise<ChatMessage[]> {
  // Valida participação antes de buscar mensagens
  await assertTicketParticipant(ticketId);

  const { data, error } = await db
    .from('chat_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ChatMessage[];
}

export async function sendMessage(
  ticketId: string,
  senderId: string,
  senderType: MessageSender,
  text: string,
): Promise<ChatMessage> {
  const sanitized = sanitizeMultiline(text);
  if (sanitized.length === 0) throw new Error('Mensagem não pode ser vazia.');

  const userId = await getAuthUserId();
  if (!userId) throw new Error('Sessão expirada. Faça login novamente.');

  if (senderType !== 'system' && senderId !== userId) {
    throw new Error('Não é permitido enviar mensagens em nome de outro usuário.');
  }

  await assertTicketParticipant(ticketId);

  const { data, error } = await db
    .from('chat_messages')
    .insert({
      ticket_id: ticketId,
      sender_id: senderType === 'system' ? null : senderId,
      sender_type: senderType,
      text: sanitized,
      type: senderType === 'system' ? 'system' : 'text',
    })
    .select()
    .single();
  if (error) throw error;
  return data as ChatMessage;
}

export function subscribeToMessages(
  ticketId: string,
  onMessage: (msg: ChatMessage) => void,
) {
  // Nota: a subscription do Realtime também é filtrada pela RLS no backend.
  // Se o usuário não for participante, o canal não receberá eventos.
  return db
    .channel(`chat:${ticketId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages',
      filter: `ticket_id=eq.${ticketId}`,
    }, (payload: any) => onMessage(payload.new as ChatMessage))
    .subscribe();
}
