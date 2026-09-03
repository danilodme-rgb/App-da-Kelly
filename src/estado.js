/* ---------------------------------------------------------------
   Rotina da Kelly — estado e regras, sem DOM.

   Tudo aqui é função pura ou mexe só no objeto de estado: é o que
   deixa a bateria (`test/estado.test.js`) provar a regra sem abrir
   navegador. O que encosta em tela fica em `main.js`.
--------------------------------------------------------------- */

export const CHAVE = 'rotina-kelly:v1';

export const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const PERIODOS = {
  manha: { nome: 'Manhã', ordem: 1 },
  tarde: { nome: 'Tarde', ordem: 2 },
  noite: { nome: 'Noite', ordem: 3 },
};

export const ICONES = [
  '🐾', '🐱', '💧', '☕', '🥣', '🏃', '🧘', '📖',
  '💼', '🧹', '🌱', '💊', '🛁', '🎵', '🧶', '🐟',
  '🌙', '🛏️', '💖', '📱',
];

export const TAREFAS_PADRAO = [
  { titulo: 'Acordar e beber água',        periodo: 'manha', hora: '06:30', icone: '💧' },
  { titulo: 'Dar comida para o gatinho',   periodo: 'manha', hora: '07:00', icone: '🐟' },
  { titulo: 'Café da manhã com calma',     periodo: 'manha', hora: '08:00', icone: '☕' },
  { titulo: 'Alongar o corpo',             periodo: 'manha', hora: '09:00', icone: '🧘' },
  { titulo: 'Almoço sem pressa',           periodo: 'tarde', hora: '12:00', icone: '🥣' },
  { titulo: 'Um pouco de leitura',         periodo: 'tarde', hora: '15:00', icone: '📖' },
  { titulo: 'Caminhada',                   periodo: 'tarde', hora: '18:00', icone: '🏃' },
  { titulo: 'Brincar com o gatinho',       periodo: 'noite', hora: '19:30', icone: '🧶' },
  { titulo: 'Jantar leve',                 periodo: 'noite', hora: '20:00', icone: '🌱' },
  { titulo: 'Desligar as telas',           periodo: 'noite', hora: '22:00', icone: '📱' },
  { titulo: 'Dormir bem',                  periodo: 'noite', hora: '22:30', icone: '🛏️' },
];

/* ------------------------- datas e ids ------------------------- */

export const uid = () => Math.random().toString(36).slice(2, 10);

/** Data em `AAAA-MM-DD`, no fuso do aparelho (nunca UTC: `toISOString`
 *  vira o dia de quem está a oeste de Greenwich, e a Kelly está). */
export const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Caminho de volta: `new Date('2026-09-03')` é lido como UTC e pode
 *  cair no dia anterior. Montando campo a campo, não cai. */
export const dataDe = (s) => {
  const [a, m, d] = String(s).split('-').map(Number);
  return new Date(a, m - 1, d);
};

export const inicioDaSemana = (dia) => {
  const base = dataDe(dia);
  const ini = new Date(base);
  ini.setDate(base.getDate() - base.getDay());
  return ini;
};

export const diasDaSemana = (dia) => {
  const ini = inicioDaSemana(dia);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(ini);
    d.setDate(ini.getDate() + i);
    return iso(d);
  });
};

/* ------------------------- estado ------------------------- */

export function semente() {
  return {
    tarefas: TAREFAS_PADRAO.map((t) => ({ ...t, id: uid(), dias: [0, 1, 2, 3, 4, 5, 6] })),
    feitas: {},
    notas: {},
    tema: null,
    nome: 'Kelly',
    gato: 'Mimi',
  };
}

/** Leitura tolerante: campo a campo, caindo no padrão quando falta ou
 *  vem torto. O que volta do armazenamento não é o que foi gravado —
 *  versão antiga, aba de outro app, JSON pela metade (regra 11e). */
export function carregar(bruto) {
  const padrao = semente();
  if (!bruto) return padrao;

  let dados;
  try {
    dados = JSON.parse(bruto);
  } catch {
    return padrao;
  }
  if (!dados || typeof dados !== 'object') return padrao;

  const tarefas = Array.isArray(dados.tarefas)
    ? dados.tarefas
        .filter((t) => t && typeof t === 'object' && typeof t.titulo === 'string' && t.titulo.trim())
        .map((t) => ({
          id: typeof t.id === 'string' && t.id ? t.id : uid(),
          titulo: t.titulo.trim(),
          periodo: PERIODOS[t.periodo] ? t.periodo : 'manha',
          hora: typeof t.hora === 'string' ? t.hora : '',
          icone: typeof t.icone === 'string' && t.icone ? t.icone : '🐾',
          dias: Array.isArray(t.dias)
            ? t.dias.filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
            : [0, 1, 2, 3, 4, 5, 6],
        }))
    : padrao.tarefas;

  const feitas = {};
  if (dados.feitas && typeof dados.feitas === 'object') {
    for (const [dia, ids] of Object.entries(dados.feitas)) {
      if (Array.isArray(ids) && ids.length) feitas[dia] = ids.filter((x) => typeof x === 'string');
      if (feitas[dia] && !feitas[dia].length) delete feitas[dia];
    }
  }

  const notas = {};
  if (dados.notas && typeof dados.notas === 'object') {
    for (const [dia, txt] of Object.entries(dados.notas)) {
      if (typeof txt === 'string' && txt.trim()) notas[dia] = txt;
    }
  }

  const texto = (v, alt) => (typeof v === 'string' && v.trim() ? v.trim() : alt);

  return {
    tarefas,
    feitas,
    notas,
    tema: dados.tema === 'dark' || dados.tema === 'light' ? dados.tema : null,
    nome: texto(dados.nome, 'Kelly'),
    gato: texto(dados.gato, 'Mimi'),
  };
}

/* ------------------------- consultas ------------------------- */

export function tarefasDoDia(estado, dia) {
  const semana = dataDe(dia).getDay();
  return estado.tarefas
    .filter((t) => !t.dias || t.dias.length === 0 || t.dias.includes(semana))
    .sort((a, b) => {
      const oa = PERIODOS[a.periodo]?.ordem ?? 9;
      const ob = PERIODOS[b.periodo]?.ordem ?? 9;
      if (oa !== ob) return oa - ob;
      return (a.hora || '99:99').localeCompare(b.hora || '99:99');
    });
}

export const feitasDoDia = (estado, dia) => estado.feitas[dia] || [];

export const estaFeita = (estado, dia, id) => feitasDoDia(estado, dia).includes(id);

/** Fração concluída do dia, de 0 a 1. Dia sem tarefa nenhuma dá 0 — e
 *  não 1: "não tinha o que fazer" não é "fez tudo". */
export function razao(estado, dia) {
  const todas = tarefasDoDia(estado, dia);
  if (!todas.length) return 0;
  return todas.filter((t) => estaFeita(estado, dia, t.id)).length / todas.length;
}

export const porcentagem = (estado, dia) => Math.round(razao(estado, dia) * 100);

export const mediaSemana = (estado, dia) =>
  Math.round((diasDaSemana(dia).reduce((s, d) => s + razao(estado, d), 0) / 7) * 100);

/** Dias seguidos com o dia inteiro concluído, contando para trás.
 *  Hoje só quebra a sequência quando já acabou: um dia em andamento é
 *  pendente, não falhou (regra 12e). */
export function sequencia(estado, hoje) {
  let dias = 0;
  const cursor = dataDe(hoje);
  for (let i = 0; i < 400; i++) {
    const chave = iso(cursor);
    const cheio = tarefasDoDia(estado, chave).length > 0 && razao(estado, chave) === 1;
    if (cheio) dias++;
    else if (chave !== hoje) break;
    cursor.setDate(cursor.getDate() - 1);
  }
  return dias;
}

/* ------------------------- ações ------------------------- */

export function alternarFeita(estado, dia, id) {
  const atuais = feitasDoDia(estado, dia);
  const proximas = atuais.includes(id) ? atuais.filter((x) => x !== id) : [...atuais, id];
  if (proximas.length) estado.feitas[dia] = proximas;
  else delete estado.feitas[dia];
  return estado;
}

export function removerTarefa(estado, id) {
  estado.tarefas = estado.tarefas.filter((t) => t.id !== id);
  for (const dia of Object.keys(estado.feitas)) {
    estado.feitas[dia] = estado.feitas[dia].filter((x) => x !== id);
    if (!estado.feitas[dia].length) delete estado.feitas[dia];
  }
  return estado;
}

export function anotar(estado, dia, texto) {
  if (texto && texto.trim()) estado.notas[dia] = texto;
  else delete estado.notas[dia];
  return estado;
}

/* ------------------------- o gatinho ------------------------- */

/** O humor do gatinho é a barra de progresso da Kelly, em forma de bicho.
 *  Cada faixa tem nome próprio, olho e frase — nada de "quase lá" genérico. */
export function humorDoGato(pct, temTarefas = true) {
  if (!temTarefas) return { humor: 'sono', cara: 'ᴗ', fala: 'Nenhuma tarefa hoje. Toque no + para criar.' };
  if (pct >= 100) return { humor: 'festa', cara: '^', fala: 'Rotina completa! O gatinho está muito orgulhoso.' };
  if (pct >= 60) return { humor: 'feliz', cara: 'ᵕ', fala: 'Mais da metade feita. Ronronando por aqui.' };
  if (pct >= 25) return { humor: 'curioso', cara: 'o', fala: 'Já começou bem. O gatinho está de olho.' };
  if (pct > 0) return { humor: 'curioso', cara: 'o', fala: 'Primeiro passo dado. Bora o próximo?' };
  return { humor: 'sono', cara: 'ᴗ', fala: 'O gatinho ainda está cochilando. Comece quando quiser.' };
}

export function saudacao(hora) {
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}
