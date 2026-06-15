import { z } from 'zod';
import { CLINIC_SPECIALTIES, ANIMAL_TYPE_VALUES } from '@/constants/specialties';
import { validateCNPJ } from '@/lib/cnpj';
import { sanitizeLine, sanitizeMultiline } from '@/lib/sanitize';

// Schema de configuração inicial da clínica (Req 11.1).
export const clinicSetupSchema = z.object({
  clinicName: z.string().trim().min(1, 'Informe o nome da clínica').max(100).transform(sanitizeLine),
  phone: z
    .string()
    .trim()
    .regex(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos (somente números)'),
  cnpj: z.string().refine(validateCNPJ, 'CNPJ inválido'),
  street: z.string().trim().min(1, 'Informe a rua').max(200).transform(sanitizeLine),
  number: z.string().trim().min(1, 'Informe o número').max(20).transform(sanitizeLine),
  neighborhood: z.string().trim().max(100).transform(sanitizeLine).optional().or(z.literal('')),
  city: z.string().trim().max(100).transform(sanitizeLine).optional().or(z.literal('')),
  state: z
    .string()
    .trim()
    .length(2, 'UF deve ter 2 letras')
    .transform(s => s.toUpperCase())
    .optional()
    .or(z.literal('')),
  cep: z.string().trim().max(9).optional().or(z.literal('')),
  description: z.string().trim().max(1000).transform(sanitizeMultiline).optional().or(z.literal('')),
  is24Hours: z.boolean(),
  specialties: z
    .array(z.enum(CLINIC_SPECIALTIES))
    .min(1, 'Selecione ao menos uma especialidade'),
  animalTypes: z
    .array(z.enum(ANIMAL_TYPE_VALUES))
    .min(1, 'Selecione ao menos um tipo de animal'),
});

export type ClinicSetupInput = z.infer<typeof clinicSetupSchema>;

// Schema de cor (configuração visual — Req 17.4).
export const clinicVisualSetupSchema = z.object({
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve estar no formato #RRGGBB')
    .optional(),
});
