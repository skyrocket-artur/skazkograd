'use strict';
// Мир 3 «Репка»: ритм по слогам, герои по порядку и по росту, морковки на верёвочках (Cut the Rope),
// утёнок прыгает по листикам с «У» (Doodle Jump), босс — две корзинки «где больше».
(function () {
  const { FOREST, forest, shadow, roundRect } = G.lv;
  const HEROES = ['ded', 'babka', 'vnuchka', 'zhuchka', 'koshka', 'mouse'];
  const HT = { ded: 1, babka: 0.9, vnuchka: 0.78, zhuchka: 0.58, koshka: 0.48, mouse: 0.34 };
  const SAYH = { ded: 'w3_a_ded', babka: 'w3_a_babka', vnuchka: 'w3_a_vnuchka', zhuchka: 'w3_a_zhuchka', koshka: 'w3_a_koshka', mouse: 'w3_a_mouse' };

  // ---------- огород: лесной фон + забор и грядки ----------
  function garden(api, ground, o = {}) {
    const bg = forest(api, { ground, trees: 0.35, sky1: '#8CD0F8', sky2: '#DDF2FF', ground1: '#A5D46E', ground2: '#76B352' });
    const base = bg.draw;
    bg.draw = (c, s) => {
      base(c, s);
      const W = api.W, gy = bg.gy, fh = Math.min(api.H * 0.075, 56), step = Math.max(24, fh * 0.6), pw = step * 0.64;
      c.fillStyle = '#B98450';
      c.fillRect(0, gy - fh * 0.78, W, fh * 0.12); c.fillRect(0, gy - fh * 0.36, W, fh * 0.12);
      for (let x = step * 0.2; x < W; x += step) {
        c.fillStyle = '#EBBB80'; c.beginPath(); c.moveTo(x, gy + 2); c.lineTo(x, gy - fh + pw * 0.45); c.lineTo(x + pw / 2, gy - fh);
        c.lineTo(x + pw, gy - fh + pw * 0.45); c.lineTo(x + pw, gy + 2); c.closePath(); c.fill();
        c.fillStyle = 'rgba(140,90,40,.18)'; c.fillRect(x + pw * 0.7, gy - fh + pw * 0.45, pw * 0.3, fh - pw * 0.45);
      }
      if (o.beds) {
        const room = api.H - gy;
        for (let i = 0; i < 2; i++) {
          const y = gy + room * (0.32 + i * 0.36), bh = Math.max(10, room * 0.15);
          c.fillStyle = '#9C6A42'; roundRect(c, W * 0.04, y, W * 0.92, bh, bh / 2); c.fill();
          c.fillStyle = '#B98257'; roundRect(c, W * 0.04, y, W * 0.92, bh * 0.45, bh * 0.22); c.fill();
          c.strokeStyle = '#4FAE4A'; c.lineWidth = 3; c.lineCap = 'round';
          for (let x = W * 0.08; x < W * 0.94; x += 34) { c.beginPath(); c.moveTo(x - 5, y - 6); c.lineTo(x, y + 3); c.lineTo(x + 5, y - 6); c.stroke(); }
        }
      }
    };
    return bg;
  }

  // Репка в земле: lift 0 — сидит крепко, 1 — вытянута
  function repkaAt(api, c, x, gy, h, lift = 0, rot = 0) {
    c.save();
    if (lift < 0.98) { c.beginPath(); c.rect(0, 0, api.W, gy + 2); c.clip(); }
    G.art.draw(c, 'repka', x, gy + h * 0.36 * (1 - lift), h, { anchor: 'b', rot });
    c.restore();
    c.fillStyle = '#8E5B36'; c.beginPath(); c.ellipse(x, gy + 3, h * 0.34, h * 0.06, 0, 0, 7); c.fill();
    c.fillStyle = '#A97048'; c.beginPath(); c.ellipse(x, gy + 1, h * 0.28, h * 0.035, 0, Math.PI, 0); c.fill();
  }
  function hero(c, n, x, y, h, o = {}) {
    shadow(c, x, y + 2, G.art.width(n, h) * 0.8, 0.16);
    G.art.draw(c, n, x, y + 2, h, Object.assign({ anchor: 'b' }, o));
  }

  // Корзинка с морковками. rim — линия края, h — высота корзинки.
  function inBasket(k, n, h) {
    const rows = n > 4 ? 2 : 1, back = Math.ceil(n / rows), row = k < back ? 0 : 1, m = row ? n - back : back, i = row ? k - back : k;
    const span = h * (row ? 0.6 : (rows > 1 ? 0.9 : 0.8)), step = m > 1 ? span / (m - 1) : 0;
    return { dx: m > 1 ? -span / 2 + i * step : 0, dy: row ? h * 0.02 : (rows > 1 ? -h * 0.17 : -h * 0.08), rot: m > 1 ? (i / (m - 1) - 0.5) * 0.4 : 0 };
  }
  function basket(api, c, x, rim, h, n, cw, o = {}) {
    G.art.draw(c, 'basket_back', x, rim + h * 0.03, h);
    const of = Math.max(n, o.of || 0);
    for (let k = 0; k < n; k++) {
      const q = inBasket(k, of, h);
      if (o.hl === k) { c.fillStyle = 'rgba(255,220,80,.85)'; c.beginPath(); c.arc(x + q.dx, rim + q.dy - cw * 0.25, cw * 0.36, 0, 7); c.fill(); }
      G.art.draw(c, 'carrot', x + q.dx, rim + q.dy, cw, { rot: q.rot });
    }
    G.art.draw(c, 'basket_front', x, rim + h * 0.03, h);
    if (o.label != null) {
      const s = h * 0.34, ty = rim + h * 0.24;
      c.fillStyle = '#FFF8EA'; roundRect(c, x - s / 2, ty - s / 2, s, s, s * 0.28); c.fill();
      c.strokeStyle = '#E8D2A8'; c.lineWidth = 3; c.stroke();
      api.glyph(c, String(o.label), x, ty, s * 0.78, { color: '#6A4BD6' });
    }
  }

  // =====================================================================
  // 11. Тя-нем, по-тя-нем! — ритм по слогам: репки летят к кружку, нажимаем в такт, дед с помощниками тянет.
  // =====================================================================
  function chant(text, beats, notes, bt) {
    const syl = [], wend = [];
    text.split(' ').forEach(w => w.split('-').forEach((s, i, a) => { syl.push(s); wend.push(i === a.length - 1); }));
    return { syl, wend, beats, notes, bt };
  }
  const CHANT = [
    chant('Тя-нем, по-тя-нем!', [1, 2, 1, 1, 2], [67, 64, 67, 69, 67], 0.95),
    chant('Дед-ка, баб-ка, тя-нем ре-пку!', [1, 1, 1, 2, 1, 1, 1, 2], [72, 69, 72, 69, 67, 69, 71, 72], 0.85),
    chant('Тя-нем, по-тя-нем, вы-тя-нуть не мо-жем!', [1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2], [67, 64, 67, 69, 67, 72, 71, 69, 67, 69, 72], 0.8)
  ];
  G.level({
    id: 'w3l1', world: 'w3', n: 1, title: 'Тя-нем, по-тя-нем!', icon: 'ded', music: 'garden',
    sprites: [...FOREST, 'repka', 'ded', 'babka', 'vnuchka'],
    create(api) {
      const bg = garden(api, 0.8);
      const team = [], st = { pull: 0, glow: 0 };
      let notes = [], song = null, win = 0.42, travel = 1.9, ringX = 0, laneY = 0, resRound = null;
      function layout() { bg.resize(); ringX = api.W * 0.2; laneY = Math.max(api.H * 0.33, 130); }
      layout();
      const spd = () => (api.W + 60 - ringX) / travel;
      function play(s, slow) {
        song = s; win = slow ? 0.5 : 0.42;
        const bt = s.bt * (slow ? 1.2 : 1);
        let t = api.t + travel + 0.4;
        notes = s.syl.map((syl, i) => { const n = { i, n: s.notes[i], t, st: 'wait' }; t += s.beats[i] * bt; return n; });
        api.expect(true);
        return new Promise(r => { resRound = () => r(notes.filter(n => n.st === 'hit').length / notes.length); });
      }
      async function sing(i) {
        const k = await play(CHANT[i]);
        if (k < 0.3) { await api.say('w3_l11_again'); await play(CHANT[i], true); }
      }
      function hitNote(n) {
        n.st = 'hit'; G.sfx.note(n.n); st.glow = 1; st.pull = 1; api.good();
        api.burst(ringX, laneY, { n: 8, scale: 0.6, ringSize: 50 });
      }
      function join(name) { const m = { n: name, k: 0 }; team.push(m); api.sfx('peek'); return api.tween(m, { k: 1 }, 0.8, 'out'); }
      function drawSyl(c, W) {
        const fs = G.clamp(W * 0.075, 20, 40), gap = fs * 0.45;
        c.font = `900 ${fs}px Nunito, ui-rounded, system-ui, sans-serif`; c.textBaseline = 'middle'; c.textAlign = 'left';
        const items = [];
        song.syl.forEach((s, i) => { items.push({ s, i }); if (!song.wend[i]) items.push({ s: '-' }); else if (i < song.syl.length - 1) items.push({ sp: true }); });
        items.forEach(it => { it.w = it.sp ? gap : c.measureText(it.s).width; });
        let rows = [items];
        const total = items.reduce((a, b) => a + b.w, 0);
        if (total > W * 0.9) {
          let cut = -1, best = 1e9, acc = 0;
          items.forEach((it, k) => { acc += it.w; if (it.sp && Math.abs(acc - total / 2) < best) { best = Math.abs(acc - total / 2); cut = k; } });
          if (cut > 0) rows = [items.slice(0, cut), items.slice(cut + 1)];
        }
        const curI = (notes.find(n => n.st === 'wait') || {}).i;
        rows.forEach((row, ri) => {
          const tot = row.reduce((a, b) => a + b.w, 0), y = laneY + 72 + ri * fs * 1.4;
          let x = W / 2 - tot / 2;
          c.fillStyle = 'rgba(255,255,255,.62)'; roundRect(c, x - fs * 0.5, y - fs * 0.7, tot + fs, fs * 1.4, fs * 0.6); c.fill();
          row.forEach(it => {
            if (it.i != null) {
              const n = notes[it.i];
              if (it.i === curI) { c.fillStyle = 'rgba(255,210,63,.95)'; roundRect(c, x - 5, y - fs * 0.6, it.w + 10, fs * 1.2, fs * 0.4); c.fill(); }
              c.fillStyle = n.st === 'hit' ? '#FF5A2E' : n.st === 'miss' ? '#9B87B5' : '#4A3F66';
              c.fillText(it.s, x, y + 1);
            } else if (!it.sp) { c.fillStyle = '#B3A6C9'; c.fillText(it.s, x, y + 1); }
            x += it.w;
          });
        });
      }
      return {
        resize: layout,
        async run() {
          api.rounds(3); api.round(0);
          join('ded');
          await api.say('w3_l11_intro');
          await sing(0);
          api.round(1); join('babka'); await api.say('w3_l11_r2');
          await sing(1);
          api.round(2); join('vnuchka'); await api.say('w3_l11_r3');
          await sing(2);
          song = null; notes = [];
          for (let i = 0; i < 3; i++) { st.pull = 1; api.sfx('boing'); await api.wait(0.5); }
          await api.say('w3_l11_end');
          api.round(3); await api.wait(0.3);
        },
        update(dt) {
          st.glow = Math.max(0, st.glow - dt * 3); st.pull = Math.max(0, st.pull - dt * 2.5);
          if (!notes.length) return;
          for (const n of notes) {
            if (n.st === 'wait' && api.t > n.t + win) { n.st = 'miss'; G.sfx.soft(n.n); }
            if (!n.bass && api.t >= n.t) { n.bass = true; G.tone({ f: G.nf(n.n - 24), type: 'triangle', dur: 0.35, vol: 0.09 }); }
          }
          const last = notes[notes.length - 1];
          if (resRound && notes.every(n => n.st !== 'wait') && api.t > last.t + 0.9) { const f = resRound; resRound = null; api.expect(false); f(); }
        },
        draw(c, W, H) {
          bg.draw(c, 0);
          const gy = bg.gy, rh = Math.min(H * 0.26, W * 0.46), rx = W * 0.17, p = st.pull;
          repkaAt(api, c, rx, gy, rh, p * 0.08, -p * 0.06);
          // цепочка: каждый держится за того, кто впереди
          const hh = Math.min(H * 0.24, W * 0.36), pos = [];
          let x = rx + rh * 0.34;
          team.forEach(m => { const h = hh * HT[m.n], w = G.art.width(m.n, h); pos.push([m, x + w * 0.5 + (1 - m.k) * W * 0.7, h, w]); x += w * 0.6; });
          for (let i = pos.length - 1; i >= 0; i--) {
            const [m, cx, h, w] = pos[i];
            shadow(c, cx, gy + 4, w * 0.8);
            G.art.draw(c, m.n, cx + p * 4, gy + 3, h, { anchor: 'b', rot: 0.08 + p * 0.12 });
          }
          if (!song) return;
          c.fillStyle = 'rgba(255,255,255,.45)'; roundRect(c, ringX - 40, laneY - 34, W - ringX + 60, 68, 34); c.fill();
          const near = notes.some(n => n.st === 'wait' && Math.abs(n.t - api.t) < win);
          c.strokeStyle = near ? '#FFB020' : '#fff'; c.lineWidth = 7 + st.glow * 5;
          c.beginPath(); c.arc(ringX, laneY, 34 + st.glow * 6, 0, 7); c.stroke();
          for (const n of notes) {
            if (n.st === 'hit') continue;
            const nx = ringX + (n.t - api.t) * spd();
            if (nx > W + 60 || nx < -60) continue;
            G.art.draw(c, 'repka', nx, laneY, 54, { alpha: n.st === 'miss' ? 0.35 : 1 });
          }
          drawSyl(c, W);
        },
        down() {
          if (!notes.length) return;
          let best = null, bd = 9;
          for (const n of notes) { if (n.st !== 'wait') continue; const d = Math.abs(n.t - api.t); if (d < win && d < bd) { bd = d; best = n; } }
          if (best) hitNote(best); else G.sfx.tick();
        },
        hint() { if (song) api.finger(ringX, laneY + 10); },
        auto() { const n = notes.find(x => x.st === 'wait' && Math.abs(x.t - api.t) < 0.07); if (n) hitNote(n); }
      };
    }
  });

  // =====================================================================
  // 12. Кто за кем — раскладка героев: по сказке (дед → мышка) и по росту, счёт до шести.
  // =====================================================================
  G.level({
    id: 'w3l2', world: 'w3', n: 2, title: 'Кто за кем', icon: 'vnuchka', music: 'garden',
    sprites: [...FOREST, 'repka', ...HEROES],
    create(api) {
      const bg = garden(api, () => (api.W > api.H ? 0.46 : 0.58));
      const st = { lift: 0, lean: 0 };
      let R = null, slots = [], tray = [], showRepka = true, nums = false, hm = 80, hmT = 70, sp = 50, tsp = 60, saidWrong = false;
      const repH = () => Math.min(api.H * 0.22, api.W * 0.32);
      function layout() {
        bg.resize();
        const W = api.W, H = api.H, n = slots.length || 3;
        const x0 = showRepka ? W * 0.24 : W * 0.08, x1 = W * 0.96;
        const land = W > H;
        sp = (x1 - x0) / n; tsp = (land ? W - 100 : W) / ((tray.length || 3) + 1);
        hm = Math.min(H * 0.22, sp * 2.3); hmT = land ? Math.min(H * 0.3, tsp * 2, H * 0.86 - bg.gy - 50) : Math.min(H * 0.17, tsp * 2);
        slots.forEach((s, i) => { s.x = x0 + sp * (i + 0.5); s.y = bg.gy + 2; });
        const stag = tray.length > 4 && !land;
        tray.forEach((t, i) => { t.tx = tsp * (i + 1); t.ty = land ? H * 0.86 : H * (stag && i % 2 ? 0.77 : 0.87); if (!t.slot) { t.x = t.tx; t.y = t.ty; } });
      }
      function round(order, o) {
        showRepka = !!o.repka; nums = !!o.nums; saidWrong = false;
        slots = order.map(n => ({ n, x: 0, y: 0, got: null }));
        let mix = G.shuffle(order.slice());
        for (let k = 0; k < 5 && mix.every((n, i) => n === order[i]); k++) mix = G.shuffle(order.slice());
        tray = mix.map(n => ({ n, x: 0, y: 0, tx: 0, ty: 0, slot: null, fly: null, wob: 0, s: 0 }));
        layout();
        tray.forEach((t, i) => api.tween(t, { s: 1 }, 0.3 + i * 0.07, 'back'));
        R = { order, i: 0, o }; api.expect(true);
        return new Promise(r => { R.res = r; });
      }
      function pick(t) {
        if (!R || t.slot) return;
        if (t.n !== R.order[R.i]) {
          t.wob = 1; api.sfx('wrong'); api.miss();
          if (!saidWrong) { saidWrong = true; api.say(R.o.wrong); }
          return;
        }
        const s = slots[R.i]; s.got = t; t.slot = s; R.i++;
        api.sfx('jump'); api.good(); G.buzz(12);
        t.fly = { fx: t.x, fy: t.y, k: 0 };
        api.tween(t.fly, { k: 1 }, 0.45, 'inOut').then(() => { t.fly = null; api.sfx('land'); api.burst(s.x, s.y - hm * HT[t.n] * 0.5, { n: 10, scale: 0.7 }); });
        api.say(R.o.nums ? 'n' + R.i : SAYH[t.n]);
        if (R.i >= R.order.length) { api.expect(false); api.after(1.3, () => { const f = R.res; R.res = null; f && f(); }); }
      }
      async function pullOut() {
        for (let i = 0; i < 3; i++) { await api.tween(st, { lean: 1 }, 0.2); api.sfx('boing'); await api.tween(st, { lean: 0.3 }, 0.22); }
        api.sfx('pop'); G.buzz([20, 30, 20]);
        api.tween(st, { lift: 1 }, 0.7, 'back');
        await api.tween(st, { lean: 2.2 }, 0.35, 'out');
        api.sfx('cheer'); api.burst(api.W * 0.13, bg.gy - repH() * 0.5, { n: 30, power: 1.2 });
        api.tween(st, { lean: 0 }, 0.9, 'bounce');
      }
      return {
        resize: layout,
        async run() {
          api.rounds(3); api.round(0);
          const r1 = round(['ded', 'babka', 'vnuchka'], { repka: true, wrong: 'w3_l12_wrong' });
          await api.say('w3_l12_intro'); await r1;
          await api.say('w3_l12_r1'); api.round(1);
          const r2 = round(['mouse', 'koshka', 'vnuchka', 'ded'], { repka: false, wrong: 'w3_l12_small' });
          await api.say('w3_l12_r2'); await r2;
          await api.say('w3_l12_r2done'); api.round(2);
          const r3 = round(HEROES, { repka: true, nums: true, wrong: 'w3_l12_wrong' });
          await api.say('w3_l12_r3'); await r3;
          api.card(6, { caption: 'шесть героев' }); await api.say('w3_l12_six');
          await pullOut();
          await api.say('w3_l12_pull');
          api.round(3); await api.wait(0.3);
        },
        update(dt) { tray.forEach(t => { t.wob = Math.max(0, t.wob - dt * 2); }); },
        draw(c, W, H) {
          bg.draw(c, 0);
          const gy = bg.gy;
          if (showRepka) repkaAt(api, c, W * 0.13, gy, repH(), st.lift, -st.lean * 0.08);
          slots.forEach((s, i) => {
            if (!s.got || s.got.fly) {
              c.strokeStyle = 'rgba(255,255,255,.85)'; c.setLineDash([7, 6]); c.lineWidth = 3;
              c.beginPath(); c.ellipse(s.x, gy + 4, sp * 0.38, Math.max(6, sp * 0.12), 0, 0, 7); c.stroke(); c.setLineDash([]);
            }
            if (nums) api.glyph(c, String(i + 1), s.x, gy + G.clamp((H - gy) * 0.07, 14, 28) + 6, G.clamp(sp * 0.5, 18, 36), { color: '#6A4BD6' });
          });
          for (let i = slots.length - 1; i >= 0; i--) {
            const t = slots[i].got;
            if (t && !t.fly) hero(c, t.n, slots[i].x + st.lean * sp * 0.08, slots[i].y, hm * HT[t.n], { rot: st.lean * 0.16 });
          }
          [...tray].sort((a, b) => a.y - b.y).forEach(t => { if (!t.slot) hero(c, t.n, t.x + Math.sin(t.wob * 25) * 8 * t.wob, t.y, hmT * HT[t.n] * t.s); });
          tray.forEach(t => {
            if (!t.fly) return;
            const k = t.fly.k, s = t.slot;
            hero(c, t.n, t.fly.fx + (s.x - t.fly.fx) * k, t.fly.fy + (s.y - t.fly.fy) * k - Math.sin(Math.PI * k) * H * 0.14, (hmT + (hm - hmT) * k) * HT[t.n]);
          });
        },
        down(p) {
          if (!R) return;
          const cand = tray.filter(t => !t.slot).map(t => { const h = hmT * HT[t.n]; return [t, Math.hypot(p.x - t.x, p.y - (t.y - h * 0.5)), Math.max(h * 0.75, 48)]; })
            .filter(a => a[1] < a[2]).sort((a, b) => a[1] - b[1])[0];
          if (cand) pick(cand[0]);
        },
        hint() {
          if (!R || R.i >= R.order.length) return;
          const want = R.order[R.i], t = tray.find(x => x.n === want && !x.slot); if (!t) return;
          api.finger(t.x, t.y - hmT * HT[t.n] * 0.5);
          api.say(R.o.repka ? SAYH[want] : 'w3_l12_small');
        },
        auto() { if (!R || R.i >= R.order.length) return; const t = tray.find(x => x.n === R.order[R.i] && !x.slot); if (t) pick(t); }
      };
    }
  });

  // =====================================================================
  // 13. Урожай — Cut the Rope: морковки качаются на верёвочках, режем пальцем, ловим в корзинку с цифрой.
  // =====================================================================
  function crosses(a, b, c, d) {
    const o = (p, q, r) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
    return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b);
  }
  function distSeg(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy || 1;
    const k = G.clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / l2, 0, 1);
    return Math.hypot(p.x - a.x - dx * k, p.y - a.y - dy * k);
  }
  G.level({
    id: 'w3l3', world: 'w3', n: 3, title: 'Урожай', icon: 'carrot', music: 'garden',
    sprites: [...FOREST, 'carrot', 'basket_back', 'basket_front', 'mouse'],
    create(api) {
      const bg = garden(api, 0.92);
      const B = { x: 0, rim: 0, h: 80 };
      let ropes = [], falling = [], got = 0, R = null, ch = 60, last = null, beamY = 100;
      function layout() {
        bg.resize();
        const W = api.W, H = api.H, n = ropes.length || 3;
        B.h = Math.min(W * 0.42, H * 0.24); B.x = W / 2; B.rim = H * 0.92 - B.h * 0.5;
        beamY = Math.max(92, H * 0.13);
        ch = Math.min(H * 0.12, W / n * 1.4, 100);
        ropes.forEach((r, i) => { r.ax = W * (i + 0.5) / n; r.ay = beamY + (i % 2) * H * 0.035; r.L = H * (0.12 + ((i * 7) % 3) * 0.045); });
      }
      function round(n, need) {
        ropes = Array.from({ length: n }, () => ({ th: G.rand(0.12, 0.3) * (Math.random() < 0.5 ? -1 : 1), om: 0, cut: false, off: false, ax: 0, ay: 0, L: 1 }));
        falling = []; got = 0; R = { need }; layout(); api.expect(true);
        return new Promise(r => { R.res = r; });
      }
      const tip = r => ({ x: r.ax + Math.sin(r.th) * r.L, y: r.ay + Math.cos(r.th) * r.L });
      const mid = r => ({ x: r.ax + Math.sin(r.th) * (r.L + ch / 2), y: r.ay + Math.cos(r.th) * (r.L + ch / 2) });
      const live = () => ropes.filter(r => !r.cut && !r.off);
      function cut(r) {
        if (!R || r.cut || r.off) return;
        r.cut = true; const m = mid(r);
        falling.push({ x: m.x, y: m.y, vx: Math.cos(r.th) * r.om * r.L, vy: -Math.sin(r.th) * r.om * r.L, rot: -r.th, vr: G.rand(-2, 2) });
        api.sfx('pop'); G.buzz(10); api.good();
        if (got + falling.length >= R.need) ropes.forEach(x => { if (!x.cut) x.off = true; }); // ровно столько, сколько написано
      }
      function caught() {
        got++; api.sfx('coin'); api.burst(B.x, B.rim, { n: 10, scale: 0.7 }); api.say('n' + got);
        if (got >= R.need) { api.expect(false); api.after(0.9, () => { const f = R.res; R.res = null; f && f(); }); }
      }
      return {
        resize: layout,
        async run() {
          api.rounds(3); api.round(0);
          const r1 = round(3, 3);
          await api.say('w3_l13_intro'); await r1;
          await api.praise(); api.round(1);
          const r2 = round(6, 6);
          await api.say('w3_l13_r2'); await r2;
          api.card(6, { caption: 'шесть морковок' }); await api.say('w3_l13_six');
          api.round(2);
          const r3 = round(8, 7);
          await api.say('w3_l13_r3'); await r3;
          api.card(7, { caption: 'семь морковок' }); await api.say('w3_l13_seven');
          api.round(3); await api.wait(0.3);
        },
        update(dt) {
          const g = api.H * 2.2, steps = Math.ceil(dt / 0.012), h = dt / steps;
          for (const r of ropes) if (!r.cut) for (let k = 0; k < steps; k++) { r.om -= (g / r.L) * Math.sin(r.th) * h; r.th += r.om * h; }
          const gf = api.H * 2.6;
          for (let i = falling.length - 1; i >= 0; i--) {
            const f = falling[i];
            f.vy += gf * dt; f.vx += (B.x - f.x) * 9 * dt; f.vx *= Math.max(0, 1 - 3 * dt);
            f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.vr * dt;
            if (f.vy > 0 && f.y >= B.rim - ch * 0.2) { falling.splice(i, 1); caught(); }
          }
        },
        draw(c, W, H) {
          bg.draw(c, 0);
          // жердь на столбиках
          c.fillStyle = '#8A5A2E'; c.fillRect(W * 0.03, beamY - 6, 12, bg.gy - beamY + 8); c.fillRect(W * 0.97 - 12, beamY - 6, 12, bg.gy - beamY + 8);
          c.fillStyle = '#B07A45'; roundRect(c, W * 0.02, beamY - 12, W * 0.96, 14, 7); c.fill();
          ropes.forEach(r => {
            c.strokeStyle = '#8B6B4A'; c.lineWidth = 3; c.lineCap = 'round';
            c.beginPath(); c.moveTo(r.ax, r.ay - 6);
            if (r.cut) c.lineTo(r.ax + Math.sin(r.th) * 14, r.ay + Math.cos(r.th) * 14);
            else { const t = tip(r); c.lineTo(t.x, t.y); }
            c.stroke();
            c.fillStyle = '#6E4522'; c.beginPath(); c.arc(r.ax, r.ay - 6, 5, 0, 7); c.fill();
            if (!r.cut) { const m = mid(r); G.art.draw(c, 'carrot', m.x, m.y, ch, { rot: -r.th, alpha: r.off ? 0.45 : 1 }); }
          });
          G.art.draw(c, 'mouse', B.x - B.h * 0.85, B.rim + B.h * 0.5, B.h * 0.6, { anchor: 'b', rot: Math.sin(api.t * 3) * 0.05 });
          basket(api, c, B.x, B.rim, B.h, got, ch * 0.9, { of: R ? R.need : got, label: R ? R.need : null });
          falling.forEach(f => G.art.draw(c, 'carrot', f.x, f.y, ch, { rot: f.rot }));
        },
        down(p) {
          last = p;
          const r = live().map(r => [r, Math.min(distSeg(p, { x: r.ax, y: r.ay }, tip(r)), Math.hypot(p.x - mid(r).x, p.y - mid(r).y) - ch * 0.3)]).filter(a => a[1] < 24).sort((a, b) => a[1] - b[1])[0];
          if (r) cut(r[0]);
        },
        move(p) {
          if (!last) return;
          for (const r of live()) if (crosses(last, p, { x: r.ax, y: r.ay }, tip(r))) cut(r);
          last = p;
        },
        up() { last = null; },
        hint() {
          const r = live().sort((a, b) => Math.abs(a.ax - api.W / 2) - Math.abs(b.ax - api.W / 2))[0]; if (!r) return;
          const t = tip(r); api.finger((r.ax + t.x) / 2, (r.ay + t.y) / 2); api.say('c_hint');
        },
        auto() { if (!R || falling.length) return; const r = live()[0]; if (r) cut(r); }
      };
    }
  });

  // =====================================================================
  // 14. Утёнок и буква «У» — Doodle Jump: утёнок сам подпрыгивает, мы ведём его к листикам с «У».
  // =====================================================================
  function leaf(c, x, y, w, h, o = {}) { // y — поверхность листа
    c.save(); c.translate(x, y + h * 0.45); if (o.rot) c.rotate(o.rot);
    if (o.alpha != null) c.globalAlpha *= o.alpha;
    c.fillStyle = 'rgba(20,70,30,.16)'; c.beginPath(); c.ellipse(0, h * 0.42, w * 0.44, h * 0.22, 0, 0, 7); c.fill();
    const g = c.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, '#9BE476'); g.addColorStop(1, '#3E9B3A');
    c.fillStyle = g; c.beginPath(); c.moveTo(-w / 2, 0);
    c.quadraticCurveTo(-w * 0.12, -h * 1.0, w / 2, -h * 0.04); c.quadraticCurveTo(-w * 0.04, h * 0.95, -w / 2, 0); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-w * 0.44, 0); c.quadraticCurveTo(0, -h * 0.1, w * 0.44, -h * 0.03); c.stroke();
    c.strokeStyle = '#3E9B3A'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(-w / 2, 0); c.quadraticCurveTo(-w * 0.62, h * 0.1, -w * 0.6, h * 0.36); c.stroke();
    c.restore();
  }
  G.level({
    id: 'w3l4', world: 'w3', n: 4, title: 'Утёнок и буква «У»', icon: 'duck', music: 'garden',
    sprites: ['cloud', 'duck', 'duck_mama'],
    create(api) {
      let W = 1, H = 1, d = 100, lw = 100, lh = 40, g = 1000, V = 600, cam = 0;
      const duck = { x: 0, y: 0, vy: 0, right: true, sq: 1, home: null, save: false };
      let rows = [], tgtX = null, R = null, count = 0, saidBad = false, topRow = 0, mamaRes = null;
      const BANK = () => H * 0.9;
      const LET = ['А', 'О', 'М', 'К', 'Ш'];
      function layout() {
        W = api.W; H = api.H; d = H * 0.19; lw = Math.min(W * 0.24, H * (W > H ? 0.22 : 0.17)); lh = lw * 0.42;
        g = H * 3.0; V = Math.sqrt(2 * g * d * 1.45);
        rows.forEach(r => { r.y = BANK() - r.k * d; r.leaves.forEach(l => { l.x = W * l.fx; l.y = r.y; }); });
        if (!duck.x) { duck.x = W / 2; duck.y = BANK(); cam = BANK() - H * 0.72; }
      }
      layout();
      function addRows(n, decoys) {
        let prev = rows.length ? rows[rows.length - 1].good.fx : 0.5;
        for (let i = 0; i < n; i++) {
          const k = ++topRow;
          const spots = decoys >= 2 ? [0.2, 0.5, 0.8] : G.shuffle([0.25, 0.5, 0.75]).slice(0, 2);
          const ok = spots.filter(s => Math.abs(s - prev) > 0.1 && Math.abs(s - prev) < 0.62);
          const gfx = ok.length ? G.pick(ok) : G.pick(spots); prev = gfx;
          const others = G.shuffle(LET.slice());
          const leaves = spots.map((fx, j) => ({ fx, ch: fx === gfx ? 'У' : others[j], good: fx === gfx, sink: 0, x: W * fx, y: BANK() - k * d, row: k, s: 0 }));
          leaves.forEach((l, j) => api.tween(l, { s: 1 }, 0.3 + j * 0.06, 'back'));
          const r = { k, y: BANK() - k * d, leaves, good: leaves.find(l => l.good) };
          rows.push(r);
        }
      }
      function round(n, decoys, line) {
        addRows(n, decoys);
        R = { base: topRow - n, need: n }; count = 0; api.expect(true);
        api.say(line);
        return new Promise(r => { R.res = r; });
      }
      function land(l) {
        if (!l.good) {
          l.sink = 0.001; api.sfx('wrong'); api.miss();
          if (!saidBad) { saidBad = true; api.say('w3_l14_bad'); }
          return;
        }
        duck.y = l.y; duck.vy = -V; duck.sq = 0.65;
        if (duck.home === l) return;
        duck.home = l; api.sfx('boing');
        if (l.mama) { duck.vy = -V * 0.5; const f = mamaRes; mamaRes = null; f && f(); return; }
        if (R && !R.done && l.row > R.base && !l.counted) {
          l.counted = true; count++;
          api.sfx('coin'); api.good(); G.buzz(12); api.burst(l.x, l.y - cam, { n: 10, scale: 0.7 });
          api.say('n' + count);
          if (count >= R.need) { R.done = true; api.expect(false); api.after(0.7, () => { const f = R.res; R.res = null; f && f(); }); }
        }
      }
      function rescue() {
        const h = duck.home, hx = h ? h.x : W / 2, hy = h ? h.y : BANK();
        duck.save = true; tgtX = hx; api.sfx('whoosh');
        api.tween(duck, { x: hx, y: hy - d * 0.9 }, 0.55, 'inOut').then(() => { duck.save = false; duck.vy = 0; });
      }
      const nextGood = () => { const k = duck.home ? duck.home.row + 1 : 1, r = rows.find(x => x.k === k); return r && r.good; };
      return {
        resize: layout,
        async run() {
          api.rounds(3); api.round(0);
          api.card('У', { caption: 'буква У', dur: 3.4 });
          await api.say('w3_l14_letter');
          await round(3, 1, 'w3_l14_intro');
          await api.praise(); api.round(1);
          await round(5, 2, 'w3_l14_r2');
          await api.praise(); api.round(2);
          await round(5, 2, 'w3_l14_r3');
          // мама-утка на большом листе
          const k = ++topRow, l = { fx: 0.5, x: W / 2, y: BANK() - k * d, row: k, good: true, mama: true, big: true, ch: '', sink: 0, s: 1 };
          rows.push({ k, y: l.y, leaves: [l], good: l });
          await new Promise(r => { mamaRes = r; });
          api.sfx('cheer'); api.burst(W / 2, l.y - cam - lh, { n: 26, colors: ['#FF6B8B', '#FF9AB0', '#FFD23F'] });
          await api.say('w3_l14_mama');
          api.round(3); await api.wait(0.4);
        },
        update(dt) {
          rows.forEach(r => r.leaves.forEach(l => { if (l.sink > 0) { l.sink += dt; if (l.sink > 2.4) l.sink = 0; } }));
          duck.sq += (1 - duck.sq) * Math.min(1, dt * 7);
          if (!duck.save) {
            if (tgtX != null) { const dx = tgtX - duck.x, mx = W * 1.3 * dt; duck.x += G.clamp(dx, -mx, mx); if (Math.abs(dx) > 3) duck.right = dx > 0; }
            const py = duck.y;
            duck.vy += g * dt; duck.y += duck.vy * dt;
            if (duck.vy > 0) {
              if (!duck.home && duck.y >= BANK()) { duck.y = BANK(); duck.vy = -V; duck.sq = 0.65; }
              else {
                for (const r of rows) {
                  if (!(py <= r.y + 1 && duck.y >= r.y)) continue;
                  const l = r.leaves.find(l => l.sink === 0 && Math.abs(duck.x - l.x) < lw * (l.big ? 0.8 : 0.5));
                  if (l) { land(l); if (l.good) break; }
                }
              }
            }
            const hy = duck.home ? duck.home.y : BANK();
            if (duck.y > hy + d * 0.75) rescue();
          }
          const camT = (duck.home ? duck.home.y : BANK()) - H * 0.72;
          cam += (camT - cam) * Math.min(1, dt * 3);
        },
        draw(c) {
          const sg = c.createLinearGradient(0, 0, 0, H); sg.addColorStop(0, '#76C3F5'); sg.addColorStop(1, '#E6F6FF');
          c.fillStyle = sg; c.fillRect(0, 0, W, H);
          const step = H * 0.42, lo = Math.floor((cam * 0.5 - H * 0.3) / step), hi = Math.ceil((cam * 0.5 + H * 1.2) / step);
          for (let i = lo; i <= hi; i++) {
            const fx = (((i * 0.618) % 1) + 1) % 1, sy = i * step - cam * 0.5;
            G.art.draw(c, 'cloud', W * (0.1 + fx * 0.8), sy, Math.min(H * 0.08, 70) * (1 + (((i % 3) + 3) % 3) * 0.2), { alpha: 0.9 });
          }
          // берег и пруд
          const by = BANK() - cam;
          if (by < H + 40) {
            c.fillStyle = '#5FB6E3'; c.fillRect(0, by + lh * 0.3, W, H - by);
            c.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 5; i++) c.fillRect(W * ((i * 0.29 + 0.07) % 1), by + lh * 0.9 + (i % 2) * 14, 40, 3);
            c.fillStyle = '#7DCB5F'; roundRect(c, -20, by - 4, W + 40, lh * 0.55, 14); c.fill();
            c.strokeStyle = '#4F9E46'; c.lineWidth = 4; c.lineCap = 'round';
            for (let i = 0; i < 6; i++) { const rx = W * ((i * 0.37 + 0.05) % 1); c.beginPath(); c.moveTo(rx, by); c.quadraticCurveTo(rx - 6, by - lh * 0.9, rx + 4, by - lh * 1.5); c.stroke(); }
          }
          rows.forEach(r => r.leaves.forEach(l => {
            const sy = l.y - cam; if (sy < -80 || sy > H + 80) return;
            const sink = l.sink > 0 ? Math.min(1, l.sink * 3) : 0;
            const w = lw * (l.big ? 1.6 : 1) * l.s;
            leaf(c, l.x, sy + sink * lh * 1.2, w, lh * l.s, { alpha: 1 - sink * 0.6, rot: sink * 0.3 });
            if (l.ch) api.glyph(c, l.ch, l.x, sy + lh * 0.38 + sink * lh * 1.2, lh * 1.05 * l.s, { color: '#6A4BD6', alpha: 1 - sink * 0.6 });
            if (l.mama) G.art.draw(c, 'duck_mama', l.x + lw * 0.4, sy + 4, lw * 0.95, { anchor: 'b', flip: true });
          }));
          const dh = lw * 0.85;
          G.art.draw(c, 'duck', duck.x, duck.y - cam + 4, dh, { anchor: 'b', flip: !duck.right, sx: 1 / duck.sq, sy: duck.sq });
          if (tgtX != null && !duck.save && Math.abs(tgtX - duck.x) > 8) { c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(tgtX, duck.y - cam - dh * 0.5, 8, 0, 7); c.fill(); }
        },
        down(p) {
          const wy = p.y + cam;
          const l = rows.flatMap(r => r.leaves).find(l => Math.abs(l.x - p.x) < lw * 0.6 && Math.abs(l.y - wy) < lh * 1.6);
          tgtX = l ? l.x : p.x;
        },
        move(p) { tgtX = p.x; },
        hint() { const l = nextGood(); if (l) { api.finger(l.x, l.y - cam + lh * 0.4); api.say('c_hint'); } },
        auto() { const l = nextGood(); if (l) tgtX = l.x; }
      };
    }
  });

  // =====================================================================
  // 15. Босс: Где больше? — две корзинки: больше, меньше, поровну; считаем до семи; мышка решает спор.
  // =====================================================================
  G.level({
    id: 'w3l5', world: 'w3', n: 5, title: 'Где больше?', icon: 'babka', music: 'garden',
    sprites: [...FOREST, 'carrot', 'basket_back', 'basket_front', 'ded', 'babka', 'mouse'],
    create(api) {
      const bg = garden(api, 0.62);
      const bk = [{ n: 0, x: 0, glow: 0, wob: 0, j: 0 }, { n: 0, x: 0, glow: 0, wob: 0, j: 0 }];
      let bh = 80, rim = 0, cw = 50, ask = null, eq = null, hl = null, flyer = null;
      const mouse = { j: 0 };
      function layout() {
        bg.resize();
        const W = api.W, H = api.H;
        bh = Math.min(W * 0.36, H * 0.24); rim = bg.gy + (H - bg.gy) * 0.3; cw = bh * 0.5;
        bk[0].x = W * 0.27; bk[1].x = W * 0.72;
      }
      layout();
      const hitB = p => bk.findIndex(b => Math.abs(p.x - b.x) < bh * 0.75 && p.y > rim - cw - 50 && p.y < rim + bh * 0.7);
      function askB(correct, line) {
        return new Promise(res => { ask = { correct, res }; api.expect(true); api.say(line); });
      }
      async function count(i) {
        await api.say('c_count');
        for (let k = 0; k < bk[i].n; k++) { hl = { i, k }; api.sfx('tick'); await api.say('n' + (k + 1)); }
        hl = null;
      }
      function hop(o) { api.tween(o, { j: 1 }, 0.18).then(() => api.tween(o, { j: 0 }, 0.4, 'bounce')); }
      function moveOne() {
        const from = eq.big, to = 1 - from; bk[from].n--;
        flyer = { k: 0, from, to }; api.sfx('jump'); api.good();
        api.tween(flyer, { k: 1 }, 0.6, 'inOut').then(() => {
          flyer = null; bk[to].n++; api.sfx('coin'); api.burst(bk[to].x, rim, { n: 12 });
          if (bk[0].n === bk[1].n) { const f = eq.res; eq = null; api.expect(false); f(); }
        });
      }
      return {
        resize: layout,
        async run() {
          api.rounds(4); api.round(0);
          await api.say('w3_l15_intro');
          let big = Math.random() < 0.5 ? 0 : 1;
          bk[big].n = 6; bk[1 - big].n = 3;
          await askB(big, 'w3_l15_more');
          await count(big);
          api.card(6, { caption: 'шесть морковок' }); await api.wait(1.2);
          api.round(1);
          big = Math.random() < 0.5 ? 0 : 1;
          bk[big].n = 7; bk[1 - big].n = 4;
          await askB(1 - big, 'w3_l15_less');
          await count(big);
          api.card(7, { caption: 'семь морковок' }); await api.wait(1.2);
          api.round(2);
          big = Math.random() < 0.5 ? 0 : 1;
          bk[big].n = 7; bk[1 - big].n = 5;
          hop(mouse);
          await new Promise(res => { eq = { big, res }; api.expect(true); api.say('w3_l15_equal'); });
          hop(mouse); hop(bk[0]); hop(bk[1]); api.sfx('cheer');
          await api.say('w3_l15_eqdone');
          api.round(3); bk[0].n = bk[1].n = 0;
          await api.choose({ items: [{ label: 6 }, { label: 7 }, { label: 4 }], correct: 1, say: 'w3_l15_q1' });
          await api.choose({ items: [{ label: 'О' }, { label: 'У' }, { label: 'А' }], correct: 1, say: 'w3_l15_q2' });
          await api.choose({ items: [{ art: 'koshka' }, { art: 'zhuchka' }, { art: 'mouse' }], correct: 2, say: 'w3_l15_q3' });
          hop(mouse); api.burst(api.W / 2, rim - bh * 0.3, { n: 24, colors: ['#FF6B8B', '#FF9AB0', '#FFD23F'] });
          await api.say('w3_l15_end');
          api.round(4); await api.wait(0.3);
        },
        update(dt) { bk.forEach(b => { b.glow = Math.max(0, b.glow - dt * 0.8); b.wob = Math.max(0, b.wob - dt * 2); }); },
        draw(c, W, H) {
          bg.draw(c, 0);
          const gy = bg.gy, hh = Math.min(H * 0.26, W * 0.36);
          hero(c, 'ded', bk[0].x - bh * 0.15, gy, hh * HT.ded, { rot: Math.sin(api.t * 1.6) * 0.03 });
          hero(c, 'babka', bk[1].x + bh * 0.15, gy, hh * HT.babka, { rot: -Math.sin(api.t * 1.6) * 0.03 });
          bk.forEach((b, i) => {
            const x = b.x + Math.sin(b.wob * 25) * 8 * b.wob, r = rim - b.j * bh * 0.15;
            if (b.glow > 0.02) { c.fillStyle = `rgba(255,220,80,${b.glow * 0.6})`; c.beginPath(); c.ellipse(x, r, bh * 0.85, bh * 0.75, 0, 0, 7); c.fill(); }
            shadow(c, x, r + bh * 0.5, bh * 1.1);
            basket(api, c, x, r, bh, b.n, cw, { hl: hl && hl.i === i ? hl.k : null });
          });
          const mh = bh * 0.55;
          hero(c, 'mouse', W / 2, rim + bh * 0.85 - mouse.j * mh * 0.4, mh);
          if (flyer) {
            const a = bk[flyer.from], b = bk[flyer.to], k = flyer.k;
            G.art.draw(c, 'carrot', a.x + (b.x - a.x) * k, rim - cw * 0.3 - Math.sin(Math.PI * k) * H * 0.18, cw, { rot: k * Math.PI * 2 });
          }
        },
        down(p) {
          const i = hitB(p); if (i < 0) return;
          if (ask) {
            if (i === ask.correct) { const a = ask; ask = null; api.expect(false); bk[i].glow = 1; hop(bk[i]); api.praise(); api.burst(bk[i].x, rim - bh * 0.2, { n: 16 }); a.res(); }
            else { bk[i].wob = 1; api.tryAgain(); api.miss(); }
          } else if (eq && !flyer) {
            if (i === eq.big) moveOne();
            else { bk[i].wob = 1; api.sfx('wrong'); api.miss(); api.say('w3_l15_fromBig'); }
          }
        },
        hint() {
          const i = ask ? ask.correct : eq ? eq.big : -1; if (i < 0) return;
          api.finger(bk[i].x, rim); api.say('c_hint');
        },
        auto() {
          if (ask) { const b = bk[ask.correct]; this.down({ x: b.x, y: rim }); }
          else if (eq && !flyer) moveOne();
        }
      };
    }
  });
})();
