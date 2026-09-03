/* ---------------------------------------------------------------
   Rotina da Kelly — tela e eventos.

   A regra vive em `estado.js` (testada sem navegador). Aqui só o que
   depende de DOM: desenhar, ouvir toque e gravar no aparelho.
--------------------------------------------------------------- */

import './styles.css';
import {
  CHAVE, SEMANA, PERIODOS, ICONES,
  uid, iso, dataDe, diasDaSemana,
  carregar, tarefasDoDia, feitasDoDia, estaFeita,
  razao, porcentagem, mediaSemana, sequencia,
  alternarFeita, removerTarefa, anotar,
  humorDoGato, saudacao,
} from './estado.js';

const $ = (sel) => document.querySelector(sel);

let estado;
try {
  estado = carregar(localStorage.getItem(CHAVE));
} catch {
  estado = carregar(null); // navegador com armazenamento bloqueado
}

let diaSelecionado = iso(new Date());
let filtro = 'todos';
let editando = null;

function gravar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
  } catch {
    avisar('Não deu para salvar neste navegador.');
  }
}

let avisoTimer;
function avisar(texto) {
  const el = $('#aviso');
  el.textContent = texto;
  el.classList.add('aparece');
  clearTimeout(avisoTimer);
  avisoTimer = setTimeout(() => el.classList.remove('aparece'), 2400);
}

/* ------------------------- tema ------------------------- */

function aplicarTema() {
  const escuroNoSistema = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const tema = estado.tema || (escuroNoSistema ? 'dark' : 'light');
  document.documentElement.dataset.tema = tema;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = tema === 'dark' ? '#1a1016' : '#c2185b';
}

$('#alternarTema').addEventListener('click', () => {
  estado.tema = document.documentElement.dataset.tema === 'dark' ? 'light' : 'dark';
  aplicarTema();
  gravar();
});

/* ------------------------- desenho ------------------------- */

/** Só a primeira letra em maiúscula: `text-transform: capitalize` no CSS
 *  entregaria "Quinta-Feira, 03 De Setembro" — erro de português na tela
 *  é erro de produto, não detalhe (regra 12c). */
const comMaiuscula = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

function desenharTopo() {
  $('#rotuloDia').textContent = comMaiuscula(
    dataDe(diaSelecionado).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
  );
  $('#saudacao').textContent = `${saudacao(new Date().getHours())}, ${estado.nome}!`;
}

function desenharSemana() {
  const tira = $('#tiraSemana');
  const hoje = iso(new Date());
  tira.replaceChildren();

  for (const dia of diasDaSemana(diaSelecionado)) {
    const d = dataDe(dia);
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.innerHTML =
      `<span class="wd">${SEMANA[d.getDay()]}</span>` +
      `<span class="dn">${d.getDate()}</span>` +
      `<span class="ponto"></span>`;
    if (dia === diaSelecionado) botao.classList.add('selecionado');
    if (dia === hoje) botao.classList.add('e-hoje');
    if (razao(estado, dia) > 0) botao.classList.add('tem-progresso');
    botao.addEventListener('click', () => {
      diaSelecionado = dia;
      desenharTudo();
    });
    tira.appendChild(botao);
  }
}

function desenharNumeros() {
  const todas = tarefasDoDia(estado, diaSelecionado);
  const feitas = todas.filter((t) => estaFeita(estado, diaSelecionado, t.id)).length;
  const pct = porcentagem(estado, diaSelecionado);

  $('#pctProgresso').textContent = `${pct}%`;
  $('#numFeitas').textContent = `${feitas}/${todas.length}`;
  $('#numSemana').textContent = `${mediaSemana(estado, diaSelecionado)}%`;
  $('#numSequencia').textContent = String(sequencia(estado, iso(new Date())));

  const volta = 2 * Math.PI * 52;
  $('#anelProgresso').style.strokeDashoffset = String(volta - (volta * pct) / 100);

  const { humor, fala } = humorDoGato(pct, todas.length > 0);
  $('#gatinho').dataset.humor = humor;
  $('#falaDoGato').textContent = fala;
}

function nodeDaTarefa(tarefa) {
  const feita = estaFeita(estado, diaSelecionado, tarefa.id);
  const el = document.createElement('article');
  el.className = 'tarefa' + (feita ? ' feita' : '');
  el.innerHTML =
    `<span class="tarefa-emoji">${tarefa.icone || '🐾'}</span>` +
    `<span class="tarefa-corpo">` +
      `<span class="tarefa-titulo"></span>` +
      `<span class="tarefa-meta">${tarefa.hora ? tarefa.hora + ' · ' : ''}${PERIODOS[tarefa.periodo]?.nome || ''}</span>` +
    `</span>` +
    `<button class="tarefa-editar" type="button" aria-label="Editar tarefa">` +
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
      `<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>` +
    `</button>` +
    `<span class="marca-feito">` +
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">` +
      `<path d="M20 6 9 17l-5-5"/></svg>` +
    `</span>`;

  // texto do usuário nunca entra por innerHTML
  el.querySelector('.tarefa-titulo').textContent = tarefa.titulo;

  el.addEventListener('click', (ev) => {
    if (ev.target.closest('.tarefa-editar')) return;
    alternarFeita(estado, diaSelecionado, tarefa.id);
    gravar();
    desenharTudo();
  });
  el.querySelector('.tarefa-editar').addEventListener('click', () => abrirJanela(tarefa));
  return el;
}

function desenharLista() {
  const lista = $('#lista');
  lista.replaceChildren();

  const doDia = tarefasDoDia(estado, diaSelecionado)
    .filter((t) => filtro === 'todos' || t.periodo === filtro);

  if (!doDia.length) {
    const vazio = document.createElement('div');
    vazio.className = 'vazio';
    vazio.innerHTML = '<strong>Nada por aqui 🐾</strong>';
    vazio.append('O gatinho aproveitou para cochilar. Toque no + para criar uma tarefa.');
    lista.appendChild(vazio);
    return;
  }

  for (const periodo of Object.keys(PERIODOS)) {
    const itens = doDia.filter((t) => t.periodo === periodo);
    if (!itens.length) continue;

    const feitas = itens.filter((t) => estaFeita(estado, diaSelecionado, t.id)).length;
    const grupo = document.createElement('section');
    grupo.className = 'grupo';
    grupo.innerHTML = `<h3>${PERIODOS[periodo].nome} <small>${feitas}/${itens.length}</small></h3>`;

    const caixa = document.createElement('div');
    caixa.className = 'itens';
    for (const t of itens) caixa.appendChild(nodeDaTarefa(t));
    grupo.appendChild(caixa);
    lista.appendChild(grupo);
  }
}

function desenharNota() {
  $('#caixaNota').value = estado.notas[diaSelecionado] || '';
}

function desenharTudo() {
  desenharTopo();
  desenharSemana();
  desenharNumeros();
  desenharLista();
  desenharNota();
}

/* ------------------------- ações ------------------------- */

$('#saudacao').addEventListener('click', () => {
  const novo = prompt('Qual nome deve aparecer na saudação?', estado.nome);
  if (novo === null) return;
  estado.nome = novo.trim() || 'Kelly';
  gravar();
  desenharTopo();
  avisar('Nome atualizado.');
});

$('#caixaNota').addEventListener('input', (ev) => {
  anotar(estado, diaSelecionado, ev.target.value);
  gravar();
});

for (const pilula of document.querySelectorAll('.pilula')) {
  pilula.addEventListener('click', () => {
    for (const p of document.querySelectorAll('.pilula')) p.classList.remove('is-ativa');
    pilula.classList.add('is-ativa');
    filtro = pilula.dataset.filtro;
    desenharLista();
  });
}

$('#limparDia').addEventListener('click', () => {
  if (!feitasDoDia(estado, diaSelecionado).length) return avisar('Nenhuma marcação neste dia.');
  if (!confirm('Limpar todas as marcações deste dia?')) return;
  delete estado.feitas[diaSelecionado];
  gravar();
  desenharTudo();
  avisar('Marcações do dia limpas.');
});

/* ------------------------- janela da tarefa ------------------------- */

const janela = $('#janelaTarefa');
let diasEscolhidos = [];
let rolagemTravada = 0;

// sem isto a lista rola por baixo do formulário no celular
function travarFundo() {
  rolagemTravada = window.scrollY;
  document.body.style.top = `-${rolagemTravada}px`;
  document.body.classList.add('janela-aberta');
}

function destravarFundo() {
  document.body.classList.remove('janela-aberta');
  document.body.style.top = '';
  window.scrollTo(0, rolagemTravada);
}

janela.addEventListener('close', destravarFundo);

function montarEscolhas() {
  const caixaIcones = $('#escolhaIcone');
  caixaIcones.replaceChildren();
  for (const icone of ICONES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = icone;
    b.addEventListener('click', () => {
      $('#fIcone').value = icone;
      for (const x of caixaIcones.querySelectorAll('button')) x.classList.remove('is-ativa');
      b.classList.add('is-ativa');
    });
    caixaIcones.appendChild(b);
  }

  const caixaDias = $('#escolhaDias');
  caixaDias.replaceChildren();
  SEMANA.forEach((rotulo, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = rotulo;
    b.addEventListener('click', () => {
      diasEscolhidos = diasEscolhidos.includes(i)
        ? diasEscolhidos.filter((x) => x !== i)
        : [...diasEscolhidos, i];
      b.classList.toggle('is-ativa', diasEscolhidos.includes(i));
    });
    caixaDias.appendChild(b);
  });
}

function sincronizarEscolhas() {
  for (const b of $('#escolhaIcone').querySelectorAll('button')) {
    b.classList.toggle('is-ativa', b.textContent === $('#fIcone').value);
  }
  $('#escolhaDias').querySelectorAll('button').forEach((b, i) => {
    b.classList.toggle('is-ativa', diasEscolhidos.includes(i));
  });
}

function abrirJanela(tarefa) {
  editando = tarefa ? tarefa.id : null;
  $('#tituloJanela').textContent = tarefa ? 'Editar tarefa' : 'Nova tarefa';
  $('#fTitulo').value = tarefa ? tarefa.titulo : '';
  $('#fPeriodo').value = tarefa ? tarefa.periodo : 'manha';
  $('#fHora').value = tarefa ? (tarefa.hora || '') : '';
  $('#fIcone').value = tarefa ? (tarefa.icone || '🐾') : '🐾';
  diasEscolhidos = tarefa ? [...(tarefa.dias || [])] : [0, 1, 2, 3, 4, 5, 6];
  $('#excluirTarefa').hidden = !tarefa;
  sincronizarEscolhas();
  travarFundo();
  janela.showModal();
  $('#fTitulo').focus();
}

$('#novaTarefa').addEventListener('click', () => abrirJanela(null));
$('#cancelarTarefa').addEventListener('click', () => janela.close());

$('#formTarefa').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const titulo = $('#fTitulo').value.trim();
  if (!titulo) return;

  const dados = {
    titulo,
    periodo: $('#fPeriodo').value,
    hora: $('#fHora').value,
    icone: $('#fIcone').value || '🐾',
    dias: diasEscolhidos.length ? [...diasEscolhidos].sort((a, b) => a - b) : [0, 1, 2, 3, 4, 5, 6],
  };

  if (editando) {
    const alvo = estado.tarefas.find((t) => t.id === editando);
    if (alvo) Object.assign(alvo, dados);
    avisar('Tarefa atualizada.');
  } else {
    estado.tarefas.push({ id: uid(), ...dados });
    avisar('Tarefa adicionada.');
  }

  gravar();
  janela.close();
  desenharTudo();
});

$('#excluirTarefa').addEventListener('click', () => {
  if (!editando) return;
  if (!confirm('Excluir esta tarefa da rotina?')) return;
  removerTarefa(estado, editando);
  gravar();
  janela.close();
  desenharTudo();
  avisar('Tarefa excluída.');
});

/* ------------------------- início ------------------------- */

aplicarTema();
montarEscolhas();
desenharTudo();
gravar();

/* Atualização automática: quando sai uma versão nova, o service worker
   assume e a página recarrega sozinha. A primeira tomada de controle é a
   instalação, não uma atualização — recarregar ali daria um pisca-pisca
   na primeira visita. */
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  let controlador = navigator.serviceWorker.controller;
  let recarregando = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    const anterior = controlador;
    controlador = navigator.serviceWorker.controller;
    if (!anterior || recarregando) return;
    recarregando = true;
    location.reload();
  });

  const url = `${import.meta.env.BASE_URL}sw.js`;
  navigator.serviceWorker.register(url, { scope: import.meta.env.BASE_URL }).then((reg) => {
    const procurar = () => reg.update().catch(() => {});
    procurar();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') procurar();
    });
  }).catch(() => {});
}
