# Armadilhas medidas em execução real

Cada uma foi medida rodando, não deduzida. Todas têm a mesma característica: **o sintoma aponta
para o lugar errado**, e quem confia no sintoma depura a peça inocente.

Origem: `kit-propostas` do `fpl-app` (plano-de-voo), 14/08 a 31/08/2026.

---

## Shell e código de saída

**Num cano, `$?` é o código do ÚLTIMO comando.** `psql ... | tail -3` devolve o código do `tail`,
que é sempre 0. Um teste reportou "PASSOU" num caso que havia reprovado corretamente. Não passar
por cano o que se vai medir — e desconfiar do rótulo quando ele contradiz a saída bruta logo acima.

**Sob `set -e`, `[ cond ] && cmd` como última linha de um laço derruba o job.** A condição falsa no
fim do corpo vira código de saída do laço. Usar `if ...; then ...; fi`. A forma curta parece igual
e não é.

**No Windows, `export PATH="C:/...:$PATH"` não insere nada.** O `:` de `C:` é lido como separador
de `PATH` e a entrada se perde **em silêncio** — o programa de verdade roda, e um teste que deveria
usar o falso sai à rede. Converter com `cygpath -u` e conferir com `command -v` antes de rodar.

## GitHub Actions

**A bateria que lê `process.env` responde diferente na sua máquina e no runner.** Um caso que
consultava `GITHUB_REPOSITORY` — variável que só existe no Actions — passou verde local e reprovou
no runner, por um motivo que nada tinha a ver com o que ele media; e como o sabotador compara
árvore limpa com árvore sabotada, ele acusou "a bateria não detecta a sabotagem" quando o defeito
era o caso ambiental. Medido em 02/09/2026. Todo caso recebe o ambiente **por parâmetro**; quem
precisa da variável a define e a restaura ali mesmo. Vale igual para chamada de rede escondida num
valor padrão de parâmetro: `f(x, y = chamaARede())` sai à internet no teste que você jurou ser
offline.

**Todo passo já nasce com `-e` ligado.** O Actions invoca `bash --noprofile --norc -eo pipefail`.
Escrever `set -uo pipefail` liga `-u` e `pipefail` e **não desliga** o `-e` herdado: um código de
saída 1 esperado (por exemplo "há pendência") mata o passo antes da sua própria lógica de decisão.
Precisa de `set +e` **explícito**. ⚠ Comentário afirmando "roda sem `set -e`" não é execução — só
o disparo real pega isto, porque a bateria testa o script, não o YAML que o chama.

**Job com `if: failure()` fica `skipped` no caminho feliz.** Portão de merge que lê "pulado" como
*não verificado* trava toda promoção. A condição vai no **passo**, não no `if:` do job; o job roda
sempre.

**Evento disparado com o `GITHUB_TOKEN` não cria nova execução de workflow.** É a regra anti-
recursão do GitHub: o pedido é aceito, **nada roda**, e o resumo diz que deu certo. Falha
perfeitamente silenciosa.

**Nome de input não pode ter hífen.** `inputs.o-que-fazer` é avaliado como **subtração** pelo
interpretador de expressões.

**Agendamento atrasa em pico e pode ser descartado.** A própria documentação diz que execuções em
fila podem ser abandonadas. Tarefa cuja falta importa roda **duas vezes por dia**, em minutos fora
do topo da hora — uma execução perdida não pode zerar o dia.

**O resumo da execução tem teto, e estourá-lo descarta o resumo INTEIRO.** Não sobra nem a lista.
Conteúdo grande vai com orçamento e aviso de truncagem.

**Os canais não chegam aos mesmos lugares.** Medido: o **log do job** chega em toda parte; o resumo
da execução e o artefato não chegam a uma sessão de nuvem (o host do artefato fica fora da política
de rede, `CONNECT tunnel failed, 403`). Publicar só no canal mais completo é publicar para quem
menos precisa.

**Trava que compara o repositório com um mundo externo reprova por CONSTRUÇÃO quando roda em
`pull_request`.** Se a fonte da verdade mora aqui e as cópias moram noutros repositórios, o PR que
muda a fonte deixa, no ato, todas as cópias diferentes — e não há como ser diferente, porque elas só
podem ser atualizadas depois do merge. Medido neste repositório: a conferência das cópias ficava
vermelha em todo PR que encostasse no bloco geral. A correção não é liberar: é dar **nome próprio**
ao estado intermediário (regra 12e), comparando também com a **base do PR** — cópia que bate com a
base é `PENDENTE` (este PR a desatualiza, ninguém podia ter feito melhor), cópia que não bate nem
com a base é `ATRASADO` e reprova como sempre. ⚠ E a janela tem de ser provada nos **dois**
sentidos: só ver o `PENDENTE` aparecer não distingue a janela legítima de uma anistia geral que
matou a trava.

**Conferência que só roda onde a rede existe não roda.** A parte de rede de uma trava é a que o
autoteste não alcança — e é justamente aí que ela vira "deve funcionar". Recebendo o baixador por
parâmetro, o caminho inteiro (ler a base, cair para o modo estrito quando a base não vem) se prova
offline, em segundos, em qualquer máquina.

**Deploy verde não prova que o endereço responde — e a sessão que publica pode não conseguir abrir o que publicou.** Medido em 03/09/2026: a política de rede da sessão recusava `danilodme-rgb.github.io` no CONNECT (403 do proxy), então "publicou" e "o endereço responde" eram duas afirmações, e só a primeira estava ao alcance de quem rodou o deploy. O agravante é o formato da recusa: `curl` barrado pelo proxy chega como "não veio nada", **indistinguível** de um 404 para quem olha só o corpo da resposta — e daí sai laudo sobre o produto a partir de bloqueio de rede. Conferência que sai pela rede mede o código, não o corpo: `curl -sS -o /dev/null -w '%{http_code}' --connect-timeout 10` separa 404 de 403-do-proxy de conexão recusada, e o que não chegou a ser medido sai dito como não medido, nunca como reprovado (regra 10b).

## Git

**Merge por squash quebra o teste de ancestralidade.** O commit da branch **nunca** vira ancestral,
então `git merge-base --is-ancestor` responde "não mesclada" para branches perfeitamente
integradas. Quem acredita nesse teste nunca apaga nada. O que responde a verdade é o **diff de
conteúdo**: vazio = já está lá.

**`Repository not found` costuma ser erro de credencial, não de repositório.** O cofre de
credenciais da máquina é consultado primeiro e responde com a conta errada. A correção é um
`-c credential.helper=` **vazio** antes do helper próprio, zerando a lista herdada — e o helper em
**todo** comando que fala com o servidor, não só no `push`.

**`git diff --no-index` vaza caminho absoluto no cabeçalho.** Em runner, a pasta temporária muda a
cada execução e faz dois relatórios idênticos parecerem diferentes. Cortar tudo antes do primeiro
`@@`.

**Repositório recém-criado adota como padrão o primeiro branch que chega.** Medido em 03/09/2026: o repositório foi criado sem nenhum commit, a API respondia `default_branch: main`, e essa `main` não existia. O primeiro push foi num branch de trabalho, e o GitHub **o** promoveu a padrão — a API passou a devolver o nome do branch de trabalho, com a mesma cara de resposta normal. Toda trava que lê o branch **padrão** (varredura de cópia, comparação com a fonte, deploy) passou a conferir o branch errado, e ficaria verde para sempre enquanto a `main` andasse sozinha: verde por não ter procurado, e sem sinal nenhum (regra 8c). Em repositório vazio o `default_branch` é promessa, não fato — conferir **depois** do primeiro push, nunca antes, e empurrar de propósito o branch que se quer como padrão antes de qualquer outro.

## Node e Windows

**`node --check arquivo.js` não vê erro de sintaxe em arquivo com `import`/`export`.** Medido no
Node v22.22.2, nos dois sentidos e com caso de controle:

| Arquivo | Erro de sintaxe idêntico | Código de saída |
|---|---|---|
| `.js` **com** `export` | sim | **0 — passou** |
| `.js` sem `export` | sim | 1 |
| `.mjs` com `export` | sim | 1 |

O `.js` é lido como CommonJS por padrão. A forma que funciona é
`node --input-type=module --check < arquivo.js` (ou copiar para `.mjs`). ⚠ É falha **aberta** numa
conferência que a pessoa acabou de escrever para se proteger — o pior lugar possível para ela
estar.

**`process.env` no Windows traz a variável como `Path`, não `PATH`.** Acrescentar `PATH` ao lado
**não substitui** a original: o processo filho continua enxergando o `PATH` real da máquina.

**No `NODE_OPTIONS` o caminho vai com barras normais.** O interpretador come as barras invertidas,
e o erro sai como `Cannot find module 'C:UsersfulanoAppData…'` — um caminho sem separador nenhum.

**`spawn` no Windows só encontra `.exe`.** Medido: sem extensão → `ENOENT`; `.cmd`/`.bat` →
`EINVAL`, recusados sem `shell: true` (CVE-2024-27980); `.js` → `ENOENT`, porque o `PATHEXT` não é
consultado. Programa de mentira em bateria precisa ser `.exe`.

**O Node resolve o primeiro argumento para caminho absoluto** antes de qualquer pré-carregador
rodar, por tomá-lo como o script. Repassar os argumentos crus manda `C:\...\repo\remote` no lugar
de `remote`, e o programa chamado responde algo como "não é um comando" — que parece defeito dele.

**`fetch` do Node ignora as variáveis de proxy.** Em ambiente onde o proxy é quem injeta a
credencial, `curl` devolve 200 e `fetch` devolve 403. Não trocar `curl` por `fetch` "para tirar uma
dependência".

**E o `fetch` do Node lê conteúdo velho onde o `curl` já lê o novo.** Medido em 02/09/2026, no
mesmo arquivo de `raw.githubusercontent.com` segundos depois de um push: `curl` trouxe 8715 bytes,
`fetch` trouxe 7801 — a versão anterior. Nem `Cache-Control: no-cache`, nem `Pragma`, nem
parâmetro de query furaram o cache do `fetch`; o `curl` nunca precisou.

**E `raw.githubusercontent.com` guarda o arquivo por 5 minutos, para todo mundo.** Medido no mesmo
dia: com o push já feito, o `raw` devolvia 8715 bytes e a API de conteúdo
(`/repos/OWNER/REPO/contents/CAMINHO?ref=BRANCH`, com `Accept: application/vnd.github.raw`)
devolvia os 9296 corretos. O estrago é pior que uma leitura errada: **uma trava que roda em push e
lê pelo `raw` acusa "atrasado" quem acabou de ficar em dia**, e aviso que mente vira aviso ignorado
(regra 12e). Trava que compara arquivo publicado lê pela API, por `curl` — e com `GITHUB_TOKEN` no
ambiente, para não bater no limite de 60 chamadas por hora.

## Escrita de arquivo e texto

**Cerca de bloco de código não se resolve alterando o conteúdo.** Conteúdo com crases triplas
fecharia o bloco no meio; enfiar caractere invisível nas crases **adultera a evidência**. A saída
certa é **calcular** a cerca: uma crase a mais que a maior sequência dentro do conteúdo.

**Markdown: sempre uma linha em branco antes de uma lista.** O GitHub tolera sem, e por isso o
defeito passa despercebido — mas conversor de PDF cola a lista no parágrafo anterior. Medido em
projeto que gera PDF a partir de `.md`.

**Número escrito à mão em vários lugares diverge sozinho.** Num caso medido, **seis de quatorze**
contagens anunciadas estavam erradas — todas verdes. Ou existe algo que confere os números entre
si, ou não se escreve o número em mais de um lugar.

**Troca textual de marcador acerta a primeira ocorrência — e a primeira costuma ser o comentário que explica a troca.** Medido em 03/09/2026, no primeiro build de um projeto: o molde do `sw.js` escrevia `__BUILD__` por extenso num comentário **antes** de usá-lo no código, e o `String.replace` com texto, que troca só a primeira, carimbou o comentário. O arquivo publicado saiu com o marcador intacto no código — a versão do cache virou a palavra `__BUILD__`, igual para sempre, e o app já instalado nunca mais se atualizaria (regra 11f) — sem erro nenhum, porque o build de fato trocou alguma coisa. O conserto tem duas metades, e as duas fazem falta: trocar **todas** as ocorrências (`replaceAll`, ou `/g`), e o comentário **não escrever o marcador por extenso**. Vale para qualquer substituição de marcador em molde, não só em service worker.

---

# Stack que hoje não usamos

Nenhum projeto atual usa Postgres, Supabase ou gitleaks — Listinha e Rotina guardam no
aparelho (o Listinha sincroniza por Firebase) e o Azambuja ainda não tem código. Fica
registrado porque custa nada e a armadilha é cara para quem cai nela.

## Varredura de segredos

**Varredores sérios ignoram chaves de exemplo publicadas por fornecedores**, de propósito
(*allowlist*). Uma isca de teste usando a chave de exemplo da AWS **passa** onde o varredor não
está instalado e **falha** onde está — teste que muda de resposta conforme a máquina. Isca de teste
tem de valer nos **dois** caminhos de varredura: usar valor inventado com o formato certo.

## Postgres e Supabase

**`force row level security` NÃO liga a RLS.** Ele mexe em outro campo; só o `enable` liga. Trocar
um pelo outro deixa a tabela aberta.

**Partição-filha não herda RLS do pai.** Nasce desprotegida mesmo com o pai protegido, e é
consultável diretamente. Cobrar RLS de cada partição.

**O critério de pausa do plano gratuito é atividade em CADA DIA.** Os 7 dias são a **janela de
avaliação**, não um prazo a estourar — a leitura natural ("não passar 7 dias sem nada") produz um
ping espaçado que não cumpre a função. Medido: banco pausado **2,8 dias depois de um ping verde**,
9 dias fora do ar sem ninguém saber. ⚠ E o defeito fica invisível enquanto houver trabalho humano
no projeto: a atividade real cobre o ping insuficiente, e a quebra só aparece quando o projeto
fica quieto.

