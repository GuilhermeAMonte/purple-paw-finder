-- ============================================================================
-- Performance & Robustez — Índices e constraints adicionais
-- ----------------------------------------------------------------------------
-- Baseado na análise dos padrões de acesso da aplicação:
--  - fetchClinics() filtra por clinic_name NOT NULL + profiles.is_profile_complete
--  - filterAndSortClinics() filtra por city, state, neighborhood (texto)
--  - fetchClinicTickets() filtra por clinic_id + ordena por created_at
--  - fetchClientTickets() filtra por user_id + ordena por created_at
--  - Dashboard filtra tickets por approval_status
--  - Pets são sempre buscados por owner_id
--  - CNPJ deve ser único entre clínicas
-- ============================================================================

-- ─── clinics: índices de busca ───────────────────────────────────────────────

-- Busca por nome (listagem/search) — partial index exclui NULLs
create index if not exists clinics_clinic_name_idx
  on public.clinics (clinic_name)
  where clinic_name is not null;

-- Busca por localização (cidade, estado, bairro)
create index if not exists clinics_city_state_idx
  on public.clinics (state, city);

create index if not exists clinics_neighborhood_idx
  on public.clinics (neighborhood)
  where neighborhood is not null;

-- Ordenação por rating + review_count (critério padrão de listagem)
create index if not exists clinics_rating_reviews_idx
  on public.clinics (rating desc nulls last, review_count desc);

-- Busca geográfica (latitude, longitude) para queries de proximidade
create index if not exists clinics_geo_idx
  on public.clinics (latitude, longitude)
  where latitude is not null and longitude is not null;

-- Busca por especialidades (GIN para arrays)
create index if not exists clinics_specialties_gin_idx
  on public.clinics using gin (specialties);

-- Busca por tipos de animais atendidos (GIN para arrays)
create index if not exists clinics_animal_types_gin_idx
  on public.clinics using gin (animal_types);

-- CNPJ deve ser único (impede duplicatas no banco, não só no código)
create unique index if not exists clinics_cnpj_unique_idx
  on public.clinics (cnpj)
  where cnpj is not null;

-- ─── tickets: índices compostos para queries do dashboard ────────────────────

-- Dashboard da clínica: filtra por clinic_id + approval_status + ordena por created_at
create index if not exists tickets_clinic_approval_idx
  on public.tickets (clinic_id, approval_status, created_at desc);

-- Histórico do cliente: filtra por user_id + ordena por created_at
create index if not exists tickets_user_created_idx
  on public.tickets (user_id, created_at desc);

-- Busca por data agendada (para calendário de agendamentos)
create index if not exists tickets_scheduled_date_idx
  on public.tickets (clinic_id, scheduled_date);

-- ─── pets: índice de busca por dono ──────────────────────────────────────────

create index if not exists pets_owner_id_idx
  on public.pets (owner_id);

-- ─── profiles: índice para JOINs de listagem ────────────────────────────────

-- fetchClinics faz JOIN com profiles.is_profile_complete = true
create index if not exists profiles_complete_idx
  on public.profiles (id)
  where is_profile_complete = true;

-- ─── chat_messages: índice para contagem e últimas mensagens ─────────────────

-- Já existe chat_messages_ticket_id_idx (ticket_id, created_at).
-- Adicionamos índice no sender_id para queries de perfil/histórico.
create index if not exists chat_messages_sender_idx
  on public.chat_messages (sender_id)
  where sender_id is not null;

-- ─── favorites: índice reverso para contar favoritos de uma clínica ──────────

create index if not exists favorites_clinic_id_idx
  on public.favorites (clinic_id);
