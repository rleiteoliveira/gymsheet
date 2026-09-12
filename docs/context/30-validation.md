# Evidência de validação

- `context_level`: `EVIDENCE`
- `observed_at`: 2026-09-12, America/Fortaleza
- `scope`: slice 40 — cara de treino na home e na sessão
- `release_status`: publicado e verificado

## Última execução local registrada

| Comando | Resultado observado |
|---|---|
| `npm test` | 9 arquivos e 32 testes aprovados (inclui 3 de `lib/session-ring.test.ts`) |
| `npm run lint` | aprovado; 0 warnings e 0 errors |
| `npx tsc --noEmit` | aprovado |
| `npm run build` | aprovado |
| `npm run verify:build` | aprovado; artefato contém Worker, assets, build-meta e Service Worker |
| `npm run test:e2e` | 17 testes aprovados em 30,7 s após o CSS compacto; anel aberto 0→1 no livre, anel 0/1 e 1/1 na ficha, acento `#ff6a3d` no CTA, reduced-motion sem atraso |
| Playwright contra `http://127.0.0.1:8787` | CTA `rgb(255, 106, 61)` cápsula 999px com glow; palco ativo com borda/glow; anel 0→1 ao marcar; linha da série com `data-arriving` |

## Evidência remota

- PR [#55](https://github.com/rleiteoliveira/gymsheet/pull/55) squash-mergeado; SHA `3e0d30a7e2cc2e873f83c489d677e43c607fe889`.
- Run [34684392058](https://github.com/rleiteoliveira/gymsheet/actions/runs/34684392058): job `ci` success no PR; `deploy` skipped (só em `main`).
- Run [34684494232](https://github.com/rleiteoliveira/gymsheet/actions/runs/34684494232): `ci` e `deploy` success no push para `main`.
- Consulta independente a `https://gymsheet.rleiteoliveira.workers.dev/build-meta.json` retornou HTTP 200 e o buildId `3e0d30a7e2cc2e873f83c489d677e43c607fe889` em 2026-09-12.

## Cobertura relevante

- treino livre mostra anel aberto `0` e `1` sem `data-complete`;
- ficha mostra anel planejado `0/1` na partida e `1/1` após salvar série;
- contraste do CTA laranja com texto escuro permanece ≥ 4.5;
- recarga preserva IDs e valores; animação não entra no IndexedDB.

## Limites

- Chrome DevTools/wmux não estavam disponíveis neste ambiente; a verificação visual usou Playwright no servidor local.
- `output/` e `work/` são artefatos auxiliares.
