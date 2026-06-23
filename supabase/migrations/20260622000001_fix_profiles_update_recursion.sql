-- ============================================================================
-- Fix: "infinite recursion detected in policy for relation profiles"
-- ----------------------------------------------------------------------------
-- O banco tinha uma versão hand-edited da policy "profiles: update own" cujo
-- WITH CHECK consultava a PRÓPRIA tabela profiles (para travar consent_at/
-- consent_version). Como profiles também tem a policy de SELECT
-- "read counterpart via ticket" (que consulta tickets), a subquery dentro da
-- policy gerava o ciclo profiles → tickets → profiles → recursão infinita.
--
-- Correção:
--   1. Restaura a policy de UPDATE sem auto-referência (auth.uid() = id).
--   2. Reimplementa a imutabilidade de consentimento (LGPD) via trigger
--      BEFORE UPDATE — caminho correto e sem recursão.
-- ============================================================================

-- 1. Policy de UPDATE não-recursiva (igual à definição original da migration).
DROP POLICY IF EXISTS "profiles: update own" ON public.profiles;
CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. Imutabilidade dos campos de consentimento via trigger.
--    Bloqueia qualquer tentativa de alterar consent_at / consent_version
--    após o cadastro, sem precisar de subquery na policy.
CREATE OR REPLACE FUNCTION public.enforce_consent_immutable()
  RETURNS trigger
  LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.consent_at IS DISTINCT FROM OLD.consent_at
     OR NEW.consent_version IS DISTINCT FROM OLD.consent_version THEN
    RAISE EXCEPTION 'Os dados de consentimento (LGPD) não podem ser alterados.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_consent_immutable ON public.profiles;
CREATE TRIGGER trg_enforce_consent_immutable
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_consent_immutable();
