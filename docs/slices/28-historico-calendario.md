# Slice 28 — Histórico e calendário essenciais

- Issue: [#37](https://github.com/rleiteoliveira/gymsheet/issues/37) — não é a #1, #6, #7 nem #8.
- Status: doing
- Cabe no próximo treino? sim — a correção de um dia passado ainda está no proto da “Semana”.

Direção da avaliação de 06/09/2026: padrão v1. Calendário é a porta de correção. Dashboard da semana (métricas, Top skipped/swapped/added) sai. Slice 13 permanece adiado.

## Faz

- [ ] Calendário no padrão v1: mês, dias, detalhe do dia selecionado e **Adicionar sessão neste dia**. Sem slogan, métricas, Top skipped/swapped/added ou aviso azul.
- [ ] Histórico no padrão v1: lista cronológica. **Retomar** só em `in_progress`. Concluída é leitura; edição continua pelo calendário. Sem CTA “Começar sessão vazia”.
- [ ] Modal de sessão retroativa no padrão v1: ficha existente ou sessão vazia; datas futuras bloqueadas. Confirms atuais de descarte/finalizar permanecem.
- [ ] Estado em texto curto (em andamento / concluída), sem chip lime. `todayPin` e o fluxo de hoje não mutam sessão de outro dia.
- [ ] E2E: menu abre Calendário e Histórico; sessão concluída aparece no calendário; modal de nova sessão no dia; sem “O que aconteceu” e sem Top skipped.

## Não faz

- Dados e backup (slice 29)
- Débito do slice 13 / #7 (confirm na primeira mutação, `completedAt` retroativo)
- Programa #6, schema, IndexedDB, `components/ui`, CI
- Pedir QA ao dono

## Arquivos

- pode: `app/page.tsx`, `app/globals.css`, `e2e/happy-path.spec.ts`, este slice, `docs/slices/README.md`
- não toca: `lib/`, `components/ui/`, `public/sw.js`, `package.json`, `.github/`

## Contrato de dados

- `schemaVersion` permanece 2
- Dia = data civil local; sessão passada criada ao meio-dia local (já existente)
- CSV e backup inalterados; status skipped/swapped/added continua no registro
- Fluxo de hoje não dá put em sessão de outro dia

## Testes

- `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run verify:build`, `npm run test:e2e`
- Sem “smoke manual”

## Débito

- Dados (29), consolidação de tokens (30), slice 13
