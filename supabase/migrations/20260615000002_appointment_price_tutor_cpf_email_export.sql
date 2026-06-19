-- Valor da consulta (informado ao aprovar).
ALTER TABLE public.vet_appointments
  ADD COLUMN IF NOT EXISTS price numeric(10,2)
  CHECK (price IS NULL OR price >= 0);

-- CPF e email do tutor no profile (CPF só dígitos).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cpf   text,
  ADD COLUMN IF NOT EXISTS email text;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_cpf_format CHECK (cpf IS NULL OR cpf ~ '^\d{11}$');

-- Trigger passa a gravar email (do auth) e cpf (do metadata) no signup.
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
    INSERT INTO public.clinics (id, plan)
    VALUES (
      new.id,
      COALESCE((new.raw_user_meta_data ->> 'plan')::plan_type, 'free')
    );
  END IF;

  RETURN new;
END;
$function$;

-- RPC de exportação: consultas do mês com dados do tutor/pet/vet/valor.
-- SECURITY DEFINER + filtro auth.uid()=clinic_id → cada clínica só lê o seu,
-- contornando o RLS de profiles de forma segura (sem expor outros tutores).
CREATE OR REPLACE FUNCTION public.export_clinic_month_appointments(
  p_year  int,
  p_month int
)
RETURNS TABLE (
  appt_date    date,
  appt_time    text,
  vet_name     text,
  price        numeric,
  pet_name     text,
  pet_breed    text,
  pet_species  text,
  tutor_name   text,
  tutor_cpf    text,
  tutor_email  text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    va.date,
    va.time,
    v.name,
    va.price,
    COALESCE(t.pet_name, va.patient_pet),
    t.pet_breed,
    t.pet_species,
    COALESCE(p.name, va.patient_name),
    p.cpf,
    p.email
  FROM public.vet_appointments va
  JOIN public.veterinarians v ON v.id = va.vet_id
  LEFT JOIN public.tickets  t ON t.id = va.ticket_id
  LEFT JOIN public.profiles p ON p.id = t.user_id
  WHERE va.clinic_id = auth.uid()
    AND va.status = 'booked'
    AND EXTRACT(YEAR  FROM va.date) = p_year
    AND EXTRACT(MONTH FROM va.date) = p_month
  ORDER BY va.date, va.time;
$function$;

GRANT EXECUTE ON FUNCTION public.export_clinic_month_appointments(int, int) TO authenticated;
