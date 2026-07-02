-- ============================================================================
-- Confirmação de preço pelo cliente antes da aprovação definitiva
-- Req: clínica define valor → envia proposta → cliente confirma ou cancela
-- ============================================================================

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS pending_vet_id       uuid         REFERENCES public.veterinarians(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pending_price        numeric(10,2),
  ADD COLUMN IF NOT EXISTS client_confirmation  text
    CHECK (client_confirmation IN ('pending', 'confirmed', 'cancelled'));

-- RPC: cliente confirma (SECURITY DEFINER — permite inserir em vet_appointments sem expor a chave de serviço)
CREATE OR REPLACE FUNCTION public.client_confirm_appointment(p_ticket_id uuid)
  RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v RECORD;
BEGIN
  SELECT t.*, p.name AS pname
    INTO v
    FROM public.tickets t
    LEFT JOIN public.profiles p ON p.id = t.user_id
   WHERE t.id = p_ticket_id
     AND t.user_id = auth.uid()
     AND t.client_confirmation = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ticket not found or confirmation not allowed';
  END IF;

  IF v.pending_vet_id IS NULL THEN
    RAISE EXCEPTION 'no pending vet defined for this ticket';
  END IF;

  UPDATE public.tickets SET
    client_confirmation = 'confirmed',
    approval_status     = 'approved',
    status              = 'confirmed'
  WHERE id = p_ticket_id;

  INSERT INTO public.vet_appointments
    (vet_id, clinic_id, ticket_id, date, time, status,
     patient_name, patient_pet, patient_notes, price)
  VALUES (
    v.pending_vet_id,
    v.clinic_id,
    p_ticket_id,
    v.scheduled_date,
    LEFT(v.scheduled_time::text, 5),
    'booked',
    COALESCE(v.pname, 'Cliente'),
    v.pet_name || ' (' || v.pet_species || ')',
    v.description,
    v.pending_price
  );
END;
$$;

-- RPC: cliente cancela a proposta
CREATE OR REPLACE FUNCTION public.client_cancel_appointment(p_ticket_id uuid)
  RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.tickets SET
    client_confirmation = 'cancelled',
    status              = 'cancelled'
  WHERE id = p_ticket_id
    AND user_id = auth.uid()
    AND client_confirmation = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ticket not found or cancellation not allowed';
  END IF;
END;
$$;
