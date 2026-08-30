# Slices

Contrato de execução. A issue é a intenção; o slice é o que o executor pode fazer.

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

| Slice | Status | Issue |
|---|---|---|
| [23-hoje-foco-no-treino](./23-hoje-foco-no-treino.md) | ready | #23 |
| [21-zero-qa-e2e](./21-zero-qa-e2e.md) | ready | #21 |
| [18-comecar-agora](./18-comecar-agora.md) | doing | #18 |
| [15-diario-exemplo](./15-diario-exemplo.md) | done | #15 |
| [13-debito-historico](./13-debito-historico.md) | adiado | #7 |

Quando criar um slice novo, acrescente uma linha aqui no mesmo PR do arquivo.
