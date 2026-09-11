# Estado atual — GymSheet

- `context_level`: `NOW`
- `observed_at`: 2026-09-11, America/Fortaleza
- Revalidar no início de cada tarefa; fatos vivos prevalecem sobre este snapshot.

## Checkout e entrega observados

- O runtime do slice 38 entrou no PR [#50](https://github.com/rleiteoliveira/gymsheet/pull/50); o fix de persistência e o fechamento documental entraram no PR [#51](https://github.com/rleiteoliveira/gymsheet/pull/51).
- O slice [38 — registro rápido como companion](../slices/38-registro-rapido.md) está `done` após CI e deploy verdes.
- Run [34635895805](https://github.com/rleiteoliveira/gymsheet/actions/runs/34635895805): jobs `ci` e `deploy` com success; o artefato passou lint, TypeScript, unit, build, verify:build e 17 E2E após o fix.
- Produção consultada após o deploy corrigido: `https://gymsheet.rleiteoliveira.workers.dev`, HTTP 200, buildId `903ac605e71ce6273cc18daadc32782d8e1223c7`.
- O slice [39 — registro mínimo no treino livre](../slices/39-registro-minimo.md) entrou no PR [#53](https://github.com/rleiteoliveira/gymsheet/pull/53) e está `done` após CI e deploy verdes.
- Run [34642351891](https://github.com/rleiteoliveira/gymsheet/actions/runs/34642351891): jobs `ci` e `deploy` com success; o artefato passou lint, TypeScript, unit, build, verify:build e 17 E2E.
- Produção consultada após o deploy do slice 39: `https://gymsheet.rleiteoliveira.workers.dev`, HTTP 200, buildId `ad13d8d381f47b253c1e98dfd67e92dcc9552e76`.
- Fechamentos documentais posteriores podem atualizar apenas o buildId publicado; não alteram o runtime descrito nesta seção.

## Produto publicado

- Treino livre começa direto na sessão, sem nome editável, picker intermediário, combobox, filtros musculares ou catálogo na tela.
- O cabeçalho exibe `Treino · dia data` como contexto derivado; o valor continua opcional no contrato e não é alterado nesta tela.
- O treino livre começa com `Exercício 1`; os próximos são numerados automaticamente, sem configuração durante o registro.
- A única ação do exercício livre no início é `Marcar série`; peso e repetições ficam omitidos e a série salva `kg: null` e `reps: 0`.
- Depois da primeira série, `Próximo exercício` é liberado.
- Fichas planejadas, troca e adição pelo picker permanecem separadas e cobertas.

## Limites

- Não há IA, prescrição ou sugestão de carga/repetições nesta entrega.
- Slice 33 continua draft; não implementar imagens por inferência.
- `output/`, `test-results/` e `.playwright-cli/` são artefatos auxiliares, não fonte de verdade.
