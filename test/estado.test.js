/* ---------------------------------------------------------------
   Bateria da lógica da rotina.

   Duas coisas que esta bateria faz de propósito (skill `travas-e-baterias`):

   1. Conta os casos que EXECUTARAM e reprova quando não bate com o
      declarado. Bateria que só conta falhas não distingue "26 passaram"
      de "2 passaram e 24 deixaram de rodar".
   2. Nenhum caso lê `process.env` nem sai à rede: caso que depende do
      ambiente responde diferente aqui e no runner, e aí reprova por um
      motivo que nada tem a ver com o que ele mede.

   Mudou o número de casos de propósito? Atualize CASOS_ESPERADOS aqui e
   o número citado no README.
--------------------------------------------------------------- */

import { describe, it, expect, afterAll } from 'vitest';
import {
  PERIODOS, TAREFAS_PADRAO,
  iso, dataDe, diasDaSemana, inicioDaSemana,
  semente, carregar,
  tarefasDoDia, estaFeita, razao, porcentagem, mediaSemana, sequencia,
  alternarFeita, removerTarefa, anotar,
  humorDoGato, saudacao,
} from '../src/estado.js';

const CASOS_ESPERADOS = 38;
let casos = 0;

/** Cada caso passa por aqui, e o `casos++` é a PRIMEIRA linha: colar o
 *  bloco sem ele deixaria a contagem em zero e reprovaria tudo. */
function caso(nome, corpo) {
  it(nome, () => {
    casos++;
    corpo();
  });
}

afterAll(() => {
  if (casos !== CASOS_ESPERADOS) {
    throw new Error(
      `CONTAGEM NAO FECHA: ${casos} caso(s) executado(s), ${CASOS_ESPERADOS} esperado(s). ` +
      (casos < CASOS_ESPERADOS
        ? 'Caso(s) deixaram de rodar — a bateria NAO provou o que diz provar.'
        : 'Caso(s) novo(s) entraram — atualize CASOS_ESPERADOS e o README.')
    );
  }
});

/* ------------------------- datas ------------------------- */

describe('datas', () => {
  caso('iso usa o fuso do aparelho, não UTC', () => {
    // 1º de janeiro às 00:30 no horário local: em UTC-3 o `toISOString`
    // devolveria 03:30 do mesmo dia, mas às 23:30 do dia 31 ele viraria
    // o ano. Montando campo a campo, o dia é sempre o que está na tela.
    expect(iso(new Date(2026, 0, 1, 0, 30))).toBe('2026-01-01');
    expect(iso(new Date(2026, 11, 31, 23, 30))).toBe('2026-12-31');
  });

  caso('dataDe não escorrega um dia para trás', () => {
    const d = dataDe('2026-03-15');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(15);
  });

  caso('iso e dataDe são o caminho de ida e volta', () => {
    for (const dia of ['2026-01-01', '2026-02-28', '2026-06-30', '2026-12-31']) {
      expect(iso(dataDe(dia))).toBe(dia);
    }
  });

  caso('a semana começa no domingo', () => {
    expect(inicioDaSemana('2026-09-03').getDay()).toBe(0);
    expect(iso(inicioDaSemana('2026-09-03'))).toBe('2026-08-30');
  });

  caso('diasDaSemana devolve sete dias seguidos', () => {
    const dias = diasDaSemana('2026-09-03');
    expect(dias).toHaveLength(7);
    expect(dias[0]).toBe('2026-08-30');
    expect(dias[6]).toBe('2026-09-05');
    expect(dias).toContain('2026-09-03');
  });

  caso('a semana atravessa a virada de mês', () => {
    expect(diasDaSemana('2026-10-01')).toEqual([
      '2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30',
      '2026-10-01', '2026-10-02', '2026-10-03',
    ]);
  });
});

/* ------------------------- leitura tolerante ------------------------- */

describe('carregar', () => {
  caso('sem nada gravado, começa na semente', () => {
    const e = carregar(null);
    expect(e.tarefas).toHaveLength(TAREFAS_PADRAO.length);
    expect(e.nome).toBe('Kelly');
    expect(e.feitas).toEqual({});
  });

  caso('JSON quebrado não derruba o app', () => {
    expect(carregar('{isto nao e json').nome).toBe('Kelly');
    expect(carregar('').tarefas.length).toBeGreaterThan(0);
    expect(carregar('null').nome).toBe('Kelly');
    expect(carregar('"texto solto"').nome).toBe('Kelly');
  });

  caso('estado antigo sem os campos novos ganha o padrão', () => {
    const e = carregar(JSON.stringify({ tarefas: [{ titulo: 'Antiga' }] }));
    expect(e.tarefas[0].titulo).toBe('Antiga');
    expect(e.tarefas[0].periodo).toBe('manha');
    expect(e.tarefas[0].icone).toBe('🐾');
    expect(e.tarefas[0].dias).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(typeof e.tarefas[0].id).toBe('string');
    expect(e.gato).toBe('Mimi');
  });

  caso('tarefa sem título é descartada, não desenhada vazia', () => {
    const e = carregar(JSON.stringify({ tarefas: [{ titulo: '   ' }, null, 7, { titulo: 'Vale' }] }));
    expect(e.tarefas).toHaveLength(1);
    expect(e.tarefas[0].titulo).toBe('Vale');
  });

  caso('período desconhecido cai em manhã em vez de sumir da tela', () => {
    const e = carregar(JSON.stringify({ tarefas: [{ titulo: 'X', periodo: 'madrugada' }] }));
    expect(e.tarefas[0].periodo).toBe('manha');
  });

  caso('dias fora de 0..6 são jogados fora', () => {
    const e = carregar(JSON.stringify({ tarefas: [{ titulo: 'X', dias: [0, 9, -1, 3, 'seg', 6.5] }] }));
    expect(e.tarefas[0].dias).toEqual([0, 3]);
  });

  caso('feitas e notas vazias não ficam ocupando o estado', () => {
    const e = carregar(JSON.stringify({
      feitas: { '2026-09-01': [], '2026-09-02': ['a', 5, 'b'] },
      notas: { '2026-09-01': '   ', '2026-09-02': 'ok' },
    }));
    expect(e.feitas['2026-09-01']).toBeUndefined();
    expect(e.feitas['2026-09-02']).toEqual(['a', 'b']);
    expect(e.notas['2026-09-01']).toBeUndefined();
    expect(e.notas['2026-09-02']).toBe('ok');
  });

  caso('tema só aceita os dois valores conhecidos', () => {
    expect(carregar(JSON.stringify({ tema: 'dark' })).tema).toBe('dark');
    expect(carregar(JSON.stringify({ tema: 'light' })).tema).toBe('light');
    expect(carregar(JSON.stringify({ tema: 'roxo' })).tema).toBeNull();
  });

  caso('nome em branco volta para Kelly', () => {
    expect(carregar(JSON.stringify({ nome: '   ' })).nome).toBe('Kelly');
    expect(carregar(JSON.stringify({ nome: 'Kel' })).nome).toBe('Kel');
    expect(carregar(JSON.stringify({ nome: 42 })).nome).toBe('Kelly');
  });
});

/* ------------------------- tarefas do dia ------------------------- */

function estadoDeTeste(tarefas) {
  return { tarefas, feitas: {}, notas: {}, tema: null, nome: 'Kelly', gato: 'Mimi' };
}

describe('tarefasDoDia', () => {
  caso('mostra só as tarefas do dia da semana', () => {
    // 2026-09-03 é uma quinta-feira (dia 4)
    const e = estadoDeTeste([
      { id: 'a', titulo: 'Quinta', periodo: 'manha', hora: '08:00', dias: [4] },
      { id: 'b', titulo: 'Domingo', periodo: 'manha', hora: '08:00', dias: [0] },
    ]);
    expect(tarefasDoDia(e, '2026-09-03').map((t) => t.id)).toEqual(['a']);
  });

  caso('lista de dias vazia significa todo dia', () => {
    const e = estadoDeTeste([{ id: 'a', titulo: 'Sempre', periodo: 'manha', dias: [] }]);
    expect(tarefasDoDia(e, '2026-09-03')).toHaveLength(1);
    expect(tarefasDoDia(e, '2026-09-06')).toHaveLength(1);
  });

  caso('ordena por período e depois por horário', () => {
    const e = estadoDeTeste([
      { id: 'noite', titulo: 'N', periodo: 'noite', hora: '20:00', dias: [] },
      { id: 'manha2', titulo: 'M2', periodo: 'manha', hora: '09:00', dias: [] },
      { id: 'manha1', titulo: 'M1', periodo: 'manha', hora: '06:00', dias: [] },
      { id: 'tarde', titulo: 'T', periodo: 'tarde', hora: '13:00', dias: [] },
    ]);
    expect(tarefasDoDia(e, '2026-09-03').map((t) => t.id))
      .toEqual(['manha1', 'manha2', 'tarde', 'noite']);
  });

  caso('tarefa sem horário vai para o fim do período', () => {
    const e = estadoDeTeste([
      { id: 'sem', titulo: 'S', periodo: 'manha', hora: '', dias: [] },
      { id: 'com', titulo: 'C', periodo: 'manha', hora: '10:00', dias: [] },
    ]);
    expect(tarefasDoDia(e, '2026-09-03').map((t) => t.id)).toEqual(['com', 'sem']);
  });

  caso('os três períodos existem e estão em ordem', () => {
    expect(Object.keys(PERIODOS)).toEqual(['manha', 'tarde', 'noite']);
    expect(PERIODOS.manha.ordem).toBeLessThan(PERIODOS.tarde.ordem);
    expect(PERIODOS.tarde.ordem).toBeLessThan(PERIODOS.noite.ordem);
  });
});

/* ------------------------- progresso ------------------------- */

describe('progresso', () => {
  const trio = () => estadoDeTeste([
    { id: 'a', titulo: 'A', periodo: 'manha', hora: '07:00', dias: [] },
    { id: 'b', titulo: 'B', periodo: 'tarde', hora: '13:00', dias: [] },
    { id: 'c', titulo: 'C', periodo: 'noite', hora: '20:00', dias: [] },
  ]);

  caso('dia sem tarefa nenhuma dá 0%, não 100%', () => {
    const e = estadoDeTeste([{ id: 'a', titulo: 'A', periodo: 'manha', dias: [0] }]);
    expect(razao(e, '2026-09-03')).toBe(0); // quinta, a tarefa é de domingo
    expect(porcentagem(e, '2026-09-03')).toBe(0);
  });

  caso('a razão acompanha as marcações', () => {
    const e = trio();
    expect(porcentagem(e, '2026-09-03')).toBe(0);
    alternarFeita(e, '2026-09-03', 'a');
    expect(porcentagem(e, '2026-09-03')).toBe(33);
    alternarFeita(e, '2026-09-03', 'b');
    alternarFeita(e, '2026-09-03', 'c');
    expect(porcentagem(e, '2026-09-03')).toBe(100);
  });

  caso('alternarFeita marca e desmarca', () => {
    const e = trio();
    alternarFeita(e, '2026-09-03', 'a');
    expect(estaFeita(e, '2026-09-03', 'a')).toBe(true);
    alternarFeita(e, '2026-09-03', 'a');
    expect(estaFeita(e, '2026-09-03', 'a')).toBe(false);
  });

  caso('dia sem marcação nenhuma sai do estado', () => {
    const e = trio();
    alternarFeita(e, '2026-09-03', 'a');
    alternarFeita(e, '2026-09-03', 'a');
    expect(Object.keys(e.feitas)).toHaveLength(0);
  });

  caso('marcação de um dia não vaza para o outro', () => {
    const e = trio();
    alternarFeita(e, '2026-09-03', 'a');
    expect(estaFeita(e, '2026-09-04', 'a')).toBe(false);
    expect(porcentagem(e, '2026-09-04')).toBe(0);
  });

  caso('a média da semana divide por sete, não pelos dias com marcação', () => {
    const e = trio();
    for (const id of ['a', 'b', 'c']) alternarFeita(e, '2026-09-03', id);
    // um dia cheio em sete: 100/7 = 14,28...
    expect(mediaSemana(e, '2026-09-03')).toBe(14);
  });

  caso('semana inteira completa dá 100%', () => {
    const e = trio();
    for (const dia of diasDaSemana('2026-09-03')) {
      for (const id of ['a', 'b', 'c']) alternarFeita(e, dia, id);
    }
    expect(mediaSemana(e, '2026-09-03')).toBe(100);
  });
});

/* ------------------------- sequência ------------------------- */

describe('sequencia', () => {
  const umaPorDia = () => estadoDeTeste([{ id: 'a', titulo: 'A', periodo: 'manha', dias: [] }]);

  caso('dia de hoje em andamento não zera a sequência', () => {
    const e = umaPorDia();
    alternarFeita(e, '2026-09-02', 'a');
    alternarFeita(e, '2026-09-01', 'a');
    // hoje (03) ainda vazio: pendente não é falhou
    expect(sequencia(e, '2026-09-03')).toBe(2);
  });

  caso('hoje concluído entra na conta', () => {
    const e = umaPorDia();
    for (const dia of ['2026-09-03', '2026-09-02', '2026-09-01']) alternarFeita(e, dia, 'a');
    expect(sequencia(e, '2026-09-03')).toBe(3);
  });

  caso('um dia vazio no meio corta a sequência', () => {
    const e = umaPorDia();
    for (const dia of ['2026-09-02', '2026-08-31']) alternarFeita(e, dia, 'a');
    expect(sequencia(e, '2026-09-03')).toBe(1); // o dia 01 quebrou
  });

  caso('nada marcado dá zero', () => {
    expect(sequencia(umaPorDia(), '2026-09-03')).toBe(0);
  });
});

/* ------------------------- edição ------------------------- */

describe('edição', () => {
  caso('remover tarefa apaga também as marcações dela', () => {
    const e = estadoDeTeste([
      { id: 'a', titulo: 'A', periodo: 'manha', dias: [] },
      { id: 'b', titulo: 'B', periodo: 'manha', dias: [] },
    ]);
    alternarFeita(e, '2026-09-03', 'a');
    alternarFeita(e, '2026-09-03', 'b');
    removerTarefa(e, 'a');
    expect(e.tarefas.map((t) => t.id)).toEqual(['b']);
    expect(e.feitas['2026-09-03']).toEqual(['b']);
  });

  caso('remover a última tarefa marcada limpa o dia inteiro', () => {
    const e = estadoDeTeste([{ id: 'a', titulo: 'A', periodo: 'manha', dias: [] }]);
    alternarFeita(e, '2026-09-03', 'a');
    removerTarefa(e, 'a');
    expect(e.feitas['2026-09-03']).toBeUndefined();
  });

  caso('nota em branco não fica guardada', () => {
    const e = estadoDeTeste([]);
    anotar(e, '2026-09-03', 'foi um bom dia');
    expect(e.notas['2026-09-03']).toBe('foi um bom dia');
    anotar(e, '2026-09-03', '   ');
    expect(e.notas['2026-09-03']).toBeUndefined();
  });
});

/* ------------------------- o gatinho ------------------------- */

describe('humor do gatinho', () => {
  caso('cada faixa tem humor e frase próprios', () => {
    expect(humorDoGato(0).humor).toBe('sono');
    expect(humorDoGato(10).humor).toBe('curioso');
    expect(humorDoGato(60).humor).toBe('feliz');
    expect(humorDoGato(100).humor).toBe('festa');
    const falas = new Set([0, 10, 60, 100].map((p) => humorDoGato(p).fala));
    expect(falas.size).toBe(4);
  });

  caso('dia sem tarefa fala de dia sem tarefa, não de preguiça', () => {
    const semTarefa = humorDoGato(0, false);
    expect(semTarefa.humor).toBe('sono');
    expect(semTarefa.fala).not.toBe(humorDoGato(0, true).fala);
  });

  caso('a saudação segue a hora do relógio', () => {
    expect(saudacao(6)).toBe('Bom dia');
    expect(saudacao(11)).toBe('Bom dia');
    expect(saudacao(12)).toBe('Boa tarde');
    expect(saudacao(17)).toBe('Boa tarde');
    expect(saudacao(18)).toBe('Boa noite');
    expect(saudacao(23)).toBe('Boa noite');
  });

  caso('a semente vem com tarefas nos três períodos', () => {
    const e = semente();
    const periodos = new Set(e.tarefas.map((t) => t.periodo));
    expect([...periodos].sort()).toEqual(['manha', 'noite', 'tarde']);
    expect(new Set(e.tarefas.map((t) => t.id)).size).toBe(e.tarefas.length);
  });
});
