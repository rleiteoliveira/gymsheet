# Estado atual — GymSheet

- `context_level`: `NOW`
- `observed_at`: 2026-09-12, America/Fortaleza
- Revalidar no início de cada tarefa; fatos vivos prevalecem sobre este snapshot.

## Checkout e entrega observados

- Branch `main` em `8e9c40d3191560b4579c02ff3d2a76f2aa3926ae` (slice 42 mesclado via PR #58).
- Limpeza de componentes e dependências órfãs executada sob pedido do dono (remoção de `components/ui/*`, `hooks/use-mobile.ts`, `lib/utils.ts`, `components.json` e 12 dependências não utilizadas).

## Produto no checkout

- Livre e ficha: Marcar série sem kg/reps. Sem rótulo de peso corporal.
- Toque na linha edita kg/reps e atualiza a mesma série.
- Alvo da ficha é dica.
- Zero dependências de UI órfãs; 100% dos testes e build validados.

## Limites

- Schema 2. `reps: 0` e `kg: null` significam não informado.
