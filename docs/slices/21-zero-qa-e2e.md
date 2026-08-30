# Slice 21 — zero QA do dono (e2e no CI)

- Issue: #21
- Status: ready
- Cabe no próximo treino? não — destrava o dono de testar

## Faz

- [ ] Playwright + `@playwright/test` + Chromium. Script `npm run test:e2e`. CI (`ci.yml`, mesmo job `ci`) roda isso depois do build.
- [ ] Um spec `e2e/happy-path.spec.ts`: app sobe (preview do build ou wrangler da dist já usada no projeto); Começar treino → confirma → série feita se o botão existir → Finalizar se existir → navega até Semana e vê o calendário.
- [ ] Selectors estáveis: `data-testid` só nos botões do caminho feliz (começar, série feita, finalizar, tab semana). Não refatora UI.
- [ ] `docs/prompts/executor.md` e o template de slice: “smoke manual” some; fatia nova **estende** o spec se mudar o caminho feliz.
- [ ] README raiz: uma linha “o dono não testa; o CI clica”.

## Não faz

- #8 deploy auto, #6, slice 13, Percy, testes de SW, Android
- dezenas de specs
- pedir o dono para abrir o celular no PR

## Arquivos

- pode: `e2e/`, `playwright.config.ts`, `package.json`, `package-lock.json`, `.github/workflows/ci.yml`, `app/page.tsx` só `data-testid`, docs de prompt/slice/README
- não toca: `lib/types.ts`, `lib/storage.ts`, `lib/demo-state.ts`, `public/sw.js`

## Contrato de dados

- schemaVersion 2, IndexedDB de teste é o do browser do CI (vazio)

## Testes

- o próprio spec passando no job `ci` é o aceite

## Débito

PWA instalada / SW no Samsung continua sem cobertura. Aceito.
