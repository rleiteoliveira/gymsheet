# Estado atual — GymSheet

- `context_level`: `NOW`
- `observed_at`: 2026-09-12, America/Fortaleza
- Revalidar no início de cada tarefa; fatos vivos prevalecem sobre este snapshot.

## Checkout e entrega observados

- O slice [40 — cara de treino](../slices/40-cara-de-treino.md) entrou no PR [#55](https://github.com/rleiteoliveira/gymsheet/pull/55) e está `done` após CI e deploy verdes.
- Run [34684494232](https://github.com/rleiteoliveira/gymsheet/actions/runs/34684494232): jobs `ci` e `deploy` com success no push para `main`.
- Produção consultada após o deploy: `https://gymsheet.rleiteoliveira.workers.dev`, HTTP 200, buildId `3e0d30a7e2cc2e873f83c489d677e43c607fe889`.

## Produto publicado

- Home: CTA cápsula com acento `#ff6a3d` e glow; data, título e Começar entram em stagger.
- Sessão: exercício ativo como palco; anel SVG no ativo (ficha = feitas/`targetSets`; livre cresce sem meta inventada).
- Marcar/Salvar série: press no botão, tick no anel, linha da série entra; “Série salva” permanece.
- Schema 2 e persistência iguais; motion não grava IndexedDB.

## Limites

- Sem recap, descanso, dashboard, fonte nova ou imagens (#44).
- `components/ui/*` não foi tocado.
