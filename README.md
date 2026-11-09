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

## Base de dados

- Projeto Supabase: `karga` (`vfpgzvhfxezszjrajuyv`, região eu-west-3 Paris).
- O schema está em `apps/api/src/db/schema.ts`. Para uma alteração: editar o schema, correr `npm run db:generate -w apps/api` (gera um novo ficheiro em `db/migrations/`) e aplicar esse ficheiro ao Supabase (pelo conector do Claude ou pelo SQL Editor). Nunca usar `drizzle-kit push`.
- Regras que o Drizzle não declara (extensões, constraint de exclusão das reservas, RLS) estão nas migrações manuais `0000_extensions.sql` e `0002_constraints_rls.sql`.
- Todas as tabelas têm RLS ativo **sem políticas**: só a API (ligação de servidor) acede aos dados. O aviso "RLS Enabled No Policy" do Supabase é esperado.
