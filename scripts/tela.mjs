#!/usr/bin/env node
/* ---------------------------------------------------------------
   Abre o app publicado num Chromium de verdade, tira print nos dois
   temas e reprova se o console tiver erro.

   Ler o código não substitui isto: mudança de interface se confere
   renderizando (regra 11), e o console sujo é o sintoma que aparece
   antes de qualquer relato de usuária.

   Uso: node scripts/tela.mjs [pasta]   (padrão: dist)
   Códigos de saída: 0 tudo certo · 1 achou erro · 2 não consegui rodar.
--------------------------------------------------------------- */

import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync, mkdirSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { chromium } from 'playwright-core';

const CHROMIUM = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PASTA = resolve(process.argv[2] || 'dist');
const BASE = '/App-da-Kelly/';
const SAIDA = resolve('capturas');

if (!existsSync(PASTA)) {
  console.error(`NAO CONSEGUI RODAR: ${PASTA} não existe. Rode \`npm run build\` antes.`);
  process.exit(2);
}
if (!existsSync(CHROMIUM)) {
  console.error(`NAO CONSEGUI RODAR: não achei o Chromium em ${CHROMIUM}. Aponte CHROMIUM_PATH para ele.`);
  process.exit(2);
}

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json',
};

// Servidor mínimo só para esta conferência: abrir o `index.html` pelo
// `file://` não deixa registrar service worker nem carregar módulo.
const servidor = createServer((req, res) => {
  let caminho = decodeURIComponent(req.url.split('?')[0]);
  if (!caminho.startsWith(BASE)) return res.writeHead(404).end('fora da base');
  caminho = caminho.slice(BASE.length) || 'index.html';
  if (caminho.endsWith('/')) caminho += 'index.html';
  const arquivo = join(PASTA, caminho);
  if (!arquivo.startsWith(PASTA) || !existsSync(arquivo) || statSync(arquivo).isDirectory()) {
    return res.writeHead(404).end('não achei');
  }
  res.writeHead(200, { 'content-type': TIPOS[extname(arquivo)] || 'application/octet-stream' });
  res.end(readFileSync(arquivo));
});

await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
const endereco = `http://127.0.0.1:${servidor.address().port}${BASE}`;

mkdirSync(SAIDA, { recursive: true });

const problemas = [];
const navegador = await chromium.launch({ executablePath: CHROMIUM });

for (const tema of ['light', 'dark']) {
  const contexto = await navegador.newContext({
    colorScheme: tema,
    viewport: { width: 430, height: 1000 },
    deviceScaleFactor: 2,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  });
  const pagina = await contexto.newPage();
  pagina.on('console', (m) => {
    if (m.type() === 'error') problemas.push(`[${tema}] console: ${m.text()}`);
  });
  pagina.on('pageerror', (e) => problemas.push(`[${tema}] erro de página: ${e.message}`));

  await pagina.goto(endereco, { waitUntil: 'networkidle' });

  // marca duas tarefas, para o print mostrar o gatinho reagindo
  const tarefas = pagina.locator('.tarefa');
  await tarefas.nth(0).click();
  await tarefas.nth(1).click();
  await pagina.waitForTimeout(600);

  const temaNaTela = await pagina.evaluate(() => document.documentElement.dataset.tema);
  if (temaNaTela !== tema) problemas.push(`[${tema}] a página abriu no tema "${temaNaTela}"`);

  const pct = await pagina.locator('#pctProgresso').textContent();
  if (pct === '0%') problemas.push(`[${tema}] marquei duas tarefas e o progresso continuou em 0%`);

  await pagina.screenshot({ path: join(SAIDA, `${tema}.png`), fullPage: false });
  await contexto.close();
}

await navegador.close();
servidor.close();

if (problemas.length) {
  console.error(`TELA: ${problemas.length} problema(s):\n`);
  for (const p of problemas) console.error(`  · ${p}`);
  process.exit(1);
}

console.log(`TELA OK: os dois temas abriram sem erro no console. Prints em ${SAIDA}.`);
process.exit(0);
