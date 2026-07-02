-- ============================================================================
-- Security hardening: dois gaps críticos de RLS
-- 1. profiles: user_type era mutável pelo próprio usuário (privilege escalation)
-- 2. tickets: clientes podiam UPDATE em qualquer coluna (bypass de aprovação)
-- ============================================================================

-- 1. PROFILES — travar user_type
--    O WITH_CHECK anterior verificava só auth.uid() = id, permitindo que um
--    client alterasse user_type para 'clinic' via UPDATE direto.
DROP POLICY IF EXISTS "profiles: update own" ON public.profiles;
CREATE POLICY "profiles: update own" ON public.profiles
  FOR UPDATE
  USING  (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- user_type nunca pode ser alterado pelo próprio usuário
    AND user_type = (SELECT p.user_type FROM public.profiles p WHERE p.id = auth.uid())
  );

-- 2. TICKETS — substituir UPDATE direto do cliente por SECURITY DEFINER RPC
--    A policy "tickets: client cancels own" não restringia colunas, permitindo
--    ao cliente setar approval_status='approved' e aprovar o próprio ticket.
DROP POLICY IF EXISTS "tickets: client cancels own" ON public.tickets;

CREATE OR REPLACE FUNCTION public.cancel_ticket(p_ticket_id uuid)
  RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.tickets SET
    status          = 'cancelled',
    approval_status = 'rejected'
  WHERE id       = p_ticket_id
    AND user_id  = auth.uid()
    AND status   NOT IN ('cancelled', 'completed');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ticket not found or cannot be cancelled';
  END IF;
END;
$$;

-- Revogar acesso público direto à função (só via autenticado)
REVOKE ALL ON FUNCTION public.cancel_ticket(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_ticket(uuid) TO authenticated;
