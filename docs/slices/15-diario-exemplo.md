# Slice 15 — diário de exemplo

- Issue: #15
- Status: done
- Cabe no próximo treino? sim — é o que destrava ver o app

## Faz

- [ ] `lib/demo-state.ts` com `buildDemoState(now = new Date()): AppState` e datas civis locais relativas a `now` (hoje, hoje-1, hoje-3, hoje-7, hoje-10)
- [ ] 3 fichas com emoji + nome (Peito + ombro, Costa, Perna); sem slot A/B/C
- [ ] sessões `completed` nesses dias, com `done` / `skipped` / `swapped` / `added`; skipped sem série, os outros com ≥1 série
- [ ] 1 sessão `in_progress` com `startedAt` = ontem ao meio-dia local; `todayPin` na ficha de peito
- [ ] aba Dados: botão “Carregar diário de exemplo” + confirm que substitui o IndexedDB via o mesmo caminho do restore; **não** roda no first load

## Não faz

- seed no boot
- D1, login, multi-perfil, #6, bump de schemaVersion, SW, CI, Playwright
- apagar cache do catálogo
- slice 13 (débito de histórico)

## Arquivos

- pode: `lib/demo-state.ts`, `lib/demo-state.test.ts`, `app/page.tsx` (aba Dados), `lib/calendar.ts` / `lib/session.ts` só se precisar de helper de noon já existente
- não toca: `lib/types.ts`, `lib/storage.ts` (salvo chamar `saveAppState` / restore já existentes), `public/sw.js`, `.github`

## Contrato de dados

- schemaVersion permanece 2
- seed é `AppState` válido; rebuild pode gerar IDs novos
- não persiste seed fora do IndexedDB do aparelho

## Testes

- vitest: ≥3 plans e sessões em ≥4 dias civis distintos para um `now` fixo
- vitest: existe `in_progress` no dia civil de ontem; existe `completed` com skipped e swapped
- vitest: `todayPin.kind === 'plan'`
- smoke (manual no PR): Dados → carregar exemplo → Hoje tem pin, calendário tem pontos, picker mostra favorito

## Débito

Nenhum neste slice.
