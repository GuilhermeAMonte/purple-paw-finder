-- ============================================================================
-- Security: bloqueia injeção de plano pago no signup
-- ----------------------------------------------------------------------------
-- handle_new_user() lia o plano de raw_user_meta_data, que é controlado pelo
-- usuário no signup. Chamando a API de signup diretamente com
-- { data: { user_type: 'clinic', plan: 'experience' } } um atacante criava
-- uma clínica no plano pago mais alto de graça — furando o controle de
-- change_clinic_plan() (que exige pagamento para upgrade).
--
-- Correção: toda clínica nova nasce no plano 'free'. Upgrades só pelo fluxo
-- pago. O metadata 'plan' é ignorado.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, user_type, name, email, cpf, consent_at, consent_version)
  VALUES (
    new.id,
    COALESCE((new.raw_user_meta_data ->> 'user_type')::user_type, 'client'),
    COALESCE(new.raw_user_meta_data ->> 'name', 'Usuário'),
    new.email,
    NULLIF(regexp_replace(COALESCE(new.raw_user_meta_data ->> 'cpf', ''), '\D', '', 'g'), ''),
    COALESCE((new.raw_user_meta_data ->> 'consent_at')::timestamptz, now()),
    COALESCE(new.raw_user_meta_data ->> 'consent_version', '1.0')
  );

  IF (new.raw_user_meta_data ->> 'user_type') = 'clinic' THEN
    -- Plano SEMPRE 'free' no cadastro — ignora qualquer 'plan' do metadata.
    -- Upgrade exige pagamento via fluxo dedicado.
    INSERT INTO public.clinics (id, plan)
    VALUES (new.id, 'free');
  END IF;

  RETURN new;
END;
$function$;
