-- ============================================================================
-- Migration: View pública para busca de clínicas + RLS hardening
-- ----------------------------------------------------------------------------
-- Problema: A tabela `clinics` expõe CNPJ e outros PIIs via anon key se a
-- RLS não restringir adequadamente o SELECT.
--
-- Solução:
--   1. Criar view `clinics_public` com apenas as colunas não-sensíveis.
--   2. Restringir SELECT na tabela `clinics` ao dono (auth.uid() = id).
--   3. Liberar SELECT na view para anon (filtrada por is_listed = true).
--   4. Garantir que profiles só é legível pelo próprio usuário.
--
-- COMO APLICAR: Execute este SQL no Supabase SQL Editor (Dashboard → SQL)
--               ou via `supabase db push` se usar CLI local.
-- ============================================================================

-- ─── 1. View pública (sem PIIs) ─────────────────────────────────────────────

CREATE OR REPLACE VIEW clinics_public AS
SELECT
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
  latitude,
  longitude,
  description,
  logo_url,
  cover_url,
  primary_color,
  services
FROM clinics
WHERE is_listed = true
  AND clinic_name IS NOT NULL;

-- A view herda permissões da tabela base por padrão (SECURITY INVOKER).
-- Para permitir leitura anônima, precisamos conceder acesso à view
-- E garantir que o SELECT na tabela base permita esse fluxo via policy.
-- A abordagem mais segura é usar SECURITY DEFINER na view para que ela
-- rode com as permissões do owner (postgres), bypassando RLS na tabela.

-- Recrear como SECURITY DEFINER para bypass de RLS (a view já filtra is_listed):
DROP VIEW IF EXISTS clinics_public;
CREATE VIEW clinics_public
WITH (security_invoker = false)
AS
SELECT
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
  latitude,
  longitude,
  description,
  logo_url,
  cover_url,
  primary_color,
  services
FROM clinics
WHERE is_listed = true
  AND clinic_name IS NOT NULL;

-- Concede SELECT na view para anon e authenticated
GRANT SELECT ON clinics_public TO anon;
GRANT SELECT ON clinics_public TO authenticated;

-- ─── 2. RLS na tabela clinics (restrita ao owner) ───────────────────────────

ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

-- Remove policies antigas de SELECT para recriar de forma mais restritiva.
-- (DROP IF EXISTS evita erro se não existirem)
DROP POLICY IF EXISTS "clinics_select_own" ON clinics;
DROP POLICY IF EXISTS "clinics_select_public" ON clinics;
DROP POLICY IF EXISTS "Clinics are viewable by everyone" ON clinics;
DROP POLICY IF EXISTS "Enable read access for all users" ON clinics;

-- SELECT: apenas o dono da clínica pode ler a row completa (com CNPJ etc.)
CREATE POLICY "clinics_select_own"
  ON clinics FOR SELECT
  USING (auth.uid() = id);

-- INSERT: apenas o próprio usuário pode inserir sua clínica
DROP POLICY IF EXISTS "clinics_insert_own" ON clinics;
CREATE POLICY "clinics_insert_own"
  ON clinics FOR INSERT
  WITH CHECK (auth.uid() = id);

-- UPDATE: apenas o dono pode atualizar
DROP POLICY IF EXISTS "clinics_update_own" ON clinics;
CREATE POLICY "clinics_update_own"
  ON clinics FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- DELETE: apenas o dono (se necessário)
DROP POLICY IF EXISTS "clinics_delete_own" ON clinics;
CREATE POLICY "clinics_delete_own"
  ON clinics FOR DELETE
  USING (auth.uid() = id);

-- ─── 3. RLS na tabela profiles ──────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by owner" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

-- SELECT: apenas o próprio usuário
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- UPDATE: apenas o próprio usuário
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT: o trigger handle_new_user() roda como SECURITY DEFINER,
-- então não precisa de policy de INSERT para o usuário final.
-- Mas caso precise de fallback:
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ─── 4. RLS na tabela pets ──────────────────────────────────────────────────

ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pets_select_own" ON pets;
CREATE POLICY "pets_select_own"
  ON pets FOR SELECT
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "pets_insert_own" ON pets;
CREATE POLICY "pets_insert_own"
  ON pets FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "pets_update_own" ON pets;
CREATE POLICY "pets_update_own"
  ON pets FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "pets_delete_own" ON pets;
CREATE POLICY "pets_delete_own"
  ON pets FOR DELETE
  USING (auth.uid() = owner_id);

-- ─── 5. Política para tickets (ambas as partes podem ler) ───────────────────

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tickets_select_parties" ON tickets;
CREATE POLICY "tickets_select_parties"
  ON tickets FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = clinic_id);

-- ─── 6. RPC para buscar dados públicos de uma clínica por ID ────────────────
-- Útil para a página de detalhes (usuário autenticado mas não-dono).

CREATE OR REPLACE FUNCTION get_clinic_public(p_clinic_id uuid)
RETURNS TABLE (
  id uuid,
  clinic_name text,
  rating numeric,
  review_count integer,
  street text,
  number text,
  neighborhood text,
  city text,
  state text,
  specialties text[],
  animal_types text[],
  schedules jsonb,
  is_24_hours boolean,
  is_emergency_available boolean,
  latitude double precision,
  longitude double precision,
  description text,
  phone text,
  logo_url text,
  cover_url text,
  primary_color text,
  services text[]
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    c.id,
    c.clinic_name,
    c.rating,
    c.review_count,
    c.street,
    c.number,
    c.neighborhood,
    c.city,
    c.state,
    c.specialties,
    c.animal_types::text[],
    c.schedules::jsonb,
    c.is_24_hours,
    c.is_emergency_available,
    c.latitude,
    c.longitude,
    c.description,
    c.phone,
    c.logo_url,
    c.cover_url,
    c.primary_color,
    c.services
  FROM clinics c
  WHERE c.id = p_clinic_id
    AND c.is_listed = true;
$$;

-- Concede execução para authenticated (a página de detalhes requer login)
GRANT EXECUTE ON FUNCTION get_clinic_public(uuid) TO authenticated;
