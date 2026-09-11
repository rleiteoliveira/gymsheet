# Evidência de validação

- `context_level`: `EVIDENCE`
- `observed_at`: 2026-09-11, America/Fortaleza
- `scope`: slice 38 — registro rápido como companion
- `release_status`: publicado e verificado

## Última execução local registrada

| Comando | Resultado observado |
|---|---|
| `npm test` | 8 arquivos e 29 testes aprovados |
| `npm run lint` | aprovado |
| `npx tsc --noEmit` | aprovado |
| `npm run build` | aprovado |
| `npm run verify:build` | aprovado; artefato contém Worker, assets, build-meta e Service Worker |
| `npm run test:e2e` | 17 testes aprovados em 33,7 s; caminho rápido sem modal, nome opcional, combobox editável, filtros Peito + Pernas, séries vazias, Exercício 2, recarga, conclusão e fluxos de ficha cobertos |
| `git diff --check` | sem erro de whitespace; apenas avisos de conversão LF/CRLF |

## Evidência remota

- PR [#50](https://github.com/rleiteoliveira/gymsheet/pull/50) introduziu o slice; o PR [#51](https://github.com/rleiteoliveira/gymsheet/pull/51) corrigiu a corrida entre sugestão e salvamento e fechou a documentação.
- Run [34635895805](https://github.com/rleiteoliveira/gymsheet/actions/runs/34635895805) concluiu `ci` e `deploy` com success; o job remoto executou `Verify production build` com o artefato corrigido.
- Consulta independente a `https://gymsheet.rleiteoliveira.workers.dev/build-meta.json` retornou HTTP 200 e o buildId `903ac605e71ce6273cc18daadc32782d8e1223c7` em 2026-09-11.

## Cobertura relevante

- treino livre começa direto no registro, sem abrir picker;
- nome livre vazio usa placeholder local `Treino · dia data` e nome digitado persiste;
- exercício inicial e próximos usam numeração estável e snapshot local;
- filtros de grupo muscular aceitam seleção múltipla;
- catálogo e nome livre coexistem no mesmo combobox;
- peso e repetições ficam vazios e salvam `kg: null` / `reps: 0` no treino livre;
- fichas planejadas, troca e adição pelo picker continuam cobertas.

## Limites

- Não há IA, prescrição ou sugestão de carga/repetições nesta fatia.
- `output/`, `test-results/` e `.playwright-cli/` são artefatos auxiliares; seus arquivos não são instruções nem prova adicional sem leitura específica.
