# Slice 39 — registro mínimo no treino livre

- Issue: pedido do dono em 2026-09-11
- Status: done
- Cabe no próximo treino? sim

## Faz

- [x] Abrir treino livre com nome e exercício como texto de contexto, sem edição, catálogo ou filtros musculares na sessão.
- [x] Exibir no exercício livre apenas a ação `Marcar série`, sem campos de peso e repetições.
- [x] Liberar `Próximo exercício` somente depois de a primeira série do exercício ativo ser marcada.
- [x] Manter a numeração automática dos exercícios e salvar a série rápida como `kg: null` e `reps: 0`.
- [x] Cobrir o estado antes/depois da primeira série e preservar os fluxos de ficha.

## Não faz

- Não remove catálogo, filtros ou edição dos fluxos de ficha, troca ou adição planejada.
- Não altera schema, autenticação, D1, Workbox, `develop` ou `components/ui`.
- Não adiciona IA, prescrição ou sugestão de carga/repetições.

## Arquivos

- pode: `app/page.tsx`, `app/globals.css`, `e2e/happy-path.spec.ts`, documentação do slice e validação.
- não toca: `lib/types.ts` e `lib/session.ts`; o contrato atual já suporta o registro rápido.

## Contrato de dados

- `schemaVersion` permanece 2.
- O nome sugerido continua derivado de `startedAt` quando `sourcePlanName` é nulo.
- Cada marcação rápida cria uma série sem carga/repetições (`kg: null`, `reps: 0`).
- Exercícios livres continuam snapshots locais numerados (`Exercício 1`, `Exercício 2`, ...).

## Testes

- vitest: suíte existente sem alteração de contrato.
- e2e: treino livre sem opções densas, bloqueio inicial de `Próximo exercício`, liberação após a primeira série e fluxos de ficha preservados.

## Débito

- Informações de carga/repetições poderão voltar em uma interação posterior baseada em uso observado.

## Evidência de entrega

- PR [#53](https://github.com/rleiteoliveira/gymsheet/pull/53) integrado após CI verde.
- Run [34642351891](https://github.com/rleiteoliveira/gymsheet/actions/runs/34642351891) concluiu `ci` e `deploy` com success; os 17 E2E passaram.
- Produção consultada em 2026-09-11: HTTP 200 em `https://gymsheet.rleiteoliveira.workers.dev/build-meta.json`, buildId `ad13d8d381f47b253c1e98dfd67e92dcc9552e76`.
