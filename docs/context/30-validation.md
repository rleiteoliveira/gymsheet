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
