import { supabase } from './supabase';

const db = supabase as any;

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type TicketStatus   = 'pending' | 'confirmed' | 'cancelled';
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

/* ── Tickets ─────────────────────────────────────────────────────────────── */

export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  const { data, error } = await db
    .from('tickets')
    .insert({ ...input, approval_status: 'pending', status: 'pending' })
    .select()
    .single();
  if (error) throw error;
  return data as Ticket;
}

export async function fetchClientTickets(userId: string): Promise<Ticket[]> {
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
  const { error } = await db
    .from('tickets')
    .update({ approval_status: 'approved', status: 'confirmed' })
    .eq('id', ticketId);
  if (error) throw error;
}

export async function rejectTicket(ticketId: string, reason: string): Promise<void> {
  const { error } = await db
    .from('tickets')
    .update({ approval_status: 'rejected', status: 'cancelled', rejection_reason: reason })
    .eq('id', ticketId);
  if (error) throw error;
}

export async function cancelTicket(ticketId: string): Promise<void> {
  const { error } = await db
    .from('tickets')
    .update({ status: 'cancelled', approval_status: 'rejected' })
    .eq('id', ticketId);
  if (error) throw error;
}

/* ── Chat messages ────────────────────────────────────────────────────────── */

export async function fetchMessages(ticketId: string): Promise<ChatMessage[]> {
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
  const { data, error } = await db
    .from('chat_messages')
    .insert({
      ticket_id: ticketId,
      sender_id: senderType === 'system' ? null : senderId,
      sender_type: senderType,
      text,
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
