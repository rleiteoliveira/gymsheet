# Slice 26 — Sessão essencial

- Issue: [#33](https://github.com/rleiteoliveira/gymsheet/issues/33) — não é a #1, #6, #7 nem #8.
- Status: doing
- Cabe no próximo treino? sim — a sessão ainda está no proto; é a tela que o dono usa para registrar.

Direção aprovada na avaliação de 06/09/2026: padrão v1 da Essencial A na sessão. Pular/trocar/adicionar ficam. Relógio, barra %, chips visíveis e o modal pré-início saem. Sem mock novo; composição abaixo.

## Faz

- [ ] Aplicar o padrão v1 ao shell da sessão (voltar, nome, lista, compositor). Sem lime, card em card, relógio, barra % ou slogan. Tokens só nessa superfície.
- [ ] Uma ação principal: **Salvar série**, com kg/reps visíveis no exercício ativo. Pular / Trocar / Adicionar ficam no card ativo, não repetidos em todo exercício pendente. Finalizar quando não estiver compondo (secundário enquanto o compositor está aberto). Descartar separado, com o confirm atual.
- [ ] Começar livre: sem modal de nome/grupamento; cria a sessão com o nome sugerido civil local e abre o picker. Filtro de músculo permanece no picker.
- [ ] Esconder chips de status; manter `done` / `skipped` / `swapped` / `added` no dado, no CSV e nas regras de finalizar (série obrigatória em trocado/adicionado; pendentes viram pulado no confirm).
- [ ] E2E: livre e ficha; gravar série; pular/trocar/adicionar; sair/recarregar/retomar mesmo ID; finalizar; calendário continua acessível pelo menu. Sem esperar relógio, %, chip ou o diálogo “Começar treino”.

## Não faz

- Fichas, calendário, Dados, dashboard da semana (vão 27–29)
- Apagar skip/swap/add do domínio ou do CSV
- Slice 13, #6, schema, IndexedDB, `components/ui`, CI
- Fonte nova, mock Figma novo, conta, D1
- Pedir QA ao dono

## Arquivos

- pode: `app/page.tsx`, `app/globals.css`, `e2e/happy-path.spec.ts`, este slice, `docs/slices/README.md`
- não toca: `lib/`, `components/ui/`, `public/sw.js`, `package.json`, `package-lock.json`, `.github/`, configuração de build/deploy

## Contrato de dados

- `schemaVersion` permanece 2. IndexedDB, stores e backup iguais.
- Sessão livre continua `sourcePlanId: null` e não cria `Plan`.
- `todayPin` e `decideSessionStart` iguais.
- Relógio e % nunca foram persistidos.
- Status de exercício permanece no registro e no CSV.

## Testes

- `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run verify:build`, `npm run test:e2e`
- vitest existente de session/storage/catalog não quebra
- E2E: Começar livre deixa de preencher “Nome do treino”; persistência de ID e série permanece
- Sem “smoke manual”

## Débito

- Fichas, picker, calendário e Dados continuam no proto até 27–29
- Dashboard da semana (métricas, Top skipped/swapped/added) sai no slice 28
