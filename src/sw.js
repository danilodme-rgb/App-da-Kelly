/* ---------------------------------------------------------------
   Rotina da Kelly — cache offline com atualização automática.

   Estratégia: REDE PRIMEIRO, cache só como reserva. Cache-first
   congelaria o app na versão antiga para sempre; aqui o cache existe
   para o app abrir sem internet, nunca como fonte principal.

   Este arquivo é um molde: o build (`vite.config.js`) troca os dois
   marcadores abaixo pela versão do build e pela lista real de arquivos.
   O comentário NÃO os escreve por extenso de propósito — a troca é
   textual, e citar o marcador aqui em cima faria a substituição acertar
   o comentário e deixar o código intacto. Aconteceu; a conferência de
   fumaça reprova se algum marcador sobrar no `dist`.
--------------------------------------------------------------- */

const VERSAO = '__BUILD__';
const CACHE = `rotina-kelly-${VERSAO}`;
const ARQUIVOS = __ARQUIVOS__;

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ARQUIVOS))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((chaves) => Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (evento) => {
  const pedido = evento.request;
  if (pedido.method !== 'GET') return;
  if (new URL(pedido.url).origin !== self.location.origin) return;

  // 'no-store' pula o cache HTTP do navegador: sem isso o GitHub Pages
  // entrega a versão anterior por até 10 minutos (max-age=600), e a
  // correção de hoje não chega em ninguém.
  const daRede = new Request(pedido, { cache: 'no-store' });

  evento.respondWith(
    fetch(daRede)
      .then((resposta) => {
        if (resposta && resposta.ok) {
          const copia = resposta.clone();
          caches.open(CACHE).then((c) => c.put(pedido, copia)).catch(() => {});
        }
        return resposta;
      })
      .catch(() =>
        caches.match(pedido).then((achou) =>
          achou || (pedido.mode === 'navigate' ? caches.match(ARQUIVOS[0]) : undefined)
        )
      )
  );
});
