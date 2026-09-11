# Estado atual — GymSheet

- `context_level`: `NOW`
- `observed_at`: 2026-09-11, America/Fortaleza
- Revalidar no início de cada tarefa; fatos vivos prevalecem sobre este snapshot.

## Checkout e entrega observados

- `main` local e `origin/main` estão no commit `6139c7418d13d13c124299b71b827a92b7d02bd5`, merge do PR [#50](https://github.com/rleiteoliveira/gymsheet/pull/50).
- O slice [38 — registro rápido como companion](../slices/38-registro-rapido.md) está `done` após CI e deploy verdes.
- Run [34632659421](https://github.com/rleiteoliveira/gymsheet/actions/runs/34632659421): jobs `ci` e `deploy` com success; o artefato passou lint, TypeScript, unit, build, verify:build e 17 E2E.
- Produção consultada após o deploy: `https://gymsheet.rleiteoliveira.workers.dev`, HTTP 200, buildId `6139c7418d13d13c124299b71b827a92b7d02bd5`.

## Produto publicado

- Treino livre começa direto na sessão, sem nome obrigatório ou picker intermediário.
- O nome opcional usa `Treino · dia data` como placeholder e só grava texto quando o usuário digita.
- O treino livre começa com `Exercício 1`; os próximos são numerados e editáveis.
- O exercício é um combobox de texto livre com sugestões do catálogo e filtros múltiplos por grupo muscular.
- Peso e repetições começam vazios no treino livre; deixar ambos vazios salva `kg: null` e `reps: 0`.
- Fichas planejadas, troca e adição pelo picker permanecem separadas e cobertas.

## Limites

- Não há IA, prescrição ou sugestão de carga/repetições nesta entrega.
- Slice 33 continua draft; não implementar imagens por inferência.
- `output/`, `test-results/` e `.playwright-cli/` são artefatos auxiliares, não fonte de verdade.
