# Processo de entrega

- `context_level`: `PROCESS`
- `authority`: regras operacionais complementares a `AGENTS.md`

## Papéis

- Planejador: escreve ou atualiza um slice em `draft`; não implementa produto.
- Dono: expressa a intenção e promove o slice para `ready`; não é responsável por smoke manual.
- Executor: implementa somente o slice `ready`, marca `doing` durante o PR, estende o E2E quando o caminho feliz muda e não amplia o escopo.

## Estados de slice

| Estado | Significado | Pode executar? |
|---|---|---|
| `draft` | proposta ainda não autorizada | não |
| `ready` | o dono autorizou este recorte | sim, somente este recorte |
| `doing` | execução/PR em andamento | apenas a execução já iniciada |
| `done` | merge + CI verde | encerrado |
| `adiado` | decisão consciente de não executar agora | não |

Um `doing` antigo no índice não é autorização para um agente novo. O agente deve conferir [00-current-state.md](./00-current-state.md), branch, PR e evidência viva.

## Validação mínima

Quando o projeto oferecer os scripts, executar:

```text
npm test
npm run lint
npx tsc --noEmit
npm run build
npm run verify:build
npm run test:e2e
```

Registrar comando, data, resultado, escopo e limites em [30-validation.md](./30-validation.md). Build local não prova CI remoto; CI verde não prova produção sem comparar o artefato publicado com o commit.

## Branch e deploy

- Um desenvolvedor; sem `develop` e sem gitflow.
- Um slice = uma issue/P1 = um PR.
- Não fazer deploy, publicar, alterar secrets ou tocar produção sem autorização explícita e verificação separada.
- Issue #8 só governa CI/deploy; issue #1 é mapa de produto, não backlog implícito.
