# Estado atual — GymSheet

- `context_level`: `NOW`
- `observed_at`: 2026-09-12, America/Fortaleza
- Revalidar no início de cada tarefa; fatos vivos prevalecem sobre este snapshot.

## Checkout e entrega observados

- Branch `feat/40-cara-de-treino` a partir de `main` `81f2190e690fdae861fa0a0734e6854b17a18bd4`.
- O slice [40 — cara de treino](../slices/40-cara-de-treino.md) está `doing`; o dono autorizou aplicar, subir e mergear em 2026-09-12.
- Produção publicada continua a do slice 39 até o merge e o deploy desta fatia: `https://gymsheet.rleiteoliveira.workers.dev`, buildId `ad13d8d381f47b253c1e98dfd67e92dcc9552e76`.

## Produto no checkout

- Home: CTA cápsula com acento `#ff6a3d` e glow; data, título e Começar entram em stagger.
- Sessão: exercício ativo como palco; anel SVG no ativo (ficha = feitas/`targetSets`; livre cresce sem meta inventada).
- Marcar/Salvar série: press no botão, tick no anel, linha da série entra; “Série salva” permanece.
- Schema 2 e persistência iguais; motion não grava IndexedDB.

## Limites

- Sem recap, descanso, dashboard, fonte nova ou imagens (#44).
- `components/ui/*` não foi tocado.
