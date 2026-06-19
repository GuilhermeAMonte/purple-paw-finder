-- Dias e horários de trabalho do veterinário.
-- work_days: dias da semana (0=domingo … 6=sábado).
ALTER TABLE public.veterinarians
  ADD COLUMN IF NOT EXISTS work_days smallint[] NOT NULL DEFAULT '{1,2,3,4,5}',
  ADD COLUMN IF NOT EXISTS work_start text NOT NULL DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS work_end   text NOT NULL DEFAULT '18:00';

-- Garante formato HH:MM e intervalo válido.
ALTER TABLE public.veterinarians
  ADD CONSTRAINT vet_work_start_format CHECK (work_start ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  ADD CONSTRAINT vet_work_end_format   CHECK (work_end   ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  ADD CONSTRAINT vet_work_range        CHECK (work_start < work_end);
