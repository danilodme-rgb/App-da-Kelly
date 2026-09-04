#!/usr/bin/env node
/* ---------------------------------------------------------------
   Prova por sabotagem da conferência de atualização automática.

   Passar não prova que detecta falha (regra 8d). Aqui cada invariante
   da regra 11f é desligada de propósito — uma por vez, no código-fonte,
   antes do build — e a conferência tem de REPROVAR, dizendo o motivo
   certo. Reprovar pelo motivo errado é o pior resultado possível:
   parece cobertura e não é.

   Mais um caso de controle: a árvore limpa tem de PASSAR. Trava que
   reprova trabalho legítimo é trava que alguém desliga.

   A lista de sabotagens vem da própria conferência (`--listar-sabotagens`),
   nunca de uma cópia aqui: sabotagem nova nasceria fora de uma lista
   escrita à mão, e este provador ficaria verde por não ter procurado
   (regra 16e). Sabotagem sem motivo esperado declarado aqui **reprova**,
   em vez de ser ignorada em silêncio.

   Códigos de saída: 0 a conferência se provou · 1 deixou passar alguma
   sabotagem · 2 não consegui rodar a prova.
--------------------------------------------------------------- */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CONFERENCIA = resolve('scripts/conferir-atualizacao.mjs');

if (!existsSync(CONFERENCIA)) {
  console.error(`NAO CONSEGUI RODAR A PROVA: não achei ${CONFERENCIA}.`);
  process.exit(2);
}

/* O que cada sabotagem tem de fazer a conferência dizer. É a mensagem
   que se exige, não o código de saída: caso que espera bloqueio e recebe
   bloqueio por outro motivo fica verde pelo motivo errado. */
const MOTIVO_ESPERADO = {
  // Esta espera a mensagem do começo do ciclo, não a do fim: o fim dela
  // não pega (o cache novo do service worker novo busca tudo da rede).
  'cache-primeiro': 'O cache virou fonte principal',
  'sem-assumir-na-hora': 'seguia mostrando a versão 1',
  'sem-recarregar': 'seguia mostrando a versão 1',
  'lista-e-versao-a-mao': 'seguia mostrando a versão 1',
  'sem-reserva-offline': 'não desenhou a rotina',
};

function rodar(args) {
  const r = spawnSync(process.execPath, [CONFERENCIA, ...args], { encoding: 'utf8' });
  if (r.error) {
    console.error(`NAO CONSEGUI RODAR A PROVA: ${r.error.message}`);
    process.exit(2);
  }
  return { codigo: r.status, saida: `${r.stdout}${r.stderr}` };
}

const listagem = rodar(['--listar-sabotagens']);
if (listagem.codigo !== 0) {
  console.error(`NAO CONSEGUI RODAR A PROVA: a conferência não listou as sabotagens.\n${listagem.saida}`);
  process.exit(2);
}
const sabotagens = listagem.saida.trim().split('\n').filter(Boolean);
if (!sabotagens.length) {
  console.error('NAO CONSEGUI RODAR A PROVA: a conferência não declarou sabotagem nenhuma. ' +
                'Lista vazia nunca vira "está tudo provado".');
  process.exit(2);
}

const semMotivo = sabotagens.filter((s) => !MOTIVO_ESPERADO[s]);
if (semMotivo.length) {
  console.error(
    `NAO CONSEGUI RODAR A PROVA: sabotagem(ns) sem motivo esperado declarado: ${semMotivo.join(', ')}. ` +
    'Escreva em MOTIVO_ESPERADO, aqui neste arquivo, o que a conferência deve dizer ao pegá-la(s).'
  );
  process.exit(2);
}

let casos = 0;
const falhas = [];

// o controle primeiro: sem ele, qualquer sabotagem abaixo pode estar
// reprovando por um defeito da própria conferência
casos++;
{
  const { codigo, saida } = rodar([]);
  if (codigo !== 0 || !saida.includes('ATUALIZACAO OK')) {
    falhas.push(
      'controle: a conferência REPROVOU a árvore limpa. Antes de acreditar em qualquer ' +
      `sabotagem, conserte isto. Saiu: ${saida.trim().split('\n').join(' | ')}`
    );
  }
}

for (const chave of sabotagens) {
  casos++;
  const { codigo, saida } = rodar([`--sabotar=${chave}`]);
  if (codigo === 0) {
    falhas.push(`${chave}: a conferência PASSOU com a regra 11f desligada — ela não pega este defeito.`);
    continue;
  }
  if (codigo === 2) {
    falhas.push(`${chave}: a conferência não conseguiu rodar (código 2), então não reprovou nada. ` +
                `Saiu: ${saida.trim().split('\n').join(' | ')}`);
    continue;
  }
  if (!saida.includes(MOTIVO_ESPERADO[chave])) {
    falhas.push(
      `${chave}: reprovou, mas pelo motivo errado. Esperava a mensagem conter ` +
      `"${MOTIVO_ESPERADO[chave]}" e saiu: ${saida.trim().split('\n').join(' | ')}`
    );
  }
}

const esperados = sabotagens.length + 1;
if (casos !== esperados) {
  console.error(`CONTAGEM NAO FECHA: ${casos} caso(s) executado(s), ${esperados} esperado(s).`);
  process.exit(2);
}

if (falhas.length) {
  console.error(`SABOTAGEM: a conferência de atualização falhou em ${falhas.length} de ${casos} caso(s):\n`);
  for (const f of falhas) console.error(`  · ${f}`);
  process.exit(1);
}

console.log(`SABOTAGEM OK: a conferência de atualização reprovou as ${sabotagens.length} sabotagens ` +
            'e aprovou a árvore limpa.');
process.exit(0);
