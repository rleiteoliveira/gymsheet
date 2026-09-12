# Padrão visual v1 — Essencial

Linguagem visual viva do GymSheet. A inicial e o menu nasceram no [slice 25](../slices/25-interface-essencial.md); as telas seguintes (26–29) adotaram o mesmo padrão. Este arquivo reúne os tokens e as regras. O slice 25 permanece o contrato histórico da primeira entrega.

Referências: [mock da inicial](./references/25-essencial-inicial.png), [estrutura do menu](./references/25-essencial-menu.png), [veredito das variantes](./references/README.md).

## Tokens

| Papel | Valor |
|---|---|
| Fundo | `#11120f` |
| Superfície (menu, painel, sheet) | `#191a16` |
| Texto | `#f2f0e8` |
| Texto secundário | `#a4a49a` |
| Divisor | `#30312c` |
| Acento de treino | Pele Calor `#ff6a3d`; Studio creme; Pulse `#ff2d1a`. CTA, barra do palco e confirmação de série |
| Texto no botão de treino | `--essential-heat-text` |
| Erro | `#ff7b88`, só com texto de problema real |

Peles: `calor` (default), `studio`, `pulse`. Troca em Aparência no menu; `localStorage gymsheet-skin`; fora do backup.

Marca e nome do treino: serifada local (Georgia / Times), título da home ~44 px. Corpo, campos e botões: sans de sistema. Números tabulares. Sem fonte externa.

Escala: marca 18 px; título da home 36–44 px; corpo e botões 16 px; data e metadados 13–14 px. Espaçamento 4/8/12/16/24/32/48. Margem mobile 24 px. Alvo 48×48; CTA de treino ≥ 56 px. Coluna ≤ 560 px.

Glow e wash só no CTA e no exercício ativo. Sem anel, dock, card dentro de card ou métrica inventada. O progresso visível é o número da série.

## Botões

Toda ação visível precisa de tarefa, estado, por que não está no menu, o que substitui e como se lê por texto/teclado/leitor.

| Tipo | Onde |
|---|---|
| Próxima ação principal | Uma, preenchida: Começar, Retomar, Salvar série, Salvar ficha, Baixar JSON |
| Escolha de treino | Nome com seta, na inicial |
| Navegação secundária | Menu: Treino, Fichas, Histórico, Calendário, Dados e backup |
| Operação menos frequente | No contexto (Pular, Trocar, Fixar, Restaurar) |
| Destrutiva | Separada, com confirm existente |
| Falha | Texto + ação só quando há problema |

Textos descrevem ações. Sem slogan no estado normal.

## Estados

- Inicial: ficha fixada, treino livre, retomar hoje, concluída volta à composição normal, sessão de outro dia exige decisão explícita.
- Sessão: marcar série no toque; kg/reps opcionais na linha depois; pular/trocar/adicionar no exercício ativo; finalizar; calendário corrige o passado. Sem rótulo de peso corporal na série vazia.
- Dados: JSON, CSV, restaurar e exemplo; catálogo só aqui.

## Fora deste padrão

- Programa (#6)
- Débito histórico ([slice 13](../slices/13-debito-historico.md) / #7)
- `components/ui/*` não se refatora por estética
