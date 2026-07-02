-- ============================================================================
-- Conclusão de atendimento: status 'completed' + colunas de resumo/cobrança
-- ============================================================================

-- Estender enums (ADD VALUE IF NOT EXISTS é idempotente)
ALTER TYPE public.ticket_status     ADD VALUE IF NOT EXISTS 'completed';
ALTER TYPE public.slot_status_enum  ADD VALUE IF NOT EXISTS 'completed';

-- Colunas de conclusão no ticket
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS completed_at       timestamptz,
  ADD COLUMN IF NOT EXISTS final_amount       numeric(10,2),
  ADD COLUMN IF NOT EXISTS treatment_summary  text
    CHECK (treatment_summary IS NULL OR char_length(treatment_summary) <= 5000),
  ADD COLUMN IF NOT EXISTS payment_proof_url  text
    CHECK (payment_proof_url IS NULL OR char_length(payment_proof_url) <= 2000);
