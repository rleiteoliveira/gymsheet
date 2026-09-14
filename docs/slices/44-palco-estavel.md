# Slice 44 — Palco estável

- Origem: atrito relatado pelo dono em 2026-09-14, com capturas do palco antes e depois de acumular séries e trocar de exercício.
- Issue: ainda não criada. A issue #44 existente é sobre imagens de exercícios (slice 33); o número deste slice não significa reutilizar essa issue.
- Status: draft
- Cabe no próximo treino? sim — o botão que o dedo repete muda de lugar a cada marca, no percurso principal.
- Recorte: é o **B** do roteiro em [slice 43](./43-plano-treino-solo.md). O recorte A (registro confiável) está `done`; C, D e E continuam sem slice.

## Atrito observado

O dono enviou duas capturas da mesma sessão, em janela estreita:

| Estado | Onde fica "Marcar série" |
|---|---|
| Exercício 2 com 6 séries | topo do botão por volta de 768 px |
| Exercício 3 com 0 séries, recém-selecionado | topo do botão por volta de 370 px |

São medições lidas das imagens, não instrumentadas; servem para reproduzir, não como valor de aceite. O aceite é a medição automatizada descrita em **Testes**.

Causa no checkout `cabafbd`:

| Fato | Fonte | Implicação |
|---|---|---|
| A lista de séries é renderizada dentro do cartão ativo, antes do bloco de ação | `app/page.tsx`, `renderSession`; `.essential-set-list` | Cada marca empurra o próximo toque para baixo. |
| O exercício ativo é ordenado para o topo e os demais viram lista abaixo | `app/page.tsx`, `orderedExercises` | Trocar de exercício reescreve a geometria da tela inteira. |
| Cabeçalho, lista, "Próximo exercício" e rodapé compartilham o mesmo fluxo vertical | `app/page.tsx`, `.essential-session-main` | Não existe posição reservada para a ação recorrente. |
| "Próximo exercício" só é renderizado depois da primeira série na sessão livre | `app/page.tsx`, `renderSession` | O botão entra no fluxo e desloca o rodapé quando aparece. |

## Faz

- [ ] Dar ao palco uma composição de altura estável na área visível: cabeçalho, palco do exercício ativo, área de consulta e barra de ação em regiões próprias, com a área central em `minmax(0, 1fr)`.
- [ ] Tirar a lista de séries do fluxo que antecede o CTA: ela passa a ocupar a área de consulta com rolagem própria, preservando ordem, horários, o toque que edita kg/reps e o destino da próxima marca.
- [ ] Reservar desde o começo o espaço de "Próximo exercício" e da faixa de estado de salvamento, mantendo a regra de habilitação atual — muda onde o botão fica, não quando ele aparece.
- [ ] Ao trocar de exercício, atualizar apenas o palco e o agrupamento ativo: sem rolar a página, sem animar altura e sem mover cabeçalho ou barra de ação.
- [ ] Cobrir com E2E que meça a posição dos controles em 390×844 e 360×800, com 10 séries em cada um de 5 exercícios; registrar evidência e limites em `docs/context/30-validation.md`.

## Não faz

- Recortes C, D e E do slice 43: trocar Começar/Retomar por Iniciar treino, encerramento estimado, metadados temporais, histórico que abre sessões concluídas, desfazer marca, desligamento de features e redução do legado.
- Ajustar o verde neon, o `--essential-wash` da home ou o `box-shadow` do CTA. Esse atrito é real e foi separado; ver **Débito**.
- Mudar quando "Próximo exercício" fica disponível, reordenar séries, renomear exercícios ou abrir editor.
- Alterar persistência, `schemaVersion`, IDs, horários, backup ou o contrato de concorrência entregues no recorte A.
- Refatorar `app/page.tsx` por estética, extrair componentes além do necessário para separar palco, consulta e ação, atualizar dependências ou mexer em build e service worker.
- Pedir smoke manual ao dono.

## Arquivos

- Pode: `app/page.tsx`, `app/globals.css`, um componente focado novo se ele for necessário para separar palco, consulta e ação, `e2e/happy-path.spec.ts`, este slice, o índice e `docs/context/` para bookkeeping.
- Não toca: `lib/types.ts`, `lib/storage.ts`, `lib/persistence.ts`, `lib/session.ts`, `lib/workout-time.ts`, catálogo, imagens, skins, `AGENTS.md`, `docs/design/README.md`, `public/`, `package.json`, lockfile e `.github/`.

## Contrato de dados

- `schemaVersion` permanece 2. Nenhum campo novo, nenhuma migração.
- IndexedDB, nome do banco, stores, IDs, `startedAt`, `completedAt`, `savedAt`, índices das séries, snapshots, planos e `todayPin` não mudam.
- A transação única de escrita, a confirmação após commit, o retry idempotente e a recusa de captura obsoleta continuam como entregues no recorte A. Este slice é apresentação.

## Testes

- vitest: só se aparecer transformação pura, como o cálculo da ordem estável de exibição. Não inventar teste de unidade para CSS.
- e2e: estender `e2e/happy-path.spec.ts`.
  - Com 10 séries em cada um de 5 exercícios, em 390×844 e 360×800, a caixa de "Marcar série" e a da barra de ação variam no máximo 1 CSS px entre estados assentados.
  - Clique repetido na mesma coordenada central do CTA, sem auto-scroll do locator: o número de séries persistidas é igual ao número de ativações.
  - Trocar de exercício não altera `scrollTop` da página nem a posição do cabeçalho.
  - Ler séries antigas e receber uma marca nova preserva o ponto de leitura.
  - 320×568, paisagem 844×390 e texto a 200%: sem corte, sem overflow horizontal, todos os controles alcançáveis; rolagem acessível é permitida quando a altura não comporta a composição.
- Não usar CLS como prova de estabilidade. Capturas antes/depois com viewport e seed definidos, salvas em artefato de teste.

## Débito

- Verde neon da inicial: o `radial-gradient` de `.essential-main` é recortado pelo `width: min(100%, 560px)` e soma com o `box-shadow` do `.essential-start`, virando um retângulo claro atrás do CTA. O mesmo `--essential-wash` dentro do cartão do palco lê bem. É fatia própria de aparência, não entra aqui.
- Continuar o treino pelo Histórico, encerramento estimado e desfazer marca permanecem no roteiro do slice 43.
- Medição de leitor de tela real continua fora de qualquer verificação automatizada.
