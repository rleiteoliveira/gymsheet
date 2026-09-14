# Estado atual — GymSheet

- `context_level`: `NOW`
- `observed_at`: 2026-09-14, America/Fortaleza
- Revalidar no início de cada tarefa; fatos vivos prevalecem sobre este snapshot.

## Checkout e entrega observados

- Branch `main` em `a3886535be5789b1407610063c0c1ac425e048e6` (ajuste Neon do slice 41 mesclado via PR #60; CI e deploy verdes).
- Limpeza de componentes e dependências órfãs executada sob pedido do dono (remoção de `components/ui/*`, `hooks/use-mobile.ts`, `lib/utils.ts`, `components.json` e 12 dependências não utilizadas).

## Produto no checkout

- Livre e ficha: Marcar série sem kg/reps. Sem rótulo de peso corporal.
- Toque na linha edita kg/reps e atualiza a mesma série.
- Alvo da ficha é dica.
- Acento padrão Neon `#b8f34a`; Studio e Pulse continuam disponíveis em Aparência. O identificador local `calor` foi preservado.
- Zero dependências de UI órfãs; 100% dos testes e build validados.

## Limites

- Schema 2. `reps: 0` e `kg: null` significam não informado.
