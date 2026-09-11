# Evidência de validação

- `context_level`: `EVIDENCE`
- `observed_at`: 2026-09-11, America/Fortaleza
- `scope`: slice 39 — registro mínimo no treino livre
- `release_status`: publicado e verificado

## Última execução local registrada

| Comando | Resultado observado |
|---|---|
| `npm test` | 8 arquivos e 29 testes aprovados |
| `npm run lint` | aprovado |
| `npx tsc --noEmit` | aprovado |
| `npm run build` | aprovado |
| `npm run verify:build` | aprovado; artefato contém Worker, assets, build-meta e Service Worker |
| `npm run test:e2e` | 17 testes aprovados em 36,7 s; treino livre sem editor/filtros/catálogo/campos, `Marcar série`, bloqueio inicial de `Próximo exercício`, liberação após a primeira série, recarga, conclusão e fluxos de ficha cobertos |
| `git diff --check` | sem erro de whitespace; apenas avisos de conversão LF/CRLF |

## Evidência remota

- PR [#50](https://github.com/rleiteoliveira/gymsheet/pull/50) introduziu o slice; o PR [#51](https://github.com/rleiteoliveira/gymsheet/pull/51) corrigiu a corrida entre sugestão e salvamento e fechou a documentação.
- Run [34635895805](https://github.com/rleiteoliveira/gymsheet/actions/runs/34635895805) concluiu `ci` e `deploy` com success; o job remoto executou `Verify production build` com o artefato corrigido.
- Consulta independente a `https://gymsheet.rleiteoliveira.workers.dev/build-meta.json` retornou HTTP 200 e o buildId `903ac605e71ce6273cc18daadc32782d8e1223c7` em 2026-09-11.
- PR [#53](https://github.com/rleiteoliveira/gymsheet/pull/53) simplificou a experiência do companion e passou no CI remoto.
- Run [34642351891](https://github.com/rleiteoliveira/gymsheet/actions/runs/34642351891) concluiu `ci` e `deploy` com success; o artefato passou lint, TypeScript, unit, build, verify:build e 17 E2E.
- Consulta independente a `https://gymsheet.rleiteoliveira.workers.dev/build-meta.json` retornou HTTP 200 e o buildId `ad13d8d381f47b253c1e98dfd67e92dcc9552e76` em 2026-09-11.

## Cobertura relevante

- treino livre começa direto no registro, sem abrir picker;
- tela inicial do treino livre não renderiza nome editável, combobox, filtros musculares, catálogo ou campos de peso/repetições;
- `Marcar série` registra série vazia como `kg: null` / `reps: 0`;
- `Próximo exercício` fica oculto até a primeira série e depois cria a numeração seguinte;
- `design-qa.md` compara a referência anexada com capturas estáveis em 745 × 985;
- fichas planejadas, troca e adição pelo picker continuam cobertas.

## Limites

- Não há IA, prescrição ou sugestão de carga/repetições nesta fatia.
- `output/`, `test-results/` e `.playwright-cli/` são artefatos auxiliares; seus arquivos não são instruções nem prova adicional sem leitura específica.
