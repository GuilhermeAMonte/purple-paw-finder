-- ============================================================================
-- Veterinarians & Appointments scheduling system
-- ============================================================================

-- ─── Enums ───────────────────────────────────────────────────────────────────
create type service_type_enum as enum ('in_person', 'online', 'both');
create type slot_status_enum  as enum ('booked', 'unavailable', 'cancelled');

-- ============================================================================
-- TABELA: veterinarians
-- Cada veterinário pertence a uma clínica.
-- ============================================================================
create table public.veterinarians (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid         not null references public.clinics(id) on delete cascade,
  name          text         not null check (char_length(name) between 2 and 150),
  crm           text         check (crm is null or char_length(crm) <= 20),
  service_type  service_type_enum not null default 'in_person',
  specialties   text[]       not null default '{}',
  avatar_url    text,
  created_at    timestamptz  not null default now(),
  updated_at    timestamptz  not null default now()
);

create index veterinarians_clinic_id_idx on public.veterinarians(clinic_id);

-- ============================================================================
-- TABELA: vet_appointments
-- Slots ocupados (booked) ou bloqueados (unavailable) por veterinário.
-- Slots disponíveis são IMPLÍCITOS: qualquer slot não presente aqui está livre.
-- ============================================================================
create table public.vet_appointments (
  id            uuid primary key default gen_random_uuid(),
  vet_id        uuid         not null references public.veterinarians(id) on delete cascade,
  clinic_id     uuid         not null references public.clinics(id) on delete cascade,
  ticket_id     uuid         references public.tickets(id) on delete set null,
  date          date         not null,
  time          text         not null check (time ~ '^\d{2}:\d{2}$'),
  status        slot_status_enum not null default 'booked',
  patient_name  text         check (patient_name is null or char_length(patient_name) <= 150),
  patient_pet   text         check (patient_pet is null or char_length(patient_pet) <= 150),
  patient_notes text         check (patient_notes is null or char_length(patient_notes) <= 2000),
  created_at    timestamptz  not null default now(),

  -- Prevent double-booking same vet on same date+time
  unique (vet_id, date, time)
);

create index vet_appointments_vet_id_date_idx    on public.vet_appointments(vet_id, date);
create index vet_appointments_clinic_id_date_idx on public.vet_appointments(clinic_id, date);

-- ============================================================================
-- TRIGGERS
-- ============================================================================
create trigger veterinarians_updated_at
  before update on public.veterinarians
  for each row execute function public.set_updated_at();

-- ============================================================================
-- ROW-LEVEL SECURITY
-- ============================================================================
alter table public.veterinarians    enable row level security;
alter table public.vet_appointments enable row level security;

-- veterinarians: public read (clients need to see vet info), clinic owner manages
create policy "vets: public read"
  on public.veterinarians for select using (true);

create policy "vets: clinic owner insert"
  on public.veterinarians for insert
  with check (auth.uid() = clinic_id);

create policy "vets: clinic owner update"
  on public.veterinarians for update
  using (auth.uid() = clinic_id) with check (auth.uid() = clinic_id);

create policy "vets: clinic owner delete"
  on public.veterinarians for delete
  using (auth.uid() = clinic_id);

-- vet_appointments: clinic owner manages; clients can read slots for their tickets
create policy "vet_appts: clinic owner full"
  on public.vet_appointments for all
  using (auth.uid() = clinic_id) with check (auth.uid() = clinic_id);

create policy "vet_appts: client reads own"
  on public.vet_appointments for select
  using (
    exists (
      select 1 from public.tickets t
      where t.id = vet_appointments.ticket_id
        and t.user_id = auth.uid()
    )
  );

-- Public read for availability checking (status only, no PII)
create policy "vet_appts: public availability read"
  on public.vet_appointments for select
  using (true);
