# Slice 42 — Série opcional

- Issue / origem: pedido do dono em 2026-09-12; kg/reps opcionais, sem peso corporal
- Status: doing
- Cabe no próximo treino? sim — marcar série no toque; preencher carga depois se quiser.

## Faz

- [x] Livre e ficha: **Marcar série** grava `kg: null` e `reps: 0`. Sem formulário na frente.
- [x] Linha da série sem “Peso corporal” nem “0 reps”; valores só quando existem.
- [x] Toque na linha abre kg/reps opcionais e **atualiza** a mesma série (id e `savedAt` iguais).
- [x] Na ficha, alvo aparece como dica, não como obrigação.
- [x] E2E: marca vazia nos dois fluxos, edição posterior persiste, recarga, sem o texto de peso corporal.

## Não faz

- Schema, catálogo/imagens, recap, descanso, `components/ui`.
- Pedir QA ao dono.

## Arquivos

- pode: `app/page.tsx`, `app/globals.css`, `lib/session.ts`, `lib/session.test.ts`, `lib/set-load.ts`, `lib/set-load.test.ts`, `e2e/happy-path.spec.ts`, este slice, `docs/slices/README.md`, `docs/design/README.md`, `docs/context/`.
- não toca: `lib/types.ts`, `lib/storage.ts`, `components/ui/`, `package.json`, lockfile.

## Contrato de dados

- `schemaVersion` 2. `SetRecord.kg` continua `null`; `reps` 0 significa “não informado”.
- `update-set` não cria série nem muda `savedAt`.

## Testes

- vitest: copy da carga; update-set preserva id/horário.
- e2e: livre e ficha marcam vazio; editar 80 kg / 8 reps; recarga; `Peso corporal` ausente na sessão.

## Débito

- Sugestão automática de carga fica fora.
