# Contratos estáveis do produto

- `context_level`: `STABLE`
- `authority`: contrato transversal; detalhes de uma entrega ficam no slice correspondente
- `change_policy`: mudar somente com decisão explícita e evidência de que o contrato atual dói

## Promessa e hierarquia

GymSheet serve para **iniciar o treino e treinar**: planejar fichas, registrar o que aconteceu e corrigir o histórico. A superfície principal deve ser esparsa, móvel e operacional.

- A inicial prioriza data, ficha selecionada e uma ação principal (`Começar`/`Retomar`).
- Secundárias ficam no menu ou no contexto da sessão.
- Não preencher o vazio com dashboard, métricas, slogan, dock persistente, card decorativo ou progresso inventado.
- Preservar o padrão visual v1 em [docs/design/README.md](../design/README.md); não reconstruir a partir de referências rejeitadas.

## Dados e tempo

- Sem login, D1 ou auth; dados vivem no dispositivo.
- Persistência: IndexedDB; backup completo em JSON versionado; CSV é projeção.
- `schemaVersion` permanece `2` salvo slice que peça mudança explícita.
- IDs, snapshots, séries, `todayPin`, status de sessão e timestamps são contratos, não detalhes descartáveis de UI.
- Dia significa data civil **local**.
- O fluxo de hoje não muta sessão de outro dia; calendário é a porta de correção retroativa.
- Fixtures/demonstrações precisam ser distinguíveis do uso real. Um registro de hoje não prova que o app foi usado pelo dono.

## Limites técnicos

- A implementação atual é a PWA em `app/` + `lib/`, com IndexedDB e publicação em Cloudflare Workers.
- Catálogo e fallback de imagens permanecem contratos separados do fluxo de sessão.
- `components/ui/*` não deve ser refatorado por estética.
- Não importar decisões, dependências ou dados do snapshot `feat/grok-app-builder` sem comparar contratos com este checkout.

Se uma ideia não cabe nesses contratos, ela precisa virar decisão/slice explícito; não deve aparecer por “melhoria óbvia” durante outra tarefa.
