/**
 * Veterinarians & Vet Appointments
 *
 * Uses a type-cast Supabase client because the new tables (veterinarians,
 * vet_appointments) are not yet reflected in the generated database.ts.
 * After running the migration and regenerating types, replace `db` with
 * the typed `supabase` client and remove the `as any` casts.
 */
import { supabase } from './supabase';

// Untyped helper until DB types are regenerated
const db = supabase as any;

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
  created_at: string;
}

export interface CreateVetInput {
  clinic_id: string;
  name: string;
  crm?: string;
  service_type: ServiceType;
  specialties: string[];
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
}

/* ── Default time slots (30-min intervals 08:00–17:30) ──────────────── */
export const DEFAULT_SLOTS: string[] = [
  '08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30',
  '16:00','16:30','17:00','17:30',
];

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
