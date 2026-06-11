-- Telefone de contato da clínica é dado público de negócio → fica em clinics
-- (legível por qualquer um via RLS de leitura pública), não em profiles (privado).
alter table public.clinics add column if not exists phone text;
