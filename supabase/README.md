# Supabase — Backend do Paw Connect

Este diretório contém o schema e as configurações do backend gratuito (Supabase).

## O que o Supabase substitui

| Antes (localStorage) | Agora (Supabase, plano grátis) |
|---|---|
| `paw_users` + `simpleHash` | **Auth** — bcrypt, JWT, verificação de e-mail, reset de senha |
| `paw_login_attempts` | **Auth** — proteção de tentativas embutida |
| `paw_session_meta` | **Auth** — sessões e expiração de JWT |
| `paw_tickets`, `paw_pets`, etc. | Tabelas **PostgreSQL** com Row-Level Security |
| `paw_photo_*`, `paw_referral_*` | **Storage** com buckets e políticas |
| Chat simulado (`setTimeout`) | **Realtime** (websockets) |

## Estrutura

```
supabase/
├── migrations/
│   ├── 20260610000001_initial_schema.sql   # tabelas, enums, RLS, triggers
│   └── 20260610000002_storage_buckets.sql  # buckets de upload + políticas
└── README.md
```

## Como aplicar (2 caminhos)

### Caminho A — Painel web (mais simples, sem instalar nada)

1. Crie conta grátis em https://supabase.com e um novo projeto (escolha região **South America (São Paulo)** para menor latência).
2. Guarde a senha do banco que aparece na criação.
3. No painel do projeto, vá em **SQL Editor → New query**.
4. Cole o conteúdo de `migrations/20260610000001_initial_schema.sql`, clique **Run**.
5. Repita com `migrations/20260610000002_storage_buckets.sql`.
6. Em **Project Settings → API**, copie:
   - `Project URL`
   - `anon public` key
7. Crie um arquivo `.env.local` na raiz do projeto (veja `.env.example`).

### Caminho B — Supabase CLI (recomendado quando o time crescer)

```bash
npm install -g supabase
supabase login
supabase link --project-ref <seu-project-ref>
supabase db push        # aplica as migrações desta pasta
```

A vantagem do CLI: as migrações ficam versionadas no git e qualquer pessoa
recria o banco idêntico com um comando — importante para mostrar organização
a investidores e para futuros desenvolvedores.

## Configuração de Auth recomendada (painel)

Em **Authentication → Providers / Settings**:
- **Email** habilitado.
- Para o MVP/demo: pode **desativar "Confirm email"** para agilizar testes,
  e reativar antes de ir a público.
- Em **URL Configuration**, defina o Site URL (ex.: `http://localhost:5173`
  em dev e a URL da Vercel em produção).

## Próximos passos no código

1. `npm install @supabase/supabase-js`
2. Criar `src/lib/supabase.ts` (client tipado).
3. Substituir `src/lib/storage.ts` (localStorage) por funções que falam com o Supabase.
4. Refatorar o `AuthContext` para usar `supabase.auth`.

> **Segurança:** a chave `anon` é pública por design — quem protege os dados é
> a RLS, não a chave. **Nunca** exponha a chave `service_role` no frontend.
