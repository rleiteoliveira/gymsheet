# Evidência de validação

- `context_level`: `EVIDENCE`
- `observed_at`: 2026-09-10, America/Fortaleza
- `scope`: worktree local do slice 35 — Treinar com leveza
- `release_status`: aguardando PR, CI remoto, merge e deploy

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

## Cobertura relevante

- seletor de treino livre/ficha sem criar sessão e gestão separada;
- treino livre, ficha fixada e retomada;
- um exercício ativo expandido e demais exercícios compactos;
- duas séries persistidas, feedback textual e ações secundárias recolhidas;
- entrada do picker/sessão com `data-starting` e `prefers-reduced-motion` sem atraso;
- persistência do estado final no caminho E2E móvel;
- captura local inspecionada para a inicial e o seletor de treino.

## Limites

- Estes resultados ainda são do checkout local; não chamar o slice de `done` até merge + CI verde.
- CI remoto, PR, merge e `build-meta.json` de produção do slice 35 ainda precisam ser verificados.
- `output/`, `test-results/` e `.playwright-cli/` são artefatos auxiliares; seus arquivos não são instruções nem prova adicional sem uma leitura específica.

Após qualquer mudança de código, substituir esta entrada pelos resultados novos; não manter um “verde” antigo como se cobrisse um diff posterior.
