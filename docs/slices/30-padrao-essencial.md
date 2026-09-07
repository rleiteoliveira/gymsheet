# Slice 30 — Consolidar o padrão essencial

- Issue: [#41](https://github.com/rleiteoliveira/gymsheet/issues/41) — não é a #1, #6, #7 nem #8.
- Status: doing
- Cabe no próximo treino? não — fecha a migração visual.

Direção do roteiro do slice 25, etapa 6: extrair o padrão v1, reunir tokens, retirar CSS proto sem consumidor. Sem nova reforma.

## Faz

- [ ] Gravar `docs/design/README.md` com tokens v1, regra de botões, navegação e estados. O slice 25 permanece o contrato histórico da inicial.
- [ ] Aplicar v1 aos leftovers: modal de sessão anterior, banner de atualização, toast, aviso de catálogo e tela de carregamento. Fundo da página `#11120f`.
- [ ] Usar as classes `essential-primary` / `essential-secondary` / `essential-quiet` também na sessão; remover as cópias `essential-session-*` de botão.
- [ ] Remover CSS proto sem consumidor (dock, métricas, cards lime, relógio, composer antigo, `.btn` lime). Preservar `exercise-image`, `hidden-input` e o bloco essencial. Não tocar `components/ui`.
- [ ] E2E existente continua: sessão anterior, catálogo offline, menu, persistência. Sem esperar dock, métricas ou chips lime.

## Não faz

- Fonte nova, paleta nova, mock Figma novo
- Slice 13, #6, schema, IndexedDB, CI, `components/ui`
- Pedir QA ao dono

## Arquivos

- pode: `app/page.tsx`, `app/globals.css`, `docs/design/README.md`, `docs/design/references/README.md`, `e2e/happy-path.spec.ts` se o seletor de overlay mudar, este slice, `docs/slices/README.md`
- não toca: `lib/`, `components/ui/`, `public/sw.js`, `package.json`, `.github/`

## Contrato de dados

- `schemaVersion` permanece 2
- Nenhum campo persistido novo
- Confirms e validações iguais

## Testes

- `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run verify:build`, `npm run test:e2e`
- Sem “smoke manual”

## Débito

- Slice 13 / #7
- Programa #6
