/**
 * Veterinarians & Vet Appointments
 *
 * Cliente Supabase tipado: as tabelas veterinarians/vet_appointments e a RPC
 * export_clinic_month_appointments estão refletidas em database.ts.
 */
import { supabase } from './supabase';

const db = supabase;

export type ServiceType = 'in_person' | 'online' | 'both';
export type SlotStatus  = 'booked' | 'unavailable' | 'cancelled';

export interface Veterinarian {
  id: string;
  clinic_id: string;
  name: string;
  crm?: string | null;
  service_type: ServiceType;
  specialties: string[];
  avatar_url?: string | null;
  /** Dias da semana em que atende (0=domingo … 6=sábado). */
  work_days: number[];
  /** Início do expediente ('HH:MM'). */
  work_start: string;
  /** Fim do expediente ('HH:MM'). */
  work_end: string;
  created_at: string;
}

export interface VetAppointment {
  id: string;
  vet_id: string;
  clinic_id: string;
  ticket_id?: string | null;
  date: string;          // 'YYYY-MM-DD'
  time: string;          // 'HH:MM'
  status: SlotStatus;
  patient_name?: string | null;
  patient_pet?: string | null;
  patient_notes?: string | null;
  price?: number | null;
  created_at: string;
}

export interface CreateVetInput {
  clinic_id: string;
  name: string;
  crm?: string;
  service_type: ServiceType;
  specialties: string[];
  work_days: number[];
  work_start: string;
  work_end: string;
}

export interface BookSlotInput {
  vet_id: string;
  clinic_id: string;
  ticket_id?: string;
  date: string;
  time: string;
  status?: SlotStatus;
  patient_name?: string;
  patient_pet?: string;
  patient_notes?: string;
  price?: number;
}

/* ── Linha de exportação (consultas do mês) ─────────────────────────── */
export interface ExportRow {
  appt_date: string;
  appt_time: string;
  vet_name: string;
  price: number | null;
  pet_name: string | null;
  pet_breed: string | null;
  pet_species: string | null;
  tutor_name: string | null;
  tutor_cpf: string | null;
  tutor_email: string | null;
}

/* ── Default time slots (30-min intervals 08:00–17:30) ──────────────── */
export const DEFAULT_SLOTS: string[] = [
  '08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30',
  '16:00','16:30','17:00','17:30',
];

/* ── Working-hours check ─────────────────────────────────────────────── */

/**
 * Verifica se o veterinário atende no dia/horário informados,
 * cruzando os dias da semana e o intervalo de expediente do cadastro.
 */
export function isVetWorking(
  vet: Pick<Veterinarian, 'work_days' | 'work_start' | 'work_end'>,
  dateStr: string,   // 'YYYY-MM-DD'
  time: string,      // 'HH:MM'
): boolean {
  const dayOfWeek = new Date(`${dateStr}T12:00:00`).getDay();
  if (!vet.work_days?.includes(dayOfWeek)) return false;
  return time >= vet.work_start && time < vet.work_end;
}

/* ── Fetch all vets for a clinic ─────────────────────────────────────── */
export async function fetchVeterinarians(clinicId: string): Promise<Veterinarian[]> {
  const { data, error } = await db
    .from('veterinarians')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('name');
  if (error) throw error;
  return (data ?? []) as Veterinarian[];
}

/* ── Create a new vet ────────────────────────────────────────────────── */
export async function createVeterinarian(input: CreateVetInput): Promise<Veterinarian> {
  const { data, error } = await db
    .from('veterinarians')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Veterinarian;
}

/* ── Exporta consultas do mês (via RPC clinic-scoped) ────────────────── */
export async function fetchMonthExport(year: number, month: number): Promise<ExportRow[]> {
  const { data, error } = await db.rpc('export_clinic_month_appointments', {
    p_year: year,
    p_month: month,
  });
  if (error) throw error;
  return (data ?? []) as ExportRow[];
}

/* ── Delete a vet ────────────────────────────────────────────────────── */
export async function deleteVeterinarian(vetId: string): Promise<void> {
  const { error } = await db
    .from('veterinarians')
    .delete()
    .eq('id', vetId);
  if (error) throw error;
}

/* ── Fetch appointments for a vet within a month ─────────────────────── */
export async function fetchVetAppointments(
  vetId: string,
  year: number,
  month: number,  // 1-based
): Promise<VetAppointment[]> {
  const pad      = (n: number) => String(n).padStart(2, '0');
  const start    = `${year}-${pad(month)}-01`;
  const lastDay  = new Date(year, month, 0).getDate();
  const end      = `${year}-${pad(month)}-${pad(lastDay)}`;

  const { data, error } = await db
    .from('vet_appointments')
    .select('*')
    .eq('vet_id', vetId)
    .gte('date', start)
    .lte('date', end)
    .order('date')
    .order('time');
  if (error) throw error;
  return (data ?? []) as VetAppointment[];
}

/* ── Fetch all booked appointments for a clinic on a given date ──────── */
export async function fetchClinicAppointmentsByDate(
  clinicId: string,
  date: string,
): Promise<(VetAppointment & { vet_name: string })[]> {
  const { data, error } = await db
    .from('vet_appointments')
    .select('*, veterinarians(name)')
    .eq('clinic_id', clinicId)
    .eq('date', date)
    .eq('status', 'booked')
    .order('time');
  if (error) throw error;
  return ((data ?? []) as any[]).map((row: any) => ({
    ...row,
    vet_name: row.veterinarians?.name ?? 'Unknown',
  }));
}

/* ── Fetch all booked appointments for a clinic within a month ────────── */
export async function fetchClinicMonthAppointments(
  clinicId: string,
  year: number,
  month: number,
): Promise<(VetAppointment & { vet_name: string })[]> {
  const pad     = (n: number) => String(n).padStart(2, '0');
  const start   = `${year}-${pad(month)}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end     = `${year}-${pad(month)}-${pad(lastDay)}`;

  const { data, error } = await db
    .from('vet_appointments')
    .select('*, veterinarians(name)')
    .eq('clinic_id', clinicId)
    .gte('date', start)
    .lte('date', end)
    .eq('status', 'booked')
    .order('date')
    .order('time');
  if (error) throw error;
  return ((data ?? []) as any[]).map((row: any) => ({
    ...row,
    vet_name: row.veterinarians?.name ?? 'Unknown',
  }));
}

/* ── Book a slot ─────────────────────────────────────────────────────── */
export async function bookVetSlot(input: BookSlotInput): Promise<VetAppointment> {
  const { data, error } = await db
    .from('vet_appointments')
    .insert({ ...input, status: input.status ?? 'booked' })
    .select()
    .single();
  if (error) throw error;
  return data as VetAppointment;
}

/* ── Cancel a slot ───────────────────────────────────────────────────── */
export async function cancelVetSlot(slotId: string): Promise<void> {
  const { error } = await db
    .from('vet_appointments')
    .update({ status: 'cancelled' })
    .eq('id', slotId);
  if (error) throw error;
}

/* ── Week helpers ────────────────────────────────────────────────────── */

/** Returns which week of month (1–4) a date string belongs to */
export function getWeekOfMonth(dateStr: string): 1 | 2 | 3 | 4 {
  const day = parseInt(dateStr.slice(8, 10), 10);
  if (day <= 7)  return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
}

/** Returns array of date strings for a given week within a month */
export function getWeekDateRange(
  year: number,
  month: number,
  week: 1 | 2 | 3 | 4,
): { start: string; end: string; days: string[] } {
  const pad      = (n: number) => String(n).padStart(2, '0');
  const startDay = (week - 1) * 7 + 1;
  const lastDay  = new Date(year, month, 0).getDate();
  const endDay   = week === 4 ? lastDay : Math.min(week * 7, lastDay);

  const days: string[] = [];
  for (let d = startDay; d <= endDay; d++) {
    days.push(`${year}-${pad(month)}-${pad(d)}`);
  }
  return {
    start: `${year}-${pad(month)}-${pad(startDay)}`,
    end:   `${year}-${pad(month)}-${pad(endDay)}`,
    days,
  };
}
