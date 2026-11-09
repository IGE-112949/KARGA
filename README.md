# KARGA

Plataforma P2P de aluguer de lugares de estacionamento com carregamento elétrico.

```
apps/api/      → API REST (Node.js + TypeScript + Express + Drizzle ORM + Zod)
apps/mobile/   → app React Native (Expo) — em breve
db/migrations/ → migrações SQL da base de dados (Supabase / PostgreSQL + PostGIS)
docs/          → especificações e planos
```

## Requisitos

- Node.js 20 ou superior (não é preciso Docker nem Postgres local).

## Instalar

```bash
npm install
cp apps/api/.env.example apps/api/.env   # e preencher (ver abaixo)
```

Variáveis em `apps/api/.env`:

| Variável | Onde encontrar |
|---|---|
| `DATABASE_URL` | Supabase › botão **Connect** › Session pooler (ou ORM › Drizzle), com a password da base de dados |
| `SUPABASE_URL` | `https://vfpgzvhfxezszjrajuyv.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings › API Keys › `service_role` (só no servidor, nunca na app) |
| `PORT` | opcional, por omissão 3000 |

## Testar

```bash
npm test -w apps/api
```

Os testes usam uma base de dados em memória (PGlite com PostGIS) criada com as mesmas migrações; nunca tocam no Supabase. A pasta `apps/api/test/` serve o desenvolvimento e é excluída da entrega final do código.

## Correr a API

```bash
npm run dev -w apps/api      # http://localhost:3000
```

Endpoints (todos exceto `/health` exigem `Authorization: Bearer <JWT da Supabase Auth>`):

| Método | Rota | |
|---|---|---|
| GET | `/health` | estado da API |
| GET / POST / PATCH / DELETE | `/me` | perfil do utilizador (DELETE apaga a conta — RGPD) |
| GET / POST | `/me/vehicles` | veículos |
| PATCH / DELETE | `/me/vehicles/:id` | editar / definir predefinido / remover |

Erros: `{ "error": { "code", "message", "details"? } }`.

## Testar contra o Supabase real (sem instalar nada: GitHub Codespaces)

1. No GitHub, em **Settings › Secrets and variables › Codespaces**, criar os secrets `DATABASE_URL`, `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (ficam como variáveis de ambiente no Codespace; não vão para o código).
2. Na página do repositório: **Code › Codespaces › Create codespace on feat/bd-api-perfil**. O `npm install` corre sozinho.
3. No terminal do Codespace: `npm run dev -w apps/api`.
4. Abrir um segundo terminal (+) e correr `SUPABASE_PUBLISHABLE_KEY=sb_publishable__voVNlvZIR9p0jRP3jIvkA_vk_KY98_ npm run smoke -w apps/api`.
   O script cria um utilizador de teste, chama `/me` e `/me/vehicles`, apaga a conta no fim e mostra ✅ ou ❌.

## Base de dados

- Projeto Supabase: `karga` (`vfpgzvhfxezszjrajuyv`, região eu-west-3 Paris).
- O schema está em `apps/api/src/db/schema.ts`. Para uma alteração: editar o schema, correr `npm run db:generate -w apps/api` (gera um novo ficheiro em `db/migrations/`) e aplicar esse ficheiro ao Supabase (pelo conector do Claude ou pelo SQL Editor). Nunca usar `drizzle-kit push`.
- Regras que o Drizzle não declara (extensões, constraint de exclusão das reservas, RLS) estão nas migrações manuais `0000_extensions.sql` e `0002_constraints_rls.sql`.
- Todas as tabelas têm RLS ativo **sem políticas**: só a API (ligação de servidor) acede aos dados. O aviso "RLS Enabled No Policy" do Supabase é esperado.
