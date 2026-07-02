-- ============================================================================
-- Security: fecha exposição de CRM (e horários) dos veterinários
-- ----------------------------------------------------------------------------
-- A policy "vets: public read (true)" liberava SELECT * em veterinarians a
-- qualquer usuário/anônimo, expondo crm (registro profissional), nome e
-- expediente de todos os vets.
--
-- Nenhum caminho público do app consome esses dados: todas as leituras passam
-- por fetchVeterinarians(clinicId), que valida auth.uid() = clinic_id. Os
-- joins veterinarians(name) em vet_appointments rodam em contexto do dono da
-- clínica. Restringe a leitura ao dono.
-- ============================================================================

DROP POLICY IF EXISTS "vets: public read" ON public.veterinarians;
CREATE POLICY "vets: clinic owner read" ON public.veterinarians
  FOR SELECT
  USING (auth.uid() = clinic_id);
