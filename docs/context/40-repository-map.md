# Mapa do repositório

- `context_level`: `MAP`
- `purpose`: direcionar leitura sem transformar artefato em instrução

## Fonte de verdade por assunto

| Assunto | Fonte principal | Não usar como substituto |
|---|---|---|
| Regras para agentes | `AGENTS.md` | rollout ou memória |
| Estado do checkout | `docs/context/00-current-state.md` + `git` | nome de branch antigo |
| Contratos de produto/dados | `docs/context/10-contracts.md` + `docs/design/README.md` | mock rejeitado ou snapshot Grok |
| Processo de execução | `docs/context/20-delivery.md` + `docs/slices/README.md` | issue sem revalidação |
| Escopo de uma mudança | `docs/slices/NN-slug.md` ativo | outro slice “doing” |
| Validação | `docs/context/30-validation.md` + saída atual dos comandos | claim em PR/rollout antigo |
| UI | `app/`, `docs/design/`, E2E | `components/ui/*` sem necessidade explícita |
| Regras de domínio/dados | `lib/` e testes | texto de uma auditoria |
| Build/deploy | `package.json`, `scripts/`, `.github/workflows/ci.yml` | `dist/` ou `.wrangler/` gerados |

## Material histórico ou gerado

Os diretórios abaixo podem ser úteis para investigação, mas não entram no contexto automático de uma tarefa:

- `docs/context/history/`: snapshots e decisões encerradas;
- `outputs/`: auditorias e capturas ignoradas pelo Git;
- `work/`: rascunhos e scripts locais ignorados pelo Git;
- `.playwright-cli/`, `output/`, `test-results/`: capturas e resultados de execução;
- `.next/`, `.vinext/`, `dist/`, `.wrangler/`, `node_modules/`: gerados ou dependências.

Não mover ou apagar esses diretórios durante uma feature sem escopo explícito. Se um artefato histórico for promovido a evidência atual, copiar apenas a conclusão necessária para `30-validation.md` ou para um slice, com data e fonte.
