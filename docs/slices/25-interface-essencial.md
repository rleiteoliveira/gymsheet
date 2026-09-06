# Slice 25 — Interface essencial

- Issue: [#30](https://github.com/rleiteoliveira/gymsheet/issues/30) — não é a #1, #6, #7 nem #8.
- Status: draft
- Cabe no próximo treino? sim — a primeira entrega simplifica a entrada e recolhe a navegação secundária.
- Direção visual aprovada pelo dono em 06/09/2026. Confirmada no mesmo dia após PoC de quatro variantes: a base de execução é a **Essencial (A)**. A confirmação não promove este plano a `ready`.

## Objetivo e referência aprovada

Abrir o GymSheet, identificar o treino e começar. A tela inicial contém marca discreta, menu no canto esquerdo, data pequena, nome do treino com seletor e uma ação principal. O espaço vazio é intencional; não deve ser preenchido com atalhos, estatísticas ou explicações.

A referência principal é a variante **Essencial (A)**: fundo escuro uniforme, texto marfim, título serifado, botão claro “Começar” e nenhuma barra inferior. O menu lateral aprovado anteriormente permanece como padrão de navegação, adaptado à nova paleta sóbria.

Veredito do dono após o laboratório de 06/09/2026 (ver [docs/design/references/README.md](../design/references/README.md)):

- Essencial (A) — base. Já era o contrato deste slice; segue.
- Dock (B) — descartada para esta entrega e para PoC adicional.
- Densa (C) — pior das quatro; descreve o antes, não o alvo.
- Extrema (D) — fora. O vazio sem conteúdo parece abandono. Só revisitar se um slice futuro ocupar esse espaço com histórico e uma transição explícita; não preencher a inicial do 25 “para não ficar vazia”.

- [Comparativo no Figma](https://www.figma.com/design/jKvskdHKH4roQWDPe2RPkJ/GymSheet?node-id=2-2): a reconstrução no nó `3:8` fundamenta a linguagem visual. A data gigante e a barra inferior dessa referência não fazem parte da direção final.
- Mock final aprovado, arquivo local: `C:/Users/rafao/.codex/generated_images/01a074a1-d025-72e3-b22d-61711d43c646/exec-029a1456-354b-4b65-8694-bd0e3b6e4b16.png`.
- Menu aprovado, arquivo local: `C:/Users/rafao/.codex/generated_images/01a074a1-d025-72e3-b22d-61711d43c646/exec-1850eb98-0bba-4b0c-9df9-e89136f4147b.png`. Referência de estrutura e comportamento; não reutilizar seu verde nem a densidade da tela de treino ao fundo.
- Os mocks usam dados ilustrativos. “Peito” e a data não são valores fixos do produto.

Antes da execução, guardar cópias desses dois mocks em `docs/design/references/` e trocar os caminhos locais por links relativos neste documento. Se os arquivos não estiverem disponíveis, recuperar a referência aprovada; não reconstruí-la a partir de uma opção anterior. Esta preparação faz parte da entrega documental do primeiro slice, sem criar dependência de publicação no Figma.
