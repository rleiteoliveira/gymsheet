# Slice 24 — deploy contínuo em main

- Issue: #8
- Status: doing
- Cabe no próximo treino? sim — a produção precisa refletir o `main`

## Faz

- [ ] Manter o CI atual e, somente no push para `main` após o job `ci` verde, publicar o artefato `dist/` testado em Cloudflare Workers usando `cloudflare/wrangler-action`.
- [ ] Validar o contrato do artefato antes do upload e verificar depois do deploy que a produção serve o `buildId` do commit; não expor ou persistir secrets.
- [ ] Reconciliar o índice e os status dos slices já mergeados e documentar no README o fluxo CI → deploy e os dois secrets necessários.

## Não faz

- preview por PR, GitHub Pages, Workers Builds ou alteração de plataforma neste PR
- D1, R2, KV, auth, sync, migração de dados ou mudança de `schemaVersion`
- refatorar `components/ui`, alterar a lógica do treino ou reescrever o Service Worker
- smoke manual no Android ou pedir QA ao dono
- branch `develop`, release/hotfix ou aprovação humana obrigatória

## Arquivos

- pode: `.github/workflows/ci.yml`, `scripts/verify-build-output.mjs`, `scripts/verify-production-build.mjs`, `package.json`, `README.md`, `AGENTS.md`, `docs/slices/`
- não toca: `app/`, `lib/`, `lib/types.ts`, `.openai/hosting.json`, `public/sw.js`, `components/ui/`

## Contrato de dados

- `AppState` continua sendo a fonte no IndexedDB; nenhum dado do aparelho é enviado ao deploy
- `schemaVersion` permanece 2; JSON e CSV permanecem inalterados
- `public/sw.js` continua com cache versionado pelo build, navegação network-first e atualização sem apagar IndexedDB
- o artefato publicado é o mesmo `dist/` validado pelo CI

## Testes

- `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run verify:build` e `npm run test:e2e`
- `npx wrangler deploy dist/server/index.js --config dist/server/wrangler.json --dry-run --no-bundle`
- job `deploy` somente após `ci`, seguido de verificação com `build-meta.json` sem cache

## Débito

- proteção de branch `main` e configuração dos secrets são pré-condições administrativas do repositório; o workflow não cria nem altera essas configurações.
