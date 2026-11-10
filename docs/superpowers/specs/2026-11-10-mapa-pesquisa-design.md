# KARGA — Mapa, pesquisa, detalhe do lugar e favoritos (condutor)

**Data:** 2026-11-10 · **Estado:** aprovado pelo Pedro ("podes avançar que depois testo")
**Âmbito:** itens do cronograma "Motor de geolocalização e endpoints de listagem de garagens" + ecrãs Mapa e Detalhe do lugar do mockup, favoritos e partilha. Reservar fica desativado.

## 1. Decisões tomadas com o Pedro

| Tema | Decisão |
|---|---|
| Base visual | Mockup (ECRÃ 1 · MAPA e ECRÃ 2 · DETALHE DO LUGAR) |
| Janela de pesquisa | Dia entre hoje e hoje + 3 (hora de Portugal); chegada de 30 em 30 min; duração 1–12 h. Por omissão: hoje, próxima meia hora, 2 h |
| Chips rápidos | "Esta noite" = hoje 20:00 durante 12 h; "Rápido" = ≥ 7,4 kW; "Coberta" = garagem fechada ou coberto |
| Filtros (folha) | Quando; preço máximo (até 0,25 / 0,30 / 0,35 €/h / qualquer); potência mínima (qualquer / 3,7 / 7,4 / 11 kW); ficha (qualquer / Tipo 2 / Schuko); Limpar; "Ver N lugares" |
| O que aparece | Espaços ativos, livres em toda a janela (horário semanal incluindo a meia-noite, sem bloqueios nem reservas confirmadas sobrepostas), excluindo os do próprio utilizador |
| Mapa | `react-native-maps`; atualiza sozinho ao mover/zoom (0,5 s depois de parar); abre na localização atual (com permissão) ou Lisboa; barra "Pesquisar morada ou zona" move o mapa |
| Privacidade | Antes de reservar: zona aproximada. No mapa um círculo verde (raio ~150 m) com etiqueta de preço, centrado num ponto deslocado 50–150 m, fixo por espaço (derivado do id). No detalhe só a zona ("Odivelas"). Morada exata e código só depois de reservar (fase das reservas) |
| Detalhe | Galeria (1/N), partilhar, favorito, nome, zona, proprietário (primeiro nome + inicial do apelido, "Novo" sem avaliações), características (kW, ficha, tipo, energia), "Quando precisas do lugar?" (mesma janela dos filtros), disponível/indisponível, resumo de custos (lugar, energia estimada, taxa de serviço 10%, total), notas do mockup (energia a preço de custo; taxa de ocupação 0,10 €/min), botão Reservar desativado ("Em breve") |
| Custos | lugar = €/h × horas; energia = min(kW × horas, 20 kWh) × €/kWh (0 se o espaço não tiver €/kWh); taxa = 10% (platform_settings) × (lugar + energia); valores arredondados a 2 casas |
| Favoritos | Tabela `favorites`; coração no detalhe e no cartão do mapa; página "Os meus favoritos" no Perfil (por baixo dos veículos) |
| Partilhar | Folha de partilha do sistema com "Garagem X · 0,30 €/h · Odivelas — vê na Karga: <link>"; o link abre o detalhe na app (`Linking.createURL`) |
| Avaliações / verificado | Escondidos (ainda não existem) |
| Dados de teste | Script `npm run seed -w apps/api` (corre no PC do Pedro): 3 proprietários de teste com password, 20 garagens na zona de Odivelas/Loures (2–3 no mesmo prédio), horários/fichas/preços variados, alguns bloqueios e desativados, fotos geradas pelo script; `-- --apagar` remove só o que o script criou |

## 2. Base de dados (migração nova)

- `favorites (user_id uuid → profiles on delete cascade, space_id uuid → spaces on delete cascade, created_at)`, PK `(user_id, space_id)`, RLS ativo sem políticas.
- `spaces.area text null` — zona/localidade. A app envia-a ao criar e ao editar a localização (geocodificação inversa: `district ?? subregion ?? city`). Migração preenche os existentes com o texto depois da última vírgula da morada.

## 3. API

| Método | Rota | |
|---|---|---|
| GET | `/spaces/search` | `bbox=minLng,minLat,maxLng,maxLat`, `date=YYYY-MM-DD`, `start=HH:MM`, `hours=1..12`, opcionais `maxPrice`, `minKw`, `plug=schuko|type2`, `covered=true`. Até 100 resultados, mais baratos primeiro |
| GET | `/spaces/:id` | Detalhe público; com `date/start/hours` inclui `available` e `cost` |
| GET | `/me/favorites` | Favoritos (sem eliminados; inativos com `status`) |
| PUT / DELETE | `/me/favorites/:spaceId` | Idempotentes; 204 |

Resultado da pesquisa: `{ id, title, area, latitude, longitude (aproximadas), pricePerHour, energyPriceKwh, powerKw, plugType, spaceType, coverUrl, isFavorite }`. Detalhe: mais `photos[]`, `accessInstructions` **não**, `host { firstName, initial, avatarUrl }`, `available: boolean | null`, `cost: { hours, place, energyKwh, energy, serviceFeePercent, serviceFee, total } | null`. Nunca inclui morada, piso/lugar nem código.

Erros: `VALIDATION_ERROR` (bbox inválida ou maior que ~0,5° de lado, data fora de hoje..+3, hora, duração), `SPACE_NOT_FOUND` (inexistente, inativo, eliminado), 400 ao tentar favoritar o próprio espaço (`OWN_SPACE`).

Disponibilidade (`modules/search/availability.ts`, função pura): converte a janela pedida (hora de Lisboa) em UTC; as janelas semanais do espaço nos dias D−1, D, D+1 (fim ≤ início ⇒ dia seguinte; 24:00 ⇒ meia-noite seguinte) são unidas (contíguas juntam-se) e a janela pedida tem de caber numa delas; nenhum bloqueio nem reserva confirmada se pode sobrepor.

## 4. App

- **Separador Mapa** (modo condutor): mapa a ecrã inteiro com logo + barra de pesquisa + botão de filtros, chips; círculos com etiqueta de preço; tocar seleciona e mostra o cartão (capa, nome, zona, kW, preço, coração, "Ver detalhes"); estado vazio "Nenhum lugar corresponde a estes filtros." No browser (só testes) o mapa dá lugar a uma lista dos resultados.
- **Folha de filtros** como no mockup.
- **Detalhe do lugar** (`/home/space/[id]`) como no mockup; o "Quando" do detalhe partilha o estado com os filtros.
- **Perfil → "Os meus favoritos"** (só condutor) → lista de cartões → detalhe; estado vazio com convite para explorar o mapa.
- O assistente do proprietário passa a enviar `area`.

## 5. Testes (só desenvolvimento)

API (PGlite): disponibilidade (dentro/fora, meia-noite, dia todo, janelas contíguas de dois dias, bloqueio, reserva, fuso de Lisboa na mudança de hora); pesquisa (bbox, filtros, exclui próprios/inativos/eliminados, sem morada/código, ponto deslocado ≤ 150 m e estável); detalhe e custos; favoritos (idempotência, próprio espaço, eliminados). App (jest): estado da pesquisa (omissões, "Esta noite", limites de dias), filtros, cartão, detalhe (custos, favorito, partilhar, Reservar desativado), página de favoritos.

## 6. Fora de âmbito

Reservar e pagamentos; avaliações; morada exata após reserva; notificações; versão web.
