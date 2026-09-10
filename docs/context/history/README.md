# Histórico de contexto

Esta pasta é arquivo, não instrução. Entradas aqui descrevem uma decisão, diagnóstico ou snapshot que já foi útil, mas não autorizam código, deploy, merge ou conclusão de slice.

## Regra de promoção

Uma conclusão histórica só volta ao contexto atual depois de ser confrontada com o checkout, a fonte viva ou os testes atuais. O agente deve copiar a conclusão revalidada para `00-current-state.md`, `10-contracts.md` ou `30-validation.md`, conforme o nível, e manter a referência histórica.

Não duplicar rollouts inteiros aqui. Guardar apenas decisões resumidas, com data, commit/escopo e motivo pelo qual a decisão continua ou deixou de valer.
