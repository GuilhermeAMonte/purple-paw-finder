// Allowlist de especialidades de clínica (INPUT-005).
// Fonte única de verdade — usada nos formulários, na busca e na validação.

export const CLINIC_SPECIALTIES = [
  'Clínica Geral',
  'Cirurgia',
  'Cardiologia',
  'Dermatologia',
  'Oftalmologia',
  'Oncologia',
  'Ortopedia',
  'Neurologia',
  'Emergência',
  'Vacinação',
  'Exames Laboratoriais',
  'Ultrassonografia',
  'Radiologia',
  'Fisioterapia',
  'Odontologia Veterinária',
] as const;

export type ClinicSpecialty = (typeof CLINIC_SPECIALTIES)[number];

// Tipos de animais atendidos (alinhado ao enum species_type do banco).
export const ANIMAL_TYPES = [
  { value: 'dog', label: 'Cachorro' },
  { value: 'cat', label: 'Gato' },
  { value: 'bird', label: 'Pássaro' },
  { value: 'rabbit', label: 'Coelho' },
  { value: 'hamster', label: 'Hamster' },
  { value: 'fish', label: 'Peixe' },
  { value: 'reptile', label: 'Réptil' },
  { value: 'other', label: 'Outros' },
] as const;

export const ANIMAL_TYPE_VALUES = [
  'dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other',
] as const;
