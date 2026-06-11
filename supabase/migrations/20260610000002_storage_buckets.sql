-- ============================================================================
-- Storage Buckets — uploads de arquivos
-- ----------------------------------------------------------------------------
-- Convenção de caminho: <user_id>/<arquivo>. As políticas exigem que o
-- primeiro segmento do path seja o auth.uid() do dono — assim um usuário
-- nunca escreve na pasta de outro (defesa contra path traversal/abuso).
--
-- Validação de MIME, tamanho e magic bytes continua sendo feita no cliente
-- (src/lib/validateFile.ts) ANTES do upload; aqui aplicamos o limite e a
-- allowlist de MIME como segunda camada no servidor (INPUT-011).
-- ============================================================================

-- ─── Buckets ─────────────────────────────────────────────────────────────────
-- Públicos para leitura (avatares, logos e capas aparecem na UI sem auth).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars',   'avatars',   true,  5242880,  array['image/jpeg','image/png','image/webp','image/gif']),
  ('pet-photos','pet-photos',true,  5242880,  array['image/jpeg','image/png','image/webp']),
  ('clinic-media','clinic-media', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Privado: encaminhamentos médicos só são lidos pelos participantes do ticket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('referrals', 'referrals', false, 10485760, array[
    'application/pdf','image/jpeg','image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ])
on conflict (id) do nothing;

-- ─── Políticas: buckets públicos de imagem ───────────────────────────────────
-- Leitura pública; escrita/edição/remoção só na própria pasta (<uid>/...).
create policy "public images: anyone can read"
  on storage.objects for select
  using (bucket_id in ('avatars','pet-photos','clinic-media'));

create policy "public images: write own folder"
  on storage.objects for insert
  with check (
    bucket_id in ('avatars','pet-photos','clinic-media')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "public images: update own folder"
  on storage.objects for update
  using (
    bucket_id in ('avatars','pet-photos','clinic-media')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "public images: delete own folder"
  on storage.objects for delete
  using (
    bucket_id in ('avatars','pet-photos','clinic-media')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─── Políticas: encaminhamentos (privado) ────────────────────────────────────
-- Upload só na própria pasta; leitura pelo dono do arquivo.
create policy "referrals: write own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'referrals'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "referrals: read own folder"
  on storage.objects for select
  using (
    bucket_id = 'referrals'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
