# Slice 40 — Cara de treino

- Issue / origem: pedido do dono em 2026-09-12; PoC visual da home e da sessão
- Status: done
- Cabe no próximo treino? sim — Começar tem presença; cada série move o anel.

## Direção

Identidade de app de treino nas duas telas do fluxo principal, sem recap, descanso ou dashboard. Base olive/creme permanece. Acento quente `#ff6a3d` e glow só no CTA, no exercício ativo e no gesto de marcar/salvar série. Anel do exercício ativo: ficha = feitas / `targetSets`; treino livre = arco que cresce por marca, sem meta inventada.

## Faz

- [x] Tokens: `--essential-heat` `#ff6a3d`, glow radial no CTA e no exercício ativo. Atualizar `docs/design/README.md`.
- [x] Home: data → título → CTA em stagger; CTA cápsula com acento + glow; press elástico em Começar/Retomar.
- [x] Sessão: exercício ativo como palco (nome maior, borda/glow). Anel SVG no ativo; ficha usa `targetSets`; livre cresce sem completar uma meta falsa.
- [x] Marcar/Salvar série: compressão do botão, tick no anel, linha da série entra; “Série salva” permanece. Sem espera para o próximo toque. Estado de animação não persiste.
- [x] `prefers-reduced-motion` mostra o estado final. E2E cobre home (acento), marca no livre, salva na ficha, IDs/valores após recarga e movimento reduzido.

## Não faz

- Tela de recap, confete, som, descanso, dock, dashboard, fonte nova, imagens (#44).
- Menu, fichas, calendário e dados não mudam de layout.
- D1, auth, schema, `components/ui`, dependências novas.
- Pedir QA ao dono.

## Arquivos

- pode: `app/page.tsx`, `app/globals.css`, `app/components/session-ring.tsx`, `lib/session-ring.ts`, `lib/session-ring.test.ts`, `e2e/happy-path.spec.ts`, este slice, `docs/slices/README.md`, `docs/design/README.md`, `docs/context/` (estado e evidência).
- não toca: `lib/types.ts`, `lib/storage.ts`, `lib/session.ts`, `components/ui/`, `public/`, `package.json`, lockfile, `.github/`.

## Contrato de dados

- `schemaVersion` permanece 2.
- IndexedDB, IDs, snapshots, séries, `todayPin`, backup e CSV iguais.
- Anel e motion são só de UI; não gravam progresso, meta semanal nem timestamps novos.
- Treino livre continua sem `targetSets`; o arco aberto não inventa objetivo.

## Testes

- vitest: razão do anel planejado, arco aberto, alvo ausente e contagens inválidas.
- e2e: acento na home, anel 0/N → N/N na ficha, anel 1 e 2 no livre, recarga preserva IDs, reduced-motion sem atraso.
- `npm test`; `npm run lint`; `npx tsc --noEmit`; `npm run build`; `npm run verify:build`; `npm run test:e2e`.

## Débito

- Recap ao finalizar e timer de descanso ficam para fatias seguintes.
- Slice promovido a `ready` pelo dono em 2026-09-12 (“aplicar o plano e mergear”).
- Concluído após PR #55, CI/deploy verdes e buildId de produção `3e0d30a7e2cc2e873f83c489d677e43c607fe889`.
