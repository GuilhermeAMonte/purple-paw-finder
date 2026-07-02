-- ============================================================================
-- Security: fecha vazamento de PII via policies RLS com qual = true
-- ----------------------------------------------------------------------------
-- 1. clinics: "public read (true)" expunha SELECT * (incl. cnpj) a qualquer
--    usuário/anônimo. Leituras públicas usam a view clinics_public e o RPC
--    get_clinic_public (ambos SECURITY DEFINER / security_invoker=false, que
--    ignoram a RLS da tabela base). Restringe a tabela base ao dono.
--
-- 2. vet_appointments: "public availability read (true)" expunha
--    patient_name, patient_notes (notas médicas) e price de todos os
--    pacientes. Nenhum caminho do app consome essa policy — todas as leituras
--    passam por funções owner/participant-scoped. Removida.
--    Acesso legítimo permanece: "vet_appts: clinic owner full" (clínica) e
--    "vet_appts: client reads own" (cliente, via ticket).
-- ============================================================================

-- 1. CLINICS — leitura da tabela base só para o dono
DROP POLICY IF EXISTS "clinics: public read" ON public.clinics;
CREATE POLICY "clinics: owner read" ON public.clinics
  FOR SELECT
  USING (auth.uid() = id);

-- 2. VET_APPOINTMENTS — remove leitura pública irrestrita
DROP POLICY IF EXISTS "vet_appts: public availability read" ON public.vet_appointments;
