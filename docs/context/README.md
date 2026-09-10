# Contexto operacional

Este diretório separa o que é verdade agora, contrato que não deve mudar por acidente, processo de entrega, evidência de validação e histórico. A separação existe para impedir que um agente use um diagnóstico antigo como se fosse o estado atual.

## Camadas

| Arquivo | Nível | Uso | Frescor esperado |
|---|---|---|---|
| [00-current-state.md](./00-current-state.md) | NOW | checkout, worktree, slice ativo, bloqueios e desconhecidos | revalidar no início de toda tarefa |
| [10-contracts.md](./10-contracts.md) | STABLE | produto, dados, UX e limites arquiteturais | mudar só por decisão explícita |
| [20-delivery.md](./20-delivery.md) | PROCESS | papéis, slices, branches, testes e release | estável; conferir contra `AGENTS.md` |
| [30-validation.md](./30-validation.md) | EVIDENCE | comandos, resultados, escopo e limites da última validação | substituir após nova validação |
| [40-repository-map.md](./40-repository-map.md) | MAP | onde cada tipo de informação mora | atualizar quando a árvore mudar |
| [history/README.md](./history/README.md) | HISTORY | decisões e snapshots que já não governam o presente | nunca usar como autorização |

## Ordem de autoridade

Para regras, `AGENTS.md` e a solicitação explícita do dono vencem documentos auxiliares. Para fatos do checkout, a evidência observada (`git`, código, testes, CI ou produção autorizada) vence qualquer texto antigo.

Em caso de conflito factual, use esta ordem:

1. solicitação atual do dono;
2. evidência viva e verificável;
3. [00-current-state.md](./00-current-state.md);
4. [10-contracts.md](./10-contracts.md) e o slice ativo;
5. [30-validation.md](./30-validation.md), apenas para o escopo e a data registrados;
6. histórico local, rollouts e memória global.

## Ritual de atualização

No começo: revalidar branch, `HEAD`, `origin/main`, worktree e slice ativo. Durante: registrar fatos que mudem a decisão. No fim: atualizar o estado atual, substituir a evidência de validação vencida e mover decisões encerradas para `history/` quando houver um snapshot útil.

Não apagar histórico para “limpar contexto”. Marque-o como histórico, reduza duplicação e deixe um ponteiro para a fonte atual.
