#!/usr/bin/env node
/* ---------------------------------------------------------------
   O app instalado se atualiza sozinho? (regra 11f)

   Por que esta trava existe: a regra 11f é o alicerce do app — quem já
   abriu recebe a mudança sem reinstalar, sem limpar cache e sem apertar
   nada. Sem trava, desobedecer não produz sinal nenhum: trocar o service
   worker para cache-first deixa a bateria verde, o build verde, a
   conferência de fumaça verde, e a Kelly congelada na versão velha para
   sempre — sem ninguém perceber, porque a tela antiga continua
   funcionando.

   Teste de função pura não serve aqui: ele passa verde com a lógica
   errada (regra 11b). Comportamento de ambiente se prova no ciclo real.

   O ciclo que ela roda, do jeito que acontece na vida:
     1. constrói a versão 1 e serve num servidor local
     2. abre num Chromium de verdade e espera o service worker assumir
     3. troca o que o servidor entrega pela versão 2
     4. exige que o app entregue a versão nova JÁ NA PRIMEIRA BUSCA,
        antes de qualquer atualização do service worker — é isto, e só
        isto, que prova "rede primeiro"
     5. dispara a MESMA checagem que o app faz ao voltar para a tela
     6. exige que a página troque SOZINHA — sem recarregar à mão
     7. corta a rede e exige que o app ainda abra

   O que ela NÃO cobre, escrito de propósito:
     - o cache HTTP da hospedagem. O servidor daqui não manda
       `Cache-Control: max-age`, então o `cache: 'no-store'` do service
       worker não é exercido. Quem prova aquilo é o GitHub Pages.
     - o endereço publicado. A rede desta sessão não alcança o
       github.io; isto roda tudo em 127.0.0.1.
     - instalar como app (tela de início, ícone). Isso é aparelho real.

   Uso: node scripts/conferir-atualizacao.mjs [--sabotar=<chave>]
   Códigos de saída: 0 em dia · 1 achou defeito · 2 não consegui conferir.
--------------------------------------------------------------- */

import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';

const CASOS_ESPERADOS = 6;
let casos = 0;
const problemas = [];

const RAIZ = resolve('.');
const CHROMIUM = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = '/App-da-Kelly/';
const MARCA = 'ESTA-E-A-VERSAO-DOIS';

/* A marca de versão é uma frase que o app mostra na tela assim que abre
   (a fala do gatinho com o dia zerado) e que vive DENTRO do pacote de
   JavaScript. Isso é de propósito: mexer só no `index.html` não muda o
   hash de nenhum arquivo, o service worker sai idêntico, e o navegador
   não vê atualização nenhuma para instalar — o teste passaria sem
   exercitar o mecanismo que ele diz medir. */
const FALA_V1 = "'O gatinho ainda está cochilando. Comece quando quiser.'";

/* Sabotagens, para `sabotar-atualizacao.mjs` quebrar o app de propósito
   e exigir que esta conferência reprove. Cada uma é um jeito realista de
   alguém desligar a regra 11f sem querer. */
const SABOTAGENS = {
  'cache-primeiro': {
    arquivo: 'src/sw.js',
    de: 'fetch(daRede)\n      .then((resposta) => {',
    para: 'caches.match(pedido).then((guardado) => guardado || fetch(daRede))\n      .then((resposta) => {',
  },
  'sem-assumir-na-hora': {
    arquivo: 'src/sw.js',
    de: '.then(() => self.skipWaiting())',
    para: '.then(() => undefined)',
  },
  'sem-recarregar': {
    arquivo: 'src/main.js',
    de: '    recarregando = true;\n    location.reload();',
    para: '    recarregando = true;',
  },
  'lista-e-versao-a-mao': {
    // O caso mais realista de todos: alguém acha o carimbo automático
    // complicado e escreve versão e lista de arquivos à mão. O service
    // worker sai idêntico a cada build, o navegador não vê atualização
    // nenhuma para instalar, e o app congela — calado.
    arquivo: 'vite.config.js',
    de: "const versao = createHash('sha256').update(arquivos.join('|')).digest('hex').slice(0, 12);",
    para: "const versao = 'versao-fixa';\n      arquivos.length = 0;\n      arquivos.push(BASE, `${BASE}index.html`);",
  },
  'sem-reserva-offline': {
    arquivo: 'src/sw.js',
    de: '      .catch(() =>\n        caches.match(pedido).then((achou) =>',
    para: '      .catch(() =>\n        Promise.resolve(undefined).then((achou) =>',
  },
};

// A lista de sabotagens sai daqui, não de uma cópia no provador: trava
// que confere lista escrita à mão só confere quem está na lista, e a
// sabotagem nova nasceria fora dela, calada (regra 16e).
if (process.argv.includes('--listar-sabotagens')) {
  console.log(Object.keys(SABOTAGENS).join('\n'));
  process.exit(0);
}

const argSabotagem = (process.argv.find((a) => a.startsWith('--sabotar=')) || '').split('=')[1] || null;
if (argSabotagem && !SABOTAGENS[argSabotagem]) {
  console.error(`NAO CONSEGUI CONFERIR: sabotagem "${argSabotagem}" não existe. ` +
                `As que existem: ${Object.keys(SABOTAGENS).join(', ')}.`);
  process.exit(2);
}

if (!existsSync(CHROMIUM)) {
  console.error(`NAO CONSEGUI CONFERIR: não achei o Chromium em ${CHROMIUM}. Aponte CHROMIUM_PATH para ele.`);
  process.exit(2);
}
if (!existsSync(join(RAIZ, 'node_modules', 'vite'))) {
  console.error('NAO CONSEGUI CONFERIR: falta node_modules. Rode `npm install` antes.');
  process.exit(2);
}

/* ------------------------- construir as duas versões ------------------------- */

const oficina = mkdtempSync(join(tmpdir(), 'atualizacao-kelly-'));

function trocar(arquivo, de, para, ondeFica) {
  const caminho = join(ondeFica, arquivo);
  const antes = readFileSync(caminho, 'utf8');
  const depois = antes.replace(de, para);
  if (antes === depois) {
    throw new Error(`a troca em ${arquivo} não mudou nada — o texto procurado não está mais lá`);
  }
  writeFileSync(caminho, depois);
}

/** Copia o projeto para uma bancada própria. O `node_modules` entra por
 *  atalho: copiar levaria minutos, e o teste não mexe nele. A árvore de
 *  trabalho nunca é tocada — teste que edita o código-fonte de verdade
 *  deixa o repositório sujo quando estoura no meio. */
function bancada(nome) {
  const destino = join(oficina, nome);
  for (const item of ['index.html', 'src', 'public', 'vite.config.js', 'package.json']) {
    cpSync(join(RAIZ, item), join(destino, item), { recursive: true });
  }
  symlinkSync(join(RAIZ, 'node_modules'), join(destino, 'node_modules'), 'dir');
  if (argSabotagem) {
    const s = SABOTAGENS[argSabotagem];
    trocar(s.arquivo, s.de, s.para, destino);
  }
  return destino;
}

function construir(ondeFica, saida) {
  const r = spawnSync(process.execPath, [join(RAIZ, 'node_modules', 'vite', 'bin', 'vite.js'), 'build', '--outDir', saida], {
    cwd: ondeFica,
    encoding: 'utf8',
  });
  if (r.status !== 0) {
    throw new Error(`o build falhou em ${ondeFica}:\n${(r.stderr || r.stdout || '').trim()}`);
  }
}

let v1;
let v2;
try {
  const casa1 = bancada('fonte-v1');
  v1 = join(oficina, 'v1');
  construir(casa1, v1);

  const casa2 = bancada('fonte-v2');
  trocar('src/estado.js', FALA_V1, `'${MARCA}'`, casa2);
  v2 = join(oficina, 'v2');
  construir(casa2, v2);
} catch (erro) {
  rmSync(oficina, { recursive: true, force: true });
  console.error(`NAO CONSEGUI CONFERIR: ${erro.message}`);
  process.exit(2);
}

/* ------------------------- o servidor que troca de versão ------------------------- */

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
};

// Este é o "servidor de hospedagem": publicar a versão 2 é trocar esta
// pasta, exatamente como um deploy troca o que o endereço entrega.
let servindo = v1;

const servidor = createServer((req, res) => {
  let caminho = decodeURIComponent(req.url.split('?')[0]);
  if (!caminho.startsWith(BASE)) return res.writeHead(404).end('fora da base');
  caminho = caminho.slice(BASE.length) || 'index.html';
  if (caminho.endsWith('/')) caminho += 'index.html';
  const arquivo = join(servindo, caminho);
  if (!arquivo.startsWith(servindo) || !existsSync(arquivo)) return res.writeHead(404).end('não achei');
  res.writeHead(200, { 'content-type': TIPOS[extname(arquivo)] || 'application/octet-stream' });
  res.end(readFileSync(arquivo));
});

await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
const endereco = `http://127.0.0.1:${servidor.address().port}${BASE}`;

/* ------------------------- o ciclo ------------------------- */

function caso(nome, condicao, detalhe) {
  casos++;
  if (!condicao) problemas.push(`${nome}: ${detalhe}`);
}

const { chromium } = await import('playwright-core');
const navegador = await chromium.launch({ executablePath: CHROMIUM });
const contexto = await navegador.newContext({ viewport: { width: 430, height: 900 }, locale: 'pt-BR' });
const pagina = await contexto.newPage();

// Quantas vezes NÓS mandamos a página navegar. Fica em 1 (a abertura):
// se a tela trocar, foi o app, não o teste.
let navegacoesNossas = 0;

try {
  navegacoesNossas++;
  await pagina.goto(endereco, { waitUntil: 'networkidle' });

  const assumiu = await pagina.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15000 })
    .then(() => true).catch(() => false);
  caso('o service worker assume a página',
    assumiu,
    'abri o app e nenhum service worker tomou o controle em 15s — sem isso não existe atualização automática nem modo offline.');

  const textoV1 = await pagina.locator('#falaDoGato').textContent();
  caso('a versão 1 é mesmo a versão 1',
    textoV1 && !textoV1.includes(MARCA),
    `a tela já abriu mostrando a marca da versão 2 ("${textoV1}") — as duas versões saíram iguais e o teste não mediria nada.`);

  // publicar a versão 2
  servindo = v2;

  /* "Rede primeiro" se mede AQUI, antes de o service worker se
     atualizar: uma busca comum, feita pela página, passa pelo `fetch` do
     service worker e tem de voltar da rede. Cache-first devolveria a
     cópia guardada — a versão velha — e o app só se corrigiria depois,
     quando o service worker novo assumisse.

     Medir isto no fim do ciclo não funciona: como o nome do cache sai do
     conteúdo do build, o service worker novo abre um cache vazio e busca
     tudo da rede, e aí até um cache-first acaba entregando a versão 2.
     A primeira versão desta conferência media só o fim, e a prova por
     sabotagem pegou: `cache-primeiro` passava batido. */
  const htmlV1 = readFileSync(join(v1, 'index.html'), 'utf8');
  const htmlV2 = readFileSync(join(v2, 'index.html'), 'utf8');
  const htmlServido = await pagina.evaluate(async (u) => {
    try { return await (await fetch(u)).text(); } catch { return null; }
  }, endereco);
  caso('a rede vem primeiro, o cache é reserva',
    htmlServido === htmlV2 && htmlV2 !== htmlV1,
    htmlServido === htmlV1
      ? 'publiquei a versão 2 e a primeira busca do app ainda entregou a versão 1, guardada no cache. ' +
        'O cache virou fonte principal: a correção de hoje só chegaria na próxima troca de service worker.'
      : 'não consegui comparar o que o app entregou com as duas versões construídas.');

  /* O app procura atualização ao carregar e toda vez que a janela volta
     a ficar visível. Aqui o evento é disparado à mão porque não dá para
     minimizar a janela de um navegador sem tela — mas quem responde é o
     ouvinte de verdade do app, em `main.js`, não um atalho do teste. */
  await pagina.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));

  const trocouSozinha = await pagina
    .waitForFunction((marca) => document.body.innerText.includes(marca), MARCA, { timeout: 25000 })
    .then(() => true).catch(() => false);
  caso('a tela troca sozinha quando sai versão nova',
    trocouSozinha,
    'publiquei a versão 2 e, 25s depois, a página seguia mostrando a versão 1. ' +
    'Quem já instalou o app ficaria preso na versão velha, sem sinal nenhum.');

  const foiRecarregamento = await pagina.evaluate(() =>
    performance.getEntriesByType('navigation')[0]?.type ?? null);
  caso('a troca veio de um recarregamento que o app pediu',
    foiRecarregamento === 'reload' && navegacoesNossas === 1,
    `o teste navegou ${navegacoesNossas} vez(es) e o navegador classificou a última navegação como ` +
    `"${foiRecarregamento}" — para valer, a página tem de ter se recarregado por conta própria.`);

  // e o app continua abrindo sem internet
  await contexto.setOffline(true);
  servidor.close();
  navegacoesNossas++;
  const abriuOffline = await pagina.reload({ waitUntil: 'domcontentloaded', timeout: 20000 })
    .then(async () => {
      const tarefas = await pagina.locator('.tarefa').count();
      return tarefas > 0;
    })
    .catch(() => false);
  caso('o app ainda abre sem internet',
    abriuOffline,
    'cortei a rede e o app não desenhou a rotina — o cache deixou de ser reserva de offline.');
} catch (erro) {
  problemas.push(`o ciclo estourou no meio: ${erro.message}`);
} finally {
  await navegador.close().catch(() => {});
  servidor.close();
  rmSync(oficina, { recursive: true, force: true });
}

/* ------------------------- veredito ------------------------- */

if (casos !== CASOS_ESPERADOS) {
  console.error(
    `NAO CONSEGUI CONFERIR: rodaram ${casos} de ${CASOS_ESPERADOS} casos. ` +
    'O ciclo parou no meio — o resultado não prova o que diz provar.'
  );
  process.exit(2);
}

if (problemas.length) {
  console.error(`ATUALIZACAO: ${problemas.length} problema(s) no ciclo de atualização do app instalado:\n`);
  for (const p of problemas) console.error(`  · ${p}`);
  process.exit(1);
}

console.log(`ATUALIZACAO OK: ${casos} casos — o app instalado recebe a versão nova sozinho e ainda abre offline.`);
process.exit(0);
