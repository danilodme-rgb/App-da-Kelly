import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

// O app é publicado em https://danilodme-rgb.github.io/App-da-Kelly/, e é
// isso que o `base` diz. Mudar o nome do repositório muda esta linha —
// sem ela, o app publicado procura os arquivos na raiz do domínio e abre
// em branco. Fora do Pages (dev, preview, teste local) a base é a raiz.
const BASE = process.env.BASE_URL ?? '/App-da-Kelly/';

/* A versão que aparece no rodapé do app. Sai da data do último commit,
   não do relógio do build: assim dois builds do mesmo código dão a mesma
   resposta, e o nome do cache do service worker continua trocando só
   quando o app mudou de verdade. Sem git por perto (uma cópia da árvore,
   um tarball), cai no relógio — e aí a data é a do build mesmo.

   Fuso de São Paulo, sempre: o runner do GitHub roda em UTC, e sem dizer
   o fuso o app mostraria para a Kelly uma hora que não é a dela. */
function versaoDoApp() {
  const r = spawnSync('git', ['log', '-1', '--format=%cI'], { encoding: 'utf8' });
  const quando = r.status === 0 && r.stdout.trim() ? new Date(r.stdout.trim()) : new Date();
  const partes = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(quando);
  const p = Object.fromEntries(partes.map((x) => [x.type, x.value]));
  return `${p.day}/${p.month}, ${p.hour}h${p.minute}`;
}

/* O service worker precisa saber o nome real dos arquivos, e com build
   eles ganham hash a cada versão. Escrever a lista à mão seria uma lista
   que envelhece calada (regra 16e): aqui ela sai do próprio bundle.

   A versão do cache vem do conteúdo — os nomes já carregam o hash dos
   arquivos. Assim o cache só troca quando o app mudou de verdade, e uma
   republicação idêntica não force um recarregamento à toa. */
function servicoWorker() {
  return {
    name: 'kelly-service-worker',
    apply: 'build',
    generateBundle(_opcoes, bundle) {
      const doBundle = Object.keys(bundle).map((nome) => BASE + nome);
      const doPublic = [
        BASE,
        `${BASE}manifest.webmanifest`,
        `${BASE}assets/gatinho.svg`,
        `${BASE}assets/gatinho-mascara.svg`,
      ];
      const arquivos = [...doPublic, ...doBundle];

      const versao = createHash('sha256').update(arquivos.join('|')).digest('hex').slice(0, 12);

      const molde = readFileSync(new URL('./src/sw.js', import.meta.url), 'utf8');
      const codigo = molde
        .replaceAll('__BUILD__', versao)
        .replaceAll('__ARQUIVOS__', JSON.stringify(arquivos, null, 2));

      this.emitFile({ type: 'asset', fileName: 'sw.js', source: codigo });
    },
  };
}

export default defineConfig({
  base: BASE,
  define: {
    __VERSAO_DO_APP__: JSON.stringify(versaoDoApp()),
  },
  plugins: [servicoWorker()],
  build: {
    target: 'es2020',
    outDir: 'dist',
    emptyOutDir: true,
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
  },
});
