-- ============================================================================
-- Migration: Proteção contra IDOR — RLS completa para tabelas restantes
-- ----------------------------------------------------------------------------
-- Garante que nenhum token autenticado possa acessar ou modificar recursos
-- de outro usuário. Cada operação é restrita aos participantes legítimos.
--
-- Tabelas cobertas:
--   • tickets (SELECT/INSERT/UPDATE por participantes)
--   • chat_messages (SELECT/INSERT por participantes do ticket)
--   • veterinarians (CRUD somente pela clínica dona)
--   • vet_appointments (CRUD pela clínica dona + SELECT pelo client do ticket)
--   • blocks (SELECT/INSERT/DELETE pelo blocker)
--   • reports (SELECT/INSERT pelo reporter)
--   • favorites (SELECT/INSERT/DELETE pelo dono)
--
-- COMO APLICAR: Execute no Supabase SQL Editor (Dashboard → SQL).
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. TICKETS
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Limpa policies antigas
DROP POLICY IF EXISTS "tickets_select_parties" ON tickets;
DROP POLICY IF EXISTS "tickets_insert_client" ON tickets;
DROP POLICY IF EXISTS "tickets_update_parties" ON tickets;
DROP POLICY IF EXISTS "tickets_delete_own" ON tickets;
DROP POLICY IF EXISTS "Enable read access for all users" ON tickets;

-- SELECT: somente o cliente criador ou a clínica destinatária
CREATE POLICY "tickets_select_parties"
  ON tickets FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = clinic_id);

-- INSERT: o cliente só pode criar tickets em seu próprio nome
CREATE POLICY "tickets_insert_client"
  ON tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: ambas as partes podem atualizar (approve/reject pela clínica, cancel pelo client)
-- A lógica de "quem pode fazer o quê" é enforced pela aplicação + check constraints.
CREATE POLICY "tickets_update_parties"
  ON tickets FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = clinic_id)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = clinic_id);

-- DELETE: não permitido (tickets são cancelados, nunca deletados)
-- Sem policy de DELETE = bloqueado por padrão com RLS ativo.

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. CHAT_MESSAGES
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_select_participants" ON chat_messages;
DROP POLICY IF EXISTS "chat_insert_participants" ON chat_messages;
DROP POLICY IF EXISTS "Enable read access for all users" ON chat_messages;

-- SELECT: somente se o usuário é participante do ticket vinculado
CREATE POLICY "chat_select_participants"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = chat_messages.ticket_id
        AND (t.user_id = auth.uid() OR t.clinic_id = auth.uid())
    )
  );

-- INSERT: somente participantes do ticket (e o sender_id precisa ser o próprio usuário ou null para system)
CREATE POLICY "chat_insert_participants"
  ON chat_messages FOR INSERT
  WITH CHECK (
    (sender_id = auth.uid() OR sender_id IS NULL)
    AND EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = chat_messages.ticket_id
        AND (t.user_id = auth.uid() OR t.clinic_id = auth.uid())
    )
  );

-- UPDATE/DELETE: não permitido (mensagens são imutáveis)

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. VETERINARIANS
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE veterinarians ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vets_select_clinic" ON veterinarians;
DROP POLICY IF EXISTS "vets_insert_clinic" ON veterinarians;
DROP POLICY IF EXISTS "vets_update_clinic" ON veterinarians;
DROP POLICY IF EXISTS "vets_delete_clinic" ON veterinarians;
DROP POLICY IF EXISTS "Enable read access for all users" ON veterinarians;

-- SELECT: somente a clínica dona pode ver seus veterinários
CREATE POLICY "vets_select_clinic"
  ON veterinarians FOR SELECT
  USING (auth.uid() = clinic_id);

-- INSERT: somente a clínica pode cadastrar vets para si mesma
CREATE POLICY "vets_insert_clinic"
  ON veterinarians FOR INSERT
  WITH CHECK (auth.uid() = clinic_id);

-- UPDATE: somente a clínica dona
CREATE POLICY "vets_update_clinic"
  ON veterinarians FOR UPDATE
  USING (auth.uid() = clinic_id)
  WITH CHECK (auth.uid() = clinic_id);

-- DELETE: somente a clínica dona
CREATE POLICY "vets_delete_clinic"
  ON veterinarians FOR DELETE
  USING (auth.uid() = clinic_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. VET_APPOINTMENTS
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE vet_appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "appts_select_clinic" ON vet_appointments;
DROP POLICY IF EXISTS "appts_insert_clinic" ON vet_appointments;
DROP POLICY IF EXISTS "appts_update_clinic" ON vet_appointments;
DROP POLICY IF EXISTS "appts_delete_clinic" ON vet_appointments;
DROP POLICY IF EXISTS "Enable read access for all users" ON vet_appointments;

-- SELECT: a clínica dona pode ver todos os seus agendamentos
CREATE POLICY "appts_select_clinic"
  ON vet_appointments FOR SELECT
  USING (auth.uid() = clinic_id);

-- INSERT: somente a clínica (agendamentos criados via dashboard)
CREATE POLICY "appts_insert_clinic"
  ON vet_appointments FOR INSERT
  WITH CHECK (auth.uid() = clinic_id);

-- UPDATE: somente a clínica (cancelar, remarcar)
CREATE POLICY "appts_update_clinic"
  ON vet_appointments FOR UPDATE
  USING (auth.uid() = clinic_id)
  WITH CHECK (auth.uid() = clinic_id);

-- DELETE: somente a clínica
CREATE POLICY "appts_delete_clinic"
  ON vet_appointments FOR DELETE
  USING (auth.uid() = clinic_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. BLOCKS
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blocks_select_own" ON blocks;
DROP POLICY IF EXISTS "blocks_insert_own" ON blocks;
DROP POLICY IF EXISTS "blocks_delete_own" ON blocks;
DROP POLICY IF EXISTS "Enable read access for all users" ON blocks;

-- SELECT: somente quem bloqueou pode ver seus bloqueios
CREATE POLICY "blocks_select_own"
  ON blocks FOR SELECT
  USING (auth.uid() = blocker_id);

-- INSERT: só pode bloquear em nome próprio
CREATE POLICY "blocks_insert_own"
  ON blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

-- DELETE: só pode desbloquear seus próprios bloqueios
CREATE POLICY "blocks_delete_own"
  ON blocks FOR DELETE
  USING (auth.uid() = blocker_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. REPORTS
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_select_own" ON reports;
DROP POLICY IF EXISTS "reports_insert_own" ON reports;
DROP POLICY IF EXISTS "Enable read access for all users" ON reports;

-- SELECT: só o reporter vê suas próprias denúncias
CREATE POLICY "reports_select_own"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- INSERT: só pode denunciar em nome próprio
CREATE POLICY "reports_insert_own"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. FAVORITES
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "favorites_select_own" ON favorites;
DROP POLICY IF EXISTS "favorites_insert_own" ON favorites;
DROP POLICY IF EXISTS "favorites_delete_own" ON favorites;
DROP POLICY IF EXISTS "Enable read access for all users" ON favorites;

-- SELECT: somente o dono dos favoritos
CREATE POLICY "favorites_select_own"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: somente em nome próprio
CREATE POLICY "favorites_insert_own"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- DELETE: somente o dono pode remover
CREATE POLICY "favorites_delete_own"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);
