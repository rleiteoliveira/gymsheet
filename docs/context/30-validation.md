# Evidência de validação

- `context_level`: `EVIDENCE`
- `observed_at`: 2026-09-10, America/Fortaleza
- `scope`: worktree local do slice 35 — Treinar com leveza
- `release_status`: publicado; PR #46 mergeado e deploy verificado

## Última execução local registrada

| Comando | Resultado observado |
|---|---|
| `npm test` | 7 arquivos e 24 testes aprovados |
| `npm run lint` | aprovado |
| `npx tsc --noEmit` | aprovado |
| `npm run build` | aprovado |
| `npm run verify:build` | aprovado no artefato local |
| `npm run test:e2e` | 16 testes aprovados em viewport móvel; seletor de treino, duas séries, ações recolhidas, feedback e movimento reduzido cobertos |
| `git diff --check` | sem erro de whitespace; apenas avisos de conversão LF/CRLF |

## Evidência remota

- Validação local do slice 36 (2026-09-10): `npm test` (8 arquivos, 27 testes), `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run verify:build` e `npm run test:e2e` (17 testes) concluídos com sucesso. Cobertura adicionada para horário de séries, recarga/retomada e intervalo congelado após conclusão; a verificação remota e o build publicado ainda estão pendentes.

- Revalidação de planejamento do slice 36 (2026-09-10): HEAD e main remoto `3d72bb7d866d9a92c41a952a955a865c7ddeeb9c`, produção com o mesmo buildId e HTTP 200. Run [34499101722](https://github.com/rleiteoliveira/gymsheet/actions/runs/34499101722) com ci e deploy success; nenhuma nova execução local de testes nesta rodada. A evidência abaixo se refere à entrega da feature.

- PR [#46](https://github.com/rleiteoliveira/gymsheet/pull/46) mergeado em `main`.
- Run [34498348809](https://github.com/rleiteoliveira/gymsheet/actions/runs/34498348809): `ci` e `deploy` concluídos com sucesso.
- `scripts/verify-production-build.mjs` confirmou `5fd96d4a318a075dad023aa585097396593e0244` em `https://gymsheet.rleiteoliveira.workers.dev`.
- Verificação independente confirmou HTTP 200, título `GymSheet` e o mesmo `buildId`; a tela inicial e o seletor de treino foram lidos no navegador publicado.

## Cobertura relevante

- seletor de treino livre/ficha sem criar sessão e gestão separada;
- treino livre, ficha fixada e retomada;
- um exercício ativo expandido e demais exercícios compactos;
- duas séries persistidas, feedback textual e ações secundárias recolhidas;
- entrada do picker/sessão com `data-starting` e `prefers-reduced-motion` sem atraso;
- persistência do estado final no caminho E2E móvel;
- captura local inspecionada para a inicial e o seletor de treino.

## Limites

- A verificação remota cobre o commit de feature antes de qualquer novo commit de bookkeeping; revalidar caso `main` receba outra alteração.
- `output/`, `test-results/` e `.playwright-cli/` são artefatos auxiliares; seus arquivos não são instruções nem prova adicional sem uma leitura específica.

Após qualquer mudança de código, substituir esta entrada pelos resultados novos; não manter um “verde” antigo como se cobrisse um diff posterior.
