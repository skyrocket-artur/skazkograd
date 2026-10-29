'use strict';
// Ядро: настройки, утилиты, события, сохранение прогресса.
window.G = window.G || {};
(function () {
  const G = window.G;
  const q = new URLSearchParams(location.search);

  G.CONFIG = {
    title: 'Сказкоград',
    // Куда ведёт «Поделиться». Можно заменить на ссылку бота: https://t.me/<бот>?start=skazkograd
    shareUrl: location.origin + location.pathname.replace(/index\.html$/, '') + '?from=share',
    shareText: 'Сказкоград — игра для малышей 3–4 лет: буквы и цифры в пяти сказках — Колобок, Теремок, Репка, Три медведя и Золотая рыбка. Бесплатно и без рекламы.'
  };

  // Тестовый режим: ?test=1 — ускорение и автопрохождение (?auto=1); autowait=сек — робот
  // ждёт между ходами, чтобы на скриншотах было видно, что видит ребёнок
  G.TEST = q.has('test');
  G.AUTO = q.has('auto');
  G.AUTO_WAIT = +q.get('autowait') || 0.12;
  G.SPEED = G.TEST ? (+q.get('speed') || 3) : 1;

  // ---------- утилиты ----------
  G.$ = (s, r = document) => r.querySelector(s);
  G.h = function (tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of kids.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c));
    return el;
  };
  G.rand = (a, b) => a + Math.random() * (b - a);
  G.irand = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  G.pick = a => a[Math.floor(Math.random() * a.length)];
  G.shuffle = a => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  G.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  G.lerp = (a, b, t) => a + (b - a) * t;
  G.ease = {
    linear: t => t,
    out: t => 1 - Math.pow(1 - t, 3),
    inOut: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    back: t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    bounce: t => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375; return n * (t -= 2.625 / d) * t + 0.984375; }
  };
  G.sleep = ms => new Promise(r => setTimeout(r, ms / G.SPEED));
  G.buzz = ms => {
    if (G.TEST || (navigator.userActivation && !navigator.userActivation.hasBeenActive)) return;
    try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* ok */ }
  };

  // ---------- события ----------
  const bus = {};
  G.on = (n, f) => { (bus[n] = bus[n] || []).push(f); };
  G.off = (n, f) => { if (bus[n]) bus[n] = bus[n].filter(x => x !== f); };
  G.emit = (n, d) => { (bus[n] || []).slice().forEach(f => { try { f(d); } catch (e) { console.error(e); } }); };

  // ---------- сохранение ----------
  // localStorage может быть недоступен (приватный режим, встроенные браузеры) — тогда играем без сохранения.
  const KEY = 'skazkograd-v1';
  const DEF = { done: {}, name: '', unlockAll: false, music: true, sfx: true, voice: true, tts: true, rests: true, mute: false };
  G.store = {
    s: JSON.parse(JSON.stringify(DEF)),
    load() {
      try { const raw = localStorage.getItem(KEY); if (raw) this.s = Object.assign({}, DEF, JSON.parse(raw)); } catch (e) { /* ok */ }
      if (!this.s.done || typeof this.s.done !== 'object') this.s.done = {};
    },
    save() { try { localStorage.setItem(KEY, JSON.stringify(this.s)); } catch (e) { /* ok */ } },
    reset() { const keep = { name: this.s.name }; this.s = Object.assign(JSON.parse(JSON.stringify(DEF)), keep); this.save(); }
  };
  G.store.load();
})();
