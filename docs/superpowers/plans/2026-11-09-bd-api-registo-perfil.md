# BD + API de registo, perfil e veículos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar o modelo de dados completo da fase até dezembro no Supabase e a API Node.js com os endpoints de perfil (`/me`) e veículos (`/me/vehicles`).

**Architecture:** Monorepo com npm workspaces. `apps/api` é uma API Express em TypeScript com módulos `routes → schemas (Zod) → service → repository (Drizzle)`. O schema Drizzle é a fonte de verdade; as migrações SQL ficam em `db/migrations/` e são aplicadas ao Supabase pelo conector. Os testes correm contra PGlite em memória com as mesmas migrações.

**Tech Stack:** Node.js ≥ 20, TypeScript, Express 4, Drizzle ORM + drizzle-kit, Zod, jose (JWT), @supabase/supabase-js (admin, só servidor), Vitest, Supertest, @electric-sql/pglite + @electric-sql/pglite-postgis.

**Spec:** `docs/superpowers/specs/2026-11-09-base-dados-registo-perfil-design.md`

## Global Constraints

- Nomes de tabelas/colunas em inglês (snake_case); JSON da API em camelCase; mensagens de erro em português.
- Formato de erro único: `{ "error": { "code", "message", "details"? } }`; HTTP 400/401/403/404/409/500; 500 sem detalhes técnicos.
- Todas as rotas exceto `GET /health` exigem `Authorization: Bearer <JWT>`.
- Todas as tabelas de `public` com RLS ativo e **sem políticas**.
- Migrações aplicadas só ao Supabase pelo conector, por ordem; nunca `drizzle-kit push`/`migrate` contra a base remota.
- `service_fee_percent` inicial = `10` em `platform_settings`.
- Testes em `apps/api/test/`; nunca contra a base real; excluídos da entrega final.
- Commits com as linhas de atribuição da sessão.

## Review Focus

1. Matrícula introduzida com espaços/minúsculas/sem hífenes (`aa 12 bb`, `AA12BB`) → normalizada para `AA-12-BB` e aceite; formatos inválidos → 400 (Task 6).
2. Utilizador A tenta ler/editar/apagar o veículo do utilizador B pelo id → 404, sem revelar existência (Task 6).
3. `PATCH /me` com `isDriver:false` e `isHost:false` (ou desligar o único perfil ativo) → 400 (Task 5).
4. Pedidos repetidos/concorrentes: `POST /me` duas vezes → 409 `PROFILE_EXISTS`; marcar dois veículos predefinidos → só um fica (Tasks 5 e 6).
5. JWT expirado, malformado ou de outro emissor → 401 `UNAUTHORIZED`, nunca 500 (Task 4).

---

## File Structure

```
package.json                     → npm workspaces ["apps/*"]
.gitignore
db/migrations/                   → 0000_extensions.sql, 0001_<drizzle>.sql, 0002_constraints_rls.sql, meta/ (drizzle-kit)
apps/api/
  package.json, tsconfig.json, vitest.config.ts, drizzle.config.ts, .env.example
  src/config.ts                  → env validada com Zod
  src/app.ts                     → createApp(deps)
  src/server.ts                  → arranque com dependências reais
  src/db/schema.ts               → schema Drizzle (todas as tabelas)
  src/db/client.ts               → createDb(databaseUrl) (node-postgres)
  src/db/types.ts                → type Db
  src/lib/errors.ts              → AppError + helpers
  src/middleware/requireAuth.ts
  src/middleware/errorHandler.ts
  src/auth/verifier.ts           → AuthVerifier (JWKS Supabase)
  src/auth/admin.ts              → AuthAdmin (Supabase admin deleteUser)
  src/modules/me/{routes,schemas,service,repository}.ts
  src/modules/vehicles/{routes,schemas,service,repository,plate}.ts
  test/helpers/testDb.ts         → createTestDb() com PGlite + migrações
  test/helpers/testApp.ts        → createTestApp() + tokenFor(userId)
  test/*.test.ts
README.md                        → como instalar, testar, correr
```

---

### Task 1: Monorepo e esqueleto da API

**Files:**
- Create: `package.json`, `.gitignore`, `apps/api/package.json`, `apps/api/tsconfig.json`, `apps/api/vitest.config.ts`, `apps/api/.env.example`, `apps/api/src/config.ts`, `apps/api/src/app.ts`, `apps/api/src/server.ts`
- Test: `apps/api/test/health.test.ts`

**Interfaces:**
- Produces: `createApp(deps: AppDeps): express.Express` em `src/app.ts`; `AppDeps = { db: Db; auth: AuthVerifier; authAdmin: AuthAdmin }` (tipos definidos nas Tasks 2 e 4; nesta task `AppDeps` pode ser declarado com esses nomes como `unknown` e afinado depois). `loadConfig(env = process.env): Config` com `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PORT` (default 3000).
- Scripts em `apps/api/package.json`: `dev` (tsx watch), `build` (tsc), `start`, `test` (vitest run), `db:generate` (drizzle-kit generate).

- [ ] **Step 1:** Escrever `test/health.test.ts`: `GET /health` responde 200 com `{ status: "ok" }`.
- [ ] **Step 2:** `npm test -w apps/api` → FAIL (createApp não existe).
- [ ] **Step 3:** Implementar `createApp` com `express.json()` e `GET /health`; `loadConfig` com Zod (lança erro legível se faltar variável); `server.ts` faz listen em `PORT`. `.gitignore` inclui `node_modules`, `dist`, `.env`.
- [ ] **Step 4:** `npm test -w apps/api` → PASS.
- [ ] **Step 5:** Commit `chore: monorepo e esqueleto da API`.

### Task 2: Schema Drizzle, migrações e base de testes PGlite

**Files:**
- Create: `apps/api/src/db/schema.ts`, `apps/api/src/db/types.ts`, `apps/api/src/db/client.ts`, `apps/api/drizzle.config.ts`, `db/migrations/0000_extensions.sql`, `db/migrations/0001_*.sql` (gerado), `db/migrations/0002_constraints_rls.sql`, `apps/api/test/helpers/testDb.ts`
- Test: `apps/api/test/schema.test.ts`

**Interfaces:**
- Produces: tabelas Drizzle exportadas `profiles`, `vehicles`, `spaces`, `spacePhotos`, `spaceAvailability`, `spaceBlocks`, `bookings`, `platformSettings`; enums `plugType` (`type2|schuko|ccs`), `spaceType` (`closed_garage|covered|outdoor`), `spaceStatus` (`active|inactive`), `bookingStatus` (`confirmed|cancelled_by_driver|cancelled_by_host|completed`). `type Db = PgDatabase<any, typeof schema>`. `createDb(url: string): Db`. `createTestDb(): Promise<{ db: Db; pg: PGlite }>`.

Colunas, tipos e checks exatamente como na secção 3 da spec (incluindo `spaces.access_code`, `bookings.service_fee_percent`, `platform_settings`). Checks declarados no Drizzle com `check()`: `profiles (is_driver or is_host)`, preços > 0, `ends_at > starts_at`. Índice único parcial `vehicles(user_id) where is_default`. Índice GIST em `spaces.location`.

- `0000_extensions.sql` (custom, `drizzle-kit generate --custom --name=extensions`): `create extension if not exists postgis; create extension if not exists btree_gist;`
- `0001` gerado por `npm run db:generate`.
- `0002_constraints_rls.sql` (custom): FK `profiles.id → auth.users(id) on delete cascade`; exclusion constraint das reservas (`exclude using gist (space_id with =, tstzrange(starts_at, ends_at) with &&) where (status = 'confirmed')`); `alter table … enable row level security` para as 8 tabelas; `insert into platform_settings(key, value) values ('service_fee_percent', 10)`.
- `drizzle.config.ts`: `schema: './src/db/schema.ts'`, `out: '../../db/migrations'`, `dialect: 'postgresql'`.
- `createTestDb`: cria PGlite com extensões `postgis` e `btree_gist`, executa `create schema auth; create table auth.users (id uuid primary key);` e depois todos os `db/migrations/*.sql` por ordem alfabética; devolve drizzle (`drizzle-orm/pglite`) com o schema.

- [ ] **Step 1:** Escrever `schema.test.ts`:
  - `platform_settings` tem `service_fee_percent = 10`;
  - inserir perfil com `is_driver=false, is_host=false` falha;
  - inserir duas reservas `confirmed` sobrepostas no mesmo espaço falha; a segunda com `status='cancelled_by_driver'` é aceite;
  - dois veículos `is_default=true` do mesmo utilizador falha;
  - matrícula duplicada falha;
  - todas as tabelas de `public` têm `relrowsecurity = true` (query a `pg_class`).
- [ ] **Step 2:** `npm test -w apps/api -- schema` → FAIL.
- [ ] **Step 3:** Implementar schema, config do drizzle-kit, gerar migrações, escrever as duas custom e `testDb.ts`.
- [ ] **Step 4:** `npm test -w apps/api -- schema` → PASS.
- [ ] **Step 5:** Commit `feat(db): schema completo e migrações`.

### Task 3: Projeto Supabase e aplicação das migrações

**Files:** nenhum código; atualizar `apps/api/.env.example` só se surgirem variáveis novas.

- [ ] **Step 1:** Criar o projeto `karga` na organização KARGA (`aautohiaqanfhiznmgfs`), região `eu-west-3`, via conector (confirmar custo $0 com o Pedro se o conector pedir).
- [ ] **Step 2:** Aplicar `0000`, `0001`, `0002` por ordem com `apply_migration` (nomes `extensions`, `schema`, `constraints_rls`).
- [ ] **Step 3:** Verificar: `list_tables` mostra as 8 tabelas; `select value from platform_settings` → 10; `get_advisors(security)` sem avisos de RLS em falta (o aviso "RLS enabled, no policy" é esperado e intencional — registar no README).
- [ ] **Step 4:** Pedir ao Pedro para desativar "Confirm email" em Authentication → Providers → Email no dashboard (o conector não altera esta definição) e para copiar `DATABASE_URL` (connection string do pooler, modo session) e a service role key para o seu `.env`.
- [ ] **Step 5:** Commit não aplicável (registar o id do projeto no README na Task 7).

### Task 4: Erros, verificação de JWT e middleware de autenticação

**Files:**
- Create: `src/lib/errors.ts`, `src/middleware/errorHandler.ts`, `src/middleware/requireAuth.ts`, `src/auth/verifier.ts`, `src/auth/admin.ts`, `test/helpers/testApp.ts`
- Test: `test/auth.test.ts`

**Interfaces:**
- Produces:
  - `class AppError extends Error { constructor(status: number, code: string, message: string, details?: { field: string; message: string }[]) }`
  - `interface AuthVerifier { verify(token: string): Promise<{ userId: string }> }` — lança `AppError(401,'UNAUTHORIZED','Sessão inválida ou expirada')`.
  - `createSupabaseVerifier(supabaseUrl: string): AuthVerifier` — `jose.createRemoteJWKSet(new URL(supabaseUrl + '/auth/v1/.well-known/jwks.json'))`, `jwtVerify` com `issuer: supabaseUrl + '/auth/v1'`, `audience: 'authenticated'`; `userId = payload.sub`.
  - `createHs256Verifier(secret: string, issuer: string): AuthVerifier` (testes).
  - `interface AuthAdmin { deleteUser(userId: string): Promise<void> }`; `createSupabaseAuthAdmin(url, serviceRoleKey): AuthAdmin` via `supabase.auth.admin.deleteUser`.
  - `requireAuth(verifier): RequestHandler` → define `req.userId: string` (augmentar `Express.Request`).
  - `errorHandler`: `ZodError → 400 VALIDATION_ERROR` com `details` por campo; `AppError → status/code`; resto → 500 `INTERNAL_ERROR` "Ocorreu um erro inesperado." (log com `console.error`).
  - `createTestApp(): Promise<{ app; db; pg; tokenFor(userId: string, opts?: { expiresIn?: string }): Promise<string>; authAdmin: FakeAuthAdmin }>` — usa `createTestDb`, `createHs256Verifier('test-secret','test-issuer')` e um `FakeAuthAdmin` que apaga de `auth.users`. `tokenFor` também insere o `userId` em `auth.users` se não existir.

- [ ] **Step 1:** Escrever `auth.test.ts` com uma mini app Express criada no próprio teste (`requireAuth(verifier)` + rota `GET /whoami` → `{ userId }` + uma rota que lança `new Error('boom')` + `errorHandler`), sem tocar em `createApp`: sem header → 401 `UNAUTHORIZED`; `Bearer lixo` → 401; token expirado → 401; token de outro issuer → 401; token válido → 200 com o `userId`; erro não tratado numa rota → 500 com `INTERNAL_ERROR` e sem stack na resposta.
- [ ] **Step 2:** Correr → FAIL.
- [ ] **Step 3:** Implementar os ficheiros acima; `createApp` monta `requireAuth(deps.auth)` em todas as rotas exceto `/health` e o `errorHandler` no fim.
- [ ] **Step 4:** Correr → PASS.
- [ ] **Step 5:** Commit `feat(api): autenticação JWT e tratamento de erros`.

### Task 5: Perfil — `GET/POST/PATCH /me`

**Files:**
- Create: `src/modules/me/{routes,schemas,service,repository}.ts`
- Test: `test/me.test.ts`

**Interfaces:**
- Consumes: `Db`, `profiles`, `vehicles`, `AppError`, `requireAuth`.
- Produces:
  - `ProfileDto = { id: string; fullName: string; phone: string | null; isDriver: boolean; isHost: boolean; termsAcceptedAt: string; vehicles: VehicleDto[] }`
  - `VehicleDto = { id: string; makeModel: string; plate: string; plugType: 'type2'|'schuko'|'ccs'; isDefault: boolean }` (exportado de `modules/vehicles/schemas.ts`, usado aqui).
  - `meService(db).get(userId) / create(userId, input) / update(userId, input)`.
- Validação (Zod): `fullName` trim, 2–100; `phone` opcional, sem espaços, `^\+[1-9]\d{7,14}$`; `isDriver`, `isHost` boolean; `acceptTerms` literal `true` no POST. Mensagens em português.

- [ ] **Step 1:** Escrever `me.test.ts`:
  - `GET /me` sem perfil → 404 `PROFILE_NOT_FOUND`;
  - `POST /me` válido → 201 com `ProfileDto` (`vehicles: []`, `termsAcceptedAt` preenchido); depois `GET /me` → 200 igual;
  - `POST /me` segunda vez → 409 `PROFILE_EXISTS`;
  - `POST /me` com `acceptTerms:false` → 400 com detalhe no campo `acceptTerms`;
  - `POST /me` com `isDriver:false,isHost:false` → 400;
  - `phone: "+351 912 345 678"` é guardado como `+351912345678`; `phone: "912"` → 400;
  - `PATCH /me {fullName}` → 200 atualizado; `PATCH /me {isDriver:false}` num perfil só condutor → 400; `PATCH /me` sem perfil → 404.
- [ ] **Step 2:** Correr → FAIL.
- [ ] **Step 3:** Implementar. `create` faz insert e traduz violação de PK em `AppError(409,'PROFILE_EXISTS','Já existe um perfil para esta conta')`. `update` lê o perfil, aplica as alterações, rejeita se ambos os perfis ficarem falsos.
- [ ] **Step 4:** Correr → PASS.
- [ ] **Step 5:** Commit `feat(api): perfil do utilizador`.

### Task 6: Veículos — `/me/vehicles`

**Files:**
- Create: `src/modules/vehicles/{routes,schemas,service,repository,plate}.ts`
- Test: `test/plate.test.ts`, `test/vehicles.test.ts`

**Interfaces:**
- Consumes: `Db`, `vehicles`, `profiles`, `VehicleDto`.
- Produces: `normalizePlate(input: string): string | null` em `plate.ts` — remove espaços e hífenes, maiúsculas; aceita 6 caracteres nos padrões `LLDDDD`, `DDDDLL`, `DDLLDD`, `LLDDLL` (L = letra A–Z, D = dígito); devolve com hífenes de 2 em 2 (`AA-12-BB`); caso contrário `null`.
- Endpoints: `GET /me/vehicles` → `VehicleDto[]` (predefinido primeiro, depois mais recentes); `POST` → 201 (o primeiro veículo do utilizador fica `isDefault: true`); `PATCH /me/vehicles/:id` (`makeModel`, `plate`, `plugType`, `isDefault: true`) → 200; `DELETE` → 204 (se era o predefinido, o mais recente restante passa a predefinido). Todos exigem perfil (404 `PROFILE_NOT_FOUND` se não houver).
- Validação: `makeModel` trim 2–60; `plate` via `normalizePlate` (null → 400 "Matrícula inválida"); `plugType` enum.

- [ ] **Step 1:** Escrever `plate.test.ts`: `"aa 12 bb"→"AA-12-BB"`, `"12AB34"→"12-AB-34"`, `"12-34-ab"→"12-34-AB"`, `"AB-12-34"→"AB-12-34"`, `"ABC123"→null`, `""→null`.
- [ ] **Step 2:** Escrever `vehicles.test.ts`:
  - primeiro `POST` → 201 `isDefault:true`; segundo → `isDefault:false`;
  - matrícula `12ab34` gravada como `12-AB-34`; mesma matrícula por outro utilizador → 409 `PLATE_TAKEN`;
  - `PATCH {isDefault:true}` no segundo → só esse fica predefinido (verificar via `GET`);
  - `DELETE` do predefinido → o restante passa a predefinido;
  - utilizador B faz `GET/PATCH/DELETE` ao veículo de A → 404 `VEHICLE_NOT_FOUND`;
  - `:id` que não é uuid → 404 `VEHICLE_NOT_FOUND`;
  - `plugType:"tesla"` → 400.
- [ ] **Step 3:** Correr → FAIL.
- [ ] **Step 4:** Implementar. Troca de predefinido numa transação (desmarcar todos, marcar um). Violação de unique em `plate` → 409 `PLATE_TAKEN` "Esta matrícula já está registada". Ligar `vehiclesRepository.listByUser` ao `GET /me` da Task 5.
- [ ] **Step 5:** Correr todos os testes → PASS.
- [ ] **Step 6:** Commit `feat(api): veículos do utilizador`.

### Task 7: Apagar conta (`DELETE /me`), README e arranque real

**Files:**
- Modify: `src/modules/me/{routes,service}.ts`, `src/server.ts`
- Create: `README.md`
- Test: `test/me.delete.test.ts`

**Interfaces:**
- Consumes: `AuthAdmin`, `createSupabaseVerifier`, `createSupabaseAuthAdmin`, `createDb`, `loadConfig`.

- [ ] **Step 1:** Escrever `me.delete.test.ts`: utilizador com perfil e 2 veículos → `DELETE /me` → 204; `FakeAuthAdmin.deleteUser` chamado com o `userId`; perfil e veículos deixam de existir; `DELETE /me` sem perfil → 404.
- [ ] **Step 2:** Correr → FAIL.
- [ ] **Step 3:** Implementar `DELETE /me` (verifica perfil, chama `authAdmin.deleteUser`; o cascade apaga perfil e veículos). `server.ts` liga `createDb(DATABASE_URL)`, `createSupabaseVerifier(SUPABASE_URL)`, `createSupabaseAuthAdmin(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)`.
- [ ] **Step 4:** Correr todos os testes → PASS; `npm run build -w apps/api` sem erros.
- [ ] **Step 5:** Escrever `README.md`: requisitos (Node ≥ 20), `npm install`, `cp apps/api/.env.example apps/api/.env` e preencher, `npm test -w apps/api`, `npm run dev -w apps/api`, como gerar uma migração nova (`npm run db:generate -w apps/api`, aplicada depois ao Supabase pelo conector), id do projeto Supabase, nota sobre RLS sem políticas, e que a pasta `apps/api/test/` é excluída da entrega final.
- [ ] **Step 6:** Teste manual contra o Supabase real, feito pelo Pedro no PC (o ambiente do Claude não tem as credenciais): `npm run dev -w apps/api`, criar um utilizador no dashboard (Authentication → Add user), obter um token com `supabase.auth.signInWithPassword`, `GET /me` → 404, `POST /me` → 201. O Claude confirma pelo conector (`select * from profiles`) que o perfil foi gravado.
- [ ] **Step 7:** Commit `feat(api): apagar conta e documentação`.
