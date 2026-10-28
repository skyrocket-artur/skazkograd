'use strict';
// Запуск: защита от случайного зума, офлайн-кэш (кроме localhost), стартовый экран.
(function () {
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
  document.addEventListener('contextmenu', e => { if (!e.target.closest('input, textarea, .parents')) e.preventDefault(); });

  const local = /^(localhost|127\.|\[::1\]|192\.168\.)/.test(location.hostname);
  if ('serviceWorker' in navigator && !local && !G.TEST) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  // Режим экрана: держим экран включённым во время игры (Android Chrome)
  let lock = null;
  const wake = async () => { try { if ('wakeLock' in navigator && !lock && !document.hidden) { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); } } catch (e) { /* ok */ } };
  window.addEventListener('pointerdown', wake, { passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) lock = null; });

  // Общие фразы грузим сразу, пока ребёнок смотрит на заставку
  if (!G.TEST) setTimeout(() => G.voice.loadPack('c'), 300);

  const q = new URLSearchParams(location.search);
  if (G.AUTO) {
    // Робот-тестировщик: проходит мир от начала до конца
    G.store.s.done = {}; G.store.s.greeted = true; G.WORLDS.forEach(w => { G.store.s['seen_' + w.id] = true; });
    G.ui.map();
    const l = G.LEVELS.find(x => x.id === (q.get('level') || 'w1l1'));
    setTimeout(() => G.startLevel(l.world, l.id), 300);
  } else if (q.get('level')) {
    G.ui.map();
    const l = G.LEVELS.find(x => x.id === q.get('level'));
    if (l) setTimeout(() => G.startLevel(l.world, l.id), 200);
  } else {
    G.ui.splash();
  }
})();
