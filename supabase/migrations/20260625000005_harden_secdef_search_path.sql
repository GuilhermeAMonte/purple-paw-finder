-- ============================================================================
-- Security: fixa search_path em funções SECURITY DEFINER
-- ----------------------------------------------------------------------------
-- Funções SECURITY DEFINER sem search_path fixo rodam com privilégios do dono
-- e podem ter referências não-qualificadas sequestradas por objetos plantados
-- em schemas antes de 'public' no search_path do chamador (advisor
-- function_search_path_mutable). Apesar das refs já usarem public.*, fixar o
-- search_path fecha o vetor por completo.
-- ============================================================================

ALTER FUNCTION public.cancel_ticket(uuid)               SET search_path = public;
ALTER FUNCTION public.client_cancel_appointment(uuid)   SET search_path = public;
ALTER FUNCTION public.client_confirm_appointment(uuid)  SET search_path = public;
ALTER FUNCTION public.get_clinic_public(uuid)           SET search_path = public;
