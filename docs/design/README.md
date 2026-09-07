# Padrão visual v1 — Essencial

Linguagem visual viva do GymSheet. A inicial e o menu nasceram no [slice 25](../slices/25-interface-essencial.md); as telas seguintes (26–29) adotaram o mesmo padrão. Este arquivo reúne os tokens e as regras. O slice 25 permanece o contrato histórico da primeira entrega.

Referências: [mock da inicial](./references/25-essencial-inicial.png), [estrutura do menu](./references/25-essencial-menu.png), [veredito das variantes](./references/README.md).

## Tokens

| Papel | Valor |
|---|---|
| Fundo | `#11120f` |
| Superfície (menu, painel, sheet) | `#191a16` |
| Texto e botão principal | `#f2f0e8` |
| Texto secundário | `#a4a49a` |
| Divisor | `#30312c` |
| Texto no botão claro | `#11120f` |
| Erro | `#ff7b88`, só com texto de problema real |

Marca e nome do treino: serifada local (Georgia / Times). Corpo, campos e botões: sans de sistema. Números tabulares. Sem fonte externa.

Escala: marca 18 px; título 30–32 px; corpo e botões 16 px; data e metadados 14 px. Espaçamento 4/8/12/16/24/32/48. Margem mobile 24 px. Alvo 48×48; botão principal ≥ 52 px. Cantos ~10 px. Coluna ≤ 560 px.

Sem verde decorativo, degradê, brilho, sombra pesada, card dentro de card ou ícone para cada frase.

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
- Sessão: kg/reps no exercício ativo; pular/trocar/adicionar no card ativo; finalizar; calendário corrige o passado.
- Dados: JSON, CSV, restaurar e exemplo; catálogo só aqui.

## Fora deste padrão

- Programa (#6)
- Débito histórico ([slice 13](../slices/13-debito-historico.md) / #7)
- `components/ui/*` não se refatora por estética
