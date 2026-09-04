#!/usr/bin/env node
/* ---------------------------------------------------------------
   Conferência de fumaça do que vai ao ar.

   Por que existe: publicar arquivo quebrado é publicar com sucesso. O
   job de deploy fica verde do mesmo jeito, a tela abre em branco, e o
   verde diz que está tudo bem. Esta conferência roda DEPOIS do build e
   ANTES do deploy, e roda também no PR — trava só é trava antes do
   merge; depois vira obituário.

   O que ela cobre (seis famílias, todas obrigatórias):
     1. a pasta publicada existe e tem `index.html`
     2. todo arquivo citado pelo `index.html` existe ali dentro
     3. todo `.js` publicado passa na checagem de sintaxe de módulo
     4. o service worker está pronto: sem marcador de molde sobrando,
        e cada arquivo da lista de cache existe
     5. o manifesto parseia e os ícones dele existem
     6. o `index.html` carrega o app (script de módulo), não ficou
        apontando para o código-fonte, e o carimbo de versão foi trocado
        pelo build

   O que ela NÃO cobre, escrito de propósito: não abre navegador, não
   confere aparência, não roda o app. Isso é o Chromium e a bateria de
   `test/` — buraco declarado é decisão, buraco calado é defeito.

   Códigos de saída: 0 em dia · 1 achou defeito · 2 não consegui conferir.
--------------------------------------------------------------- */

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const FAMILIAS_ESPERADAS = 6;

/* A pasta vem por parâmetro, nunca de variável de ambiente: caso que lê
   o ambiente responde diferente na minha máquina e no runner, e reprova
   por um motivo que nada tem a ver com o que ele mede. É também o que
   deixa o sabotador apontar para uma cópia da árvore. */
const PASTA = resolve(process.argv[2] || 'dist');

const problemas = [];
let familias = 0;
let conferidos = 0;

const reclamar = (texto) => problemas.push(texto);

function todosOsArquivos(dir) {
  const achados = [];
  const andar = (atual) => {
    for (const nome of readdirSync(atual)) {
      const caminho = join(atual, nome);
      if (statSync(caminho).isDirectory()) andar(caminho);
      else achados.push(relative(PASTA, caminho).split(sep).join('/'));
    }
  };
  andar(dir);
  return achados;
}

/** Caminho citado numa página → arquivo dentro da pasta publicada.
 *  Devolve `null` para o que não é arquivo nosso (http, data:, âncora). */
function paraArquivo(citado) {
  if (!citado) return null;
  const limpo = citado.trim();
  if (!limpo || limpo.startsWith('#') || limpo.startsWith('data:') || limpo.startsWith('mailto:')) return null;
  if (/^[a-z]+:\/\//i.test(limpo) || limpo.startsWith('//')) return null;

  let caminho = limpo.split('?')[0].split('#')[0];
  // `/App-da-Kelly/algo` e `algo` chegam no mesmo arquivo; o que importa
  // é o fim do caminho, porque o começo é a base da publicação.
  caminho = caminho.replace(/^\/+/, '');
  const base = 'App-da-Kelly/';
  if (caminho.startsWith(base)) caminho = caminho.slice(base.length);
  caminho = caminho.replace(/^\.\//, '');
  if (caminho === '' ) return 'index.html';
  if (caminho.endsWith('/')) return caminho + 'index.html';
  return caminho;
}

function sintaxeDeModulo(arquivo) {
  // `node --check arquivo.js` FALHA ABERTA em arquivo com import/export:
  // o mesmo erro sai com código 0. Medido no Node v22. Pela entrada
  // padrão, com --input-type=module, ele reprova de verdade.
  const r = spawnSync(process.execPath, ['--input-type=module', '--check'], {
    input: readFileSync(arquivo, 'utf8'),
    encoding: 'utf8',
  });
  if (r.error) return `não consegui rodar o Node para checar ${arquivo}: ${r.error.message}`;
  return r.status === 0 ? null : (r.stderr || '').trim().split('\n')[0];
}

/* ------------------------- 1. a pasta ------------------------- */

if (!existsSync(PASTA) || !statSync(PASTA).isDirectory()) {
  console.error(`NAO CONSEGUI CONFERIR: a pasta ${PASTA} não existe. Rode \`npm run build\` antes.`);
  process.exit(2);
}

familias++;
const arquivos = todosOsArquivos(PASTA);
const existe = (caminho) => arquivos.includes(caminho);

if (!existe('index.html')) reclamar('a pasta publicada não tem index.html — o app não abre.');
if (!existe('sw.js')) reclamar('a pasta publicada não tem sw.js — o app não funciona offline nem se atualiza sozinho.');
conferidos += 2;

const html = existe('index.html') ? readFileSync(join(PASTA, 'index.html'), 'utf8') : '';

/* ------------------------- 2. o que o HTML cita ------------------------- */

familias++;
for (const [, citado] of html.matchAll(/(?:src|href)\s*=\s*"([^"]+)"/g)) {
  const alvo = paraArquivo(citado);
  if (!alvo) continue;
  conferidos++;
  if (!existe(alvo)) reclamar(`index.html aponta para "${citado}", que não existe na pasta publicada.`);
}

/* ------------------------- 3. sintaxe do JS ------------------------- */

familias++;
for (const arquivo of arquivos.filter((a) => a.endsWith('.js'))) {
  conferidos++;
  const erro = sintaxeDeModulo(join(PASTA, arquivo));
  if (erro) reclamar(`${arquivo} tem erro de sintaxe: ${erro}`);
}

/* ------------------------- 4. o service worker ------------------------- */

familias++;
if (existe('sw.js')) {
  const sw = readFileSync(join(PASTA, 'sw.js'), 'utf8');
  conferidos++;

  // Os marcadores do molde são montados aqui em pedaços de propósito:
  // escrever o nome inteiro faria este arquivo casar consigo mesmo se
  // alguém um dia o publicasse junto.
  for (const marcador of ['__BUILD' + '__', '__ARQUIVOS' + '__']) {
    if (sw.includes(marcador)) {
      reclamar(`sw.js foi publicado com o marcador ${marcador} sem trocar — o build não carimbou a versão.`);
    }
  }

  const lista = sw.match(/const ARQUIVOS = (\[[\s\S]*?\]);/);
  if (!lista) {
    reclamar('sw.js não tem a lista de arquivos do cache no formato esperado.');
  } else {
    let itens;
    try {
      itens = JSON.parse(lista[1]);
    } catch (e) {
      reclamar(`a lista de cache do sw.js não é JSON válido: ${e.message}`);
      itens = [];
    }
    if (!itens.length) reclamar('a lista de cache do sw.js está vazia — o app não abriria offline.');
    for (const item of itens) {
      const alvo = paraArquivo(item);
      conferidos++;
      if (alvo && !existe(alvo)) {
        reclamar(`sw.js manda guardar "${item}" no cache, e esse arquivo não existe na pasta publicada.`);
      }
    }
  }
}

/* ------------------------- 5. o manifesto ------------------------- */

familias++;
for (const arquivo of arquivos.filter((a) => a.endsWith('.webmanifest') || a.endsWith('.json'))) {
  conferidos++;
  let dados;
  try {
    dados = JSON.parse(readFileSync(join(PASTA, arquivo), 'utf8'));
  } catch (e) {
    reclamar(`${arquivo} não é JSON válido: ${e.message}`);
    continue;
  }
  if (!arquivo.endsWith('.webmanifest')) continue;

  for (const campo of ['name', 'short_name', 'start_url', 'display', 'icons']) {
    if (!dados[campo]) reclamar(`${arquivo} está sem o campo "${campo}" — o app não instala direito.`);
  }
  for (const icone of Array.isArray(dados.icons) ? dados.icons : []) {
    const alvo = paraArquivo(icone.src);
    conferidos++;
    if (alvo && !existe(alvo)) reclamar(`${arquivo} aponta para o ícone "${icone.src}", que não existe.`);
  }
}

/* ------------------------- 6. o app entra em cena ------------------------- */

familias++;
conferidos++;
if (html && !/<script[^>]+type="module"[^>]+src=/.test(html)) {
  reclamar('index.html não carrega nenhum script de módulo — o app publicado seria uma página parada.');
}
conferidos++;
if (/src="\/src\//.test(html)) {
  reclamar('index.html publicado ainda aponta para /src/ — isso é o código-fonte, que não vai para o ar.');
}

/* O carimbo de versão é a única evidência visível, no celular, de que a
   versão nova chegou. Se o marcador for ao ar sem troca, o rodapé mostra
   o nome do marcador e a conferência à mão do ciclo de atualização passa
   a medir nada. O nome é montado em pedaços de propósito, para este
   arquivo não casar consigo mesmo. */
const MARCADOR_DE_VERSAO = '__VERSAO' + '_DO_APP__';
for (const arquivo of arquivos.filter((a) => a.endsWith('.js') || a.endsWith('.html'))) {
  conferidos++;
  if (readFileSync(join(PASTA, arquivo), 'utf8').includes(MARCADOR_DE_VERSAO)) {
    reclamar(`${arquivo} foi publicado com o marcador de versão sem trocar — o rodapé mostraria o marcador no lugar da data.`);
  }
}

/* ------------------------- veredito ------------------------- */

if (familias !== FAMILIAS_ESPERADAS) {
  console.error(
    `NAO CONSEGUI CONFERIR: rodaram ${familias} de ${FAMILIAS_ESPERADAS} famílias de conferência. ` +
    'Alguma deixou de rodar — o resultado não prova o que diz provar.'
  );
  process.exit(2);
}

if (problemas.length) {
  console.error(`FUMACA: ${problemas.length} problema(s) no que iria ao ar (${conferidos} conferências, ${familias} famílias):\n`);
  for (const p of problemas) console.error(`  · ${p}`);
  console.error('\nNada foi publicado. Corrija e rode `npm run conferir` de novo.');
  process.exit(1);
}

console.log(`FUMACA OK: ${conferidos} conferências em ${familias} famílias, nenhum problema em ${PASTA}.`);
process.exit(0);
