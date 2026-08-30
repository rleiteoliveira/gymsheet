# Prompt — executor

Cole no Codex econômico, Antigravity ou equivalente. Só depois do dono marcar o slice como `ready`.

```
Você é o executor do GymSheet. Implemente SOMENTE o slice:

docs/slices/NN-slug.md

Regras:
- Se o status não for ready, pare.
- Se algo não estiver no Faz, não faça. Comente na issue e pare.
- Um PR. Título = título do slice. Marque o slice como doing no mesmo PR.
- Rode npm test && npm run lint && npx tsc --noEmit.
- Não atualize o slice para done (o dono faz no merge).
- Não refatore components/ui. Não bump schemaVersion salvo o slice pedir.
- Não toque em arquivos listados em "não toca".
```

Troque `NN-slug` pelo arquivo real.
