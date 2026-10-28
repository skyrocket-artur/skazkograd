'use strict';
// Движок уровня: canvas-сцена с циклом 60 к/с, ввод, таймеры сцены, частицы, подсказки, выбор ответа.
// Правило: уровень никогда не ждёт сеть и не блокирует касания. Если код уровня упал —
// ошибка ловится, а ребёнку показывается «Дальше», а не зависший экран.
(function () {
  const { h } = G;
  const NEVER = new Promise(() => {});
  G.errors = [];
  window.addEventListener('error', e => G.errors.push(String(e.message || e)));
  window.addEventListener('unhandledrejection', e => G.errors.push('promise: ' + String(e.reason && e.reason.message || e.reason)));

  G.LEVELS = [];
  G.level = def => { G.LEVELS.push(def); return def; };

  const PRAISE = ['c_good1', 'c_good2', 'c_good3', 'c_good4', 'c_good5'];
  const TRY = ['c_try1', 'c_try2', 'c_try3'];

  // Запуск уровня. Возвращает промис: 'done' — пройден, 'exit' — вышли домой.
  G.runLevel = function (def, hooks = {}) {
    return new Promise(resolveLevel => {
      let alive = true, finished = false;
      const el = h('div', { class: 'screen level-screen' });
      const cv = h('canvas', { class: 'stage' });
      const dots = h('div', { class: 'dots' });
      const home = h('button', { class: 'icon-btn hold', 'aria-label': 'Домой', html: G.ICON.home + '<i class="ring"></i>' });
      const hintBtn = h('button', { class: 'hint-btn', 'aria-label': 'Подсказка', html: G.ICON.lamp });
      const subs = h('div', { class: 'subs' });
      const over = h('div', { class: 'overlay' });
      const finger = G.art.img('finger', 'finger');
      el.append(cv, h('div', { class: 'topbar' }, home, dots, G.soundBtns()), over, subs, hintBtn, finger);

      const ctx = cv.getContext('2d');
      let W = 1, H = 1, dpr = 1, scene = null, raf = 0, last = 0;
      const rt = { time: 0, timers: [], tweens: [], fx: [], idleAt: 0, waiting: false, misses: 0, errs: 0 };

      const live = p => p.then(v => (alive ? v : NEVER));
      const safe = (fn, ...a) => {
        try { return fn && fn(...a); } catch (e) {
          console.error(e); G.errors.push(def.id + ': ' + e.message);
          if (++rt.errs > 3) crash();
        }
      };

      // ---------- API для уровня ----------
      const api = {
        def,
        get W() { return W; }, get H() { return H; }, get dpr() { return dpr; },
        get t() { return rt.time; },
        alive: () => alive,
        after(sec, fn) { if (alive) rt.timers.push({ at: rt.time + sec, fn }); },
        wait(sec) { return new Promise(r => api.after(sec, r)); },
        tween(o, to, dur, ease = 'out') {
          return new Promise(r => {
            const from = {}; for (const k in to) from[k] = o[k];
            rt.tweens.push({ o, from, to, t0: rt.time, dur: Math.max(0.001, dur), ease: G.ease[ease] || G.ease.out, r });
          });
        },
        say(id) { return live(G.voice.say(id)); },
        sfx(n, ...a) { if (G.sfx[n]) G.sfx[n](...a); },
        praise() { G.sfx.good(); G.buzz(15); return api.say(G.pick(PRAISE)); },
        tryAgain() { G.sfx.wrong(); return api.say(G.pick(TRY)); },
        burst(x, y, o = {}) {
          const n = o.n || 14, cols = o.colors || ['#FFD23F', '#FF6B8B', '#6CD08A', '#5AB4FF', '#FFFFFF'];
          for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2, sp = G.rand(120, 340) * (o.power || 1);
            rt.fx.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 80, life: 0, max: G.rand(0.6, 1.1), size: G.rand(7, 14) * (o.scale || 1), color: G.pick(cols), kind: o.kind || (Math.random() < 0.5 ? 'star' : 'dot'), rot: Math.random() * 6 });
          }
          if (o.ring !== false) rt.fx.push({ x, y, vx: 0, vy: 0, life: 0, max: 0.45, size: o.ringSize || 60, color: '#FFFFFF', kind: 'ring' });
        },
        finger(x, y, tap = true) {
          finger.style.transform = `translate(${x - 18}px, ${y - 6}px)`;
          finger.classList.toggle('tap', tap);
          finger.classList.add('on');
          clearTimeout(finger._t); finger._t = setTimeout(() => finger.classList.remove('on'), 2600);
        },
        fingerOff() { finger.classList.remove('on'); },
        rounds(n) { dots.innerHTML = ''; for (let i = 0; i < n; i++) dots.append(h('i')); },
        round(i) { [...dots.children].forEach((d, k) => { d.classList.toggle('done', k < i); d.classList.toggle('cur', k === i); }); },
        // Ждём ли касания? Если ребёнок 7 секунд ничего не делает — подсказка сама.
        expect(on = true) { rt.waiting = on; rt.idleAt = rt.time; },
        miss() { if (++rt.misses >= 2) { rt.misses = 0; showHint(); } },
        good() { rt.misses = 0; rt.idleAt = rt.time; },
        hintNow: () => showHint(),
        // Большая цифра/буква по центру. Не блокирует ввод.
        card(text, o = {}) {
          const c = h('div', { class: 'card-big' + (o.small ? ' small' : '') },
            o.art ? G.art.img(o.art, 'card-art') : null,
            text != null ? h('b', { class: 'glyph' + (o.cls ? ' ' + o.cls : '') }, String(text)) : null,
            o.caption ? h('span', null, o.caption) : null);
          over.append(c);
          G.sfx.star();
          const dur = o.dur != null ? o.dur : 2.2;
          return api.wait(dur).then(() => { c.classList.add('out'); setTimeout(() => c.remove(), 350); });
        },
        // Выбор ответа: items — [{label} | {art}], correct — индекс. Промис — когда выбран верный.
        choose({ items, correct, say, onWrong }) {
          api.fingerOff();
          return new Promise(res => {
            const wrap = h('div', { class: 'choose' });
            let wrong = 0, done = false;
            const btns = items.map((it, i) => {
              const b = h('button', { class: 'ch-btn pop-in', style: { animationDelay: i * 70 + 'ms' } },
                it.art ? G.art.img(it.art) : null, it.label != null ? h('b', null, String(it.label)) : null);
              b.addEventListener('pointerdown', e => {
                e.preventDefault(); if (done) return; rt.idleAt = rt.time;
                if (i === correct) {
                  done = true; b.classList.add('right'); G.sfx.good(); G.buzz(15);
                  const r = b.getBoundingClientRect(), er = el.getBoundingClientRect();
                  api.burst(r.left - er.left + r.width / 2, r.top - er.top + r.height / 2, { n: 16 });
                  api.say(G.pick(PRAISE));
                  api.wait(0.7).then(() => { wrap.classList.add('out'); setTimeout(() => wrap.remove(), 300); rt.waiting = false; res(wrong); });
                } else {
                  wrong++; b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); G.sfx.wrong();
                  if (onWrong) onWrong(wrong); else api.say(G.pick(TRY));
                  if (wrong >= 2) pointAt(btns[correct]);
                }
              });
              return b;
            });
            wrap.append(...btns); over.append(wrap);
            const pointAt = b => { const r = b.getBoundingClientRect(), er = el.getBoundingClientRect(); api.finger(r.left - er.left + r.width / 2, r.top - er.top + r.height * 0.55); b.classList.add('pulse'); };
            choosing = { hint: () => pointAt(btns[correct]), auto: () => btns[correct].dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })) };
            api.expect(true);
            if (say) api.say(say);
          }).then(v => { choosing = null; return alive ? v : NEVER; });
        },
        // Буква/цифра в canvas: толстая, с белой обводкой и объёмом.
        glyph(c, text, x, y, size, o = {}) {
          c.save();
          c.font = `900 ${size}px Nunito, ui-rounded, "SF Pro Rounded", system-ui, sans-serif`;
          c.textAlign = 'center'; c.textBaseline = 'middle';
          c.lineJoin = 'round'; c.lineWidth = size * 0.16; c.strokeStyle = o.stroke || '#fff';
          if (o.alpha != null) c.globalAlpha = o.alpha;
          c.strokeText(text, x, y + size * 0.04);
          const g = c.createLinearGradient(0, y - size / 2, 0, y + size / 2);
          const col = o.color || '#FF6B3D';
          g.addColorStop(0, o.color2 || shade(col, 40)); g.addColorStop(1, col);
          c.fillStyle = g; c.fillText(text, x, y + size * 0.04);
          c.restore();
        },
        // Готовый фон: небо-градиент
        sky(c, top, bottom) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bottom); c.fillStyle = g; c.fillRect(0, 0, W, H); },
        finish() { if (!finished) { finished = true; complete(); } }
      };
      let choosing = null;

      function shade(hex, amt) {
        const n = parseInt(hex.slice(1), 16);
        const r = G.clamp((n >> 16) + amt, 0, 255), g = G.clamp(((n >> 8) & 255) + amt, 0, 255), b = G.clamp((n & 255) + amt, 0, 255);
        return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
      }

      function showHint() {
        rt.idleAt = rt.time;
        if (choosing) { choosing.hint(); return; }
        if (scene && scene.hint) safe(() => scene.hint());
      }

      // ---------- цикл ----------
      function resize() {
        const r = el.getBoundingClientRect();
        W = Math.max(1, r.width); H = Math.max(1, r.height); dpr = Math.min(2, window.devicePixelRatio || 1);
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
        cv.style.width = W + 'px'; cv.style.height = H + 'px';
        if (scene && scene.resize) safe(() => scene.resize(W, H));
      }
      let rzRaf = 0;
      const onResize = () => { cancelAnimationFrame(rzRaf); rzRaf = requestAnimationFrame(resize); };

      function tick(dt) {
        rt.time += dt;
        if (rt.timers.length) {
          const due = rt.timers.filter(t => t.at <= rt.time);
          if (due.length) { rt.timers = rt.timers.filter(t => t.at > rt.time); due.forEach(t => safe(t.fn)); }
        }
        for (let i = rt.tweens.length - 1; i >= 0; i--) {
          const tw = rt.tweens[i], k = Math.min(1, (rt.time - tw.t0) / tw.dur), e = tw.ease(k);
          for (const p in tw.to) tw.o[p] = tw.from[p] + (tw.to[p] - tw.from[p]) * e;
          if (k >= 1) { rt.tweens.splice(i, 1); tw.r(); }
        }
        for (let i = rt.fx.length - 1; i >= 0; i--) {
          const f = rt.fx[i]; f.life += dt;
          if (f.life >= f.max) { rt.fx.splice(i, 1); continue; }
          f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 520 * dt; f.vx *= 0.98; f.rot += dt * 4;
        }
        if (rt.waiting && rt.time - rt.idleAt > 7) showHint();
        if (G.AUTO && scene && scene.auto && (rt.autoT = (rt.autoT || 0) + dt) > 0.12) { rt.autoT = 0; safe(() => scene.auto()); }
        if (G.AUTO && choosing && (rt.autoC = (rt.autoC || 0) + dt) > 0.5) { rt.autoC = 0; choosing.auto(); }
        if (scene && scene.update) safe(() => scene.update(dt));
      }
      function drawFx() {
        for (const f of rt.fx) {
          const k = f.life / f.max;
          ctx.globalAlpha = 1 - k;
          if (f.kind === 'ring') {
            ctx.strokeStyle = f.color; ctx.lineWidth = 6 * (1 - k);
            ctx.beginPath(); ctx.arc(f.x, f.y, f.size * (0.3 + k), 0, 7); ctx.stroke();
          } else if (f.kind === 'star') {
            ctx.fillStyle = f.color; ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot); star(ctx, f.size * (1 - k * 0.4)); ctx.fill(); ctx.restore();
          } else {
            ctx.fillStyle = f.color; ctx.beginPath(); ctx.arc(f.x, f.y, f.size * 0.5 * (1 - k * 0.5), 0, 7); ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
      }
      function frame(now) {
        if (!alive) return;
        raf = requestAnimationFrame(frame);
        let dt = (now - last) / 1000; last = now;
        if (!(dt > 0)) return;
        dt = Math.min(dt, 0.05) * G.SPEED;
        tick(dt);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        if (scene && scene.draw) safe(() => scene.draw(ctx, W, H));
        drawFx();
      }

      // ---------- ввод ----------
      const downIds = new Set();
      const pt = e => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, id: e.pointerId }; };
      cv.addEventListener('pointerdown', e => {
        e.preventDefault(); downIds.add(e.pointerId);
        try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
        rt.idleAt = rt.time; api.fingerOff();
        if (scene && scene.down) safe(() => scene.down(pt(e)));
      });
      cv.addEventListener('pointermove', e => { if (downIds.has(e.pointerId) && scene && scene.move) safe(() => scene.move(pt(e))); });
      const up = e => { if (!downIds.delete(e.pointerId)) return; if (scene && scene.up) safe(() => scene.up(pt(e))); };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);

      hintBtn.addEventListener('pointerdown', e => { e.preventDefault(); G.sfx.tap(); hintBtn.classList.remove('bump'); void hintBtn.offsetWidth; hintBtn.classList.add('bump'); showHint(); });
      G.holdButton(home, 700, () => exit('exit'));

      const onSpeak = d => {
        if (d.on) { subs.textContent = d.text; subs.classList.add('on'); }
        else subs.classList.remove('on');
      };
      G.on('speak', onSpeak);

      // ---------- жизненный цикл ----------
      function cleanup() {
        alive = false; cancelAnimationFrame(raf);
        window.removeEventListener('resize', onResize);
        G.off('speak', onSpeak); G.voice.stop(); G.music.stop();
        clearTimeout(finger._t);
      }
      function exit(result) { if (!alive) return; cleanup(); resolveLevel(result); }
      function crash() {
        if (!alive || finished) return;
        finished = true; rt.waiting = false;
        over.append(h('div', { class: 'panel crash' }, h('p', null, 'Ой! Что-то пошло не так.'),
          h('button', { class: 'btn big', onclick: () => exit('done') }, 'Дальше')));
      }
      async function complete() {
        rt.waiting = false; api.fingerOff();
        G.music.stop(); G.sfx.fanfare(); G.buzz([20, 40, 20]);
        api.burst(W / 2, H * 0.4, { n: 40, power: 1.4 });
        const panel = h('div', { class: 'panel done-panel pop-in' },
          h('div', { class: 'stars' }, h('i', { html: G.ICON.star }), h('i', { html: G.ICON.star }), h('i', { html: G.ICON.star })),
          G.art.img(def.icon, 'done-art'),
          h('h2', null, 'Уровень пройден!'),
          h('button', { class: 'btn big next' }, 'Дальше'));
        over.append(panel);
        api.say('c_level_done');
        const btn = panel.querySelector('.next');
        btn.addEventListener('click', () => { G.sfx.tap(); exit('done'); });
        if (G.AUTO) api.wait(0.8).then(() => exit('done'));
      }

      (hooks.mount || G.ui.mount)(el);
      window.addEventListener('resize', onResize);
      resize();
      const px = Math.round(Math.min(420, 220 * dpr));
      Promise.all([G.art.ready(def.sprites || [], px), G.fontsReady()]).then(() => {
        if (!alive) return;
        try { scene = def.create(api); } catch (e) { console.error(e); G.errors.push(def.id + ' create: ' + e.message); crash(); return; }
        resize();
        last = performance.now(); raf = requestAnimationFrame(frame);
        if (def.music) G.music.play(def.music);
        Promise.resolve(safe(() => scene.run && scene.run()))
          .then(() => { if (alive) api.finish(); })
          .catch(e => { console.error(e); G.errors.push(def.id + ' run: ' + e.message); crash(); });
      });
    });
  };

  function star(c, r) {
    c.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    c.closePath();
  }
  G.starPath = star;

  // Кнопка, которую надо подержать (чтобы малыш не вышел случайно)
  G.holdButton = function (btn, ms, fn) {
    let t = null;
    const start = e => { e.preventDefault(); btn.classList.add('holding'); btn.style.setProperty('--hold', ms + 'ms'); t = setTimeout(() => { btn.classList.remove('holding'); G.sfx.tap(); fn(); }, ms); };
    const stop = () => { clearTimeout(t); btn.classList.remove('holding'); };
    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', stop); btn.addEventListener('pointerleave', stop); btn.addEventListener('pointercancel', stop);
    btn.addEventListener('contextmenu', e => e.preventDefault());
  };

  // Шрифт для букв на canvas: ждём не больше 1.5 с, дальше — системный круглый
  let fontP = null;
  G.fontsReady = () => fontP || (fontP = (document.fonts && document.fonts.load)
    ? Promise.race([document.fonts.load('900 64px Nunito').catch(() => {}), new Promise(r => setTimeout(r, 1500))])
    : Promise.resolve());
})();
