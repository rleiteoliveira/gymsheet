# Slice 34 — Ritual de partida

- Issue: pedido do dono em 2026-09-09
- Status: doing
- Cabe no próximo treino? sim — dá sensação de início sem ocupar a inicial com conteúdo novo.

Objetivo: transformar o clique em **Começar** em uma transição curta e clara para a sessão, preservando o fluxo essencial e os contratos existentes.

## Faz

- [x] Dar feedback imediato ao CTA com estado `Preparando treino…`, `aria-busy` e bloqueio contra duplo clique.
- [x] Animar a entrada da sessão e do picker usando a paleta e a composição v1 existentes, sem criar tela de pré-início.
- [x] Aplicar a mesma transição ao treino livre, ficha fixada e retomada de sessão; manter o picker como próximo passo do treino livre.
- [x] Respeitar `prefers-reduced-motion`, exibindo o destino sem atraso ou movimento quando solicitado.
- [x] Estender o E2E para provar a transição, o estado final e a preservação do estado persistido em viewport mobile.

## Não faz

- Contagem regressiva, som, haptics ou espera obrigatória antes do treino
- Dashboard, métricas, relógio, barra de progresso, navegação nova ou modal pré-início
- Catálogo, imagens, nomes/aliases, schema, IndexedDB, backup, CSV ou regras de sessão
- Refatorar `components/ui/*`, criar issue remota ou pedir smoke manual ao dono

## Arquivos

- pode: `app/page.tsx`, `app/globals.css`, `e2e/happy-path.spec.ts`, este slice, `docs/slices/README.md`
- não toca: `lib/`, `components/ui/`, `public/`, `package.json`, `package-lock.json`, `.github/`

## Contrato de dados

- `schemaVersion` permanece 2.
- IndexedDB, IDs, timestamps, `dateKey`, `todayPin`, backup, CSV e estados de sessão permanecem iguais.
- O estado da animação é somente de UI e não é persistido.

## Testes

- `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run verify:build`, `npm run test:e2e`
- E2E cobre treino livre, ficha fixada, entrada com movimento reduzido e leitura do estado final.
- Sem “smoke manual”.

## Débito

- Feedback animado ao salvar série fica fora deste slice.
