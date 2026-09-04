# Lições pendentes

Lição que apareceu no meio do produto e **ainda não virou regra geral** (regra 16f).

Mexer no bloco geral obriga a propagar em todos os projetos — caro, e no meio de outra
tarefa. Então anota-se aqui, no mesmo commit da correção (16c), e a atualização das regras
acontece na sua própria conversa.

A varredura diária lista o que está aberto, em todos os projetos. Isso **não reprova**: é
estado normal, não falha. O que ela impede é a lição sumir sem ninguém ver.

## Como usar

- Item aberto: `- [ ] texto da lição`
- Virou regra no `danilodme-rgb/instrucoes`: marque `- [x]` e ele sai da lista

## Abertas

- [x] **Troca textual de marcador em molde acerta o comentário, não o código.** O build
  trocava `__BUILD__` no `sw.js` com `String.replace`, que troca só a **primeira**
  ocorrência — e a primeira era o comentário que explicava a troca. O arquivo publicado
  saiu com o marcador intacto e o comentário carimbado; a versão do cache virou a palavra
  `__BUILD__`, igual para sempre, e o app nunca mais se atualizaria. Medido em 03/09/2026,
  no primeiro build deste projeto. O conserto tem duas metades: trocar **todas** as
  ocorrências, e o comentário **não escrever o marcador por extenso**. A generalização que
  ainda não é regra: *substituição textual de marcador acerta a primeira ocorrência, e a
  primeira costuma ser a documentação da própria substituição.*

- [x] **Repositório vazio adota como padrão o primeiro branch que chega.** O `App-da-Kelly`
  foi criado sem nenhum commit; a API dizia `default_branch: main`, mas essa `main` não
  existia. O primeiro push foi num branch de trabalho, e o GitHub o promoveu a padrão. A
  varredura das cópias lê o branch **padrão** — passou a conferir o branch de trabalho, e
  ficaria verde para sempre enquanto a `main` andasse sozinha: verde por não ter procurado
  (regra 8c/16e), e sem sinal nenhum. Medido em 03/09/2026. A generalização que ainda não é
  regra: *em repositório recém-criado, o branch padrão só é o que você acha que é depois do
  primeiro push — conferir, e conferir depois de empurrar, não antes.*

- [x] **A sessão que publica pode não conseguir abrir o que publicou.** Medido em 03/09/2026:
  a política de rede desta sessão recusa `danilodme-rgb.github.io` (403 no CONNECT), então
  "publicou" e "o endereço responde" são afirmações diferentes, e eu só alcanço a primeira.
  Antes de medir, cheguei a dizer que o endereço "dava 404" — era inferência a partir do
  deploy vermelho, não medição, e um `curl` bloqueado pelo proxy é indistinguível de um 404
  para quem só olha "não veio nada". A generalização que ainda não é regra: *quando a
  conferência sai pela rede, distinguir "reprovou" de "não consegui chegar lá" faz parte da
  conferência — sem isso, bloqueio de rede vira laudo sobre o produto.*

- [ ] **Sabotagem tem de desligar a invariante no ponto onde ela age.** A trava do ciclo de
  atualização (`conferir-atualizacao.mjs`) nasceu medindo só o fim do ciclo: publiquei a
  versão 2 e exigi que a tela trocasse. Passou nas cinco sabotagens? Não: `cache-primeiro`
  passou **batida**. Motivo, medido em 04/09/2026: como o nome do cache sai do conteúdo do
  build, o service worker novo abre um cache vazio e busca tudo da rede — outra invariante
  compensou a que eu tinha desligado, e o resultado final ficou igual. A conferência só
  passou a pegar depois de medir uma busca comum **antes** da atualização do service worker.
  A generalização que ainda não é regra: *quando várias invariantes produzem o mesmo
  resultado final, medir só o resultado não distingue qual delas está viva — a sabotagem
  precisa ser observada no ponto em que aquela invariante age, e uma sabotagem que passa é
  sinal de que o ponto de medição está errado, não de que o defeito é inofensivo.*
