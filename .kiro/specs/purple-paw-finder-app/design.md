# Documento de Design — Purple Paw Finder (Paw Connect)

## Sumário

1. [Visão Geral](#overview)
2. [Arquitetura](#architecture)
3. [Componentes e Interfaces](#components-and-interfaces)
4. [Modelos de Dados](#data-models)
5. [Schema do localStorage](#5-schema-do-localstorage)
6. [Propriedades de Correção](#correctness-properties)
7. [Tratamento de Erros](#error-handling)
8. [Estratégia de Testes](#testing-strategy)

---

## Overview

O **Paw Connect** é uma SPA que conecta tutores de animais de estimação a clínicas veterinárias. A stack é React 18 + TypeScript + Vite + shadcn/ui + Tailwind CSS + React Router v6 + TanStack Query + Zod + React Hook Form. A persistência de dados nesta fase usa exclusivamente `localStorage` — sem backend real.

Dois perfis de usuário existem:

- **Cliente** (`userType: 'client'`): busca clínicas, agenda consultas, acompanha tickets, conversa via chat.
- **Clínica** (`userType: 'clinic'`): configura perfil, gerencia aprovações, acessa dashboard completo.

Toda entrada de usuário passa por validação Zod antes de ser processada ou persistida. Identidade do usuário é sempre derivada do `AuthContext`, jamais de campos do formulário (INPUT-015).

---

## Architecture

### 2.1 Visão de Alto Nível

```
┌──────────────────────────────────────────────────────────────────┐
│                          React SPA                               │
│                                                                  │
│  ┌─────────────┐   ┌──────────────┐   ┌────────────────────┐   │
│  │ AuthContext │   │FavoritesCtx  │   │  QueryClientProvider│   │
│  │ (sessão,    │   │(lista favs,  │   │  (TanStack Query)   │   │
│  │  brute-force│   │ toggle, sync)│   │                    │   │
│  │  expiração) │   └──────────────┘   └────────────────────┘   │
│  └─────────────┘                                                 │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              React Router v6 (BrowserRouter)             │    │
│  │  PublicRoute │ ClientRoute │ ClinicRoute │ SharedRoute   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │  Pages   │ │Components│ │  Hooks   │ │ Validation Layer  │  │
│  │(rotas)   │ │(UI atoms │ │(lógica   │ │ (Zod schemas,    │  │
│  │          │ │ e molec.)│ │ reutiliz)│ │  encodeHTML,     │  │
│  │          │ │          │ │          │ │  file validation) │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  localStorage                             │   │
│  │  users │ user │ session_meta │ clinics │ tickets │ chats  │   │
│  │  pets  │ favorites │ reports │ blocks │ user_location     │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Árvore de Componentes Principal

```
App
├── QueryClientProvider
│   └── TooltipProvider
│       └── AuthProvider
│           └── FavoritesProvider
│               └── BrowserRouter
│                   ├── Routes
│                   │   ├── / → Index (SearchSection, FeaturedClinics)
│                   │   ├── /login → Login (LoginForm)
│                   │   ├── /register → Register (RegisterForm)
│                   │   ├── /client-register → ClientRegister
│                   │   ├── /clinic/:id → ClinicDetails [shared]
│                   │   ├── /clinic/:id/create-ticket → CreateTicket [client]
│                   │   ├── /clinic/:id/chat → Chat (emergência) [auth]
│                   │   ├── /chat/:ticketId → Chat (ticket) [client]
│                   │   ├── /profile → Profile [client]
│                   │   ├── /my-appointments → MyAppointments [client]
│                   │   ├── /clinic-setup → ClinicSetup [clinic]
│                   │   ├── /clinic-visual-setup → ClinicVisualSetup [clinic]
│                   │   └── /clinic-dashboard → ClinicDashboard [clinic]
│                   └── * → NotFound
├── Toaster (shadcn/ui)
└── Sonner (toast de sistema)
```

### 2.3 Fluxo de Dados

```
Usuário interage com formulário
        │
        ▼
React Hook Form coleta valores
        │
        ▼
Zod schema valida (síncrono ou async)
        │
   ┌────┴────┐
   │inválido │  → Exibe erros de campo inline
   │         │
   │válido   │  → Handler executa lógica de negócio
   └─────────┘
        │
        ▼
AuthContext verifica identidade (INPUT-015)
        │
        ▼
Lê/escreve localStorage via camada de acesso tipada
        │
        ▼
TanStack Query invalida/revalida cache local
        │
        ▼
Estado React atualizado → Re-render
        │
        ▼
Saída HTML com encodeHTML aplicado
```

### 2.4 Estrutura de Diretórios

```
src/
├── components/
│   ├── ui/                    # shadcn/ui primitivos
│   ├── AppointmentApproval.tsx
│   ├── ClinicCard.tsx
│   ├── FeaturedClinics.tsx
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── SearchSection.tsx
│   ├── TicketsList.tsx
│   ├── LocationPermissionDialog.tsx
│   └── BreedSelector.tsx
├── contexts/
│   ├── AuthContext.tsx         # Sessão, login, logout, brute-force, expiração
│   └── FavoritesContext.tsx    # Lista de favoritos com sync localStorage
├── hooks/
│   ├── use-auth.ts             # Re-export do useAuth
│   ├── use-chat.ts
│   ├── use-geolocation.ts
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── lib/
│   ├── storage.ts              # Camada tipada de acesso ao localStorage
│   ├── encodeHTML.ts           # XSS prevention (INPUT-012)
│   ├── validateFile.ts         # Validação de uploads (INPUT-011)
│   ├── cnpj.ts                 # Validação de CNPJ com dígito verificador
│   ├── planGate.ts             # Hierarquia de planos e feature gating
│   └── passwordHash.ts         # Wrapper bcryptjs
├── pages/
│   ├── Index.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── ClientRegister.tsx
│   ├── ClinicDetails.tsx
│   ├── CreateTicket.tsx
│   ├── Chat.tsx
│   ├── Profile.tsx
│   ├── MyAppointments.tsx
│   ├── ClinicSetup.tsx
│   ├── ClinicVisualSetup.tsx
│   ├── ClinicDashboard.tsx
│   └── NotFound.tsx
├── schemas/
│   ├── auth.schemas.ts         # registerSchema, loginSchema
│   ├── clinic.schemas.ts       # clinicSetupSchema, clinicProfileSchema
│   ├── ticket.schemas.ts       # createTicketSchema
│   ├── chat.schemas.ts         # messageSchema
│   ├── profile.schemas.ts      # clientProfileSchema, petSchema
│   └── search.schemas.ts       # searchSchema
├── constants/
│   ├── messages.ts
│   ├── specialties.ts          # CLINIC_SPECIALTIES allowlist
│   ├── services.ts             # CLINIC_SERVICES allowlist
│   └── plans.ts                # PLAN_HIERARCHY
├── types/
│   └── index.ts                # Todas as interfaces TypeScript
├── data/
│   └── breeds.ts
├── App.tsx
└── main.tsx
```

---

## Components and Interfaces

### 3.1 Guardas de Rota

Os guardas de rota são componentes wrapper que verificam o estado do `AuthContext` antes de renderizar o conteúdo protegido.

```typescript
// src/components/guards/PrivateRoute.tsx
// Protege rotas que exigem qualquer autenticação
interface PrivateRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

// src/components/guards/ClientRoute.tsx
// Protege rotas exclusivas de cliente (userType === 'client')
interface ClientRouteProps {
  children: React.ReactNode;
}

// src/components/guards/ClinicRoute.tsx
// Protege rotas exclusivas de clínica (userType === 'clinic')
interface ClinicRouteProps {
  children: React.ReactNode;
}
```

**Lógica do guarda:**

```
PrivateRoute:
  isAuthenticated? → renderiza children
  !isAuthenticated → <Navigate to="/login" replace />

ClientRoute (extends PrivateRoute):
  isAuthenticated && userType === 'client' → renderiza children
  isAuthenticated && userType !== 'client' → <Navigate to="/" replace />
  !isAuthenticated → <Navigate to="/login" replace />

ClinicRoute (extends PrivateRoute):
  isAuthenticated && userType === 'clinic' → renderiza children
  isAuthenticated && userType !== 'clinic' → <Navigate to="/" replace />
  !isAuthenticated → <Navigate to="/login" replace />
```

### 3.2 AuthContext — Detalhado

```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => void;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

interface LoginResult {
  success: boolean;
  lockedUntil?: number; // timestamp epoch ms
}
```

**Fluxo de expiração de sessão (Req 2.8):**

```
AuthProvider (useEffect com intervalo de 60s):
  1. Lê session_meta do localStorage
  2. Compara sessionMeta.lastActivity + 8h com Date.now()
  3. Se expirado → chama logout() + exibe toast de aviso + navega para /login
  4. Se ativo → atualiza session_meta.lastActivity a cada interação do usuário
```

**Fluxo de brute-force (Req 2.7):**

```
login():
  1. Lê login_attempts[email] do localStorage
  2. Se lockedUntil > Date.now() → rejeita com mensagem genérica
  3. Se falha → incrementa failCount, salva timestamp
     Se failCount >= 5 e todos os attempts dentro de 5min → define lockedUntil = now + 15min
  4. Se sucesso → limpa login_attempts[email]
```

### 3.3 FavoritesContext — Detalhado

```typescript
interface FavoritesContextType {
  favorites: string[];                      // array de clinicIds
  toggleFavorite: (clinicId: string) => void;
  isFavorite: (clinicId: string) => boolean;
}
```

**Inicialização segura (Req 5.3):**

```typescript
// Na inicialização do FavoritesProvider:
try {
  const raw = localStorage.getItem('paw_favorites');
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  // Valida: deve ser array de strings não-vazias
  if (!Array.isArray(parsed)) throw new Error('invalid');
  const valid = parsed.filter(
    (id): id is string => typeof id === 'string' && id.trim().length > 0
  );
  return valid;
} catch {
  console.warn('[FavoritesContext] Dados inválidos no localStorage, reiniciando com lista vazia');
  localStorage.removeItem('paw_favorites');
  return [];
}
```

**Guard de ID inválido (Req 5.5):**

```typescript
toggleFavorite(clinicId: string): void {
  if (!clinicId || typeof clinicId !== 'string' || clinicId.trim() === '') return;
  // ... lógica de toggle
}
```

### 3.4 Header

```typescript
interface HeaderProps {
  // sem props — lê de AuthContext internamente
}
```

Renderização condicional:
- Não autenticado: links "Login" + "Cadastrar"
- Cliente autenticado: "Início" + "Meus Agendamentos" + "Perfil" + botão logout
- Clínica autenticada: "Dashboard" + botão logout

Todos os botões de ícone (ex.: logout) devem ter `aria-label` descritivo (Req 16.2).

### 3.5 ClinicCard

```typescript
interface ClinicCardProps {
  clinic: Clinic;
  showFavoriteButton?: boolean;
}
```

- Exibe nome, rating, distância, especialidades
- Botão de favorito: ícone coração preenchido/vazado conforme `isFavorite(clinic.id)` (Req 5.4)
- Todo texto proveniente de dados do usuário é passado por `encodeHTML()` antes da renderização (Req 4.6, 13.4)
- `aria-label` no botão de favorito: `"Remover ${clinic.name} dos favoritos"` / `"Adicionar ${clinic.name} aos favoritos"` (Req 16.2)

### 3.6 SearchSection

```typescript
interface SearchSectionProps {
  onSearch: (query: SearchQuery) => void;
}
```

- Campo de localização com debounce de 300ms para autocomplete (até 10 sugestões — Req 3.2)
- Dropdown de especialidade com lista `CLINIC_SPECIALTIES` (Req 3.8)
- Botão de geolocalização dispara `useGeolocation` e abre `LocationPermissionDialog`
- Validação via `searchSchema` antes de emitir `onSearch`

### 3.7 Chat

```typescript
interface ChatProps {
  // lê ticketId e emergency flag via useParams e useSearchParams
}
```

- Carrega últimas 200 mensagens do localStorage (Req 9.1)
- Autorização: verifica que ticketId pertence ao usuário autenticado (Req 9.2)
- Cabeçalho vermelho com "EMERGÊNCIA — Atendimento prioritário" quando `emergency=true` (Req 9.10)
- Todas as mensagens passam por `encodeHTML()` antes de renderizar no DOM (Req 9.6)
- Alinhamento: cliente → direita, clínica → esquerda, sistema → centralizado (Req 9.8)
- Contador de caracteres visível quando campo tem mais de 900 caracteres
- Botões "Denunciar" e "Bloquear" com diálogos de confirmação (Req 9.11, 9.12)

### 3.8 ClinicDashboard

Abas/seções:
1. **Aprovações Pendentes** — lista tickets `pending` com count badge
2. **Contatos** — clientes que iniciaram contato
3. **Emergências** — contatos com `isEmergency: true`, fundo/borda vermelhos
4. **Calendário** — react-day-picker com marcadores em dias com tickets `confirmed`
5. **Pacientes Agendados** — lista tickets `confirmed`
6. **Horários** — configuração de horários de funcionamento

Aprovação de ticket:
- Atualiza `approvalStatus: 'approved'`, `status: 'confirmed'` no localStorage
- Remove da lista de pendentes em ≤ 100ms (atualização de estado otimista — Req 10.4)
- Decrementa contador do badge imediatamente (Req 10.7)

Recusa de ticket:
- Dialog com campo de motivo obrigatório (1–500 chars)
- Ao confirmar: atualiza `approvalStatus: 'rejected'`, cria mensagem `system` no chat (Req 10.5, 10.6)

---

## Data Models

### 4.1 Interfaces TypeScript

```typescript
// src/types/index.ts

// ─── Enums e Allowlists ────────────────────────────────────────────

export type UserType = 'client' | 'clinic';

export type PlanType = 'free' | 'basic' | 'intermediary' | 'experience';

export type SpeciesType = 'dog' | 'cat' | 'bird' | 'rabbit' | 'hamster' | 'fish' | 'reptile' | 'other';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type TicketStatus = 'pending' | 'confirmed' | 'cancelled';

export type MessageSenderType = 'client' | 'clinic' | 'system';

export type MessageType = 'text' | 'system';

// ─── Usuário ────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;        // bcryptjs hash — NUNCA exposto na UI
  userType: UserType;
  plan?: PlanType;             // obrigatório para clinic
  isProfileComplete: boolean;
  createdAt: number;           // timestamp epoch ms
  // Campos de perfil (preenchidos no onboarding / edição)
  phone?: string;
  avatarUrl?: string;          // data-URL base64 após validação
}

export interface ClientProfile extends User {
  userType: 'client';
  address?: string;
}

export interface ClinicProfile extends User {
  userType: 'clinic';
  plan: PlanType;
  // Configurações do perfil (ClinicSetup)
  clinicName?: string;
  cnpj?: string;               // armazenado com máscara removida
  phone?: string;
  address?: ClinicAddress;
  specialties?: string[];      // subconjunto de CLINIC_SPECIALTIES
  animalTypes?: SpeciesType[];
  services?: string[];
  description?: string;
  is24Hours?: boolean;
  schedules?: WeekSchedule;
  // Configurações visuais (ClinicVisualSetup)
  logoUrl?: string;
  coverUrl?: string;
  primaryColor?: string;
  // Dados calculados / extras
  rating?: number;             // 0-5, média das avaliações
  reviewCount?: number;
  coordinates?: Coordinates;
  isEmergencyAvailable?: boolean;
}

// ─── Endereço ────────────────────────────────────────────────────────

export interface ClinicAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode?: string;
}

// ─── Horários ────────────────────────────────────────────────────────

export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface DaySchedule {
  open: string;   // "HH:mm" — 24h
  close: string;  // "HH:mm" — 24h
  isOpen: boolean;
}

export type WeekSchedule = Record<Weekday, DaySchedule>;

// ─── Pet ──────────────────────────────────────────────────────────────

export interface Pet {
  id: string;
  ownerId: string;             // userId do cliente — derivado do AuthContext
  name: string;                // 1-100 chars
  species: SpeciesType;
  breed: string;
  birthDate?: string;          // ISO date string
  weight?: number;             // kg
  photoKey?: string;           // chave no localStorage para a foto (data-URL)
  createdAt: number;
}

// ─── Ticket ──────────────────────────────────────────────────────────

export interface Ticket {
  id: string;
  userId: string;              // derivado do AuthContext — nunca do formulário
  clinicId: string;
  petId: string;
  petName: string;             // snapshot no momento da criação
  petSpecies: SpeciesType;
  petBreed: string;
  service: string;             // valor da CLINIC_SERVICES allowlist
  title: string;               // 1-100 chars
  description: string;         // 1-1000 chars
  scheduledDate: string;       // "YYYY-MM-DD"
  scheduledTime: string;       // "HH:mm"
  referralFileKey?: string;    // chave no localStorage para o arquivo de encaminhamento
  approvalStatus: ApprovalStatus;
  status: TicketStatus;
  rejectionReason?: string;    // máx 500 chars
  isEmergency: boolean;
  createdAt: number;
}

// ─── Mensagem de Chat ─────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  ticketId: string;
  senderId: string;            // userId do remetente ou 'system'
  senderType: MessageSenderType;
  text: string;                // já encodado em HTML ao persistir
  type: MessageType;
  timestamp: number;           // epoch ms
}

// ─── Sessão e Segurança ───────────────────────────────────────────────

export interface SessionMeta {
  userId: string;
  userType: UserType;
  createdAt: number;
  lastActivity: number;
  expiresAt: number;           // createdAt + 8h em ms
}

export interface LoginAttempts {
  [email: string]: {
    failCount: number;
    firstAttemptAt: number;    // timestamp da primeira falha na janela atual
    lockedUntil?: number;      // timestamp até quando está bloqueado
  };
}

// ─── Denúncia e Bloqueio ─────────────────────────────────────────────

export interface Report {
  id: string;
  reporterId: string;
  reportedId: string;
  ticketId: string;
  timestamp: number;
  reason?: string;
}

export interface Block {
  id: string;
  blockerId: string;
  blockedId: string;
  ticketId: string;
  timestamp: number;
}

// ─── Coordenadas ─────────────────────────────────────────────────────

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// ─── Pesquisa ────────────────────────────────────────────────────────

export interface SearchQuery {
  location: string;
  specialty?: string;
}

export interface SearchResult {
  clinic: ClinicProfile;
  distanceKm?: number;
}
```

### 4.2 Schemas Zod

```typescript
// src/schemas/auth.schemas.ts

import { z } from 'zod';
import { USER_TYPES, PLAN_TYPES } from '@/constants/plans';

export const registerSchema = z.object({
  name: z.string().min(1).max(150),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  userType: z.enum(['client', 'clinic']),
  plan: z.enum(['free', 'basic', 'intermediary', 'experience']).optional(),
}).superRefine((data, ctx) => {
  if (data.userType === 'clinic' && !data.plan) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selecione um plano para prosseguir',
      path: ['plan'],
    });
  }
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

// src/schemas/profile.schemas.ts

export const clientProfileSchema = z.object({
  name: z.string().min(1).max(150),
  email: z.string().email(),
  phone: z.string().min(10).max(15).optional(),
  address: z.string().max(255).optional(),
});

export const petSchema = z.object({
  name: z.string().min(1).max(100),
  species: z.enum(['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other']),
  breed: z.string().min(1).max(100),
  birthDate: z.string().optional(),
  weight: z.number().positive().optional(),
});

// src/schemas/clinic.schemas.ts

export const clinicSetupSchema = z.object({
  clinicName: z.string().min(1).max(100),
  phone: z.string().regex(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos'),
  cnpj: z.string().refine(validateCNPJ, 'CNPJ inválido'),
  street: z.string().min(1).max(255),
  number: z.string().min(1).max(20),
  complement: z.string().max(100).optional(),
  neighborhood: z.string().min(1).max(100),
  city: z.string().min(1).max(100),
  state: z.string().min(2).max(2),
  specialties: z.array(z.enum(CLINIC_SPECIALTIES)).min(1, 'Selecione ao menos uma especialidade'),
  animalTypes: z.array(z.enum(['dog','cat','bird','rabbit','hamster','fish','reptile','other'])).min(1),
  is24Hours: z.boolean().default(false),
  description: z.string().max(1000).optional(),
});

// src/schemas/ticket.schemas.ts

export const createTicketSchema = z.object({
  petId: z.string().min(1),
  service: z.enum(CLINIC_SERVICES),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  scheduledDate: z.string().refine(
    (d) => new Date(d) >= new Date(new Date().toDateString()),
    'A data deve ser igual ou posterior a hoje'
  ),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/),
  referralFileKey: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.service !== 'Clínica Geral' && !data.referralFileKey) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Encaminhamento obrigatório para serviços especializados',
      path: ['referralFileKey'],
    });
  }
});

// src/schemas/chat.schemas.ts

export const messageSchema = z.object({
  text: z.string()
    .min(1, 'Mensagem não pode ser vazia')
    .max(1000, 'Mensagem não pode exceder 1000 caracteres')
    .refine((t) => t.trim().length > 0, 'Mensagem não pode ser só espaços'),
});

export const emergencyFirstMessageSchema = messageSchema.extend({
  text: z.string()
    .min(1)
    .max(120, 'Primeira mensagem emergencial não pode exceder 120 caracteres')
    .refine((t) => t.trim().length > 0),
});

// src/schemas/search.schemas.ts

export const searchSchema = z.object({
  location: z.string()
    .max(200, 'Localização não pode exceder 200 caracteres')
    .refine(
      (s) => /^[\x20-\x7E\u00C0-\u024F\u1E00-\u1EFF]*$/.test(s),
      'Caracteres inválidos na localização'
    ),
  specialty: z.enum(CLINIC_SPECIALTIES).optional(),
});
```

### 4.3 Validação de CNPJ

```typescript
// src/lib/cnpj.ts

export function validateCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return false;
  if (/^(\d)\1+$/.test(digits)) return false; // todos iguais

  const calc = (d: string, len: number) => {
    let sum = 0;
    let pos = len - 7;
    for (let i = len; i >= 1; i--) {
      sum += parseInt(d[len - i]) * pos--;
      if (pos < 2) pos = 9;
    }
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };

  const d1 = calc(digits, 12);
  const d2 = calc(digits, 13);
  return d1 === parseInt(digits[12]) && d2 === parseInt(digits[13]);
}
```

---

## 5. Schema do localStorage

### 5.1 Chaves e Estrutura

| Chave | Tipo | Descrição |
|---|---|---|
| `paw_users` | `User[]` | Todos os usuários registrados (inclui `passwordHash`) |
| `paw_user` | `Omit<User, 'passwordHash'>` | Usuário autenticado atual (sem hash) |
| `paw_session_meta` | `SessionMeta` | Metadados da sessão atual para controle de expiração |
| `paw_login_attempts` | `LoginAttempts` | Controle de tentativas de login por e-mail |
| `paw_clinics` | `ClinicProfile[]` | Dados públicos de clínicas (sem senhas) |
| `paw_tickets` | `Ticket[]` | Todos os tickets de todos os usuários |
| `paw_chats` | `Record<ticketId, ChatMessage[]>` | Histórico de chat por ticket |
| `paw_favorites` | `string[]` | Array de clinicIds favoritos do usuário atual |
| `paw_pets` | `Pet[]` | Todos os pets de todos os clientes |
| `paw_reports` | `Report[]` | Denúncias registradas |
| `paw_blocks` | `Block[]` | Bloqueios registrados |
| `paw_user_location` | `Coordinates` | Coordenadas GPS do usuário |
| `paw_photo_{petId}` | `string` | Data-URL base64 da foto do pet |
| `paw_avatar_{userId}` | `string` | Data-URL base64 do avatar do usuário |
| `paw_referral_{ticketId}` | `string` | Data-URL/base64 do arquivo de encaminhamento |

### 5.2 Camada de Acesso Tipada

```typescript
// src/lib/storage.ts

const PREFIX = 'paw_';

export const storage = {
  getUsers: (): User[] => safeGet<User[]>('users', []),
  setUsers: (users: User[]) => safeSet('users', users),

  getCurrentUser: (): Omit<User, 'passwordHash'> | null =>
    safeGet<Omit<User, 'passwordHash'> | null>('user', null),
  setCurrentUser: (user: Omit<User, 'passwordHash'> | null) =>
    user ? safeSet('user', user) : localStorage.removeItem(`${PREFIX}user`),

  getSessionMeta: (): SessionMeta | null => safeGet<SessionMeta | null>('session_meta', null),
  setSessionMeta: (meta: SessionMeta | null) =>
    meta ? safeSet('session_meta', meta) : localStorage.removeItem(`${PREFIX}session_meta`),

  getLoginAttempts: (): LoginAttempts => safeGet<LoginAttempts>('login_attempts', {}),
  setLoginAttempts: (attempts: LoginAttempts) => safeSet('login_attempts', attempts),

  getTickets: (): Ticket[] => safeGet<Ticket[]>('tickets', []),
  setTickets: (tickets: Ticket[]) => safeSet('tickets', tickets),

  getChatMessages: (ticketId: string): ChatMessage[] => {
    const all = safeGet<Record<string, ChatMessage[]>>('chats', {});
    return (all[ticketId] ?? []).slice(-200); // últimas 200 — Req 9.1
  },
  appendChatMessage: (msg: ChatMessage) => {
    const all = safeGet<Record<string, ChatMessage[]>>('chats', {});
    const thread = all[msg.ticketId] ?? [];
    all[msg.ticketId] = [...thread, msg];
    safeSet('chats', all);
  },

  getFavorites: (): string[] => {
    try {
      const raw = localStorage.getItem(`${PREFIX}favorites`);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('invalid');
      return parsed.filter((id): id is string => typeof id === 'string' && id.trim() !== '');
    } catch {
      console.warn('[storage] paw_favorites corrompido — reiniciando');
      localStorage.removeItem(`${PREFIX}favorites`);
      return [];
    }
  },
  setFavorites: (ids: string[]) => safeSet('favorites', ids),

  getPets: (): Pet[] => safeGet<Pet[]>('pets', []),
  setPets: (pets: Pet[]) => safeSet('pets', pets),

  removePetData: (petId: string) => {
    const pets = storage.getPets().filter(p => p.id !== petId);
    storage.setPets(pets);
    localStorage.removeItem(`${PREFIX}photo_${petId}`); // Req 6.8
  },
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${PREFIX}${key}`);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    console.warn(`[storage] Falha ao ler ${PREFIX}${key}`);
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
  } catch (e) {
    console.error(`[storage] Falha ao escrever ${PREFIX}${key}`, e);
    throw e; // propaga para tratamento de erro na UI
  }
}
```

### 5.3 Segurança no localStorage

- Senhas **nunca** são armazenadas em texto puro — apenas `passwordHash` (bcryptjs, Req 1.7)
- `paw_user` (sessão ativa) **não contém** `passwordHash`
- Tokens de sessão e hashes **nunca** aparecem em mensagens de erro (Req 1.8, 13.5)
- Ao remover um pet, tanto `paw_pets` quanto `paw_photo_{petId}` são removidos (Req 6.8)
- JSON.parse de dados lidos do localStorage é sempre envolvido em try/catch (INPUT-010)

---

## Correctness Properties

*Uma propriedade é uma característica ou comportamento que deve ser verdadeiro em todas as execuções válidas de um sistema — essencialmente, uma afirmação formal sobre o que o sistema deve fazer. As propriedades servem como ponte entre especificações legíveis por humanos e garantias de correção verificáveis por máquinas.*

### Reflexão sobre Redundância

Antes de listar as propriedades, análise de consolidação:

- As propriedades de **encoding HTML** (Req 4.6, 9.6 e 13.4) são idênticas em essência — todas testam a mesma função `encodeHTML`. Consolidadas em **Propriedade 5**.
- As propriedades de **validação de allowlist** (userType, species, plan, specialties) são instâncias do mesmo padrão — testam a função de validação de enum do Zod com diferentes enums. Podem ser expressas como uma família, mas são mantidas separadas para rastreabilidade de requisitos.
- A propriedade de **toggle de favoritos** (Req 5.1) e a de **idempotência de toggle duplo** são partes do mesmo invariante — consolidadas em **Propriedade 8**.
- A propriedade de **isolamento de tickets** (Req 8.1) e a de **associação de userId** (Req 7.8) se complementam — **Propriedade 13** cobre ambas.

---

### Property 1: Validação rejeita dados de registro inválidos

*Para qualquer* objeto de registro onde pelo menos um campo viola as restrições (nome vazio ou acima de 150 chars, e-mail fora do formato RFC 5322, senha com menos de 8 ou mais de 128 chars, `userType` fora de `['client', 'clinic']`, ou clínica sem plano), o schema `registerSchema` do Zod SHALL rejeitar a submissão com pelo menos um erro de campo.

**Valida: Requisitos 1.1, 1.4, 1.6, 13.1, 13.2, 13.3**

---

### Property 2: Senha nunca é armazenada em texto puro

*Para qualquer* string de senha fornecida durante o registro, o valor armazenado em `paw_users` no localStorage SHALL ser diferente da senha original — o campo `passwordHash` não deve ser igual à string de entrada.

**Valida: Requisito 1.7**

---

### Propriedade 3: Login bem-sucedido com credenciais válidas gera sessão

*Para qualquer* par (email, senha) que foi registrado com sucesso, chamar `login(email, senha)` SHALL resultar em `isAuthenticated === true` e `user.id` igual ao ID criado no registro, com `passwordHash` ausente do objeto de sessão exposto pelo contexto.

**Valida: Requisitos 2.1, 2.6**

---

### Propriedade 4: Sessão expirada é invalidada na inicialização

*Para qualquer* `SessionMeta` no localStorage com `lastActivity` mais de 8 horas anterior ao momento atual, ao inicializar o `AuthProvider`, a sessão SHALL ser removida do localStorage e `isAuthenticated` SHALL ser `false`.

**Valida: Requisito 2.8**

---

### Propriedade 5: Encoding HTML é idempotente e completo

*Para qualquer* string contendo caracteres HTML especiais (`<`, `>`, `"`, `'`, `&`), a função `encodeHTML` SHALL produzir uma string onde nenhum desses caracteres originais existe em forma não-codificada, e aplicar `encodeHTML` duas vezes SHALL produzir o mesmo resultado que aplicar uma vez (idempotência sobre a saída final).

**Valida: Requisitos 4.6, 9.6, 13.4**

---

### Propriedade 6: Brute-force — 5ª falha consecutiva bloqueia o e-mail

*Para qualquer* e-mail registrado, após exatamente 5 tentativas de login com senha incorreta dentro de uma janela de 5 minutos, qualquer tentativa subsequente (com credencial correta ou incorreta) SHALL ser rejeitada com mensagem genérica, sem revelar que o bloqueio existe por razão de segurança, enquanto `Date.now() < lockedUntil`.

**Valida: Requisito 2.7**

---

### Propriedade 7: Sugestões de localização não excedem 10 itens

*Para qualquer* string de busca de localização com 2 ou mais caracteres, a função de autocomplete SHALL retornar no máximo 10 sugestões, independentemente do número de clínicas no localStorage que correspondam ao critério.

**Valida: Requisito 3.2**

---

### Propriedade 8: Toggle de favorito inverte o estado e é reversível

*Para qualquer* clinicId válido e qualquer estado inicial da lista de favoritos, chamar `toggleFavorite(clinicId)` SHALL inverter `isFavorite(clinicId)` (false→true ou true→false), e chamar `toggleFavorite(clinicId)` uma segunda vez consecutiva SHALL restaurar exatamente o estado inicial da lista.

**Valida: Requisitos 5.1, 5.4**

---

### Propriedade 9: IDs inválidos em toggleFavorite não alteram o estado

*Para qualquer* lista de favoritos e qualquer valor de `clinicId` que seja `null`, `undefined` ou string vazia (ou composta apenas de espaços), chamar `toggleFavorite(clinicId)` SHALL deixar a lista de favoritos inalterada.

**Valida: Requisito 5.5**

---

### Propriedade 10: Dados corrompidos de favoritos resultam em lista vazia

*Para qualquer* string malformada (JSON inválido, array de não-strings, objeto, número) armazenada em `paw_favorites` no localStorage, ao inicializar o `FavoritesProvider`, `favorites` SHALL ser um array vazio sem propagar erros para a UI.

**Valida: Requisito 5.3**

---

### Propriedade 11: Filtro de busca satisfaz ambos os critérios simultaneamente

*Para qualquer* conjunto de clínicas no localStorage e qualquer query de busca com `location` e `specialty` preenchidos, todos os resultados retornados SHALL ter localização correspondente ao critério de location E especialidade correspondente ao critério de specialty — nenhum resultado deve satisfazer apenas um dos critérios.

**Valida: Requisito 3.3**

---

### Propriedade 12: Validação de arquivo rejeita qualquer critério inválido

*Para qualquer* arquivo onde pelo menos um dos seguintes critérios falha — tipo MIME fora da allowlist, extensão não correspondente ao MIME, tamanho acima do limite configurado, ou magic bytes inconsistentes com o tipo declarado — a função `validateFile` SHALL retornar um resultado de validação inválido com mensagem descritiva, sem processar ou armazenar o arquivo.

**Valida: Requisitos 6.4, 6.5, 6.9, 7.5, 13.7**

---

### Propriedade 13: Tickets são sempre associados ao userId do AuthContext

*Para qualquer* submissão de formulário de criação de ticket contendo qualquer valor de `userId` no corpo do formulário, o ticket persistido no localStorage SHALL ter `userId` igual ao `user.id` do `AuthContext` no momento da submissão, nunca ao valor fornecido no formulário.

**Valida: Requisitos 7.8, 8.1, 13.10**

---

### Propriedade 14: Hierarquia de planos é transitiva e não-regressiva

*Para qualquer* plano `P` na hierarquia `free ⊂ basic ⊂ intermediary ⊂ experience` e qualquer funcionalidade `F` disponível no plano `P`, a função `hasFeatureAccess(plan, feature)` SHALL retornar `true` para todos os planos iguais ou superiores a `P` na hierarquia, e `false` para todos os planos inferiores a `P`.

**Valida: Requisito 12.3**

---

### Propriedade 15: Validação de CNPJ rejeita dígitos verificadores incorretos

*Para qualquer* CNPJ com 14 dígitos cujo dígito verificador calculado pelos pesos oficiais da Receita Federal difira dos dígitos informados, a função `validateCNPJ` SHALL retornar `false`. Para qualquer CNPJ com dígito verificador correto calculado pelos pesos oficiais, SHALL retornar `true`.

**Valida: Requisito 11.1**

---

### Propriedade 16: Mensagem de comprimento inválido é sempre rejeitada

*Para qualquer* string de mensagem de chat com comprimento igual a 0 (ou composta apenas de espaços em branco) ou com comprimento maior que 1000 caracteres, a validação via `messageSchema` SHALL rejeitar o envio. Para a primeira mensagem de chat emergencial, a mesma propriedade se aplica com o limite de 120 caracteres.

**Valida: Requisitos 9.3, 9.4, 9.5**

---

### Propriedade 17: Status de abertura de clínica é determinístico

*Para qualquer* clínica com `schedules` configurado e qualquer timestamp `T`, a função `isClinicOpen(clinic, T)` SHALL retornar `true` se e somente se `T` cai dentro do intervalo `[schedule.open, schedule.close]` do dia da semana correspondente a `T`, com `schedule.isOpen === true`. Para clínicas sem horários cadastrados, SHALL retornar `null` (indeterminado).

**Valida: Requisito 4.2**

---

## Error Handling

### 7.1 Princípios Gerais

- **Mensagens genéricas para o usuário**: nunca expor stack traces, IDs internos, detalhes de banco ou estrutura do localStorage (Req 13.6, INPUT-017)
- **Log interno**: registrar falhas técnicas em `console.error` sem incluir senhas, tokens ou session IDs (Req 13.5, INPUT-016)
- **Preservação de estado de formulário**: em caso de falha de persistência, manter os dados do formulário preenchido para não forçar re-digitação (Req 7.10, 11.6)

### 7.2 Categorias de Erro

| Categoria | Mensagem para usuário | Comportamento |
|---|---|---|
| Credenciais inválidas | "E-mail ou senha incorretos" | Genérica — não indica qual campo (Req 2.2) |
| E-mail duplicado no registro | "Não foi possível completar o cadastro" | Não confirma existência do e-mail (Req 1.3) |
| Clínica não encontrada (`/clinic/:id`) | "Clínica não encontrada. Voltar à busca" | Oferece link de retorno (Req 4.5) |
| Falha de persistência (localStorage quota) | "Erro ao salvar. Tente novamente." | Mantém formulário (Req 7.10) |
| Falha de leitura de tickets | "Erro ao carregar agendamentos. Tentar novamente" | Oferece botão retry (Req 8.7) |
| Arquivo inválido (tipo/tamanho) | Mensagem descritiva com o critério violado | Descarta arquivo sem processar (Req 6.5) |
| Conta bloqueada (brute-force) | "Muitas tentativas. Tente novamente mais tarde." | Não menciona o motivo técnico (Req 2.7) |
| Sessão expirada | "Sua sessão expirou. Faça login novamente." | Toast antes de redirecionar (Req 2.8) |
| Chat — ticketId não autorizado | "Acesso não permitido." | Redireciona para `/` (Req 9.2) |
| Rota inexistente | Página NotFound com link para início | Nunca exibe componentes da rota (Req 14.5) |

### 7.3 Error Boundaries

Componentes de alto risco (Dashboard, Chat, Profile) devem ser envolvidos em React Error Boundaries para prevenir crash da aplicação inteira. O boundary exibe mensagem genérica de erro e botão "Recarregar".

### 7.4 Tratamento de localStorage Cheio

```typescript
// Na função safeSet:
try {
  localStorage.setItem(key, value);
} catch (e) {
  if (e instanceof DOMException && e.name === 'QuotaExceededError') {
    // Propaga erro para a UI mostrar mensagem amigável
    throw new Error('STORAGE_QUOTA_EXCEEDED');
  }
  throw e;
}
```

---

## Testing Strategy

### 8.1 Abordagem Dual

A estratégia combina **testes de exemplo** (unitários e de integração) com **testes baseados em propriedades** (property-based testing). Os testes de propriedade cobrem a lógica pura da aplicação; os de exemplo cobrem integrações e cenários específicos.

### 8.2 Biblioteca de Property-Based Testing

**Biblioteca escolhida:** [`fast-check`](https://github.com/dubzzz/fast-check) — madura, totalmente compatível com TypeScript, disponível no ecosistema npm, e integra com Vitest.

```bash
npm install --save-dev fast-check vitest @testing-library/react @testing-library/user-event
```

**Configuração:** cada teste de propriedade deve executar **mínimo de 100 iterações** (`numRuns: 100`).

**Formato de tag:** cada teste de propriedade deve conter um comentário de rastreabilidade:

```typescript
// Feature: purple-paw-finder-app, Property N: <texto da propriedade>
```

### 8.3 Testes de Propriedade

Cada propriedade do §6 é implementada como um único teste fast-check.

#### Propriedade 1 — Validação rejeita dados de registro inválidos

```typescript
// Feature: purple-paw-finder-app, Property 1: registerSchema rejeita qualquer input inválido
it('registerSchema rejeita qualquer combinação de campos inválidos', () => {
  fc.assert(fc.property(
    fc.record({
      name: fc.oneof(fc.constant(''), fc.string({ minLength: 151 })),
      email: fc.string().filter(s => !z.string().email().safeParse(s).success),
      password: fc.oneof(fc.string({ maxLength: 7 }), fc.string({ minLength: 129 })),
      userType: fc.string().filter(s => !['client','clinic'].includes(s)),
    }),
    (data) => {
      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
    }
  ), { numRuns: 100 });
});
```

#### Propriedade 2 — Senha nunca armazenada em texto puro

```typescript
// Feature: purple-paw-finder-app, Property 2: passwordHash != senha original
it('hash armazenado nunca é igual à senha original', () => {
  fc.assert(fc.property(
    fc.string({ minLength: 8, maxLength: 128 }),
    async (password) => {
      const hash = await hashPassword(password);
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    }
  ), { numRuns: 100 });
});
```

#### Propriedade 5 — Encoding HTML é idempotente e completo

```typescript
// Feature: purple-paw-finder-app, Property 5: encodeHTML é completo e idempotente
it('encodeHTML remove todos os caracteres HTML especiais', () => {
  fc.assert(fc.property(
    fc.string(),
    (input) => {
      const encoded = encodeHTML(input);
      // Nenhum caracter especial original permanece não-codificado
      expect(encoded).not.toMatch(/[<>"'&]/);
      // Idempotência
      expect(encodeHTML(encoded)).toBe(encoded);
    }
  ), { numRuns: 100 });
});
```

#### Propriedade 7 — Autocomplete retorna no máximo 10 sugestões

```typescript
// Feature: purple-paw-finder-app, Property 7: sugestões de localização <= 10
it('autocomplete nunca retorna mais de 10 sugestões', () => {
  fc.assert(fc.property(
    fc.array(fc.record({ city: fc.string(), neighborhood: fc.string() }), { minLength: 0, maxLength: 50 }),
    fc.string({ minLength: 2 }),
    (clinics, query) => {
      const suggestions = getLocationSuggestions(clinics, query);
      expect(suggestions.length).toBeLessThanOrEqual(10);
    }
  ), { numRuns: 100 });
});
```

#### Propriedade 8 — Toggle de favorito inverte o estado

```typescript
// Feature: purple-paw-finder-app, Property 8: toggleFavorite inverte o estado
it('toggleFavorite inverte isFavorite e é reversível', () => {
  fc.assert(fc.property(
    fc.array(fc.uuid(), { minLength: 0, maxLength: 20 }),
    fc.uuid(),
    (initialFavorites, clinicId) => {
      const initial = isFavoriteInList(initialFavorites, clinicId);
      const afterOne = isFavoriteInList(toggleInList(initialFavorites, clinicId), clinicId);
      const afterTwo = isFavoriteInList(toggleInList(toggleInList(initialFavorites, clinicId), clinicId), clinicId);
      expect(afterOne).toBe(!initial);
      expect(afterTwo).toBe(initial);
    }
  ), { numRuns: 100 });
});
```

#### Propriedade 11 — Filtro de busca satisfaz ambos os critérios

```typescript
// Feature: purple-paw-finder-app, Property 11: resultados satisfazem localização E especialidade
it('busca retorna apenas clínicas que correspondem a localização E especialidade', () => {
  fc.assert(fc.property(
    fc.array(clinicArbitrary, { minLength: 0, maxLength: 30 }),
    fc.string({ minLength: 2, maxLength: 50 }),
    fc.constantFrom(...CLINIC_SPECIALTIES),
    (clinics, location, specialty) => {
      const results = searchClinics(clinics, { location, specialty });
      for (const r of results) {
        const matchesLocation = matchesLocationCriteria(r.clinic, location);
        const matchesSpecialty = r.clinic.specialties?.includes(specialty) ?? false;
        expect(matchesLocation && matchesSpecialty).toBe(true);
      }
    }
  ), { numRuns: 100 });
});
```

#### Propriedade 14 — Hierarquia de planos é transitiva

```typescript
// Feature: purple-paw-finder-app, Property 14: hierarquia de planos é transitiva
it('plano superior sempre tem acesso às features dos planos inferiores', () => {
  const plans: PlanType[] = ['free', 'basic', 'intermediary', 'experience'];
  fc.assert(fc.property(
    fc.nat({ max: 3 }),
    fc.nat({ max: 3 }),
    fc.constantFrom(...ALL_GATED_FEATURES),
    (planIdx, featurePlanIdx, feature) => {
      const plan = plans[planIdx];
      const featurePlan = plans[featurePlanIdx];
      const planRank = plans.indexOf(plan);
      const featureRank = plans.indexOf(featurePlan);
      const access = hasFeatureAccess(plan, feature);
      if (planRank >= featureRank) {
        expect(access).toBe(true);
      } else {
        expect(access).toBe(false);
      }
    }
  ), { numRuns: 100 });
});
```

#### Propriedade 15 — Validação de CNPJ rejeita dígitos incorretos

```typescript
// Feature: purple-paw-finder-app, Property 15: validateCNPJ rejeita dígitos verificadores errados
it('validateCNPJ rejeita CNPJ com dígito verificador incorreto', () => {
  fc.assert(fc.property(
    fc.stringMatching(/^\d{12}$/),
    fc.integer({ min: 0, max: 99 }),
    (base, wrongSuffix) => {
      const paddedSuffix = String(wrongSuffix).padStart(2, '0');
      const cnpj = base + paddedSuffix;
      const correctSuffix = calcCNPJDigits(base);
      if (paddedSuffix !== correctSuffix) {
        expect(validateCNPJ(cnpj)).toBe(false);
      }
    }
  ), { numRuns: 100 });
});
```

#### Propriedade 17 — Status de abertura é determinístico

```typescript
// Feature: purple-paw-finder-app, Property 17: isClinicOpen é determinístico
it('isClinicOpen retorna true sse timestamp está dentro do intervalo de funcionamento', () => {
  fc.assert(fc.property(
    scheduleArbitrary,
    fc.date({ min: new Date('2024-01-01'), max: new Date('2030-12-31') }),
    (schedule, date) => {
      const weekday = getWeekday(date);
      const day = schedule[weekday];
      const result = isClinicOpen({ schedules: schedule, is24Hours: false }, date.getTime());
      if (!day.isOpen) {
        expect(result).toBe(false);
      } else {
        const timeStr = date.toTimeString().slice(0, 5);
        const expected = timeStr >= day.open && timeStr < day.close;
        expect(result).toBe(expected);
      }
    }
  ), { numRuns: 100 });
});
```

### 8.4 Testes de Exemplo (unitários)

- Registro com e-mail duplicado retorna mensagem genérica (Req 1.3)
- Login com credenciais corretas redireciona para página inicial (Req 2.1)
- Logout remove sessão e redireciona (Req 2.3)
- Clínica não encontrada exibe mensagem e link de retorno (Req 4.5)
- Rota protegida sem autenticação redireciona para `/login` (Req 2.5, 14.2)
- Rota de clínica acessada por cliente é bloqueada (Req 10.1, 14.3)
- Toast de sucesso após criar ticket contém título e data (Req 7.9)
- Mensagens do cliente alinhadas à direita, da clínica à esquerda (Req 9.8)
- Primeira mensagem emergencial com mais de 120 chars bloqueia envio (Req 9.5)
- Recusa de ticket cria mensagem `system` com motivo no chat (Req 10.6)
- Upload de avatar com tipo MIME inválido é descartado (Req 6.4, 6.5)
- Parâmetros `?tab=pets&add=1&returnTo=<rota>` abrem aba correta (Req 6.10)
- Badge count de aprovações pendentes atualiza após aprovação (Req 10.7)
- Toast tem auto-dismiss após 5 segundos (Req 15.6)

### 8.5 Testes de Acessibilidade

- Verificar presença de `aria-label` em botões sem texto visível (Req 16.2)
- Verificar associação `htmlFor`/`id` em todos os formulários (Req 16.5)
- Navegação por teclado em formulários de registro, login e criação de ticket (Req 16.4)

### 8.6 Design de Segurança

#### Hash de Senha

A biblioteca `bcryptjs` (já presente no projeto) é usada com salt rounds = 12:

```typescript
// src/lib/passwordHash.ts
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

> **Nota:** O `simpleHash` existente no `AuthContext` deve ser substituído por `hashPassword`/`verifyPassword` do bcryptjs. O hash baseado em XOR/bit-shift atual não oferece resistência a brute-force (Req 1.7).

#### XSS Prevention

```typescript
// src/lib/encodeHTML.ts
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
};

export function encodeHTML(str: string): string {
  return str.replace(/[&<>"']/g, (char) => HTML_ENTITIES[char] ?? char);
}
```

Aplicada em:
- Todos os campos de texto provenientes do localStorage antes de renderizar no DOM
- Mensagens de chat (persistir já encodado + decodificar nunca — exibir como texto)
- Campos do perfil de clínica na página de detalhes
- Motivo de recusa de ticket

#### Validação de Arquivos (magic bytes)

```typescript
// src/lib/validateFile.ts

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
const ALLOWED_PET_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const ALLOWED_REFERRAL_TYPES = ['application/pdf', 'image/jpeg', 'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] as const;

const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF + verificar offset 8 "WEBP"
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
};

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export async function validateFile(
  file: File,
  allowedTypes: readonly string[],
  maxSizeBytes: number
): Promise<FileValidationResult> {
  if (file.size > maxSizeBytes) {
    return { valid: false, error: `Arquivo muito grande. Máximo: ${maxSizeBytes / 1024 / 1024}MB` };
  }

  if (!allowedTypes.includes(file.type as any)) {
    return { valid: false, error: 'Tipo de arquivo não permitido' };
  }

  // Verificação de magic bytes
  const buffer = await file.slice(0, 8).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const signatures = MAGIC_BYTES[file.type];
  if (signatures) {
    const valid = signatures.some(sig => sig.every((byte, i) => bytes[i] === byte));
    if (!valid) {
      return { valid: false, error: 'Conteúdo do arquivo não corresponde ao tipo declarado' };
    }
  }

  return { valid: true };
}
```

#### Plan Gating

```typescript
// src/lib/planGate.ts
// src/constants/plans.ts

export const PLAN_HIERARCHY: PlanType[] = ['free', 'basic', 'intermediary', 'experience'];

export const PLAN_FEATURES: Record<string, PlanType> = {
  'clinic_search_visibility': 'free',
  'basic_dashboard': 'free',
  'ticket_management': 'basic',
  'chat': 'basic',
  'emergency_badge': 'basic',
  'calendar_view': 'intermediary',
  'patients_list': 'intermediary',
  'advanced_analytics': 'experience',
  'priority_listing': 'experience',
  'custom_branding': 'experience',
};

export function hasFeatureAccess(userPlan: PlanType, feature: string): boolean {
  const requiredPlan = PLAN_FEATURES[feature];
  if (!requiredPlan) return false;
  return PLAN_HIERARCHY.indexOf(userPlan) >= PLAN_HIERARCHY.indexOf(requiredPlan);
}

// Componente de guarda de plano
export function PlanGate({ 
  feature, 
  children, 
  fallback 
}: { 
  feature: string; 
  children: React.ReactNode; 
  fallback?: React.ReactNode 
}) {
  const { user } = useAuth();
  const plan = (user as ClinicProfile)?.plan ?? 'free';
  if (hasFeatureAccess(plan, feature)) return <>{children}</>;
  return fallback ? <>{fallback}</> : <UpgradePrompt feature={feature} />;
}
```

### 8.7 Performance e Cache

- **TanStack Query** gerencia cache de dados "remotos" simulados (leitura do localStorage via query functions)
- `staleTime: 30_000` (30s) para dados de clínicas na busca
- `gcTime: 5 * 60_000` (5min) para histórico de chat
- Invalidação de cache após mutações (criação de ticket, aprovação)
- Skeletons exibidos durante `isLoading` em todas as queries (Req 15.5)

```typescript
// Exemplo de query para tickets do usuário autenticado
const { data: tickets, isLoading } = useQuery({
  queryKey: ['tickets', user?.id],
  queryFn: () => storage.getTickets().filter(t => t.userId === user!.id),
  enabled: !!user,
  staleTime: 30_000,
});
```

### 8.8 Responsividade

- Breakpoints: `sm: 320px`, `md: 768px`, `lg: 1280px`
- Hook `use-mobile` detecta viewports < 768px para adaptar layouts
- Componentes shadcn/ui são responsivos por padrão via Tailwind
- Testar em 320px, 375px, 768px, 1024px e 1280px
