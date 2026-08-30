# Slice 18 — começar treino agora

- Issue: #18
- Status: ready
- Cabe no próximo treino? sim

## Faz

- [ ] Hoje: botão grande **Começar treino** (não exige pin). Abre um passo curto: nome sugerido `Treino · {weekday} {dd/mm}` civil local, editável; chips de grupamento (pt-BR do filtro #4), múltiplos, sem limite. Confirmar cria `Session` `in_progress` com `sourcePlanId: null` e `sourcePlanName` = o nome; `todayPin` = essa sessão; relógio da sessão visível.
- [ ] Depois do nome/músculos: lista sugerida (`filterCatalogExercises` + `rankCatalogExercises`). Escolher exercício chama `applySessionEdit` tipo `add`. Dá para Finalizar sem exercício (sessão vazia completed).
- [ ] Exercício ativo: kg e reps opcionais; **Série feita** grava set (`kg: null` se vazio, `reps: 0` se vazio). Zod/`SetRecord` aceita `reps >= 0`. **Próximo exercício** volta à lista. **Finalizar treino** chama `completeSession`.
- [ ] Relógio = `now - startedAt`, atualiza a cada 1s só na view da sessão. Não grava tempo por exercício neste PR.
- [ ] Testes: nome sugerido usa data civil local; set sem kg/reps persiste; sessão rápida não muta `Plan`. Smoke no PR: Começar → Peito → 2 séries sem peso → próximo → finalizar → aparece no calendário.

## Não faz

- `startedAt`/`endedAt` por exercício, tempo morto na Semana/CSV
- alarme de descanso, #6, seed no boot, bump `schemaVersion` (fica 2)
- apagar fluxo de ficha/pin/calendário/demo
- slice 13
- Playwright

## Arquivos

- pode: `app/page.tsx`, `lib/session.ts`, `lib/storage.ts` (só `reps.min(0)` no zod), `lib/session.test.ts`, CSS da sessão/Hoje
- não toca: `lib/demo-state.ts`, `lib/types.ts` salvo `SetRecord.reps` continuar `number`, `public/sw.js`, `.github`, `components/ui`

## Contrato de dados

- schemaVersion 2
- `SetRecord.reps` pode ser 0; `kg` já é null
- sessão rápida não cria Plan
- CSV: série com reps 0 aparece; não inventar colunas de tempo neste PR

## Testes

- vitest helper de nome do dia (exportar de `lib/session.ts` ou `lib/quick-start.ts`)
- vitest `save-set` com `reps: 0`, `kg: null`
- vitest: add/set numa sessão sem plan não altera `plans`

## Débito

Tempo por exercício / tempo morto = PR seguinte, só se este fluxo for usado.
