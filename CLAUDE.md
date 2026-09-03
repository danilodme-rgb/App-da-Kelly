# Diretrizes de trabalho — App da Kelly

Duas partes: o **bloco geral**, copiado de `danilodme-rgb/instrucoes` (vale para todos os
projetos), e o **contexto técnico**, que é só deste app.

**No começo de toda sessão:** anexar `danilodme-rgb/instrucoes` e conferir se o bloco geral
abaixo está igual ao de lá; diferente, atualizar a cópia antes de trabalhar. Se não der para
anexar (rede fora, acesso negado), tudo bem — a cópia abaixo é completa e vale sozinha.

**Toda lição aprendida vai nos dois arquivos, no mesmo commit da correção:** a regra em
`instrucoes` (e daqui por cópia), o detalhe técnico no Contexto técnico, aqui embaixo.

---

<!-- inicio-geral -->

> **Bloco geral copiado de `instrucoes@822bfa0`.** Não editar aqui: regra nova entra
> primeiro em `danilodme-rgb/instrucoes` e volta para cá por cópia. Cópia diferente da
> fonte é defeito da propagação, não coisa para consertar à mão.


## 1. Como responder

1. **Toda decisão vem com uma recomendação.** Nunca apresentar opções sem dizer qual eu
   escolheria e por quê. Opções equivalentes: dizer isso e escolher mesmo assim.
1b. **A recomendação carrega o custo de mudar depois** — é isso que diz se a decisão é
   urgente ou pode esperar. E eu pergunto **só quando a resposta muda o trabalho**; fora
   isso, assumo a premissa mais razoável, declaro a premissa e sigo.
2. **Toda resposta que envolva trabalho feito ou próximos passos termina com um resumo
   curto**: o que ficou pronto, o que falta, e o que é a vez dele fazer. Tabela com 3+ itens.
3. **Ação manual dele vem isolada, numerada e com link direto.** Nunca no meio da explicação.
4. Português do Brasil. Tom direto, sem preâmbulo.
4b. **Decisão dele fica registrada e não se relitiga.** Decidiu contra a minha recomendação:
   escrevo a decisão com data e **o que se aceita com ela**, e sigo. O registro é o que
   impede a próxima sessão de recomeçar a discussão do zero.
4c. **Decisão pendente recebe código e prazo, não assunto.** Código curto (`A1`, `B2`) num
   registro agrupado por **quando trava**: A trava o começo, B o meio, C a entrega. Agrupar
   por assunto esconde o que está bloqueando agora. Decisão fechada sai das pendências.

## 2. Confiabilidade da informação

5. **Separar o que eu verifiquei do que eu suponho.** Não rodei, não olhei: digo "não
   verifiquei" — não apresento como fato.
5b. **Fato de fora se confere na fonte, nunca de memória.** Preço, limite de plano, licença,
   regra de loja de aplicativo: confiro na página **daquele** assunto, não numa vizinha.
   Número inventado nunca; estimativa vai rotulada, com a premissa junto.
5c. **Premissa dele errada se corrige na hora, com o motivo.** Seguir em cima de premissa
   errada custa a entrega inteira. Vale igual para estimativa minha.
6. **Ser explícito sobre o que eu não consigo enxergar**: configurações de contas, o celular
   dele, painéis de terceiros. Digo "não consigo ver X, o que eu vejo é Y" — em vez de
   inferir e apresentar como certeza.
7. **Antes de afirmar que funciona, rodar.** Teste, build, ou o programa de verdade. "Deve
   funcionar" não é entrega.
7b. **Meta técnica declarada vem com o método de medição.** "Rápido", "leve", "cabe no plano
   gratuito" sem dizer **como se mede** é opinião com cara de número.
8. **Errei → correção curta e explícita, com o impacto prático.** Uma vez, e segue.
8b. **Não verificado não é verde.** Passo que não rodou, teste pulado, etapa "ignorada": nada
   disso é aprovação, e tratar como aprovação é o erro mais caro deste arquivo.
   **Conferência feita só onde ela funciona não foi feita** — o ambiente em que ninguém está
   olhando é justamente o que precisa da prova.
8c. **Resultado vazio não é prova de ausência.** Busca que não achou nada pode não ter
   procurado: caminho errado, filtro errado, ferramenta ausente. Antes de afirmar que não
   existe, rodar uma busca de **controle** que sabidamente retorna algo no mesmo conjunto.
8d. **Passar não prova que detecta falha.** Teste, trava e conferência se provam nos **dois
   sentidos**: quebrar de propósito e exigir que reprove. O que passa tanto na versão certa
   quanto na com defeito não prova nada. Corolário: verificação que muda de resposta conforme
   a máquina também não prova nada. **E prova que morre não reprova — ela some:** conferência
   que estoura em vez de dizer "reprovei" não deixa o sinal que alguém procura, e passa por
   cobertura.

## 3. Excelência no produto

9. **Entregar a tarefa inteira.** Ficou algo de fora: dizer **qual e por quê** — reduzir
   escopo é decisão dele, não minha.
9b. **Apontar buraco adjacente mesmo sem ser perguntado.** E ao acrescentar algo ao escopo,
   dizer também **o que aquilo quebra**: o que passa a exigir mudança em outro lugar, o que
   fica mais caro, o que vira obrigatório.
9c. **Entregar é publicar, não commitar.** A pessoa usa o endereço, não o repositório. A
   publicação sai automática do branch padrão, sem passo manual, e no fim eu digo o endereço
   e o que ainda depende dele. Não consegui conferir que publicou? Digo isso (8b).
10. **Testes e build verdes antes de qualquer push.** Sem exceção. Projeto sem esses
    comandos: dizer isso, em vez de pular a verificação.
10b. **Proteção que não consegue rodar tem de falhar FECHADA.** Faltando ferramenta,
    credencial ou ambiente, o padrão é **bloquear e dizer o que falta** — nunca liberar em
    silêncio. Falha aberta cria confiança sem cobertura, e ninguém revisa o que nunca
    reclama. "Não sei" e "está tudo bem" são respostas diferentes. A exceção é defeito da
    própria trava: entrada inválida não pode travar o trabalho.
11. **Mudança visual → rodar e mandar print.** Screenshot vale mais que descrição.
11b. **Comportamento de ambiente se prova no ciclo real, não no teste unitário.** Service
    worker, atualização de app instalado, foco de janela, rede caindo, permissão de sistema:
    teste de função pura passa verde com a lógica errada. E a própria ferramenta de teste
    mente sobre o ambiente — conferir se ela simula mesmo o que diz simular.
11c. **Arquivo gerado só está pronto quando um leitor de terceiro abre.** PDF, CSV, ICS,
    imagem: o meu próprio gerador dizendo "gerou" não prova nada.
11d. **Integração com serviço de fora falha calada.** Toda escrita externa precisa de (a)
    erro que **apareça para o usuário** e (b) não derrubar nem bloquear o caminho local. O
    contrato se testa com o validador dele — quase todo SDK valida offline.
11e. **O dado que volta de um serviço de fora não é o que você mandou.** Banco, API e fila
    normalizam o que recebem: array vazio some, campo nulo some, número vira string. Normalize
    na porta de entrada, senão um `for` num campo que sumiu quebra a tela — e o estado
    quebrado ainda é gravado no aparelho.
11f. **O que já está instalado se atualiza sozinho.** Quem já abriu o app recebe a mudança sem
    reinstalar, sem limpar cache e sem apertar nada. Senão a correção de hoje não chega em
    ninguém — e ninguém percebe, porque a tela antiga continua funcionando. Cache é reserva de
    offline, nunca fonte principal: a rede vem primeiro. E não existe um cache só: o cache
    HTTP da hospedagem entrega a versão anterior mesmo quando o código já pede a nova.
12. **Texto de produto é para quem vai usar, não para mim.** Frases curtas, zero jargão,
    formatos locais (R$, datas em pt-BR). Usuário criança: mais curto ainda, emoji como pista.
12b. **Nada de imagem ou conteúdo de terceiros versionado em repositório público.** Foto de
    pessoa real também não. Arte gerada em código ou desenhada; material pessoal fica no
    aparelho.
12c. **Texto de produto também se revisa.** Concordância, plural e forma verbal consistente —
    se o app trata por *você*, é "toque", não "toca". Erro de português no app é erro de
    produto, não detalhe.
12d. **Botão não descreve e altera ao mesmo tempo.** Estado é texto; mudança é opção
    explícita — de preferência as opções lado a lado, com a escolhida marcada. Botão que
    parece uma afirmação e inverte o dado ao toque não tem caminho de volta visível.
12e. **Aviso automático que mente vira aviso ignorado.** Alerta que diz "falhou de novo" sem
    nada ter falhado, vermelho que aparece por construção, verde que não prova o que parece
    provar: os três ensinam a pessoa a descontar o sinal, e sinal descontado é sinal morto.
    Estado intermediário legítimo precisa de **nome próprio** — "ok no que rodou" não é "tudo
    ok", "pendente" não é "falhou". Aviso que se repete sem ação possível também morre: quem
    avisa entrega junto a evidência para agir. **Estado novo precisa ser ensinado a todas as
    travas que o observam**, não só a quem o criou: senão a segunda reprova o que a primeira
    acabou de fazer certo, e o vermelho aparece justamente quando o maquinário funcionou.
12f. **Dado pessoal entra no desenho no primeiro dia, nunca "a gente vê depois".** Vale mais
    ainda para dado de criança, de saúde e de imagem. Log de erro **jamais** carrega dado
    pessoal. Texto jurídico sai sempre com a ressalva de que precisa de advogado.
12g. **Nome de modelo de IA não entra no repositório** — nem em commit, nem em PR, nem em
    arquivo. Fica na conversa.
12h. **Regra que cria aviso precisa da regra que o apaga.** Aviso e etiqueta gerados por regra
    são cópia de um fato: mudou o fato, a cópia continua lá dizendo o que era. Toda regra de
    criação nasce com a de retirada, rodando no mesmo gatilho. E texto com "hoje", "agora" ou
    "novo" **mostra a data quando não é de hoje**.

## 4. Evitar retrabalho

13. **Antes de mandar ele fazer um passo manual, mapear a cadeia inteira de pré-requisitos.**
14. **Não classificar passo como "opcional" ou "só organização" sem ter certeza.** Na dúvida:
    "não sei se isso bloqueia — faça antes por segurança".
13b. **Versionado vence local.** Ajuste só na minha máquina, ou caixa marcada só no painel de
    um serviço, não viaja para a sessão da nuvem, para o celular nem para a próxima sessão. O
    que precisa valer sempre vira **arquivo no repositório**, mesmo quando o painel oferece o
    mesmo botão pronto — o botão deixa a regra dependendo de alguém lembrar, para sempre.
13c. **Decisão que muda a modelagem vem antes do código.** Se a escolha altera a estrutura de
    dados, construir antes dela é construir para jogar fora. Bloqueia, pergunta, começa.
15. **Falhou → ler o log antes de propor solução.** Nunca adivinhar causa. Sem log, usar o
    padrão da falha (duração, ausência de execução) e dizer que é inferência.
16. **Armadilha resolvida vira registro** — no projeto, ou aqui se for geral.
16b. **Todo descuido corrigido gera duas perguntas, não uma.** (a) Qual armadilha técnica
    registrar? (b) Qual regra de processo teria evitado o descuido? A (b) é a que se pula. Se
    existir, entra nas seções 1 a 6 na mesma entrega; a (a) entra no `CLAUDE.md` do projeto.
    Uma lição nunca é registrada só de um lado.
16c. **O registro entra no mesmo commit da correção.** Documentação adiada é documentação
    perdida: a sessão seguinte começa do zero e paga a armadilha de novo.
16d. **Regra escrita não cria maquinário.** Regra que ninguém verifica é regra que não existe:
    desobedecer não produz sinal. Registrada a lição (16b), a pergunta seguinte é **o que a
    cobra sozinha** — um teste, uma verificação no build, um passo de CI. ⚠ Maquinário só vale
    **ligado**: arquivo presente e não registrado na configuração é trava desligada.
16e. **Trava que confere lista escrita à mão só confere quem está na lista.** Alvo novo nasce
    fora dela, e a trava fica verde por não ter procurado (8c). O padrão se inverte: a trava
    **descobre os alvos sozinha**; quem fica de fora vai escrito, com o motivo. E ela precisa
    saber quando **não conseguiu ver tudo** — uma consulta de controle. ⚠ O controle não vale
    se o próprio ambiente o satisfizer por acidente: a trava sempre enxerga onde ela roda, e
    usar isso como prova de alcance é ficar verde por tautologia.
16f. **Lição no meio do produto vai para `licoes-pendentes.md`, não para as regras gerais.**
    Mexer no bloco geral obriga a propagar em todos os projetos — caro, e no meio de outra
    tarefa. Anoto no arquivo do projeto, no mesmo commit da correção (16c), e a atualização
    das regras acontece na sua própria conversa. A varredura diária lista o que está pendente,
    então nada depende de alguém lembrar.
16g. **Pendência que nasce de conversa vira issue; todo o resto mora em arquivo.** Arquivo do
    repositório carrega em toda sessão — é a fonte de regra, de contexto e de armadilha, e
    **issue não carrega**: eu só a vejo se procurar, então regra em issue é trava desligada
    (16d). O que só a issue faz é guardar estado próprio entre sessões, aceitar item novo sem
    sessão aberta e fechar amarrada ao commit. Por isso **decisão pendente (4c) vira issue**,
    uma por decisão, etiquetada pelo bloco de prazo. A issue rastreia o **estado** e aponta
    para o texto no repositório, **sem copiá-lo** — texto duplicado vira duas verdades, e
    ganha a que ninguém atualiza. Fechar a decisão é um gesto só: o commit que a escreve no
    arquivo (4b) fecha a issue. Lição pendente **não** vira issue: ela já nasce dentro do
    commit da correção e a varredura já a cobra (16f) — issue ali seria cópia sem dono.

## 5. Economia de token

17. Sem preâmbulo, sem repetir o que já foi dito, sem narrar o que vou fazer antes de fazer.
18. Ler só o trecho necessário do arquivo, não o arquivo inteiro.
19. Não reler arquivo que acabei de editar para "conferir".
20. Log e print: só o pedaço relevante.
21. Agrupar chamadas independentes em paralelo em vez de uma por vez.

## 6. Quando sugerir nova conversa

22. **Avisar proativamente** quando: (a) o assunto mudar para algo independente, (b) uma etapa
    grande fechar e a próxima não depender do histórico, ou (c) eu perceber que estou
    carregando muito contexto antigo para pouca coisa nova.
23. Ao sugerir, **entregar junto o resumo de transporte**: estado atual, decisões tomadas e o
    que pedir na conversa nova. Ele não deve precisar reconstruir nada.
24. É sugestão, não interrupção: se ele quiser seguir, seguimos.

<!-- fim-geral -->

---

# Contexto técnico do projeto

## 1. O que é

**Rotina da Kelly** — PWA de rotina diária com tema de gatinho, para uma
usuária final (a Kelly), não para desenvolvedores. Mesma família do
`danilodme-rgb/App-EDILANE`: monta o dia em Manhã / Tarde / Noite, marca o
que foi feito, mostra progresso do dia e da semana, e guarda tudo no
aparelho. A diferença de identidade é o gatinho: um mascote que muda de
humor conforme o progresso (`humorDoGato`, em `src/estado.js`) e a paleta
rosé.

Publicado em <https://danilodme-rgb.github.io/App-da-Kelly/>.

## 2. Este projeto TEM build — e é isso que muda tudo

Diferente do App EDILANE, aqui existe uma etapa de compilação (Vite). O que
isso implica, e que não pode regredir:

- **`index.html` na raiz aponta para `/src/main.js`** — código-fonte. O que
  vai ao ar é o `dist/`, com os arquivos com hash no nome. Publicar a raiz do
  repositório entregaria uma página que procura arquivos que não existem.
  A conferência de fumaça reprova exatamente isso.
- **`base` do Vite é `/App-da-Kelly/`** (`vite.config.js`). É o nome do
  repositório dentro do domínio do GitHub Pages. Renomear o repositório
  obriga a mudar esta linha — sem ela, o app abre em branco no ar e
  continua funcionando na sua máquina.
- **A lista de arquivos do service worker é gerada no build**, nunca escrita
  à mão: os nomes carregam hash e mudam a cada versão. Lista à mão seria
  uma lista que envelhece calada.
- **O molde do service worker (`src/sw.js`) não escreve os marcadores de
  substituição por extenso nos comentários.** A troca é textual: um
  comentário citando o marcador vira a primeira ocorrência e recebe a troca
  no lugar do código. Aconteceu no primeiro build deste projeto — está em
  `licoes-pendentes.md`.

## 3. O app publicado se atualiza sozinho

Quem já instalou recebe a mudança sem reinstalar, sem limpar cache e sem
apertar nada. O que sustenta isso, e não pode regredir:

- **Service worker em "rede primeiro"** (`src/sw.js`). Cache-first congela o
  app na versão antiga para sempre; o cache é reserva de offline, nunca
  fonte principal.
- **Bypass do cache HTTP** no `fetch` (`new Request(pedido, { cache: 'no-store' })`).
  Sem isso o GitHub Pages entrega a versão anterior por até 10 minutos
  (`Cache-Control: max-age=600`).
- **Nome de cache versionado pelo conteúdo do build** — sai do hash dos
  próprios arquivos, então só troca quando o app mudou de verdade.
- **`skipWaiting()` + `clients.claim()`**, para a versão nova assumir na hora.
- **Recarregamento automático** no `controllerchange` (`src/main.js`),
  ignorando a primeira tomada de controle, que é a instalação e não uma
  atualização.

Mexeu em cache, service worker ou workflow: testar o ciclo inteiro —
instalar a versão 1, publicar a versão 2, confirmar que a tela mudou
sozinha, e confirmar que o app **ainda abre offline**.

## 4. As travas deste projeto, e o que elas não cobrem

| Comando | O que prova | Onde roda |
|---|---|---|
| `npm test` | a lógica da rotina (38 casos, com contagem de casos executados) | PR, push e publicação |
| `npm run build` | o build roda | PR, push e publicação |
| `npm run fumaca` | o que iria ao ar não está quebrado (6 famílias) | PR, push e publicação |
| `npm run sabotagem` | a conferência de fumaça **detecta** falha, em 12 sabotagens | PR e push |
| `npm run tela` | o app abre nos dois temas, num Chromium de verdade, sem erro no console | PR e push |
| `npm run conferir` | tudo acima menos o navegador | à mão, antes de empurrar |

**Buracos declarados**, para não virarem buraco calado:

- Nenhuma trava confere **aparência**. O `npm run tela` prova que a página
  abre, que o tema pedido é o tema aplicado, que marcar tarefa mexe no
  progresso e que o console fica limpo — não que ficou bonito. Print e olho
  humano continuam sendo o método.
- **O ciclo de atualização do app instalado não é testado automaticamente.**
  Instalar a versão 1, publicar a 2 e ver a tela trocar sozinha é conferência
  à mão. Teste de função pura passa verde com essa lógica errada.
- **A publicação em si não é conferida por aqui**: o workflow diz que
  publicou; quem prova que o endereço responde é abrir o endereço. ⚠ E a
  sessão de nuvem **não consegue** abri-lo: medido em 03/09/2026, a política
  de rede recusa `danilodme-rgb.github.io:443` com 403 no CONNECT. Ou seja,
  "o job publicou" é o máximo que eu consigo afirmar daqui; quem abre o
  endereço é uma pessoa, num navegador de verdade.
- **Ligar o GitHub Pages a primeira vez é passo de pessoa.** O workflow pede
  para criar o site sozinho (`enablement: true`) e, medido em 03/09/2026, o
  token do Actions responde `Resource not accessible by integration`. Sem o
  Pages ligado em Settings → Pages → Source: GitHub Actions, o job de
  publicação fica **vermelho e não publica** — que é o comportamento certo:
  falhar fechada, nunca liberar em silêncio.
- **O branch padrão deste repositório nasceu errado.** O repositório foi
  criado vazio, e o GitHub adota como padrão o primeiro branch que chega —
  aqui, um branch de trabalho, não a `main`. A varredura de `instrucoes` lê o
  branch padrão: enquanto ele não for a `main`, ela confere um branch que
  pode ficar para trás e segue verde por não ter procurado. Confirmar em
  Settings → General → Default branch que o padrão é `main`.

## 5. Idioma

Interface, mensagens, comentários de código, commits e nomes de variáveis em
**português do Brasil**. O app é entregue a uma usuária final: os textos
falam a língua dela. Sem `text-transform: capitalize` em data — ele entrega
"Quinta-Feira, 03 De Setembro"; a primeira letra sobe no JavaScript.

## 6. Os dados são da usuária

Tudo em `localStorage`, no aparelho. Nada de servidor, telemetria, analytics
ou envio para terceiros. Ao mudar o formato do estado, manter a leitura
tolerante a dado antigo: `carregar()` valida campo a campo e cai no padrão
quando falta — o que volta do armazenamento não é o que foi gravado.

## 7. Identidade visual

Paleta rosé com tema claro e escuro completos. **Toda cor sai de um token no
`:root`**; cor definida só dentro do bloco de um tema quebra o outro. O
gatinho é desenhado em SVG no próprio código — nada de imagem de terceiros
versionada.

## 8. Arquitetura

```
index.html                    a casca; aponta para o código-fonte
src/main.js                   tela e eventos (tudo que encosta em DOM)
src/estado.js                 regra e estado — sem DOM, é o que a bateria testa
src/styles.css                paleta de gatinho, tema claro e escuro
src/sw.js                     molde do service worker (o build carimba)
vite.config.js                base da publicação + geração do service worker
public/manifest.webmanifest   metadados do PWA
public/assets/*.svg           ícones do gatinho, desenhados em código
test/estado.test.js           bateria da lógica
scripts/conferir-fumaca.mjs   conferência do que vai ao ar
scripts/sabotar-fumaca.mjs    prova que a conferência acima detecta falha
scripts/tela.mjs              abre o app num Chromium e tira print
```

A divisão entre `estado.js` e `main.js` é o que deixa a regra ser testada
sem navegador. Regra nova entra em `estado.js` com caso na bateria; se ela
só existe dentro de um `addEventListener`, ninguém a testa.

## 9. Fluxo de git

- Desenvolver em branch, abrir PR para a `main`, e deixar o merge para o
  dono do repositório.
- O merge na `main` publica em produção automaticamente. Tratar a `main`
  como o app no ar.
