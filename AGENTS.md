# GymSheet — bootstrap de agentes

Vale para Codex, Grok, Claude, Antigravity e qualquer outro agente. Este arquivo contém regras de trabalho estáveis; não é diário de branch, PR ou produção.

## Ordem de leitura

1. Este arquivo
2. [docs/context/README.md](docs/context/README.md)
3. [docs/context/00-current-state.md](docs/context/00-current-state.md)
4. [docs/context/10-contracts.md](docs/context/10-contracts.md) e [docs/context/20-delivery.md](docs/context/20-delivery.md), conforme a tarefa
5. [docs/slices/README.md](docs/slices/README.md)
6. O slice ativo indicado pelo estado atual
7. [docs/context/30-validation.md](docs/context/30-validation.md) antes de declarar validação

Issues, rollouts, memória global, `outputs/`, `work/`, `.playwright-cli/` e outros artefatos são evidência auxiliar ou histórico. Nunca use qualquer um deles sozinho para inferir branch, PR, deploy, produção, status de slice ou decisão atual.

## Anti-alucinação operacional

- No início de uma tarefa que possa alterar o repositório, observe `git status --short --branch`, branch, `HEAD`, `origin/main` e diffs existentes. Mudanças prévias pertencem ao dono; não as apague nem as reescreva.
- Separe sempre fato observado, contexto fornecido pelo usuário, hipótese e decisão. Claims com tempo — CI, PR, merge, produção, dependências e status de slice — precisam de evidência atual.
- Se o código, o worktree ou uma fonte viva contradisser `docs/context/00-current-state.md`, a evidência observada vence; atualize o contexto, não carregue o texto antigo adiante.
- `docs/context/history/` e a memória global servem para recuperar decisões antigas. Eles não autorizam execução nem substituem revalidação.
- A manutenção dos arquivos de contexto é bookkeeping obrigatório, não uma licença para ampliar o escopo do produto.

## Papéis e slices

- **Dono:** expressa o atrito ou pedido. Merge somente com CI verde. Não é QA manual do produto.
- **Planejador:** só grava ou atualiza um slice em `draft`.
- **Executor:** implementa somente um slice que o dono promoveu a `ready`; marca o slice como `doing` durante a execução, abre um PR e não pede smoke manual.
- `done` só significa merge + CI verde. Um `doing` antigo no índice é inventário a revalidar, não autorização automática para continuar.
- Um slice = uma issue (ou P1 dela) = um PR. Fora de **Faz** está proibido.
- Se não houver slice `ready` explicitamente selecionado para a tarefa, não implemente feature.

Prompts: [docs/prompts/planejador.md](docs/prompts/planejador.md) e [docs/prompts/executor.md](docs/prompts/executor.md).

## Invariantes do produto

- Um desenvolvedor. Sem `develop`, gitflow, D1 ou auth.
- Dados: IndexedDB + backup JSON versionado + CSV como projeção.
- O fluxo de hoje não muta sessão de outro dia. Calendário é a porta de correção.
- Dia = data civil **local**.
- `components/ui/*` não se refatora por estética.
- Produção: `https://gymsheet.rleiteoliveira.workers.dev`.
- Aceite de produto = CI verde. Não existe “smoke no Android do dono”.

## Limites de entrega

- Rode unit, lint, TypeScript, build, `verify:build` e E2E quando disponíveis e aplicáveis; registre o resultado em [docs/context/30-validation.md](docs/context/30-validation.md).
- [Issue #8](https://github.com/rleiteoliveira/gymsheet/issues/8) só entra em tarefas de CI/deploy.
- [Issue #1](https://github.com/rleiteoliveira/gymsheet/issues/1) é mapa histórico; não implementar a #1 por inferência.
- Não declare produção, deploy ou CI remoto a partir de build local.
