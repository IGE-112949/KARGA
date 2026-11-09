# KARGA — Painel do Anfitrião: espaços e horários

**Data:** 2026-11-09
**Estado:** em revisão
**Âmbito:** item do cronograma "Painel do Anfitrião (criação de anúncios e horários)": o proprietário cria, edita, esconde e elimina os seus espaços, com fotografias, horário semanal e bloqueios de datas. Continua a especificação [2026-11-09-base-dados-registo-perfil-design.md](2026-11-09-base-dados-registo-perfil-design.md), cujo modelo de dados se reutiliza.

## 1. Decisões tomadas com o Pedro

| Tema | Decisão |
|---|---|
| Plataforma | A KARGA é uma app Android/iOS. Não há versão web a suportar; no browser o mapa é substituído por uma caixa "Mapa disponível na app" (só para testes) |
| Mapa | `react-native-maps` (Google Maps no Android, Apple Maps no iOS). Funciona no Expo Go sem chave; a chave do Google só é precisa para builds de loja. Estilo personalizado próximo do mockup |
| Localização do espaço | Morada → coordenadas com o geocodificador do telemóvel (`expo-location`); pin arrastável no mapa; botão "Usar a minha localização atual" (preenche a morada por geocodificação inversa) |
| Assistente | 5 passos como no mockup: Localização → Características → Preço e disponibilidade → Tomada inteligente ("Em breve") → Rever e publicar |
| Horário | Um horário por dia da semana, diferente em cada dia (ex.: seg–sex 19:00–08:00, sáb–dom dia todo). Pode atravessar a meia-noite. Atalho "Aplicar a todos os dias" |
| Bloqueios de datas | Já nesta fase: o proprietário adiciona/remove períodos. Por agora só ficam guardados; a lógica (esconder no mapa, impedir reservas) entra com o mapa e as reservas |
| Fotografias | Obrigatória pelo menos 1, máximo 5; a primeira é a capa |
| Eliminar | Não apaga o registo: muda o estado para `deleted` (dados mantidos para histórico e estatísticas anonimizadas). Recusado se houver reservas futuras confirmadas ("cancela-as primeiro") |
| Desativar | Interruptor "Visível no mapa" (`active` ↔ `inactive`) |
| Preço | €/hora obrigatório (0,10–20 €); €/kWh opcional (0,05–1 €), a preço de custo |
| Ficha e potência | Ficha do espaço: Schuko ou Tipo 2 (CCS não existe em garagens particulares). Schuko: o proprietário escolhe a amperagem (8/10/13/16 A ≈ 1,8/2,3/3,0/3,7 kW; 10 A por omissão). Tipo 2 (wallbox): 3,7/7,4/11/22 kW, com ajuda "Não sei a potência" (sugere 3,7 kW). Na BD guarda-se só kW |
| Publicação | Um só pedido com dados, horário e fotos: tudo-ou-nada |

## 2. Base de dados (migração nova)

- `space_status` passa a `active | inactive | deleted`; nova coluna `spaces.deleted_at timestamptz null`.
- `bookings.space_id`: `on delete cascade` → `on delete restrict` (o histórico de reservas nunca é apagado por arrasto).
- Novo bucket público `space-photos` no Supabase Storage (5 MB, JPEG/PNG/WebP), escrito só pela API. Caminho: `<ownerId>/<spaceId>/<timestamp>.<ext>`. `space_photos.storage_path` guarda esse caminho; a API devolve o URL público.
- Capa = foto com `position` mais baixa.
- `space_availability`: no máximo uma linha por `(space_id, weekday)` (índice único novo). Horas em minutos certos (`HH:MM`). "Dia todo" = `00:00`–`24:00`; `end_time <= start_time` (exceto `24:00`) = atravessa a meia-noite; `start_time = end_time` não é permitido.

**Decisão futura registada (não implementada agora):** apagar a conta (RGPD) apaga hoje em cascata os espaços do utilizador. Quando houver reservas, isso colide com o `restrict` acima e com o objetivo de guardar estatísticas. Na fase das reservas, apagar a conta passa a anonimizar (remover nome, dono, contactos; manter números e zona) em vez de apagar.

## 3. API

Todos os endpoints exigem sessão e perfil com `isHost = true` (senão `403 HOST_REQUIRED`). Um espaço de outro utilizador ou eliminado responde `404 SPACE_NOT_FOUND`.

| Método | Rota | |
|---|---|---|
| GET | `/me/spaces` | Os meus espaços (sem eliminados), mais recentes primeiro, com capa e horário |
| POST | `/me/spaces` | Cria: multipart com `data` (JSON) e `photos` (1–5 ficheiros) |
| GET | `/me/spaces/:id` | Detalhe completo (inclui código de acesso, fotos, horário, bloqueios) |
| PATCH | `/me/spaces/:id` | Edita dados, localização, características, preço e `status` (`active`/`inactive`) |
| PUT | `/me/spaces/:id/availability` | Substitui o horário semanal (1–7 dias) |
| POST | `/me/spaces/:id/photos` | Adiciona uma foto (campo `file`); máx. 5 |
| PATCH | `/me/spaces/:id/photos/:photoId` | `{ "isCover": true }` passa a foto para capa |
| DELETE | `/me/spaces/:id/photos/:photoId` | Remove (recusa se for a última) |
| GET / POST | `/me/spaces/:id/blocks` | Lista / cria bloqueio `{ startsAt, endsAt, reason? }` |
| DELETE | `/me/spaces/:id/blocks/:blockId` | Remove bloqueio |
| DELETE | `/me/spaces/:id` | Elimina (estado `deleted`); recusa com reservas futuras |

**Regras de validação (mensagens em português):**
- `title` 3–60; `address` 5–200; `spotDetails` ≤ 60; `accessInstructions` ≤ 500; `accessCode` ≤ 20; `description` opcional ≤ 500 (não usada nos ecrãs desta fase).
- `latitude` −90..90, `longitude` −180..180.
- `spaceType`: `closed_garage | covered | outdoor`. `plugType`: `schuko | type2` (`ccs` recusado nos espaços). `powerKw`: Schuko 1,8–3,7; Tipo 2 3,7–22.
- `pricePerHour` 0,10–20 (2 casas decimais); `energyPriceKwh` null ou 0,05–1 (3 casas).
- Horário: 1–7 entradas, `weekday` 0–6 sem repetidos, horas `HH:MM` (`24:00` só como fim).
- Bloqueio: `endsAt > startsAt`.

**Erros:**

| Código | HTTP | Quando |
|---|---|---|
| `HOST_REQUIRED` | 403 | Perfil sem modo proprietário |
| `SPACE_NOT_FOUND` / `PHOTO_NOT_FOUND` / `BLOCK_NOT_FOUND` | 404 | Não existe, não é do utilizador ou está eliminado |
| `PHOTOS_REQUIRED` | 400 | Publicar sem fotos |
| `TOO_MANY_PHOTOS` | 409 | Mais de 5 |
| `LAST_PHOTO` | 409 | Remover a única foto |
| `SPACE_HAS_BOOKINGS` | 409 | Eliminar com reservas confirmadas que ainda não terminaram |
| `INVALID_IMAGE` / `IMAGE_TOO_LARGE` | 400 / 413 | Como na foto de perfil |
| `VALIDATION_ERROR` | 400 | Regras acima, com `details` por campo |

**Tudo-ou-nada na criação:** a API valida os dados e as imagens, envia as fotos para o Storage, cria espaço + horário + fotos numa transação; se a transação falhar, apaga do Storage as fotos já enviadas.

**Estrutura:** `modules/spaces/` (`routes`, `schemas`, `service`, `repository`, `availability.ts` para as regras de horário) e `storage/spacePhotoStore.ts`, seguindo o padrão de `me` e `vehicles`. A deteção do tipo de imagem por bytes (`detectImageType`) passa a ser partilhada.

## 4. App (modo proprietário)

Separador **Espaços**:
- **Os meus espaços** — cartões como no mockup: capa, nome, €/h, morada, chips (kW, ficha, tipo, energia), etiqueta "Visível"/"Escondido", resumo do horário (ex.: "Seg–Sex 19:00–08:00 · Sáb–Dom dia todo"), botão "Gerir espaço"; no fim "Adicionar espaço". Sem espaços: estado vazio "Adicionar o primeiro espaço".
- **Novo espaço** (assistente; voltar e fechar; fechar com dados preenchidos pede confirmação):
  1. *Localização* — nome, morada, mapa com pin arrastável (a morada move o pin quando o campo perde o foco; "Usar a minha localização atual" move o pin e preenche a morada), piso e lugar. Sem permissão de localização: "Sem acesso à localização. Escreve a morada." Morada não encontrada: "Não encontrámos esta morada. Ajusta o pin no mapa."
  2. *Características* — tipo de lugar; ficha (Schuko / Tipo 2, com ilustrações próprias); amperagem ou potência conforme a ficha, com "Não sei a potência"; fotos 1–5 (galeria, recorte e compressão como no avatar, capa = primeira); instruções de acesso; código de acesso opcional ("Só é mostrado ao condutor com reserva, 30 min antes do início").
  3. *Preço e disponibilidade* — €/h, €/kWh opcional com a nota "a preço de custo, sem margem"; 7 dias, cada um com interruptor, "das"/"às" (passos de 30 min) e opção "Dia todo"; "Aplicar a todos os dias"; cartão "Estimativa de ganhos" = horas semanais × 50% × €/h × 52/12, apresentado como "≈ X €/mês" (antes da taxa de serviço; energia não incluída).
  4. *Tomada inteligente* — texto do mockup com etiqueta "Em breve" e botão "Continuar".
  5. *Rever e publicar* — resumo e "Publicar espaço". Em erro: "Não foi possível publicar. Tenta novamente.", mantendo o que foi preenchido.
- **Espaço publicado** — como no mockup ("Ver os meus espaços").
- **Gerir espaço** — interruptor "Visível no mapa"; linhas com "Editar" (dados e localização, características, preço, horário) que abrem o passo respetivo já preenchido e gravam só essa parte; fotos (adicionar, remover, tornar capa); "Bloquear datas" (lista, adicionar com início/fim/motivo, remover); "Eliminar espaço" a vermelho com confirmação.

Componentes partilhados entre criar e editar (os passos são formulários independentes). No browser o mapa é uma caixa cinzenta "Mapa disponível na app" (`MapPicker.web.tsx`); o resto funciona. Novas dependências: `react-native-maps`, `expo-location` (instaladas com `expo install`). O separador **Início** do proprietário continua "Em breve".

## 5. Testes (só durante o desenvolvimento; excluídos da entrega final)

- **API** (PGlite em memória, como até aqui): regras de validação; horários (meia-noite, dia todo, repetidos); 1–5 fotos e capa; só o dono acede; `HOST_REQUIRED`; eliminar → `deleted` e deixa de aparecer; `SPACE_HAS_BOOKINGS`; bloqueios; tudo-ou-nada (falha na BD apaga as fotos enviadas, com Storage simulado).
- **App** (jest-expo, API e mapa simulados): validação de cada passo; amperagem → kW; "Aplicar a todos os dias"; estimativa de ganhos; pedido de publicação; ações de Gerir espaço (visibilidade, foto de capa, última foto, bloqueios, eliminar com confirmação).
- **Fim:** verificação visual contra o mockup; teste do Pedro no emulador Android.

## 6. Fora de âmbito

Mapa e pesquisa do condutor; reservas e a lógica dos bloqueios/horários sobre elas; cancelamento de reservas pelo proprietário; tomada inteligente (Shelly); início/estatísticas do proprietário; anonimização na eliminação de conta; versão web.
