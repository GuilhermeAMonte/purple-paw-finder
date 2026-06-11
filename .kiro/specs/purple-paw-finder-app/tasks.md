# Tasks — Purple Paw Finder (Paw Connect)

## Visão Geral

Tarefas de implementação derivadas do `design.md`. A ordem respeita dependências: infraestrutura antes de funcionalidades, funcionalidades compartilhadas antes das específicas por perfil.

Cada tarefa referencia os requisitos que implementa (`Req X`) e os critérios de aceitação (`§X.Y`).

---

## Fase 1 — Infraestrutura e Fundação

### Task 1: Configurar ambiente de testes

- [ ] Instalar dependências: `vitest`, `@testing-library/react`, `@testing-library/user-event`, `fast-check`, `jsdom`
- [ ] Configurar `vitest.config.ts` com `environment: 'jsdom'` e `setupFiles`
- [ ] Criar `src/test/setup.ts` com mock de `localStorage` e limpeza entre testes
- [ ] Adicionar scripts `test` e `test:coverage` ao `package.json`
- [ ] Verificar que `npm test` executa sem erros

**Referências:** §8.2

---

### Task 2: Criar camada de acesso ao localStorage (`src/lib/storage.ts`)

- [ ] Implementar função `safeGet<T>(key, fallback)` com try/catch e prefixo `paw_`
- [ ] Implementar função `safeSet(key, value)` com tratamento de `QuotaExceededError`
- [ ] Implementar todos os métodos do objeto `storage` conforme §5.2
- [ ] Garantir que `paw_user` nunca inclua `passwordHash`
- [ ] Implementar `removePetData(petId)` que remove `paw_pets` entry e `paw_photo_{petId}`
- [ ] Escrever testes unitários para `safeGet` com dados corrompidos e `safeSet` com quota excedida

**Referências:** §5.1, §5.2, §5.3, Req 6.8

---

### Task 3: Implementar utilitários de segurança

#### 3a: `src/lib/passwordHash.ts`
- [ ] Implementar `hashPassword(password)` com bcryptjs, `saltRounds = 12`
- [ ] Implementar `verifyPassword(password, hash)` com bcrypt.compare
- [ ] Remover `simpleHash` do `AuthContext`
- [ ] Escrever teste de propriedade (Property 2)

#### 3b: `src/lib/encodeHTML.ts`
- [ ] Implementar `encodeHTML(str)` com mapeamento `& < > " '`
- [ ] Escrever teste de propriedade (Property 5)

#### 3c: `src/lib/validateFile.ts`
- [ ] Implementar `validateFile(file, allowedTypes, maxSizeBytes)` com verificação de magic bytes
- [ ] Definir `ALLOWED_IMAGE_TYPES`, `ALLOWED_PET_PHOTO_TYPES`, `ALLOWED_REFERRAL_TYPES`
- [ ] Escrever teste de propriedade (Property 12)

#### 3d: `src/lib/cnpj.ts`
- [ ] Implementar `validateCNPJ(cnpj)` com cálculo de dígitos verificadores
- [ ] Escrever teste de propriedade (Property 15)

**Referências:** §8.6, Req 1.7, 4.6, 6.4, 9.6, 11.1, 13.4, 13.7

---

### Task 4: Criar tipos TypeScript centralizados (`src/types/index.ts`)

- [ ] Definir todos os tipos e interfaces conforme §4.1: `UserType`, `PlanType`, `SpeciesType`, `ApprovalStatus`, `TicketStatus`, `MessageSenderType`, `MessageType`
- [ ] Definir interfaces: `User`, `ClientProfile`, `ClinicProfile`, `ClinicAddress`, `WeekSchedule`, `DaySchedule`, `Pet`, `Ticket`, `ChatMessage`, `SessionMeta`, `LoginAttempts`, `Report`, `Block`, `Coordinates`, `SearchQuery`, `SearchResult`

**Referências:** §4.1

---

### Task 5: Criar schemas Zod (`src/schemas/`)

- [ ] `auth.schemas.ts`: `registerSchema` (com `superRefine` para plano de clínica + confirmação de senha), `loginSchema`
- [ ] `profile.schemas.ts`: `clientProfileSchema`, `petSchema`
- [ ] `clinic.schemas.ts`: `clinicSetupSchema` (com `validateCNPJ`), `clinicVisualSetupSchema`
- [ ] `ticket.schemas.ts`: `createTicketSchema` (com `superRefine` para encaminhamento obrigatório)
- [ ] `chat.schemas.ts`: `messageSchema`, `emergencyFirstMessageSchema`
- [ ] `search.schemas.ts`: `searchSchema` com regex de caracteres imprimíveis
- [ ] Escrever teste de propriedade (Property 1) para `registerSchema`

**Referências:** §4.2, Req 1.1, 1.9, 7.1, 7.5, 9.3–9.5, 13.1–13.3

---

### Task 6: Criar constantes e allowlists (`src/constants/`)

- [ ] `specialties.ts`: exportar `CLINIC_SPECIALTIES` como `readonly` tuple
- [ ] `services.ts`: exportar `CLINIC_SERVICES` como `readonly` tuple
- [ ] `plans.ts`: exportar `PLAN_HIERARCHY`, `PLAN_FEATURES`, `PlanType[]`
- [ ] `messages.ts`: manter templates de mensagens existentes

**Referências:** Req 3.8, 7.1, 12.3

---

### Task 7: Implementar `src/lib/planGate.ts`

- [ ] Implementar `hasFeatureAccess(userPlan, feature)` com `PLAN_HIERARCHY.indexOf`
- [ ] Implementar componente `PlanGate` com `useAuth`, `fallback` e `UpgradePrompt`
- [ ] Escrever teste de propriedade (Property 14)

**Referências:** §8.6 (Plan Gating), Req 12.3, 12.4

---

## Fase 2 — Autenticação e Sessão

### Task 8: Refatorar `AuthContext`

- [ ] Substituir `simpleHash` por `hashPassword`/`verifyPassword` do bcryptjs
- [ ] Implementar controle de brute-force: `login_attempts` por e-mail com janela de 5 min e bloqueio de 15 min
- [ ] Implementar expiração de sessão: verificação a cada 60s via `useEffect`, encerramento após 8h de inatividade
- [ ] Atualizar `lastActivity` em interações do usuário (eventos de mouse/teclado no nível do documento)
- [ ] Garantir que `paw_user` (sessão ativa) nunca contenha `passwordHash`
- [ ] Remover todos os `console.log` de produção; manter apenas `console.warn`/`console.error` sem dados sensíveis
- [ ] Escrever testes de propriedade (Property 3, Property 4, Property 6)

**Referências:** §3.2, Req 2.1–2.8, 1.7, 1.8, 13.5

---

### Task 9: Implementar guardas de rota (`src/components/guards/`)

- [ ] `PrivateRoute.tsx`: redireciona para `/login` se não autenticado
- [ ] `ClientRoute.tsx`: redireciona para `/` se autenticado mas não for cliente
- [ ] `ClinicRoute.tsx`: redireciona para `/` se autenticado mas não for clínica
- [ ] Atualizar `App.tsx` para usar os guardas em todas as rotas protegidas conforme §2.2
- [ ] Escrever testes de exemplo: rota protegida sem autenticação, rota de clínica acessada por cliente

**Referências:** §3.1, Req 2.4, 2.5, 10.1, 14.1–14.5

---

### Task 10: Páginas de autenticação

#### 10a: `Register.tsx` / `ClientRegister.tsx`
- [ ] Integrar `registerSchema` via React Hook Form + zodResolver
- [ ] Exibir seletor de plano condicional quando `userType === 'clinic'`
- [ ] Exibir campo de confirmação de senha e validar via schema
- [ ] Exibir erros inline por campo sem revelar detalhes internos
- [ ] Ao sucesso: chamar `register()` do `AuthContext` e redirecionar

#### 10b: `Login.tsx`
- [ ] Integrar `loginSchema` via React Hook Form
- [ ] Exibir mensagem genérica em caso de credenciais inválidas ou bloqueio
- [ ] Mostrar indicador de carregamento durante autenticação

**Referências:** Req 1.1–1.9, 2.1–2.3, 15.5

---

## Fase 3 — Funcionalidades do Cliente

### Task 11: Implementar `FavoritesContext`

- [ ] Inicializar com leitura segura do `localStorage` (try/catch, validação de array de strings)
- [ ] `toggleFavorite`: guard contra IDs inválidos (null, undefined, string vazia)
- [ ] Persistir em `paw_favorites` após cada toggle
- [ ] Atualizar ícone de coração em `ClinicCard` conforme `isFavorite`
- [ ] Escrever testes de propriedade (Property 8, Property 9, Property 10)

**Referências:** §3.3, Req 5.1–5.5

---

### Task 12: Busca de clínicas (`SearchSection`, `FeaturedClinics`)

- [ ] Implementar `searchSchema` no formulário de busca
- [ ] Implementar `getLocationSuggestions(clinics, query)` com normalização de acentos e limite de 10
- [ ] Implementar `searchClinics(clinics, query)` com filtro AND de localização + especialidade
- [ ] Substituir clínicas hardcoded por leitura de `paw_clinics` do localStorage
- [ ] Integrar `useGeolocation` e `LocationPermissionDialog` com tratamento de erro não-técnico
- [ ] Escrever testes de propriedade (Property 7, Property 11)

**Referências:** §3.6, Req 3.1–3.9, 15.1

---

### Task 13: Página de detalhes da clínica (`ClinicDetails.tsx`)

- [ ] Implementar `isClinicOpen(clinic, timestamp)` e exibir status com cor correta
- [ ] Exibir badge "24h" quando `is24Hours === true`
- [ ] Exibir botão "Emergência" condicionalmente
- [ ] Aplicar `encodeHTML` em todos os campos de texto antes de renderizar
- [ ] Exibir mensagem de erro não-técnica quando clínica não for encontrada (Req 4.5)
- [ ] Escrever teste de propriedade (Property 17)

**Referências:** §3.5, Req 4.1–4.6

---

### Task 14: Perfil do cliente (`Profile.tsx`)

- [ ] Implementar abas "Dados Pessoais" e "Meus Pets" acessíveis apenas para `userType === 'client'`
- [ ] Validação de e-mail com debounce de 300ms via `clientProfileSchema`
- [ ] Upload de avatar: `validateFile(file, ALLOWED_IMAGE_TYPES, 5MB)`
- [ ] Gerenciamento de pets: adicionar (`petSchema`), remover (`removePetData`)
- [ ] Aceitar parâmetros `?tab=pets&add=1&returnTo=<rota>` e redirecionar após cadastro
- [ ] Escrever teste de exemplo: upload de avatar com MIME inválido, parâmetros de URL

**Referências:** §3.x, Req 6.1–6.10

---

### Task 15: Criação de ticket (`CreateTicket.tsx`)

- [ ] Dropdown de pets do cliente com pré-preenchimento automático de campos
- [ ] Seletor de data: desabilitar datas anteriores a hoje
- [ ] Validar encaminhamento obrigatório para serviços especializados
- [ ] `validateFile` para arquivo de encaminhamento (PDF/JPG/PNG/DOC/DOCX, 10MB)
- [ ] Associar `userId` sempre do `AuthContext` (nunca do formulário)
- [ ] Toast de confirmação com título + data ao sucesso; preservar formulário em caso de falha
- [ ] Escrever teste de propriedade (Property 13)

**Referências:** §3.x, Req 7.1–7.11, 13.10

---

### Task 16: Acompanhamento de agendamentos (`MyAppointments.tsx`)

- [ ] Filtrar tickets por `userId === user.id` do AuthContext
- [ ] Exibir badge de status (`Pendente`, `Aprovado`, `Recusado`) por `approvalStatus`
- [ ] Exibir motivo de recusa e link para chat quando `rejected`
- [ ] Exibir skeleton/spinner durante carregamento
- [ ] Exibir mensagem de erro não-técnica com botão "Tentar novamente" em falha de leitura
- [ ] Usar TanStack Query com `queryKey: ['tickets', user?.id]` e `staleTime: 30_000`

**Referências:** §8.7, Req 8.1–8.7

---

### Task 17: Chat (`Chat.tsx`)

- [ ] Autorizar acesso: verificar que `ticketId` pertence ao usuário autenticado
- [ ] Carregar últimas 200 mensagens via `storage.getChatMessages(ticketId)`
- [ ] Validar mensagem via `messageSchema` (e `emergencyFirstMessageSchema` quando `emergency=true`)
- [ ] Aplicar `encodeHTML` em todas as mensagens antes de renderizar
- [ ] Alinhamento: cliente → direita, clínica → esquerda, system → centralizado
- [ ] Cabeçalho vermelho com "EMERGÊNCIA — Atendimento prioritário" quando `?emergency=true`
- [ ] Implementar "Denunciar" e "Bloquear" com diálogos de confirmação e persistência
- [ ] Desabilitar botão de envio quando campo estiver vazio ou limite excedido
- [ ] Exibir contador de caracteres acima de 900

**Referências:** §3.7, Req 9.1–9.12

---

## Fase 4 — Funcionalidades da Clínica

### Task 18: Onboarding — Setup da clínica (`ClinicSetup.tsx`)

- [ ] Integrar `clinicSetupSchema` (com validação de CNPJ)
- [ ] Pré-preencher campos com dados salvos no localStorage
- [ ] Pelo menos uma especialidade e um tipo de animal obrigatórios
- [ ] Toggle "Atendimento 24h" com persistência de `is24Hours`
- [ ] Ao sucesso: `updateUserProfile` + navegar para `/clinic-visual-setup`

**Referências:** §3.x, Req 11.1–11.8

---

### Task 19: Onboarding — Configuração visual (`ClinicVisualSetup.tsx`)

- [ ] Upload de logotipo e foto de capa com `validateFile` + pré-visualização
- [ ] Seletor de cor com validação de formato `#RRGGBB`
- [ ] Pré-preencher com dados salvos
- [ ] Ao sucesso: `updateUserProfile({ ..., isProfileComplete: true })` + navegar para `/clinic-dashboard`

**Referências:** §3.8, Req 17.1–17.7

---

### Task 20: Dashboard da clínica (`ClinicDashboard.tsx`)

- [ ] Restringir acesso via `ClinicRoute` (redirecionar se não for clínica)
- [ ] Seção "Aprovações Pendentes": listar tickets `pending` do clinicId autenticado com badge count
- [ ] Aprovação: atualizar `approvalStatus: 'approved'`, `status: 'confirmed'` em ≤ 100ms (otimista)
- [ ] Recusa: dialog com campo obrigatório (1–500 chars), atualizar status e criar mensagem `system` no chat
- [ ] Seção "Emergências": filtrar por `isEmergency === true` com estilo vermelho
- [ ] Seção "Calendário": react-day-picker com marcadores em dias com tickets `confirmed`
- [ ] Dialog de edição de perfil com validação de campos (Req 10.11)
- [ ] Integrar `PlanGate` para funcionalidades por plano

**Referências:** §3.9, Req 10.1–10.11, 12.3, 12.4

---

## Fase 5 — Header, Roteamento e Acessibilidade

### Task 21: Atualizar `Header.tsx`

- [ ] Renderização condicional por estado de autenticação (não autenticado / cliente / clínica)
- [ ] `aria-label` em botões de ícone (logout, menu)
- [ ] Links corretos conforme Req 14.6

**Referências:** §3.4, Req 14.6, 16.2

---

### Task 22: Acessibilidade

- [ ] Adicionar elementos semânticos (`<main>`, `<header>`, `<nav>`, `<section>`) nas páginas listadas em Req 16.1
- [ ] Associar `<label htmlFor>` a todos os campos de formulário
- [ ] Verificar navegação por teclado (Tab, Shift+Tab, Enter, Space) em formulários de cadastro, login e ticket
- [ ] Escrever testes de acessibilidade conforme §8.5

**Referências:** §8.5, Req 16.1–16.5

---

## Fase 6 — Qualidade e Testes Finais

### Task 23: Implementar testes de exemplo (§8.4)

- [ ] Registro com e-mail duplicado retorna mensagem genérica
- [ ] Login com credenciais corretas redireciona para home
- [ ] Logout remove sessão e redireciona
- [ ] Rota protegida sem autenticação redireciona para `/login`
- [ ] Toast de sucesso após criar ticket contém título e data
- [ ] Primeira mensagem emergencial > 120 chars bloqueia envio
- [ ] Recusa de ticket cria mensagem `system` no chat
- [ ] Badge count de aprovações pendentes atualiza após aprovação
- [ ] Toast tem auto-dismiss após 5 segundos

**Referências:** §8.4

---

### Task 24: Error Boundaries

- [ ] Criar `src/components/ErrorBoundary.tsx` com mensagem genérica e botão "Recarregar"
- [ ] Envolver `ClinicDashboard`, `Chat` e `Profile` com o Error Boundary

**Referências:** §7.3

---

### Task 25: Performance e responsividade

- [ ] Configurar `staleTime` e `gcTime` do TanStack Query conforme §8.7
- [ ] Adicionar skeletons em todas as queries com `isLoading`
- [ ] Verificar layout em 320px, 375px, 768px, 1024px e 1280px
- [ ] Configurar auto-dismiss de 5 segundos no Sonner/Toast

**Referências:** §8.7, §8.8, Req 15.1–15.6
