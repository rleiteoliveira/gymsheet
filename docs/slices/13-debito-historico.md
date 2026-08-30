# Slice 13 — débito do calendário (#13)

- Issue: #7
- Status: adiado
- Cabe no próximo treino? não — só se o dogfood doer

Merge consciente do PR #13. Não executar até uma sessão real mostrar o problema.

## Faz (quando virar `ready`)

- [ ] Confirm de uma frase na **primeira** mutação de sessão cujo `startedAt` é dia civil ≠ hoje
- [ ] Sessão `completed`: add/swap/undo não deixam `status: null` nem `added`/`swapped` sem série; ou bloqueia essas ações, ou salva correção atômica mantendo `completed`
- [ ] `completedAt` de sessão retroativa fica no mesmo dia civil local do `startedAt` (meio-dia local é aceitável)

## Não faz

- #6 programas
- Log de revisão / auditoria
- Mexer no emoji (`maxLength`, grapheme perfeito)
- Nova aba só para calendário

## Arquivos

- pode: `app/page.tsx`, `lib/session.ts`, testes em `lib/session.test.ts` / `lib/calendar.test.ts`
- não toca: `lib/types.ts`, `lib/storage.ts`, SW, CI

## Contrato de dados

- schemaVersion permanece 2
- IndexedDB sem migração de versão

## Testes

- vitest: primeira mutação em dia passado exige o ramo de confirmação (helper puro, se extrair)
- vitest: `completeSession` em startedAt retroativo não muda o dia civil do `completedAt`
- smoke: abrir dia ontem no calendário → editar série → ver confirm → sessão de hoje intacta

## Débito

Este arquivo *é* o débito.
