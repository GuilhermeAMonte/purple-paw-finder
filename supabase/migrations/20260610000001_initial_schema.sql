-- ============================================================================
-- Paw Connect (Purple Paw Finder) — Schema Inicial
-- ----------------------------------------------------------------------------
-- Supabase Auth (auth.users) gerencia: credenciais, hash de senha (bcrypt),
-- verificação de e-mail, reset de senha e sessões JWT.
-- Este schema cobre apenas os dados de domínio da aplicação.
--
-- Princípios de segurança (alinhados às regras de appsec do projeto):
--  - RLS habilitado em TODAS as tabelas. Acesso negado por padrão.
--  - Identidade do usuário vem sempre de auth.uid() (claim do JWT),
--    nunca de um campo enviado pelo cliente (INPUT-015).
--  - Enums no banco funcionam como allowlists (INPUT-002, INPUT-005).
--  - PostgREST/Supabase usa queries parametrizadas por padrão (INPUT-006).
-- ============================================================================

-- ─── Extensões ──────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";        -- gen_random_uuid()

-- ─── Enums (allowlists no nível do banco) ────────────────────────────────────
create type user_type        as enum ('client', 'clinic');
create type plan_type         as enum ('free', 'basic', 'intermediary', 'experience');
create type species_type      as enum ('dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other');
create type approval_status   as enum ('pending', 'approved', 'rejected');
create type ticket_status     as enum ('pending', 'confirmed', 'cancelled');
create type message_sender    as enum ('client', 'clinic', 'system');
create type message_type      as enum ('text', 'system');

-- ============================================================================
-- TABELA: profiles  (1:1 com auth.users)
-- Dados comuns a clientes e clínicas. PII de clientes fica protegida por RLS.
-- ============================================================================
create table public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  user_type           user_type   not null,
  name                text        not null check (char_length(name) between 1 and 150),
  phone               text        check (phone is null or char_length(phone) between 10 and 15),
  address             text        check (address is null or char_length(address) <= 255),
  avatar_url          text,
  is_profile_complete boolean     not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ============================================================================
-- TABELA: clinics  (1:1 com profiles onde user_type = 'clinic')
-- Listagem pública de negócios — legível por qualquer um para a busca.
-- ============================================================================
create table public.clinics (
  id                    uuid primary key references public.profiles(id) on delete cascade,
  plan                  plan_type     not null default 'free',
  clinic_name           text          check (clinic_name is null or char_length(clinic_name) between 1 and 100),
  cnpj                  text          check (cnpj is null or cnpj ~ '^\d{14}$'),
  -- Endereço
  street                text,
  number                text,
  complement            text,
  neighborhood          text,
  city                  text,
  state                 text          check (state is null or char_length(state) = 2),
  zip_code              text,
  -- Configuração
  specialties           text[]        not null default '{}',
  animal_types          species_type[] not null default '{}',
  services              text[]        not null default '{}',
  description           text          check (description is null or char_length(description) <= 1000),
  is_24_hours           boolean       not null default false,
  schedules             jsonb         not null default '{}'::jsonb,
  -- Visual
  logo_url              text,
  cover_url             text,
  primary_color         text          check (primary_color is null or primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  -- Dados calculados
  rating                numeric(2,1)  check (rating is null or rating between 0 and 5),
  review_count          integer       not null default 0,
  latitude              double precision,
  longitude             double precision,
  is_emergency_available boolean      not null default false,
  created_at            timestamptz   not null default now(),
  updated_at            timestamptz   not null default now()
);

-- ============================================================================
-- TABELA: pets
-- ============================================================================
create table public.pets (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid          not null references public.profiles(id) on delete cascade,
  name        text          not null check (char_length(name) between 1 and 100),
  species     species_type  not null,
  breed       text          not null check (char_length(breed) between 1 and 100),
  birth_date  date,
  weight      numeric(5,2)  check (weight is null or weight > 0),
  photo_url   text,
  created_at  timestamptz   not null default now()
);

-- ============================================================================
-- TABELA: tickets  (solicitações de agendamento)
-- pet_* são snapshots no momento da criação (imutáveis ao editar o pet).
-- ============================================================================
create table public.tickets (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid          not null references public.profiles(id) on delete cascade,
  clinic_id         uuid          not null references public.clinics(id) on delete cascade,
  pet_id            uuid          references public.pets(id) on delete set null,
  pet_name          text          not null,
  pet_species       species_type  not null,
  pet_breed         text          not null,
  service           text          not null,
  title             text          not null check (char_length(title) between 1 and 100),
  description       text          not null check (char_length(description) between 1 and 1000),
  scheduled_date    date          not null,
  scheduled_time    text          not null check (scheduled_time ~ '^\d{2}:\d{2}$'),
  referral_file_url text,
  approval_status   approval_status not null default 'pending',
  status            ticket_status   not null default 'pending',
  rejection_reason  text          check (rejection_reason is null or char_length(rejection_reason) <= 500),
  is_emergency      boolean       not null default false,
  created_at        timestamptz   not null default now()
);

create index tickets_user_id_idx   on public.tickets(user_id);
create index tickets_clinic_id_idx on public.tickets(clinic_id);

-- ============================================================================
-- TABELA: chat_messages
-- ============================================================================
create table public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid          not null references public.tickets(id) on delete cascade,
  sender_id   uuid          references public.profiles(id) on delete set null, -- null para 'system'
  sender_type message_sender not null,
  text        text          not null check (char_length(text) between 1 and 1000),
  type        message_type  not null default 'text',
  created_at  timestamptz   not null default now()
);

create index chat_messages_ticket_id_idx on public.chat_messages(ticket_id, created_at);

-- ============================================================================
-- TABELA: favorites  (N:N cliente ↔ clínica)
-- ============================================================================
create table public.favorites (
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  clinic_id  uuid        not null references public.clinics(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, clinic_id)
);

-- ============================================================================
-- TABELA: reports / blocks
-- ============================================================================
create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid        not null references public.profiles(id) on delete cascade,
  reported_id uuid        not null references public.profiles(id) on delete cascade,
  ticket_id   uuid        references public.tickets(id) on delete set null,
  reason      text        check (reason is null or char_length(reason) <= 500),
  created_at  timestamptz not null default now()
);

create table public.blocks (
  id          uuid primary key default gen_random_uuid(),
  blocker_id  uuid        not null references public.profiles(id) on delete cascade,
  blocked_id  uuid        not null references public.profiles(id) on delete cascade,
  ticket_id   uuid        references public.tickets(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (blocker_id, blocked_id)
);

-- ============================================================================
-- TRIGGER: criar profile automaticamente ao registrar usuário
-- Lê name/user_type/plan de raw_user_meta_data (enviado no signUp).
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, user_type, name)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'user_type')::user_type, 'client'),
    coalesce(new.raw_user_meta_data ->> 'name', 'Usuário')
  );

  -- Se for clínica, cria a linha em clinics com o plano escolhido
  if (new.raw_user_meta_data ->> 'user_type') = 'clinic' then
    insert into public.clinics (id, plan)
    values (
      new.id,
      coalesce((new.raw_user_meta_data ->> 'plan')::plan_type, 'free')
    );
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- TRIGGER: manter updated_at
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger clinics_updated_at before update on public.clinics
  for each row execute function public.set_updated_at();

-- ============================================================================
-- ROW-LEVEL SECURITY
-- ============================================================================
alter table public.profiles      enable row level security;
alter table public.clinics       enable row level security;
alter table public.pets          enable row level security;
alter table public.tickets       enable row level security;
alter table public.chat_messages enable row level security;
alter table public.favorites     enable row level security;
alter table public.reports       enable row level security;
alter table public.blocks        enable row level security;

-- ─── profiles ────────────────────────────────────────────────────────────────
-- Cada um lê/edita o próprio profile. Uma clínica também pode ler o profile
-- de um cliente que tenha ticket com ela (e vice-versa) — necessário no chat.
create policy "profiles: read own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: read counterpart via ticket"
  on public.profiles for select
  using (
    exists (
      select 1 from public.tickets t
      where (t.user_id = auth.uid() and t.clinic_id = profiles.id)
         or (t.clinic_id = auth.uid() and t.user_id = profiles.id)
    )
  );

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- ─── clinics ─────────────────────────────────────────────────────────────────
-- Listagem pública: qualquer pessoa (inclusive anônima) pode buscar clínicas.
create policy "clinics: public read"
  on public.clinics for select
  using (true);

create policy "clinics: owner update"
  on public.clinics for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- ─── pets ────────────────────────────────────────────────────────────────────
create policy "pets: owner full access"
  on public.pets for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ─── tickets ─────────────────────────────────────────────────────────────────
-- Cliente cria (identidade vem do JWT, não do payload — INPUT-015).
create policy "tickets: client insert as self"
  on public.tickets for insert
  with check (auth.uid() = user_id);

-- Cliente dono OU clínica destinatária podem ler.
create policy "tickets: participants read"
  on public.tickets for select
  using (auth.uid() = user_id or auth.uid() = clinic_id);

-- Clínica destinatária aprova/recusa; cliente pode cancelar o próprio.
create policy "tickets: clinic updates"
  on public.tickets for update
  using (auth.uid() = clinic_id) with check (auth.uid() = clinic_id);

create policy "tickets: client cancels own"
  on public.tickets for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── chat_messages ───────────────────────────────────────────────────────────
-- Só participantes do ticket leem; remetente só insere em seu próprio nome.
create policy "chat: participants read"
  on public.chat_messages for select
  using (
    exists (
      select 1 from public.tickets t
      where t.id = chat_messages.ticket_id
        and (t.user_id = auth.uid() or t.clinic_id = auth.uid())
    )
  );

create policy "chat: participants insert as self"
  on public.chat_messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.tickets t
      where t.id = chat_messages.ticket_id
        and (t.user_id = auth.uid() or t.clinic_id = auth.uid())
    )
  );

-- ─── favorites ───────────────────────────────────────────────────────────────
create policy "favorites: owner full access"
  on public.favorites for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── reports / blocks ────────────────────────────────────────────────────────
create policy "reports: insert as self"
  on public.reports for insert with check (auth.uid() = reporter_id);
create policy "reports: read own"
  on public.reports for select using (auth.uid() = reporter_id);

create policy "blocks: insert as self"
  on public.blocks for insert with check (auth.uid() = blocker_id);
create policy "blocks: read own"
  on public.blocks for select using (auth.uid() = blocker_id);
