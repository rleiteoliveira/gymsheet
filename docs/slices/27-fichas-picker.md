# Slice 27 — Fichas e picker essenciais

- Issue: [#35](https://github.com/rleiteoliveira/gymsheet/issues/35) — não é a #1, #6, #7 nem #8.
- Status: doing
- Cabe no próximo treino? sim — escolher e montar a ficha ainda está no proto.

Direção da avaliação de 06/09/2026: padrão v1 da Essencial A em Fichas, editor e picker. Subabas e slogans saem. Pin, emoji, alvos e filtro de músculo ficam. Favoritos só ordenam.

## Faz

- [ ] Fichas no padrão v1: lista, criar, editar, fixar e excluir. Sem slogan e sem subabas Fichas|Sessões. Histórico segue pelo menu, com a lista atual até o slice 28.
- [ ] Editor de ficha no padrão v1: nome, emoji opcional, alvos de séries/reps/kg, ordem e remover. Sem lede. **Salvar ficha** é a ação principal. Alvos 48 px e rótulo acessível em subir/descer/remover.
- [ ] Picker no padrão v1: busca e filtro de músculo. Favoritos só ordenam a lista; sem “N× nos últimos 30 dias”. Imagem do exercício pode permanecer no picker.
- [ ] Textos de ação visíveis: Fixar/Desafixar, Editar, Excluir, Nova ficha. Sem ícone-só sem nome acessível. `todayPin` e o gesto explícito de fixar não mudam de semântica.
- [ ] E2E: menu abre Fichas com título próprio; criar ficha pelo editor e picker; fixar sem criar sessão; picker na sessão sem texto de ranking; Histórico continua acessível pelo menu.

## Não faz

- Calendário, dashboard da semana, Dados
- Redesign visual da lista de Histórico (slice 28)
- Apagar pin, emoji, alvos, busca, filtro ou ranking silencioso
- Slice 13, #6, schema, IndexedDB, `components/ui`, CI
- Fonte nova, conta, D1, pedir QA ao dono

## Arquivos

- pode: `app/page.tsx`, `app/globals.css`, `e2e/happy-path.spec.ts`, este slice, `docs/slices/README.md`
- não toca: `lib/`, `components/ui/`, `public/sw.js`, `package.json`, `package-lock.json`, `.github/`

## Contrato de dados

- `schemaVersion` permanece 2
- `Plan`, `todayPin` e snapshots de exercício iguais
- Picker não grava favoritos; só lê `computeFavoriteScores`
- Backup JSON e CSV inalterados

## Testes

- `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run verify:build`, `npm run test:e2e`
- Sem “smoke manual”

## Débito

- Histórico e calendário (28), Dados (29), consolidação de tokens (30)
