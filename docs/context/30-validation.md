# Evidência de validação

- `context_level`: `EVIDENCE`
- `observed_at`: 2026-09-14, America/Fortaleza
- `scope`: slice 41 — acento padrão Neon lime e persistência das peles
- `release_status`: integrado em `main` e confirmado em produção

## Última execução local registrada

| Comando | Resultado observado |
|---|---|
| `npm test` | 10 arquivos e 34 testes aprovados |
| `npm run lint` | aprovado, sem erros |
| `npx tsc --noEmit` | aprovado, sem erros |
| `npm run build` | aprovado |
| `npm run verify:build` | aprovado, artefatos íntegros |
| `npm run test:e2e` | 18 testes aprovados em 38.3 s |

## CI, deploy e aplicação

- PR [#60](https://github.com/rleiteoliveira/gymsheet/pull/60) foi integrado por squash no commit `a3886535be5789b1407610063c0c1ac425e048e6`.
- Run [`34869315436`](https://github.com/rleiteoliveira/gymsheet/actions/runs/34869315436): `ci` verde e `deploy` verde; o deploy usou o artefato testado.
- `build-meta.json` público retornou HTTP 200 e `buildId` `a3886535be5789b1407610063c0c1ac425e048e6`.
- Inspeção visual em Chrome, viewport 390×844: `data-skin=calor`, rótulo Neon, `--essential-heat=#b8f34a`, botão `rgb(184, 243, 74)` com texto escuro; menu e sessão renderizados sem overflow aparente.

## Limites

- Deploy remoto acionado no push para `main`.
- O CI registrou somente o aviso de depreciação do Node.js 20 em actions de terceiros; nenhum job falhou.
