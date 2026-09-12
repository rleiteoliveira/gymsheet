# Evidência de validação

- `context_level`: `EVIDENCE`
- `observed_at`: 2026-09-12, America/Fortaleza
- `scope`: limpeza de componentes e dependências órfãs
- `release_status`: validado localmente; pronto para commit na main

## Última execução local registrada

| Comando | Resultado observado |
|---|---|
| `npm run lint` | aprovado (26 arquivos, 0 erros e 0 avisos em 5.8s) |
| `npx tsc --noEmit` | aprovado (0 erros) |
| `npm test` | 10 arquivos e 34 testes aprovados (983ms) |
| `npm run build` | aprovado (build client caiu de 11.2s para 4.6s) |
| `npm run verify:build` | aprovado (artefatos de produção íntegros) |
| `npm run test:e2e` | 18 testes aprovados em 39.3 s (sem regressões) |

## Limites

- Deploy remoto acionado no push para `main`.
