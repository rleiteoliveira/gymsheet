# Slice 41 — Palco e peles

- Issue / origem: pedido do dono em 2026-09-12; anel mentia limite; avaliar Calor/Studio/Pulse no celular
- Status: doing
- Cabe no próximo treino? sim — Começar e o número da série carregam a cara; o menu troca a pele.

## Direção

Layout Palco: home com nome grande e CTA de luz; sessão com o número da série no palco, sem anel. Três peles via tokens CSS (`calor`, `studio`, `pulse`). Seletor Aparência no menu, `localStorage`, fora do backup.

## Faz

- [x] Remover anel (`SessionRing`, CSS, e2e). Número da série no exercício ativo; ficha descreve `N de T séries` em texto.
- [x] Tokens por pele em `data-skin`: fundo, acento, glow, wash, raio do CTA. Default Calor (`#ff6a3d`).
- [x] Palco: título da home maior; CTA cápsula com highlight interno; exercício ativo com barra esquerda + wash, sem card extra.
- [x] Seletor Aparência no menu (antes da nav). `localStorage gymsheet-skin`; não entra no JSON de backup.
- [x] E2E: default Calor, contraste, marca série pelo número, troca para Pulse sem quebrar o treino, recarga mantém a pele.

## Não faz

- White-label de marca (logo, nome do app), recap, descanso, dock, dashboard, fonte externa, imagens.
- Schema, IndexedDB, `components/ui`.
- Pedir QA ao dono.

## Arquivos

- pode: `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `lib/skin.ts`, `lib/skin.test.ts`, `e2e/happy-path.spec.ts`, este slice, `docs/slices/README.md`, `docs/design/README.md`, `docs/context/`.
- não toca: `lib/types.ts`, `lib/storage.ts`, `lib/session.ts`, `components/ui/`, `package.json`, lockfile, `.github/`.
- remove: `app/components/session-ring.tsx`, `lib/session-ring.ts`, `lib/session-ring.test.ts`.

## Contrato de dados

- `schemaVersion` permanece 2.
- Pele não entra no backup JSON nem no IndexedDB.
- IDs, séries, `todayPin` iguais.

## Testes

- vitest: `parseSkin`, copy do número da série.
- e2e: anel ausente; `set-count` 0→1 no livre; ficha `N de T`; Pulse altera `--essential-heat` e sobrevive a recarga.
- `npm test`; `npm run lint`; `npx tsc --noEmit`; `npm run build`; `npm run verify:build`; `npm run test:e2e`.

## Débito

- Quando o dono escolher uma pele, uma fatia posterior pode travar e remover o seletor.
