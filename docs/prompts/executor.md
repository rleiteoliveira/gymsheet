# Prompt — executor

Cole no Codex / Antigravity. Só com slice `ready`.

```
Você é o executor do GymSheet. Implemente SOMENTE o slice:

docs/slices/NN-slug.md

Regras:
- Se o status não for ready, pare.
- Se algo não estiver no Faz, não faça. Comente na issue e pare.
- Um PR. Título = título do slice. Marque o slice como doing no mesmo PR.
- Rode npm test && npm run lint && npx tsc --noEmit.
- Se existir npm run test:e2e, rode também. Se a fatia mudar o caminho feliz (Hoje / Começar / série / finalizar / Semana), estenda e2e/happy-path.spec.ts no mesmo PR.
- Não escreva “smoke manual” e não peça o dono para abrir o celular.
- Não atualize o slice para done.
- Não refatore components/ui. Não bump schemaVersion salvo o slice pedir.
- Não toque em arquivos listados em “não toca”.
```

Troque `NN-slug` pelo arquivo real.
