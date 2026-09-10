# Evidência de validação

- `context_level`: `EVIDENCE`
- `observed_at`: 2026-09-10, America/Fortaleza
- `scope`: slice 36 — Tempo do treino
- `release_status`: publicado; PR #48 mergeado e deploy verificado

## Última execução local registrada

| Comando | Resultado observado |
|---|---|
| `npm test` | 8 arquivos e 27 testes aprovados |
| `npm run lint` | aprovado |
| `npx tsc --noEmit` | aprovado |
| `npm run build` | aprovado |
| `npm run verify:build` | aprovado no artefato local |
| `npm run test:e2e` | 17 testes aprovados em viewport móvel; horário de séries, recarga/retomada, duração congelada, seletor, duas séries, ações recolhidas, feedback e movimento reduzido cobertos |
| `git diff --check` | sem erro de whitespace; apenas avisos de conversão LF/CRLF |

## Evidência remota

- Validação local do slice 36 (2026-09-10): `npm test` (8 arquivos, 27 testes), `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run verify:build` e `npm run test:e2e` (17 testes) concluídos com sucesso. Cobertura adicionada para horário de séries, recarga/retomada e intervalo congelado após conclusão.

- Entrega do slice 36 (2026-09-10): PR [#48](https://github.com/rleiteoliveira/gymsheet/pull/48) mergeado em `99d7f99fcab54978951f06f22166623851efb28c`. Run [34503773215](https://github.com/rleiteoliveira/gymsheet/actions/runs/34503773215) concluiu `ci` e `deploy` com success; `scripts/verify-production-build.mjs` confirmou o mesmo buildId em `https://gymsheet.rleiteoliveira.workers.dev` e a consulta independente retornou HTTP 200.
- Avaliação pós-deploy: o navegador publicado exibiu `Tempo de treino`, avançou de `260:41:42` para `260:41:43` sem interação, mostrou o horário local `17:07` da série existente e, após recarga e retomada da sessão, recalculou o tempo. A avaliação foi somente leitura sobre uma sessão já existente; não houve registro, descarte ou alteração de dados do usuário. Nenhum ajuste funcional foi necessário.

## Cobertura relevante

- seletor de treino livre/ficha sem criar sessão e gestão separada;
- treino livre, ficha fixada e retomada;
- um exercício ativo expandido e demais exercícios compactos;
- duas séries persistidas, feedback textual e ações secundárias recolhidas;
- entrada do picker/sessão com `data-starting` e `prefers-reduced-motion` sem atraso;
- persistência do estado final no caminho E2E móvel;
- captura local inspecionada para a inicial e o seletor de treino.

## Limites

- A verificação remota cobre o commit `99d7f99fcab54978951f06f22166623851efb28c`; revalidar caso `main` receba outra alteração.
- `output/`, `test-results/` e `.playwright-cli/` são artefatos auxiliares; seus arquivos não são instruções nem prova adicional sem uma leitura específica.

Após qualquer mudança de código, substituir esta entrada pelos resultados novos; não manter um “verde” antigo como se cobrisse um diff posterior.
