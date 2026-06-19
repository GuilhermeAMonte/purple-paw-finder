-- Downgrade/cancelamento de plano da clínica.
-- O RLS de clinics trava alteração direta de `plan`; este RPC SECURITY DEFINER
-- permite SOMENTE rebaixar (rank novo <= atual). Upgrade exige fluxo de pagamento.
CREATE OR REPLACE FUNCTION public.change_clinic_plan(p_plan plan_type)
 RETURNS plan_type
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  cur plan_type;
  rank_of CONSTANT jsonb := '{"free":0,"basic":1,"intermediary":2,"experience":3}';
  cur_rank int;
  new_rank int;
BEGIN
  SELECT plan INTO cur FROM public.clinics WHERE id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Clínica não encontrada para o usuário autenticado.';
  END IF;

  cur_rank := (rank_of ->> cur::text)::int;
  new_rank := (rank_of ->> p_plan::text)::int;

  IF new_rank > cur_rank THEN
    RAISE EXCEPTION 'Upgrade de plano requer pagamento e não está disponível por aqui.';
  END IF;

  UPDATE public.clinics SET plan = p_plan WHERE id = auth.uid();
  RETURN p_plan;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.change_clinic_plan(plan_type) TO authenticated;
