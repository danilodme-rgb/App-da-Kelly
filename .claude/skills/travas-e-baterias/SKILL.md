---
name: travas-e-baterias
description: Como montar trava automática, bateria de teste e aviso de CI que não mentem. Use ao criar ou corrigir hook, guarda, verificação de build, workflow agendado, bateria de testes ou alerta automático; ao montar a primeira conferência de um projeto que ainda não tem nenhuma; ao conferir se o deploy publica coisa quebrada — e sempre que precisar provar que uma proteção existente realmente protege. Traz o desenho (falha fechada, lista de inofensivos, contagem de casos), a prova por sabotagem, o desenho dos sinais, e a tabela de armadilhas já medidas em Git, GitHub Actions, shell e Windows.
---

# Travas e baterias que não mentem

Destilado das 22 propostas do `kit-propostas` do `fpl-app` (plano-de-voo), 14/08 a 31/08/2026 —
generalizado, sem o maquinário específico daquele projeto.

**O que isto resolve:** proteção automática que parece funcionar e não funciona. Não é caso raro:
naquelas 22 propostas, **mais da metade** é a mesma falha — a trava não rodava, ou rodava menos
do que dizia, e o verde continuou verde o tempo todo.

## As três leis

1. **Verde é ausência de sinal, não prova.** Toda pergunta é "isto rodou mesmo?", nunca "isto
   passou?".
2. **Falhar fechada.** Não conseguindo verificar, bloqueia e diz o que falta. Nunca libera calada.
3. **Sinal que mente é sinal morto.** Uma mentira e a pessoa desconta todos os seguintes.

---

## 0. O mínimo, para projeto que ainda não tem nada

Projeto sem teste e sem build não fica de fora desta skill — fica **na primeira linha dela**. A
regra 10 do bloco geral manda dizer quando esses comandos não existem, e "não existem" é um começo
de conversa, não um ponto final.

**O piso é uma conferência de fumaça no caminho do deploy.** Qualquer projeto tem uma pergunta
barata cuja resposta errada já quebra tudo:

| Tipo de projeto | Conferência de fumaça mais barata |
|---|---|
| Página ou PWA sem build | cada `.js` passa em `node --input-type=module --check < arquivo.js` (⚠ **não** `node --check arquivo.js` — ver abaixo); cada `.json` e o manifesto parseiam; todo arquivo citado no HTML e no service worker **existe** |
| Projeto com build | o build roda — e roda **no PR**, não só depois do merge |
| Projeto de documentação | o gerador roda e **um leitor de terceiro abre** o que ele gerou (regra 11c) |
| Qualquer um | nenhum link interno aponta para arquivo que não existe |

⚠⚠ **`node --check arquivo.js` FALHA ABERTA em arquivo com `import`/`export`.** Medido no Node
v22.22.2: o mesmo erro de sintaxe sai com código **0** num `.js` que usa sintaxe de módulo, e com
código **1** no mesmo conteúdo salvo como `.mjs` ou passado por
`node --input-type=module --check < arquivo.js`. Ou seja: a conferência de fumaça mais óbvia de
todas, escrita da forma mais natural, **não confere nada** justamente no tipo de arquivo que um
PWA moderno tem. Foi achada sabotando a própria receita desta seção, e é a regra 8d em uma linha.

⚠ **Deploy que publica a raiz do repositório não tem rede nenhuma.** Um `.js` com erro de sintaxe
vai ao ar e a tela fica branca; o job continua verde, porque publicar arquivo quebrado é publicar
com sucesso. Aí vale a regra 8b em estado puro: **nada foi verificado, e o verde diz que foi.**

**A conferência roda no PR, não só na branch principal.** Rodar só depois do merge é descobrir o
defeito quando ele já está lá — o vermelho vira notícia, não trava. Essa é a diferença entre uma
trava e um obituário.

Feito esse piso, o resto da skill passa a valer: a conferência de fumaça é uma trava, e trava se
desenha e se prova como as seções seguintes descrevem.

---

## 1. Desenhar a trava

**Falha fechada, com uma exceção.** Ferramenta ausente, credencial ausente, ambiente diferente →
bloqueia e diz o que falta. A única falha aberta legítima é **defeito da própria trava**: entrada
inválida ou vazia nunca pode travar o trabalho. `"não sei"` e `"está tudo bem"` são respostas
diferentes; o defeito é devolver a segunda quando a verdade é a primeira.

**Enumerar o inofensivo, não o proibido.** Lista de proibidos faz o caso novo — a próxima versão
da ferramenta, o próximo formato de entrada — nascer descoberto e **calado**. Ninguém revisa uma
lista que nunca reclama. Custo aceito: alguma conferência à toa, que só atrapalha quando a
situação já está errada — momento em que atrapalhar é o certo.

**Decidir pelo dado, não pelo nome.** Se o que importa é *"escreve no lugar protegido?"*, olhe o
parâmetro de destino, não o nome de quem chamou. Nome novo escapa de lista; dado não.

**Declarar o alcance.** O que a trava deliberadamente **não** cobre vai escrito ao lado do que
ela cobre. Buraco declarado é decisão; buraco silencioso é defeito esperando.

**Mensagem de bloqueio é texto de produto** (regra 12 do bloco geral). Ela aparece no pior momento
possível — quando a pessoa está barrada. Nada de numeração interna, referência a arquivo de outro
projeto, ou instrução que ela não consegue executar naquele ambiente.

⚠ **Ordem de declaração mata trava.** Bloco de decisão que usa constante declarada mais abaixo
levanta erro em tempo de execução, a trava morre e **sai liberando** — a checagem de sintaxe passa,
porque a sintaxe está certa. Decisão vai **depois** do que ela usa.

⚠ **Arquivo presente e não registrado é trava desligada.** Copiar o arquivo não liga nada; quem
liga é o registro na configuração. São dois passos separados, e esquecer o segundo não dá sinal
nenhum. Vale uma verificação automática de que todo arquivo de trava está registrado.

---

## 2. Desenhar a bateria

**Contar os casos que EXECUTARAM, não só as falhas.** Bateria que conta só falhas não distingue
*"28 casos passaram"* de *"2 passaram e 26 deixaram de rodar"* — um `return` antecipado, um `if`
que deixou de entrar, um bloco perdido num merge, e ela segue imprimindo tudo certo.

```js
// Conta o que EXECUTOU e reprova quando não bate com o declarado.
// Mudou o número de propósito? Atualize aqui E onde o número estiver escrito.
const CASOS_ESPERADOS = 28;
let casos = 0;
process.on("exit", (codigo) => {
  if (codigo === 2) return;              // 2 = nem chegou a rodar
  if (casos === CASOS_ESPERADOS) return;
  console.log(
    `\nCONTAGEM NAO FECHA: ${casos} executado(s), ${CASOS_ESPERADOS} esperado(s). ` +
      (casos < CASOS_ESPERADOS
        ? "Caso(s) deixaram de rodar — a bateria NAO provou o que diz provar."
        : "Caso(s) novo(s) entraram — atualize CASOS_ESPERADOS e os documentos."),
  );
  if (codigo === 0) process.exitCode = 1;
});
```

E `casos++` como **primeira linha** do corpo da função que roda cada caso. Colar o bloco sem o
`casos++` deixa a contagem em zero e reprova tudo.

**Contagem que varia com o ambiente declara os totais possíveis**, num comentário ao lado
(`// possíveis: 17 ou 25`). Número fixo descreve a máquina de quem escreveu.

**Provar por sabotagem, antes de aceitar a bateria.** Quebrar o código de propósito e exigir que
ela reprove — e comparar o real com o sabotado **na mesma árvore**, exigindo que discordem.
Comparar o sabotado com um código de saída fixo deixa passar a sabotagem que reprova **pelo motivo
errado**.

**Exigir a mensagem, nunca só o código de saída.** Caso que espera bloqueio e recebe bloqueio
*por outro motivo* fica **verde pelo motivo errado** — o pior resultado possível, porque parece
cobertura. Código de saída certo não é decisão certa.

**Os casos que provam que a trava fica CALADA valem metade.** Trava que bloqueia trabalho legítimo
é desativada pela pessoa, e aí não protege mais nada.

**Casos nascem do que aconteceu de verdade**, não do que eu imagino que aconteça. Bateria que
passa tanto na versão certa quanto na versão com defeito não prova nada — o teste é: rodar contra
a versão antiga e exigir que **reprove**.

**Nada de rede.** Teste que sai à internet fica vermelho por motivo alheio ao que mede. Montar
programa de mentira num `PATH` próprio.

⚠ **Esvaziar o `PATH` mede a ausência do programa, não a decisão da trava.** E pôr a *pasta* de um
programa real no `PATH` abre a porta do lado — em Linux `/usr/bin` traz dezenas de outros junto, e
o caso "sem ferramenta nenhuma" ganha a ferramenta de volta. Dar **um programa**, por atalho que
chama o real pelo caminho absoluto.

**Dependeu do sistema operacional → ramifica, declara e varia a contagem.** Nunca abortar a
bateria inteira, nunca fingir que rodou tudo: imprimir **quais casos não rodaram e por quê**, e
terminar com frase própria (`OK NO QUE RODOU`), diferente da frase de sucesso pleno.

---

## 3. Desenhar os sinais

| Situação | Sai como | Por quê |
|---|---|---|
| Tudo conferido, tudo certo | verde, frase de sucesso pleno | — |
| Rodou parcialmente | verde, **frase diferente**, dizendo o que não rodou | frase igual à de sucesso foi o que escondeu o defeito |
| Estado legítimo esperando gente | verde + aviso, **nunca vermelho** | vermelho por construção ensina a ignorar o vermelho |
| Erro de verdade | vermelho | — |
| Não conseguiu conferir | **vermelho ou bloqueio**, nunca verde | "não conferi" ≠ "está em dia" |

**Três códigos de saída, não dois:** `0` em dia, `1` há pendência legítima, `2` erro de verdade.
Unificar quebra os dois lados — pendência que derruba o build pinta tudo de vermelho permanente;
erro que sai como pendência esconde uma trava ilegível dentro de um aviso que ninguém liga à causa.

**Aviso automático não pode mentir.** Um alerta genérico reaproveitado para dizer "falhou de novo"
quando nada falhou é uma mentira por execução, para sempre, num agendado. Derivar o texto de um
**sinal já existente**, nunca de um segundo campo que o chamador pode esquecer de preencher — dois
campos dizendo a mesma coisa trazem a mentira de volta.

**Aviso que se repete sem ação possível vira aviso ignorado.** Quem avisa entrega junto a
**evidência para agir** — e no canal que a pessoa realmente alcança naquele ambiente. E-mail e
anexo de build não chegam a toda parte; o texto do log costuma ser o único que chega sempre.

**Truncou, diz que truncou** — e que o corte não significa que o resto esteja em dia.

---

## 4. Antes de dizer que está pronto

- [ ] Rodou **no ambiente onde ninguém está olhando**, não só onde funciona.
- [ ] Sabotado de propósito e **reprovou** — nos dois sentidos.
- [ ] A bateria reprova a versão **antiga** (senão não prova nada).
- [ ] Os casos exigem a **mensagem**, não só o código de saída.
- [ ] Existem casos provando que a trava fica **calada** no caso legítimo.
- [ ] O que ela **não** cobre está escrito.
- [ ] O arquivo está **registrado** onde precisa estar, não só presente.
- [ ] O número de casos anunciado bate com o `CASOS_ESPERADOS`.
- [ ] Nenhuma mensagem manda fazer algo impossível naquele ambiente.

## 5. Armadilhas já medidas

Antes de depurar shell, Git, GitHub Actions ou Windows nesta área: `armadilhas-medidas.md`, nesta
mesma pasta. Todas foram medidas em execução real, e cada uma tem um sintoma que aponta para o
lugar errado.
