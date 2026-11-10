# Mapa e pesquisa — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline).

**Goal:** condutor encontra espaços livres no mapa, vê o detalhe com custo estimado, guarda favoritos e partilha.
**Spec:** `docs/superpowers/specs/2026-11-10-mapa-pesquisa-design.md`

## Global Constraints
- Datas na hora de Europe/Lisbon; dia ∈ [hoje, hoje+3]; chegada HH:MM de 30 em 30; 1–12 h.
- Pesquisa/detalhe nunca devolvem `address`, `spotDetails`, `accessCode`, `accessInstructions`; coordenadas sempre aproximadas (50–150 m, fixas por id).
- Custos: lugar €/h×h; energia min(kW×h,20)×€/kWh; taxa = `platform_settings.service_fee_percent` sobre lugar+energia; 2 casas.
- Mensagens em português europeu; testes só para desenvolvimento.

## Review Focus
1. Janela 22:00–02:00 num espaço com seg 19:00–24:00 e ter 00:00–08:00 → disponível (janelas contíguas).
2. Domingo da mudança de hora (25 out / 29 mar) → conversão Lisboa→UTC correta.
3. bbox enorme ou invertida → 400, nunca uma consulta a Portugal inteiro.
4. Favorito de um espaço que depois é eliminado → some da lista, sem 500.
5. Mapa a disparar pesquisas em cada frame do arrasto → no máximo uma por paragem (debounce 0,5 s).

### Task 1: Migração (favorites, spaces.area) + teste de schema
### Task 2: API disponibilidade (função pura) + testes
### Task 3: API pesquisa, detalhe público e custos + testes
### Task 4: API favoritos + testes
### Task 5: Supabase (aplicar migração) + script de dados de teste (`scripts/seed.ts`, PNG gerado com zlib)
### Task 6: App — estado de pesquisa (SearchProvider), filtros, mapa (círculos + etiquetas), cartão; web = lista
### Task 7: App — detalhe do lugar (galeria, custos, favorito, partilhar, Reservar desativado) + favoritos no Perfil + `area` no assistente
### Task 8: Verificação visual, README, revisão final, push
