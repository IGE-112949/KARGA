# Painel do Anfitrião — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline, escolhido pelo Pedro). Steps use checkbox (`- [ ]`) syntax.

**Goal:** o proprietário cria, edita, esconde, elimina e gere fotos, horário e bloqueios dos seus espaços (API + app).

**Architecture:** módulo `spaces` na API (Express + Drizzle + Zod, mesmo padrão de `vehicles`), Storage `space-photos` atrás de uma interface `SpacePhotoStore` (fake nos testes). App Expo: separador Espaços com lista, assistente de 5 passos (formulários de passo reutilizados na edição) e Gerir espaço.

**Tech Stack:** como na fase anterior + `react-native-maps`, `expo-location`.

**Spec:** `docs/superpowers/specs/2026-11-09-espacos-anfitriao-design.md`

## Global Constraints

- Mensagens ao utilizador em português europeu; códigos de erro da tabela da spec.
- Limites: €/h 0,10–20; €/kWh null|0,05–1; Schuko 1,8–3,7 kW; Tipo 2 3,7–22 kW; 1–5 fotos (5 MB, JPEG/PNG/WebP); `title` 3–60, `address` 5–200, `spotDetails` ≤60, `accessInstructions` ≤500, `accessCode` ≤20.
- Horário: ≤1 janela por dia, `HH:MM`, `24:00` só como fim, `start = end` proibido, `end <= start` atravessa a meia-noite.
- Eliminar = `status = 'deleted'` + `deleted_at`; nunca apaga linhas.
- Testes só para desenvolvimento (fora da entrega). Sem versão web: no browser o mapa é `MapPicker.web.tsx` com "Mapa disponível na app".
- Instalar pacotes móveis com `EXPO_OFFLINE=1 npx expo install`.

## Review Focus

1. Publicação em que o Storage aceita 2 fotos e a 3.ª falha → nenhuma foto fica no Storage e nenhum espaço é criado.
2. Dois pedidos em paralelo a adicionar a 5.ª foto → nunca ficam 6 (lock `FOR UPDATE` no espaço).
3. Espaço de outro proprietário (ou eliminado) em qualquer rota `/:id` → 404, nunca 403 nem dados.
4. Horário com `24:00` como início ou `00:00–00:00` → recusado com mensagem clara.
5. Utilizador que desliga o GPS / recusa permissão a meio do passo 1 → o assistente continua com a morada escrita.

---

### Task 1: Migração da base de dados
**Files:** Modify `apps/api/src/db/schema.ts`; Create `db/migrations/0003_*.sql` (gerada) + `db/migrations/0004_spaces_rules.sql` (manual); Test `apps/api/test/spaces.schema.test.ts`.
- `space_status` += `deleted`; `spaces.deleted_at`; índice único `space_availability (space_id, weekday)`; `bookings.space_id` → `on delete restrict` (manual).
- Testes: inserir dois horários no mesmo dia falha; apagar espaço com reserva falha (restrict); `status='deleted'` aceite.

### Task 2: API — criar, listar, detalhe, editar, eliminar
**Files:** Create `apps/api/src/modules/spaces/{routes,schemas,service,repository,availability,dto}.ts`, `apps/api/src/storage/spacePhotoStore.ts`, `apps/api/src/lib/images.ts` (mover `detectImageType`); Modify `app.ts`, `server.ts`, `test/helpers/testApp.ts` (`FakeSpacePhotoStore` com `failOn?: number`); Test `apps/api/test/spaces.test.ts`, `availability.test.ts`.
- **Interfaces (Produces):** `SpacePhotoStore { upload(ownerId, spaceId, data, type): Promise<string /*path*/>; remove(paths: string[]): Promise<void>; publicUrl(path): string }`. `SpaceDto { id, title, address, spotDetails, latitude, longitude, spaceType, plugType, powerKw: number, pricePerHour: number, energyPriceKwh: number|null, accessInstructions, accessCode, status: 'active'|'inactive', photos: {id,url,isCover}[], availability: {weekday,startTime,endTime}[], blocks: {id,startsAt,endsAt,reason}[], createdAt }`. Lista devolve `SpaceSummaryDto` = DTO sem `accessCode`, `accessInstructions`, `blocks`, com `coverUrl`.
- Testes: `HOST_REQUIRED`; criação válida → 201 com fotos ordenadas; 0 fotos → `PHOTOS_REQUIRED`; 6 → `TOO_MANY_PHOTOS`; imagem falsa → `INVALID_IMAGE`; `ccs` recusado; limites de preço/potência; falha do Storage na 3.ª foto → nada criado e as 2 removidas; falha da BD → fotos removidas; espaço de outro → 404; PATCH status `inactive`; PATCH `status: 'deleted'` recusado; PUT availability (meia-noite, dia todo, repetido → 400, `24:00` início → 400); DELETE → 204, some da lista, GET → 404; DELETE com reserva confirmada futura → `SPACE_HAS_BOOKINGS`; com reserva passada → 204.

### Task 3: API — fotos e bloqueios
**Files:** Modify `apps/api/src/modules/spaces/*`; Test `apps/api/test/spaces.photos.test.ts`.
- Testes: adicionar foto (máx. 5 → `TOO_MANY_PHOTOS`); remover última → `LAST_PHOTO`; tornar capa reordena; remover foto apaga do Storage; bloqueios criar/listar/remover; `endsAt <= startsAt` → 400; 5.ª foto em paralelo nunca dá 6.

### Task 4: Supabase
- Aplicar 0003/0004 pelo conector; criar bucket `space-photos` (público, 5 MB, JPEG/PNG/WebP); advisors sem erros novos.

### Task 5: App — base (tipos, regras, mapa)
**Files:** Create `apps/mobile/src/lib/spaces.ts` (tipos `Space`, `SpaceSummary`, `PowerOption`, `scheduleSummary()`, `weeklyHours()`, `monthlyEstimate()`, `ampsToKw()`, `parseEuro()`), `src/ui/MapPicker.tsx` + `MapPicker.web.tsx`, `src/lib/location.ts` (`geocodeAddress`, `currentPlace`); Test `test/spaces.lib.test.ts`.
- Testes: `ampsToKw(13) = 3.0`; `weeklyHours` com meia-noite e dia todo; `monthlyEstimate(20h, 0,30) ≈ 13 €`; `scheduleSummary` agrupa dias iguais ("Seg–Sex 19:00–08:00 · Sáb–Dom dia todo"); `parseEuro('0,30') = 0.3`.

### Task 6: App — assistente, lista e publicado
**Files:** Create `src/app/(app)/spaces/{_layout,index,new,published}.tsx`, `src/spaces/steps/{LocationStep,FeaturesStep,PriceScheduleStep,PlugStep,ReviewStep}.tsx`, `src/spaces/draft.ts`; Remove `src/app/(app)/spaces.tsx`; Test `test/spaces.wizard.test.tsx`, `test/spaces.list.test.tsx`.
- Testes: passo 1 não avança sem nome/morada/pin; passo 2 sem foto → "Adiciona pelo menos uma fotografia."; Schuko 13 A → `powerKw 3`; "Aplicar a todos os dias"; publicar envia multipart com `data` e fotos e navega para publicado; erro mantém dados; lista mostra cartões e estado vazio.

### Task 7: App — Gerir espaço
**Files:** Create `src/app/(app)/spaces/[id]/{index,edit}.tsx`, `src/spaces/BlocksSection.tsx`, `src/spaces/PhotosSection.tsx`; Test `test/spaces.manage.test.tsx`.
- Testes: interruptor → PATCH status; editar preço → PATCH só preço; tornar capa; remover última foto mostra erro; bloqueio adicionado/removido; eliminar pede confirmação → DELETE → volta à lista; `SPACE_HAS_BOOKINGS` mostra a mensagem.

### Task 8: Verificação visual, README, revisão final
- `visual-check.mjs` com os ecrãs do proprietário; README (endpoints de espaços, emulador com `10.0.2.2`); revisão final opus; correções; push.
