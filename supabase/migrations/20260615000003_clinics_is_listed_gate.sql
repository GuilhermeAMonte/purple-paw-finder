-- Flag de visibilidade pública da clínica (espelha profiles.is_profile_complete).
-- Coluna própria em clinics → a busca pública filtra sem embedar profiles
-- (o RLS de profiles bloqueia anon e zeraria a lista).
ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS is_listed boolean NOT NULL DEFAULT false;

-- Backfill a partir do estado atual dos profiles.
UPDATE public.clinics c
  SET is_listed = p.is_profile_complete
  FROM public.profiles p
  WHERE p.id = c.id;

-- Mantém is_listed sincronizado quando o perfil da clínica completa/descompleta.
CREATE OR REPLACE FUNCTION public.sync_clinic_is_listed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.user_type = 'clinic'
     AND (TG_OP = 'INSERT' OR NEW.is_profile_complete IS DISTINCT FROM OLD.is_profile_complete) THEN
    UPDATE public.clinics
      SET is_listed = NEW.is_profile_complete
      WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_sync_clinic_is_listed ON public.profiles;
CREATE TRIGGER trg_sync_clinic_is_listed
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_clinic_is_listed();
