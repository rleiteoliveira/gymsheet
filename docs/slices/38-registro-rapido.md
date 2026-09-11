# Slice 38 — registro rápido como companion

- Issue: pedido do dono em 2026-09-11
- Status: done
- Cabe no próximo treino? sim

## Faz

- [x] Iniciar treino livre sem nome obrigatório, usando `Treino · dia data` como placeholder persistente da interface.
- [x] Abrir o treino livre já com `Exercício 1` e criar os próximos exercícios numerados.
- [x] Permitir nome livre ou escolha do catálogo por combobox editável, com filtros múltiplos por grupo muscular.
- [x] Manter peso e repetições vazios no treino livre e salvar a série sem preenchimento como peso corporal e zero repetições.
- [x] Cobrir o caminho rápido com unit e E2E e publicar apenas o artefato validado.

## Não faz

- Não adiciona IA, prescrição, sugestão de carga/repetições ou alteração de fichas planejadas.
- Não altera o schema, autenticação, D1, Workbox, `develop` ou `components/ui`.
- Não transforma o nome sugerido em dado salvo quando o usuário não digitou um nome.
- Não remove o picker de catálogo dos fluxos de ficha e troca de exercício.

## Arquivos

- pode: `app/page.tsx`, `app/globals.css`, `lib/session.ts`, `lib/session.test.ts`, `e2e/happy-path.spec.ts`, documentação do slice e validação.
- não toca: `lib/types.ts`, salvo se o contrato existente se provar insuficiente.

## Contrato de dados

- `schemaVersion` permanece 2.
- Treino livre sem nome continua com `sourcePlanName: null`; a marca d’água deriva de `startedAt` no dia civil local.
- O exercício inicial é um snapshot local não planejado; séries livres continuam usando `kg: null` e `reps: 0` quando os campos ficam vazios.

## Testes

- vitest: criação do starter, renomeação do exercício e série vazia.
- e2e: iniciar sem modal, editar nome/exercício, marcar Peito + Pernas, salvar série vazia, adicionar Exercício 2 e recarregar.

## Débito

- Regras futuras de sugestão de carga/repetições ficam adiadas até existir uso observado.
