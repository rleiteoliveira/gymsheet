# Slices

Contrato de execução. A issue é a intenção; o slice é o que o executor pode fazer.

Antes de usar este índice, leia [o estado atual do checkout](../context/00-current-state.md). A tabela abaixo é um inventário de slices; um `doing` antigo não é autorização automática para retomada. A autorização executável precisa estar indicada no estado atual e no slice promovido pelo dono.

## Regras

1. Planejador só grava slice. Executor só implementa slice com status `ready`.
2. Um slice = uma issue (ou um P1 dela) = um PR.
3. Fora do **Faz** está proibido, mesmo que pareça óbvio.
4. Débito consciente fica no slice como `adiado`. Não some.
5. Máximo 5 itens no Faz. Se passar, corte — não implemente.
6. Copie [docs/slices/_TEMPLATE.md](./_TEMPLATE.md). Nome: `NN-slug.md`.
7. O dono **não testa**. Aceite = CI verde (unit + e2e quando o slice 21 estiver `done`). “Smoke manual” é proibido no PR.

## Status

| Status | Quem muda | Significado |
|---|---|---|
| `draft` | planejador | ainda não executar |
| `ready` | dono | executor pode abrir PR |
| `doing` | executor | PR aberto |
| `done` | merge + CI verde | fechado |
| `adiado` | dono | conhecido, sem PR até doer |

## Índice

| Slice | Status | Issue / origem |
|---|---|---|
| [40-cara-de-treino](./40-cara-de-treino.md) | doing | pedido do dono em 2026-09-12 |
| [39-registro-minimo](./39-registro-minimo.md) | done | pedido do dono em 2026-09-11 |
| [38-registro-rapido](./38-registro-rapido.md) | done | pedido do dono em 2026-09-11 |
| [36-tempo-do-treino](./36-tempo-do-treino.md) | done | pedido do dono em 2026-09-10 |
| [35-treinar-com-leveza](./35-treinar-com-leveza.md) | done | pedido do dono em 2026-09-10 / #43 |
| [34-ritual-de-partida](./34-ritual-de-partida.md) | doing | pedido do dono |
| [33-imagens-exercicios-piloto](./33-imagens-exercicios-piloto.md) | draft | [#44](https://github.com/rleiteoliveira/gymsheet/issues/44) |
| [32-fluxo-principal-direto](./32-fluxo-principal-direto.md) | doing | [#43](https://github.com/rleiteoliveira/gymsheet/issues/43) |
| [30-padrao-essencial](./30-padrao-essencial.md) | doing | [#41](https://github.com/rleiteoliveira/gymsheet/issues/41) |
| [29-dados-backup](./29-dados-backup.md) | doing | [#39](https://github.com/rleiteoliveira/gymsheet/issues/39) |
| [28-historico-calendario](./28-historico-calendario.md) | doing | [#37](https://github.com/rleiteoliveira/gymsheet/issues/37) |
| [27-fichas-picker](./27-fichas-picker.md) | doing | [#35](https://github.com/rleiteoliveira/gymsheet/issues/35) |
| [26-sessao-essencial](./26-sessao-essencial.md) | doing | [#33](https://github.com/rleiteoliveira/gymsheet/issues/33) |
| [25-interface-essencial](./25-interface-essencial.md) | doing | [#30](https://github.com/rleiteoliveira/gymsheet/issues/30) |
| [24-deploy-continuo](./24-deploy-continuo.md) | doing | #8 |
| [23-hoje-foco-no-treino](./23-hoje-foco-no-treino.md) | done | #23 |
| [21-zero-qa-e2e](./21-zero-qa-e2e.md) | done | #21 |
| [18-comecar-agora](./18-comecar-agora.md) | done | #18 |
| [15-diario-exemplo](./15-diario-exemplo.md) | done | #15 |
| [13-debito-historico](./13-debito-historico.md) | adiado | #7 |

Quando criar um slice novo, acrescente uma linha aqui no mesmo PR do arquivo.
