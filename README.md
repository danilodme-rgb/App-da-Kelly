# Rotina da Kelly 🐱

App de rotina diária com tema de gatinho: monte o dia por período
(manhã, tarde e noite), marque o que fez e veja o gatinho ficar feliz
junto. Interface em português, tema claro e escuro, e tudo salvo só no
seu aparelho.

**No ar:** <https://danilodme-rgb.github.io/App-da-Kelly/>

## O que ele faz

- Rotina dividida em **Manhã / Tarde / Noite**, com filtro por período
- Toque na tarefa para marcar como feita — o anel de progresso e o gatinho
  reagem na hora
- **O gatinho é o progresso:** ele cochila no começo do dia, fica curioso,
  ronrona depois da metade e comemora quando a rotina fecha
- **Tira da semana** para navegar entre os dias e ver quais tiveram progresso
- Números do dia: dias seguidos com rotina completa, feitas hoje e média
  da semana
- Criar, editar e excluir tarefas com **ícone, horário e dias de repetição**
- **Diário do dia**
- Versão do build no rodapé, para dar para ver a olho que a atualização chegou
- Saudação com o nome — toque em "Boa tarde, Kelly!" para trocar
- **Tema claro e escuro**, seguindo o sistema, com botão para alternar
- Funciona **offline** e pode ser instalado como app (PWA)
- Dados só no aparelho (`localStorage`) — nada vai para servidor nenhum

## Rodar aqui

```bash
npm install
npm run dev        # abre em modo de desenvolvimento
npm run build      # gera a pasta dist/, que é o que vai ao ar
npm run preview    # serve a dist/ como ela ficará publicada
```

## As conferências

```bash
npm run conferir   # bateria + build + fumaça + sabotagem
npm run tela       # abre o app num Chromium e tira print dos dois temas
```

| Comando | O que prova |
|---|---|
| `npm test` | a lógica da rotina — 38 casos, e a bateria reprova se algum deixar de rodar |
| `npm run build` | o build roda |
| `npm run fumaca` | o que iria ao ar não está quebrado: arquivo citado que não existe, JavaScript com erro de sintaxe, service worker sem versão carimbada, manifesto quebrado |
| `npm run sabotagem` | que a conferência acima **detecta** falha: quebra o `dist` de propósito 13 vezes e exige reprovação, com o motivo certo, em todas |
| `npm run tela` | o app abre nos dois temas, sem erro no console, e marcar tarefa mexe no progresso |
| `npm run atualizacao` | que quem já instalou o app **recebe a versão nova sozinho** — sem reinstalar, sem limpar cache, sem apertar nada — e que o app ainda abre sem internet |
| `npm run sabotagem-atualizacao` | que a conferência acima detecta falha: desliga cada peça da atualização automática, uma por vez, e exige reprovação nas cinco |

Passar não prova que detecta falha — por isso a sabotagem existe.

Tudo isso roda em PR e em push (`.github/workflows/conferir.yml`), e as
conferências sem navegador rodam de novo antes de publicar
(`.github/workflows/pages.yml`): publicar arquivo quebrado é publicar com
sucesso, e o job ficaria verde do mesmo jeito.

## Publicação

Todo push na `main` publica sozinho no GitHub Pages
(`.github/workflows/pages.yml`). Não existe passo manual de deploy.

**Uma única vez, na criação do repositório**, alguém precisa ligar o Pages em
**Settings → Pages → Source: GitHub Actions**. O workflow tenta ligar sozinho
(`enablement: true`), e medimos em 03/09/2026 que o token do Actions não tem
permissão para criar o site: o job fica vermelho e nada é publicado. Vermelho
aqui é o comportamento certo — ele não publicou.

## Estrutura

```
index.html                    a casca da página
src/estado.js                 regra e estado, sem DOM — é o que a bateria testa
src/main.js                   tela e eventos
src/styles.css                paleta de gatinho, tema claro e escuro
src/sw.js                     molde do service worker (o build carimba a versão)
vite.config.js                base da publicação + geração do service worker
public/                       manifesto e ícones do gatinho
test/                         bateria da lógica
scripts/                      conferência de fumaça, sabotagem e print
```

## Paleta

| Token | Claro | Escuro |
|---|---|---|
| Fundo | `#fff4f8` | `#1a1016` |
| Superfície | `#ffffff` | `#251a22` |
| Destaque | `#d6336c` | `#ff8fb8` |
| Pelo do gatinho | `#ffb8d1` | `#6d3a51` |
| Texto | `#3b2130` | `#f7e9f0` |

## Diretrizes

Este projeto segue as diretrizes gerais de `danilodme-rgb/instrucoes`, copiadas
no [`CLAUDE.md`](CLAUDE.md) entre os marcadores `inicio-geral` / `fim-geral`.
Regra geral nova entra lá e volta para cá por cópia automática — não editar o
bloco aqui.
