# Evidência de validação

- `context_level`: `EVIDENCE`
- `observed_at`: 2026-09-12, America/Fortaleza
- `scope`: slice 41 — Palco e peles
- `release_status`: validado localmente; CI/deploy pendentes do PR

## Última execução local registrada

| Comando | Resultado observado |
|---|---|
| `npm test` | 9 arquivos e 31 testes aprovados (`lib/skin.test.ts` no lugar do anel) |
| `npm run lint` | aprovado |
| `npx tsc --noEmit` | aprovado |
| `npm run build` | aprovado |
| `npm run test:e2e` | 18 testes aprovados em 39,2 s; anel ausente; `set-count` 0→1; Pulse altera `--essential-heat` e sobrevive à recarga; menu 320 px sem overflow |

## Limites

- Produção ainda não republicada nesta fatia.
