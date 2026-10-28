// Офлайн-кэш. Игра работает и без него (во встроенном браузере Instagram на iPhone его нет).
// Файлы кладутся по одному: если один не скачался, остальные всё равно в кэше.
// Версию меняет tools/bump.mjs — вместе с ?v= в index.html.
const V = 5;
const CACHE = 'skazkograd-' + V;
const Q = '?v=' + V;
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
  'css/app.css' + Q, 'js/core.js' + Q, 'js/audio.js' + Q, 'js/lines.js' + Q, 'js/voice-packs.js' + Q, 'js/art.js' + Q,
  'js/game.js' + Q, 'js/ui.js' + Q, 'js/levels/common.js' + Q, 'js/levels/w1.js' + Q, 'js/levels/w2.js' + Q, 'js/levels/w3.js' + Q, 'js/app.js' + Q];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.allSettled(CORE.map(u => c.add(new Request(u, { cache: 'reload' })))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('skazkograd-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (req.mode === 'navigate') {
    // Страница — сначала сеть (свежая версия), без сети — из кэша
    e.respondWith(Promise.race([
      fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put('index.html', cp)); } return r; }),
      new Promise((_, rej) => setTimeout(rej, 4000))
    ]).catch(() => caches.match('index.html').then(r => r || caches.match('./'))));
    return;
  }
  // Остальное — из кэша, иначе из сети с сохранением (озвучка докачивается так же)
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok && r.status === 200) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
    return r;
  })));
});
