-- ============================================================================
-- Reconciliação de drift de RLS
-- ----------------------------------------------------------------------------
-- O banco live acumulou um SET inteiro de policies (sufixos _own/_clinic/
-- _parties/_participants) que NÃO existem em nenhuma migration. Esse set:
--   • duplica as policies oficiais ("x: y") em quase todas as tabelas;
--   • FURA o lock de plano: `clinics_update_own` (check só auth.uid()=id) é
--     permissiva e OR'd com "clinics: owner update", anulando a trava que
--     impede UPDATE direto em clinics.plan (que deveria passar só pelo RPC
--     change_clinic_plan).
--
-- Além disso, a trava de plano em "clinics: owner update" só existia como
-- hand-edit no live — nunca foi versionada. Num `db reset` ela sumiria
-- (regressão de segurança). Aqui ela é codificada.
--
-- Resultado: as policies oficiais ("x: y") voltam a ser a única fonte de
-- verdade, e `db reset` reproduz o estado seguro.
-- ============================================================================

-- 1. Codifica a trava de plano em clinics (antes só existia no live).
--    UPDATE só passa se o plano NÃO mudar; upgrade/downgrade vai pelo RPC
--    change_clinic_plan (SECURITY DEFINER). Sem recursão: o SELECT de clinics
--    é `using (true)`, então a subquery não reentra na própria policy.
DROP POLICY IF EXISTS "clinics: owner update" ON public.clinics;
CREATE POLICY "clinics: owner update"
  ON public.clinics FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND plan = (SELECT c.plan FROM public.clinics c WHERE c.id = auth.uid())
  );

-- 2. Remove o set drift inteiro (redundante; clinics_update_own fura a trava).
DROP POLICY IF EXISTS blocks_delete_own            ON public.blocks;
DROP POLICY IF EXISTS blocks_insert_own            ON public.blocks;
DROP POLICY IF EXISTS blocks_select_own            ON public.blocks;

DROP POLICY IF EXISTS chat_insert_participants     ON public.chat_messages;
DROP POLICY IF EXISTS chat_select_participants     ON public.chat_messages;

DROP POLICY IF EXISTS clinics_delete_own           ON public.clinics;
DROP POLICY IF EXISTS clinics_insert_own           ON public.clinics;
DROP POLICY IF EXISTS clinics_select_own           ON public.clinics;
DROP POLICY IF EXISTS clinics_update_own           ON public.clinics;

DROP POLICY IF EXISTS favorites_delete_own         ON public.favorites;
DROP POLICY IF EXISTS favorites_insert_own         ON public.favorites;
DROP POLICY IF EXISTS favorites_select_own         ON public.favorites;

DROP POLICY IF EXISTS pets_delete_own              ON public.pets;
DROP POLICY IF EXISTS pets_insert_own              ON public.pets;
DROP POLICY IF EXISTS pets_select_own              ON public.pets;
DROP POLICY IF EXISTS pets_update_own              ON public.pets;

DROP POLICY IF EXISTS profiles_insert_own          ON public.profiles;
DROP POLICY IF EXISTS profiles_select_own          ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own          ON public.profiles;

DROP POLICY IF EXISTS reports_insert_own           ON public.reports;
DROP POLICY IF EXISTS reports_select_own           ON public.reports;

DROP POLICY IF EXISTS tickets_insert_client        ON public.tickets;
DROP POLICY IF EXISTS tickets_select_parties       ON public.tickets;
DROP POLICY IF EXISTS tickets_update_parties       ON public.tickets;

DROP POLICY IF EXISTS appts_delete_clinic          ON public.vet_appointments;
DROP POLICY IF EXISTS appts_insert_clinic          ON public.vet_appointments;
DROP POLICY IF EXISTS appts_select_clinic          ON public.vet_appointments;
DROP POLICY IF EXISTS appts_update_clinic          ON public.vet_appointments;

DROP POLICY IF EXISTS vets_delete_clinic           ON public.veterinarians;
DROP POLICY IF EXISTS vets_insert_clinic           ON public.veterinarians;
DROP POLICY IF EXISTS vets_select_clinic           ON public.veterinarians;
DROP POLICY IF EXISTS vets_update_clinic           ON public.veterinarians;
