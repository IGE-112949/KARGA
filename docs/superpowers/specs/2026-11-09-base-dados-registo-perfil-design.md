# KARGA — Base de dados, registo e perfil (fase até dezembro)

**Data:** 2026-11-09
**Estado:** em revisão
**Âmbito:** modelo de dados do protótipo (≈30% — o que está no cronograma até dezembro) e a primeira fatia de implementação: registo, perfil de utilização e veículos.

## 1. Objetivo e contexto

A KARGA é uma plataforma P2P de aluguer de lugares de estacionamento com carregamento elétrico. Até dezembro o cronograma prevê: ecrãs de registo, login e perfil; mapa com pins e filtros; detalhe do anúncio, calendário e marcação; painel do condutor (histórico de reservas); painel do proprietário (anúncios e horários); base de dados, API REST (30%), CRUD de utilizadores/espaços e autenticação JWT; listagem de espaços por geolocalização.

Esta especificação define o **modelo de dados completo dessa fase** e detalha a implementação da **primeira fatia: registo e perfil**. Espaços, pesquisa e reservas terão especificações próprias, reutilizando o modelo aqui definido.

Decisões tomadas com o Pedro:

| Tema | Decisão |
|---|---|
| Âmbito do modelo | Tudo o que o cronograma prevê até dezembro; IoT, pagamentos e avaliações ficam para a fase seguinte |
| Confirmação de reservas | Imediata (como no mockup); o proprietário pode cancelar depois, com motivo |
| Disponibilidade | Horário semanal recorrente + bloqueios pontuais (padrão Airbnb) |
| Preço | Preço por hora obrigatório; €/kWh opcional, só aplicado quando houver tomada inteligente associada. Sem tomada, a energia está incluída no preço por hora |
| Autenticação | Email + password (Supabase Auth). Google pode ser ativado mais tarde sem mudar o modelo |
| Backend | API própria em Node.js com as regras de negócio em código. Supabase usado como PostgreSQL + PostGIS + Auth |
| Acesso a dados | Drizzle ORM |
| Critério geral | Quando existir um padrão claro nas apps conhecidas (Airbnb, Uber, Booking), segue-se esse padrão |

## 2. Arquitetura e organização do código

```
apps/api/      → Node.js + TypeScript + Express + Drizzle ORM + Zod
apps/mobile/   → React Native (Expo) + supabase-js (apenas autenticação)
apps/web/      → Next.js (fase posterior)
db/migrations/ → SQL gerado pelo drizzle-kit + migrações SQL manuais
docs/          → especificações e planos
```

- **Fonte de verdade da base de dados:** o schema Drizzle em `apps/api/src/db/schema.ts`. O `drizzle-kit generate` produz os ficheiros SQL em `db/migrations/`.
- **Migrações manuais** (o que o Drizzle não declara): extensões `postgis` e `btree_gist`, constraint de exclusão das reservas, ativação de RLS. Ficam na mesma pasta, numeradas na sequência.
- **Aplicação das migrações:** um único caminho — os ficheiros são aplicados por ordem ao projeto Supabase (via conector Supabase / Supabase CLI). Não se usa `drizzle-kit push` nem `drizzle-kit migrate` contra a base remota.
- **Autenticação:** a app regista e autentica-se com o SDK da Supabase Auth e envia o JWT em `Authorization: Bearer`. A API valida o token com as chaves públicas (JWKS) do projeto Supabase e obtém o `userId` (`sub`).
- **Acesso aos dados:** apenas pela API, com ligação direta ao Postgres (connection string de servidor em variável de ambiente) e transações onde necessário. Todas as tabelas de `public` têm RLS ativo **sem políticas**, pelo que a chave pública (anon) do Supabase não lhes acede.
- **Alojamento da API:** plano gratuito do Render ou Railway, a decidir quando houver uma versão para publicar.
- **Projeto Supabase:** a criar na organização "KARGA", região UE (`eu-west-3`, Paris, ou `eu-central-1`, Frankfurt), por proximidade e RGPD.

### Estrutura da API

Cada módulo segue `routes → schemas (Zod) → service (regras) → repository (Drizzle)`.

```
apps/api/src/
  app.ts                 → cria a app Express (sem listen; usado nos testes)
  server.ts              → arranque (listen)
  config.ts              → leitura e validação das variáveis de ambiente
  db/schema.ts           → schema Drizzle
  db/client.ts           → ligação (drizzle + node-postgres)
  middleware/requireAuth.ts
  middleware/errorHandler.ts
  lib/errors.ts          → AppError com code/status
  modules/me/            → perfil (routes, schemas, service, repository)
  modules/vehicles/      → veículos
```

## 3. Modelo de dados

Nomes de tabelas e colunas em inglês; textos da app em português. Todas as tabelas têm `id uuid` (exceto `profiles`, cujo id é o do utilizador da Auth), `created_at timestamptz default now()` e, quando editáveis, `updated_at`.

```
auth.users (Supabase)
   │ 1:1
profiles ──1:N── vehicles
   │
   ├─1:N── spaces ──1:N── space_photos
   │          ├──1:N── space_availability
   │          ├──1:N── space_blocks
   │          └──1:N── bookings
   └─1:N── bookings (como condutor)
```

### profiles
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid PK | = `auth.users.id`, FK com `on delete cascade` |
| full_name | text not null | 2–100 caracteres |
| phone | text null | formato E.164 (`+351…`) |
| avatar_url | text null | fase posterior |
| is_driver | boolean not null default false | |
| is_host | boolean not null default false | |
| terms_accepted_at | timestamptz not null | momento da aceitação dos termos/RGPD |

Regra: pelo menos um dos perfis ativo (`check (is_driver or is_host)`).

### vehicles
| Coluna | Tipo | Notas |
|---|---|---|
| user_id | uuid FK → profiles, cascade | |
| make_model | text not null | ex.: "Renault Zoe" |
| plate | text not null unique | normalizada em maiúsculas, formato `AA-00-AA` / `00-AA-00` / `00-00-AA` / `AA-00-00` |
| plug_type | enum `plug_type` (`type2`, `schuko`, `ccs`) | |
| is_default | boolean not null default false | no máximo um por utilizador (índice único parcial) |

### spaces
| Coluna | Tipo | Notas |
|---|---|---|
| owner_id | uuid FK → profiles | |
| title | text not null | |
| description | text null | |
| address | text not null | |
| spot_details | text null | piso / n.º do lugar |
| location | geometry(Point, 4326) not null | índice GIST |
| space_type | enum (`closed_garage`, `covered`, `outdoor`) | |
| power_kw | numeric(4,1) not null | > 0 |
| plug_type | enum `plug_type` | |
| access_instructions | text null | texto livre; só mostrado ao condutor com reserva confirmada |
| access_code | text null | código de acesso opcional (portão, cadeado), até 20 caracteres; só devolvido ao condutor com reserva confirmada, a partir de 30 min antes do início e até ao fim da reserva; nunca aparece em listagens nem na pesquisa |
| price_per_hour | numeric(6,2) not null | > 0 |
| energy_price_kwh | numeric(5,3) null | > 0 quando preenchido; só aplicado com tomada associada (fase seguinte: `smart_plug_id`) |
| status | enum (`active`, `inactive`) default `active` | |

### space_photos
`space_id` (FK cascade), `storage_path text` (Supabase Storage), `position smallint`.

### space_availability
`space_id` (FK cascade), `weekday smallint` (0 = segunda … 6 = domingo), `start_time time`, `end_time time`. Se `end_time <= start_time`, a janela atravessa a meia-noite (ex.: 19:00 → 08:00). Interpretada no fuso `Europe/Lisbon`.

### space_blocks
`space_id` (FK cascade), `starts_at timestamptz`, `ends_at timestamptz` (`ends_at > starts_at`), `reason text null`.

### bookings
| Coluna | Tipo | Notas |
|---|---|---|
| space_id | uuid FK → spaces | |
| driver_id | uuid FK → profiles | |
| vehicle_id | uuid FK → vehicles null | `on delete set null` |
| starts_at / ends_at | timestamptz | `ends_at > starts_at` |
| status | enum (`confirmed`, `cancelled_by_driver`, `cancelled_by_host`, `completed`) | |
| price_per_hour | numeric(6,2) | cópia do valor no momento da reserva |
| energy_price_kwh | numeric(5,3) null | idem |
| service_fee | numeric(5,2) | idem |
| estimated_total | numeric(8,2) | |
| cancelled_at | timestamptz null | |
| cancel_reason | text null | obrigatório quando cancelada pelo proprietário (validado na API) |

Constraint de exclusão (migração manual, requer `btree_gist`): não podem existir duas reservas `confirmed` no mesmo espaço com intervalos sobrepostos — `exclude using gist (space_id with =, tstzrange(starts_at, ends_at) with &&) where (status = 'confirmed')`.

### Fase seguinte (sem tabelas agora)
`smart_plugs`, `charging_sessions`, `payments`, `reviews`; campo `spaces.smart_plug_id`.

## 4. Registo, perfil e veículos (primeira fatia)

### Fluxo (segue o mockup: dados → perfil → veículo)
1. **Passo 1 — Dados:** a app chama `supabase.auth.signUp({ email, password })` e obtém sessão (JWT). Nome e telemóvel ficam guardados localmente até ao passo 2.
2. **Passo 2 — Perfil de utilização:** a app chama `POST /me` com `fullName`, `phone`, `isDriver`, `isHost`, `acceptTerms: true`. A API cria o perfil.
3. **Passo 3 — Veículo** (só se `isDriver`): `POST /me/vehicles`. "Saltar por agora" deixa o utilizador sem veículo.
4. **Arranque da app:** `GET /me`. Resposta `404 PROFILE_NOT_FOUND` → a app retoma o onboarding no passo 2.

Para o protótipo, a confirmação de email é desativada no projeto Supabase; volta a ser ativada antes de haver utilizadores reais.

### Endpoints
Todos exigem `Authorization: Bearer <JWT>`. Corpo e respostas em JSON, nomes em camelCase.

| Método | Rota | Descrição | Respostas |
|---|---|---|---|
| GET | `/me` | perfil + veículos | 200, 404 `PROFILE_NOT_FOUND` |
| POST | `/me` | cria o perfil | 201, 400, 409 `PROFILE_EXISTS` |
| PATCH | `/me` | edita `fullName`, `phone`, `isDriver`, `isHost` | 200, 400, 404 |
| DELETE | `/me` | apaga perfil, veículos e o utilizador na Auth (RGPD) | 204, 409 `HAS_ACTIVE_BOOKINGS` (fase das reservas) |
| GET | `/me/vehicles` | lista os veículos | 200 |
| POST | `/me/vehicles` | adiciona veículo; o primeiro fica predefinido | 201, 400, 409 `PLATE_TAKEN` |
| PATCH | `/me/vehicles/:id` | edita / define como predefinido | 200, 400, 404, 409 |
| DELETE | `/me/vehicles/:id` | remove; se era o predefinido, o mais recente passa a sê-lo | 204, 404 |

Regras de negócio (no service):
- `POST /me` exige `acceptTerms === true` e pelo menos um de `isDriver`/`isHost`; grava `terms_accepted_at = now()`.
- `PATCH /me` não permite ficar sem nenhum perfil ativo.
- Veículos: matrícula normalizada (maiúsculas, hífenes) e validada no formato português; um utilizador só acede aos seus veículos (404 caso contrário, para não revelar a existência); definir um predefinido desmarca os restantes na mesma transação.
- `DELETE /me` usa a Admin API da Supabase (service role, só no servidor) para apagar o utilizador da Auth; o `cascade` trata dos dados.

### Erros
Formato único:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Mensagem em português", "details": [ { "field": "plate", "message": "Matrícula inválida" } ] } }
```
Códigos HTTP: 400 validação, 401 sem token / token inválido, 403 sem permissão, 404 não encontrado, 409 conflito, 500 erro interno (sem detalhes técnicos na resposta; registado no log).

### Ecrãs da app (React Native / Expo)

Reproduzem os ecrãs do mockup (Claude Design "Karga APP — Protótipo"), reescritos em componentes React Native:
- **Tema** em `apps/mobile/src/theme.ts` com as cores, tipografia (Outfit), espaçamentos, raios e sombras do mockup; ícones SVG via `react-native-svg`.
- **Navegação** com `expo-router`.
- **Ecrãs desta fatia:** Boas-vindas; Login; Registo passo 1 (dados + termos/RGPD), passo 2 (Condutor / Proprietário / Ambos), passo 3 (veículo, com "Saltar por agora"); Perfil (dados, modo atual, troca de modo, lista de veículos com adicionar/editar/remover, terminar sessão, apagar conta).
- **Sessão** gerida pelo `supabase-js` (armazenamento seguro com `expo-secure-store`); um cliente HTTP da API junta o JWT a cada pedido e converte o formato de erro da API em mensagens no ecrã.
- Os botões Google/Apple aparecem desativados com "Em breve".

## 5. Testes

- **Vitest** para os services e **Supertest** para os endpoints, contra um Postgres local com PostGIS (Docker Compose em `apps/api/docker-compose.test.yml`), nunca contra a base de dados real.
- Desenvolvimento em TDD: teste primeiro, depois o código.
- O JWT é substituído nos testes por um token assinado com uma chave de teste (o middleware aceita a chave configurada por variável de ambiente).
- Os testes servem o desenvolvimento. Ficam no repositório na pasta `apps/api/test/` e são **excluídos da entrega final** do código (a entrega é feita sem essa pasta).

## 6. Fora de âmbito desta especificação

Ecrãs de espaços, mapa e reservas; endpoints de espaços, pesquisa e reservas; upload de fotografias e avatar; login com Google; tomada inteligente, pagamentos e avaliações; publicação da API. O modelo de dados já os prevê; os endpoints virão em especificações próprias.
