# Estado atual — GymSheet

- `context_level`: `NOW`
- `observed_at`: 2026-09-11, America/Fortaleza
- Revalidar no início de cada tarefa; fatos vivos prevalecem sobre este snapshot.

## Checkout e entrega observados

- O runtime do slice 38 entrou no PR [#50](https://github.com/rleiteoliveira/gymsheet/pull/50); o fix de persistência e o fechamento documental entraram no PR [#51](https://github.com/rleiteoliveira/gymsheet/pull/51).
- O slice [38 — registro rápido como companion](../slices/38-registro-rapido.md) está `done` após CI e deploy verdes.
- Run [34635895805](https://github.com/rleiteoliveira/gymsheet/actions/runs/34635895805): jobs `ci` e `deploy` com success; o artefato passou lint, TypeScript, unit, build, verify:build e 17 E2E após o fix.
- Produção consultada após o deploy corrigido: `https://gymsheet.rleiteoliveira.workers.dev`, HTTP 200, buildId `903ac605e71ce6273cc18daadc32782d8e1223c7`.
- Fechamentos documentais posteriores podem atualizar apenas o buildId publicado; não alteram o runtime descrito nesta seção.

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
