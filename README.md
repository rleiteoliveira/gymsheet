# GymSheet

PWA mobile-first para planejar fichas e registrar o treino que realmente aconteceu. Funciona sem login e mantém os dados no próprio dispositivo.

## Funcionalidades

- fichas planejadas e sessões realizadas;
- treino do dia fixado no topo;
- exercícios concluídos, pulados, trocados ou adicionados;
- resumo semanal dos desvios do plano;
- exportação CSV por série e backup completo em JSON;
- catálogo de exercícios com fallback offline.

## Desenvolvimento

Requer Node.js 22.13 ou superior.

```bash
npm install
npm run dev
```

Validação local:

```bash
npm run lint
npm run build
```

## Fluxo de entrega

Branches curtas (`feat/*`, `fix/*`) entram por PR em `main`. O CI executa lint, TypeScript e build; `main` é a produção e cada merge publica uma nova versão. O teste principal depois do merge é feito no Android.

O catálogo e as imagens de exercícios são carregados do projeto [free-exercise-db](https://github.com/yuhonas/free-exercise-db). Consulte o repositório de origem para os respectivos termos e créditos.
