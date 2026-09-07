# Slice 29 — Dados e backup essenciais

- Issue: [#39](https://github.com/rleiteoliveira/gymsheet/issues/39) — não é a #1, #6, #7 nem #8.
- Status: doing
- Cabe no próximo treino? não é o treino, mas fecha a migração visual das telas.

Direção da avaliação de 06/09/2026: padrão v1. JSON, CSV, restore e exemplo ficam. Sem conta, sem nuvem, sem slogan.

## Faz

- [ ] Dados no padrão v1: título **Dados**, sem lede “Seu histórico é seu” e sem aviso de publicação/conta.
- [ ] Ações com rótulos diretos: **Baixar JSON**, **Baixar CSV**, **Restaurar JSON** (confirm atual), **Carregar exemplo** (confirm atual). Restaurar continua validando antes de substituir.
- [ ] Catálogo nesta tela: fonte, última cópia, **Atualizar** e link Free Exercise DB. Status rotineiro não volta para a inicial.
- [ ] Uma linha junto de restaurar: substitui os dados deste aparelho. Sem transformar a área em conta ou nuvem.
- [ ] E2E: menu abre Dados; JSON e CSV visíveis; catálogo offline avisa na inicial e o status permanece em Dados.

## Não faz

- Consolidar tokens / apagar CSS denso sem consumidor (slice 30)
- Auth, sync, D1, schema, IndexedDB, `components/ui`, CI
- Mudar o exportador CSV ou o parser de backup
- Pedir QA ao dono

## Arquivos

- pode: `app/page.tsx`, `app/globals.css`, `e2e/happy-path.spec.ts`, este slice, `docs/slices/README.md`
- não toca: `lib/`, `components/ui/`, `public/sw.js`, `package.json`, `.github/`

## Contrato de dados

- `schemaVersion` permanece 2
- Backup JSON versionado e compatível; CSV continua projeção
- Confirms de restore e diário de exemplo permanecem
- Catálogo fallback/cache/live inalterado

## Testes

- `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run verify:build`, `npm run test:e2e`
- Sem “smoke manual”

## Débito

- Slice 30: extrair padrão v1, tokens únicos, CSS denso sem consumidor
