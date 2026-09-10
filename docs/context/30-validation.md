# Evidência de validação

- `context_level`: `EVIDENCE`
- `observed_at`: 2026-09-09, America/Fortaleza
- `scope`: worktree local do slice 34 e reorganização de contexto
- `release_status`: não publicado; CI remoto e produção não foram verificados nesta etapa

## Última execução local registrada

| Comando | Resultado observado |
|---|---|
| `npm test` | 7 arquivos e 24 testes aprovados |
| `npm run lint` | aprovado |
| `npx tsc --noEmit` | aprovado |
| `npm run build` | aprovado |
| `npm run verify:build` | aprovado; build ID `e4da73fdf250` |
| `npm run test:e2e` | 16 testes aprovados |
| `git diff --check` | sem erro de whitespace; apenas avisos de conversão LF/CRLF |

## Cobertura relevante

- treino livre, ficha fixada e retomada;
- entrada do picker/sessão com `data-starting`;
- `prefers-reduced-motion` sem atraso ou movimento;
- persistência do estado final no caminho E2E móvel;
- checagem visual local do fluxo pelo agente e aceitação visual informada pelo dono.

## Limites

- Estes resultados são de uma checkout local e não autorizam chamar o slice de `done`.
- Não há nesta entrada evidência de CI remoto, PR mergeado ou `build-meta.json` de produção para o slice 34.
- `output/`, `test-results/` e `.playwright-cli/` são artefatos auxiliares; seus arquivos não são instruções nem prova adicional sem uma leitura específica.

Após qualquer mudança de código, substituir esta entrada pelos resultados novos; não manter um “verde” antigo como se cobrisse um diff posterior.
