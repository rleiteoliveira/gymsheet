# Evidência de validação

- `context_level`: `EVIDENCE`
- `observed_at`: 2026-09-12, America/Fortaleza
- `scope`: slice 40 — cara de treino na home e na sessão
- `release_status`: validado localmente; CI/deploy pendentes do PR

## Última execução local registrada

| Comando | Resultado observado |
|---|---|
| `npm test` | 9 arquivos e 32 testes aprovados (inclui 3 de `lib/session-ring.test.ts`) |
| `npm run lint` | aprovado; 0 warnings e 0 errors |
| `npx tsc --noEmit` | aprovado |
| `npm run build` | aprovado |
| `npm run verify:build` | aprovado; artefato contém Worker, assets, build-meta e Service Worker |
| `npm run test:e2e` | 17 testes aprovados em 33,1 s; anel aberto 0→1 no livre, anel 0/1 e 1/1 na ficha, acento `#ff6a3d` no CTA, reduced-motion sem atraso |
| Playwright contra `http://127.0.0.1:8787` | CTA `rgb(255, 106, 61)` cápsula 999px com glow; palco ativo com borda/glow; anel 0→1 ao marcar; linha da série com `data-arriving` |

## Cobertura relevante

- treino livre mostra anel aberto `0` e `1` sem `data-complete`;
- ficha mostra anel planejado `0/1` na partida e `1/1` após salvar série;
- contraste do CTA laranja com texto escuro permanece ≥ 4.5;
- recarga preserva IDs e valores; animação não entra no IndexedDB.

## Limites

- Não foi possível abrir Chrome DevTools/wmux neste ambiente; a verificação visual usou Playwright no servidor local.
- `output/` e `work/` são artefatos auxiliares.
- Produção ainda não foi republicada nesta fatia.
