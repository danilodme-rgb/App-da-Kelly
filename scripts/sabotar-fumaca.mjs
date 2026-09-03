#!/usr/bin/env node
/* ---------------------------------------------------------------
   Prova por sabotagem da conferência de fumaça.

   Passar não prova que detecta falha (regra 8d). Aqui a árvore
   publicada é copiada, quebrada de propósito uma vez para cada
   defeito que a conferência diz pegar, e a conferência tem de
   REPROVAR nas doze — dizendo o motivo certo, não só saindo com
   código 1. Caso que espera bloqueio e recebe bloqueio pelo motivo
   errado fica verde pelo motivo errado, que é o pior resultado
   possível: parece cobertura.

   Mais um caso de controle: a cópia limpa tem de PASSAR. Trava que
   reprova trabalho legítimo é trava que alguém desliga.

   Códigos de saída: 0 a conferência se provou · 1 ela deixou passar
   alguma sabotagem · 2 não consegui rodar a prova.
--------------------------------------------------------------- */

import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const CASOS_ESPERADOS = 13;
let casos = 0;
const falhas = [];

const CONFERENCIA = resolve('scripts/conferir-fumaca.mjs');
const ORIGEM = resolve(process.argv[2] || 'dist');

if (!existsSync(ORIGEM)) {
  console.error(`NAO CONSEGUI RODAR A PROVA: ${ORIGEM} não existe. Rode \`npm run build\` antes.`);
  process.exit(2);
}
if (!existsSync(CONFERENCIA)) {
  console.error(`NAO CONSEGUI RODAR A PROVA: não achei ${CONFERENCIA}.`);
  process.exit(2);
}

const raiz = mkdtempSync(join(tmpdir(), 'sabotar-kelly-'));

function rodar(pasta) {
  const r = spawnSync(process.execPath, [CONFERENCIA, pasta], { encoding: 'utf8' });
  if (r.error) {
    console.error(`NAO CONSEGUI RODAR A PROVA: ${r.error.message}`);
    process.exit(2);
  }
  return { codigo: r.status, saida: `${r.stdout}${r.stderr}` };
}

function copia(nome) {
  const destino = join(raiz, nome);
  cpSync(ORIGEM, destino, { recursive: true });
  return destino;
}

const arquivoQueCasa = (pasta, sufixo, dentro = 'assets') =>
  readdirSync(join(pasta, dentro)).filter((n) => n.endsWith(sufixo)).map((n) => join(pasta, dentro, n));

function troca(arquivo, de, para) {
  const antes = readFileSync(arquivo, 'utf8');
  const depois = antes.replace(de, para);
  if (antes === depois) throw new Error(`a sabotagem não mudou nada em ${arquivo} — ela não sabotou`);
  writeFileSync(arquivo, depois);
}

/** Um caso: quebra a cópia e exige reprovação COM o motivo certo. */
function sabotagem(nome, quebrar, trechoEsperado) {
  casos++;
  let pasta;
  try {
    pasta = copia(`caso-${casos}`);
    quebrar(pasta);
  } catch (e) {
    falhas.push(`${nome}: não consegui aplicar a sabotagem (${e.message})`);
    return;
  }
  const { codigo, saida } = rodar(pasta);
  if (codigo === 0) {
    falhas.push(`${nome}: a conferência PASSOU numa árvore sabotada — ela não pega este defeito.`);
    return;
  }
  if (!saida.includes(trechoEsperado)) {
    falhas.push(
      `${nome}: reprovou, mas pelo motivo errado. Esperava a mensagem conter ` +
      `"${trechoEsperado}" e saiu: ${saida.trim().split('\n').join(' | ')}`
    );
  }
}

/* ------------------------- o controle ------------------------- */

casos++;
{
  const limpa = copia('controle');
  const { codigo, saida } = rodar(limpa);
  if (codigo !== 0 || !saida.includes('FUMACA OK')) {
    falhas.push(
      'controle: a conferência REPROVOU a árvore limpa. Antes de acreditar em qualquer ' +
      `sabotagem abaixo, conserte isto. Saiu: ${saida.trim().split('\n').join(' | ')}`
    );
  }
}

/* ------------------------- as sabotagens ------------------------- */

sabotagem('index.html apagado',
  (p) => rmSync(join(p, 'index.html')),
  'não tem index.html');

sabotagem('sw.js apagado',
  (p) => rmSync(join(p, 'sw.js')),
  'não tem sw.js');

sabotagem('folha de estilo citada some',
  (p) => { for (const css of arquivoQueCasa(p, '.css')) rmSync(css); },
  'que não existe na pasta publicada');

sabotagem('JavaScript publicado com erro de sintaxe',
  (p) => {
    const [js] = arquivoQueCasa(p, '.js');
    writeFileSync(js, `${readFileSync(js, 'utf8')}\nexport const quebrado = {;\n`);
  },
  'erro de sintaxe');

sabotagem('service worker sai com o marcador de versão sem trocar',
  (p) => troca(join(p, 'sw.js'), /const VERSAO = '[^']+'/, "const VERSAO = '__BUILD" + "__'"),
  'sem trocar');

sabotagem('lista de cache do service worker vazia',
  (p) => troca(join(p, 'sw.js'), /const ARQUIVOS = \[[\s\S]*?\];/, 'const ARQUIVOS = [];'),
  'está vazia');

sabotagem('service worker guarda arquivo que não existe',
  (p) => troca(join(p, 'sw.js'), /const ARQUIVOS = \[/, 'const ARQUIVOS = [\n  "/App-da-Kelly/sumiu.js",'),
  'manda guardar');

sabotagem('manifesto com JSON quebrado',
  (p) => writeFileSync(join(p, 'manifest.webmanifest'), '{ "name": "Kelly", '),
  'não é JSON válido');

sabotagem('manifesto sem start_url',
  (p) => troca(join(p, 'manifest.webmanifest'), /"start_url":\s*"[^"]*",\s*/, ''),
  'está sem o campo "start_url"');

sabotagem('ícone do manifesto aponta para arquivo que não existe',
  (p) => troca(join(p, 'manifest.webmanifest'), /"\.\/assets\/gatinho\.svg"/, '"./assets/nao-existe.svg"'),
  'aponta para o ícone');

sabotagem('página publicada sem o script do app',
  (p) => troca(join(p, 'index.html'), /<script[^>]*type="module"[^>]*><\/script>/, ''),
  'não carrega nenhum script de módulo');

sabotagem('página publicada apontando para o código-fonte',
  (p) => troca(join(p, 'index.html'), /<script type="module"[^>]*src="[^"]*"/, '<script type="module" src="/src/main.js"'),
  'ainda aponta para /src/');

/* ------------------------- veredito ------------------------- */

rmSync(raiz, { recursive: true, force: true });

if (casos !== CASOS_ESPERADOS) {
  console.error(
    `CONTAGEM NAO FECHA: ${casos} caso(s) executado(s), ${CASOS_ESPERADOS} esperado(s). ` +
    'A prova não provou o que diz provar.'
  );
  process.exit(2);
}

if (falhas.length) {
  console.error(`SABOTAGEM: a conferência de fumaça falhou em ${falhas.length} de ${casos} caso(s):\n`);
  for (const f of falhas) console.error(`  · ${f}`);
  process.exit(1);
}

console.log(`SABOTAGEM OK: a conferência de fumaça reprovou as ${casos - 1} sabotagens e aprovou a árvore limpa.`);
process.exit(0);
