# Slice 45 — Neon contido na inicial

- Origem: atrito relatado pelo dono em 2026-09-14 — "o verde com efeito neon ficou estranho, principalmente na tela anterior, mas o gradiente em tela ta legal". Débito registrado no [slice 44](./44-palco-estavel.md).
- Issue: ainda não criada; o dono pediu a execução direta em 2026-09-14.
- Status: doing
- Cabe no próximo treino? sim — é a primeira tela de todo treino, e a correção é de apresentação apenas.

## Problema

Na inicial, duas camadas de verde se somam e a de baixo é recortada em retângulo:

| Fato | Fonte |
|---|---|
| `.essential-main` pinta `radial-gradient(ellipse 90% 50% at 50% 78%, var(--essential-wash), transparent 70%)` | `app/globals.css` |
| O mesmo `.essential-main` é `width: min(100%, 560px); margin: 0 auto` | `app/globals.css` |
| `.essential-start` ainda soma `box-shadow: 0 10px 36px var(--essential-heat-glow)` | `app/globals.css` |

Como o gradiente é pintado num elemento de largura limitada, ele termina em bordas retas: acima de 560 px de janela aparece um retângulo claro atrás do CTA, e o centro da elipse (78% da altura do `main`) se move conforme o conteúdo da inicial.

No palco a mesma tinta tem recipiente: `.essential-exercise.active` aplica o wash dentro de um cartão com `border-radius: var(--essential-stage-radius)`. É por isso que lá lê como gradiente. Esse cartão não é o problema e não muda.

## Faz

- [x] Mover o wash da inicial do `.essential-main` para o shell de largura total, de modo que o gradiente sangre até as bordas da janela em vez de terminar em retângulo; preservar `background-color` do shell para não alterar contraste.
- [x] Conter o halo do CTA da inicial reduzindo o `box-shadow` do `.essential-start`, sem alterar `--essential-heat-glow` nem `--essential-wash`.
- [x] Manter o palco intacto: `.essential-exercise.active`, o gradiente do cartão e o CTA da sessão continuam como estão, nas três peles.
- [x] Cobrir com E2E: o gradiente da inicial não fica em elemento de largura limitada, o `background-color` do shell continua o mesmo, o halo do CTA encolheu e contraste/alvos seguem válidos. Atualizar as capturas da composição mobile.

### Como ficou

- `.essential-home` passou a pintar `background-color: var(--essential-bg)` mais `background-image: radial-gradient(ellipse 110% 38% at 50% 26%, var(--essential-wash), transparent 70%)`. Como o shell tem largura total e `min-height: 100dvh`, a luz sangra até as bordas da janela e fica ancorada na faixa do título e do CTA. Separar `background-color` de `background-image` preserva a cor sólida que o teste de contraste do slice 41 lê.
- `.essential-main` não pinta mais nada: era ele, com `width: min(100%, 560px)`, que recortava a elipse em retângulo.
- `.essential-start` passou de `0 10px 36px var(--essential-heat-glow)` para `0 6px 18px color-mix(in srgb, var(--essential-heat-glow) 55%, transparent)`. A variável não mudou, então o cartão do palco e o CTA da sessão continuam iguais.
- Primeira tentativa ancorou a luz em `50% 96%` e ela ficou solta no rodapé, sem relação com o botão; a âncora em `26%` foi escolhida sobre captura.

## Não faz

- Trocar a cor de acento, os tokens das peles ou o seletor de aparência.
- Slice 44 (palco estável) e recortes C–E do slice 43.
- Mexer no gradiente do cartão do palco, no CTA da sessão ou na faixa de salvamento entregues no slice 43.
- Alterar hierarquia, texto, tipografia ou espaçamento da inicial além do necessário para retirar o gradiente do `main`.
- Tocar em persistência, `schemaVersion`, dados, build ou service worker.
- Pedir smoke manual ao dono. A aprovação estética dele vem depois, sobre a captura, e não bloqueia CI.

## Arquivos

- Pode: `app/globals.css`, `e2e/happy-path.spec.ts`, este slice, o índice e `docs/context/` para bookkeeping.
- Não toca: `app/page.tsx`, `lib/`, `public/`, `AGENTS.md`, `docs/design/README.md`, `package.json`, lockfile e `.github/`.

## Contrato de dados

- Nada muda. `schemaVersion` permanece 2, IndexedDB, IDs, horários e backup intactos. O slice é só folha de estilo.

## Testes

- vitest: nenhum. Não existe lógica nova.
- e2e: estender `e2e/happy-path.spec.ts` com asserções computadas sobre a inicial e regenerar as capturas existentes.

## Débito

- Julgamento estético final é do dono, sobre a captura. Se ainda ficar forte, o passo seguinte é reduzir `--essential-wash` na pele Neon, o que afeta também o cartão do palco e por isso não entra aqui.
- Slice 44 continua `draft`: o botão que muda de lugar é problema de composição, não de cor.
