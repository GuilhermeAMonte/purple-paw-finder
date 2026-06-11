import { z } from 'zod';

// Login — validação mínima; a verificação real é no servidor (Supabase Auth).
export const loginSchema = z.object({
  email: z.string().trim().email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha').max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Política de senha (espelha os critérios exibidos no formulário de cadastro).
const passwordSchema = z
  .string()
  .min(8, 'Mínimo de 8 caracteres')
  .max(128, 'Máximo de 128 caracteres')
  .regex(/[A-Z]/, 'Inclua ao menos uma letra maiúscula')
  .regex(/[a-z]/, 'Inclua ao menos uma letra minúscula')
  .regex(/\d/, 'Inclua ao menos um número')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Inclua ao menos um caractere especial');

// Cadastro — nome, e-mail, senha forte, confirmação e (para clínica) plano.
export const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Informe seu nome').max(150),
    email: z.string().trim().email('E-mail inválido'),
    password: passwordSchema,
    confirmPassword: z.string(),
    userType: z.enum(['client', 'clinic']),
    plan: z.enum(['free', 'basic', 'intermediary', 'experience']).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'As senhas não coincidem',
        path: ['confirmPassword'],
      });
    }
    if (data.userType === 'clinic' && !data.plan) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecione um plano para prosseguir',
        path: ['plan'],
      });
    }
  });

export type RegisterInput = z.infer<typeof registerSchema>;
