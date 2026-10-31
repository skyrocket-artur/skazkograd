'use strict';
// Мир 2 «Теремок»: Тетрис из брёвен, мемори «кто в теремочке живёт», окошки-фигуры,
// Змейка «лягушка и буква О», босс — теремок на пять этажей.
(function () {
  const { FOREST, forest, shadow, roundRect, U, underHint } = G.lv;
  const meadow = (api, ground) => forest(api, { ground, trees: 0.45, flowers: true, sky1: '#86CFF7', sky2: '#D6F0FF', ground1: '#8ED46A', ground2: '#5AAE4C' });
  const SAYA = { mouse: 'w2_a_mouse', frog: 'w2_a_frog', hare: 'w2_a_hare', fox: 'w2_a_fox', wolf_plain: 'w2_a_wolf', bear: 'w2_a_bear' };

  // ---------- брёвна, стены, окошко, крыша ----------
  function log(c, x, y, w, h) {
    const g = c.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#E2A566'); g.addColorStop(0.5, '#C07A3E'); g.addColorStop(1, '#8E5426');
    c.fillStyle = g; roundRect(c, x, y, w, h, h / 2); c.fill();
    c.strokeStyle = 'rgba(110,60,20,.3)'; c.lineWidth = Math.max(1.5, h * 0.06);
    c.beginPath(); c.moveTo(x + h * 0.6, y + h * 0.36); c.lineTo(x + w - h * 1.1, y + h * 0.36);
    c.moveTo(x + h * 0.9, y + h * 0.66); c.lineTo(x + w - h * 0.9, y + h * 0.66); c.stroke();
    c.fillStyle = '#F2CF96'; c.beginPath(); c.ellipse(x + w - h * 0.42, y + h / 2, h * 0.32, h * 0.4, 0, 0, 7); c.fill();
    c.strokeStyle = '#C99A62'; c.lineWidth = Math.max(1, h * 0.05);
    c.beginPath(); c.ellipse(x + w - h * 0.42, y + h / 2, h * 0.16, h * 0.22, 0, 0, 7); c.stroke();
  }
  function wall(c, x, y, w, h) { const lh = h / 3; for (let i = 0; i < 3; i++) log(c, x - lh * 0.2, y + i * lh, w + lh * 0.4, lh); }
  function archPath(c, cx, cy, ww, wh) {
    c.beginPath(); c.moveTo(cx - ww / 2, cy + wh / 2); c.lineTo(cx - ww / 2, cy - wh / 2 + ww / 2);
    c.arc(cx, cy - wh / 2 + ww / 2, ww / 2, Math.PI, 0); c.lineTo(cx + ww / 2, cy + wh / 2); c.closePath();
  }
  function windowArch(c, cx, cy, ww, wh, animal, k) {
    c.save(); archPath(c, cx, cy, ww, wh); c.fillStyle = '#BFE6FF'; c.fill();
    if (animal && k > 0.01) { c.save(); c.clip(); G.art.draw(c, animal, cx, cy + wh / 2 + (1 - k) * wh, wh * 1.05, { anchor: 'b' }); c.restore(); }
    archPath(c, cx, cy, ww, wh); c.lineWidth = Math.max(3, ww * 0.12); c.strokeStyle = '#FFF3D6'; c.stroke();
    c.restore();
  }
  function roof(c, x, y, w, h) {
    c.fillStyle = '#D94A3A'; c.beginPath(); c.moveTo(x - w * 0.1, y); c.lineTo(x + w / 2, y - h); c.lineTo(x + w * 1.1, y); c.closePath(); c.fill();
    c.strokeStyle = '#FFD26B'; c.lineWidth = Math.max(3, h * 0.07); c.lineJoin = 'round';
    c.beginPath(); c.moveTo(x + w * 0.02, y - h * 0.08); c.lineTo(x + w / 2, y - h * 0.84); c.lineTo(x + w * 0.98, y - h * 0.08); c.stroke();
    c.fillStyle = '#FFF0D0'; c.beginPath(); c.arc(x + w / 2, y - h * 0.4, h * 0.16, 0, 7); c.fill();
    c.fillStyle = '#9FD6F5'; c.beginPath(); c.arc(x + w / 2, y - h * 0.4, h * 0.09, 0, 7); c.fill();
  }

  // ---------- строительство теремка: брёвна падают, ведём пальцем, собранный ряд — этаж ----------
  function tower(api, bg, o) {
    const T = { floors: [], row: null, piece: null, roofK: 0, cols: o.cols };
    let cs = 60, fh = 48, x0 = 0, gy = 0, saidBusy = false, saidLong = false;
    T.layout = () => {
      gy = bg.gy - 2;
      fh = Math.min((gy - api.H * 0.26) / (o.floors + 1.6), api.W * 0.82 / o.cols * 0.95);
      cs = fh / 0.95; x0 = api.W / 2 - o.cols * cs / 2;
      if (T.piece) T.piece.top = pieceTop();
    };
    const rowBottom = () => gy - T.floors.length * fh;
    const pieceTop = () => Math.max(100 + fh, rowBottom() - api.H * 0.4);
    const fits = (col, len) => { for (let i = col; i < col + len; i++) if (i < 0 || i >= o.cols || T.row.cells[i]) return false; return true; };
    const firstFit = len => { for (let i = 0; i <= o.cols - len; i++) if (fits(i, len)) return i; return -1; };
    function maxGap() { let m = 0, run = 0; T.row.cells.forEach(v => { run = v ? 0 : run + 1; m = Math.max(m, run); }); return m; }
    function spawn() {
      if (!T.row) return;
      const len = Math.max(1, Math.min(T.row.plan[T.row.i] || 1, maxGap()));
      const col = Math.floor((o.cols - len) / 2), top = pieceTop();
      T.piece = { len, tcol: col, x: x0 + col * cs, y: top, top, st: 'fall', speed: (rowBottom() - top) / T.row.fallT };
      if (len === 2 && !saidLong && o.longLine) { saidLong = true; api.say(o.longLine); }
    }
    T.floor = (plan, animal, line, fallT) => new Promise(res => {
      T.row = { cells: new Array(o.cols).fill(false), logs: [], plan, i: 0, animal, line, fallT, res, count: 0 };
      spawn(); api.expect(true);
    });
    function land(p) {
      for (let i = p.tcol; i < p.tcol + p.len; i++) T.row.cells[i] = true;
      T.row.logs.push({ col: p.tcol, len: p.len }); T.piece = null; T.row.i++; T.row.count++;
      api.sfx('land'); G.buzz(12); api.good();
      api.burst(x0 + (p.tcol + p.len / 2) * cs, rowBottom() - fh / 2, { n: 8, scale: 0.6, ring: false });
      if (o.countLogs) api.say('n' + T.row.count);
      if (T.row.cells.every(Boolean)) { api.expect(false); api.after(0.6, completeFloor); }
      else api.after(0.35, spawn);
    }
    function completeFloor() {
      const r = T.row; T.row = null;
      const f = { animal: r.animal, k: 0 }; T.floors.push(f);
      api.sfx('star'); api.burst(api.W / 2, rowBottom() + fh / 2, { n: 18 });
      api.tween(f, { k: 1 }, 0.6, 'back');
      (r.line ? api.say(r.line) : api.wait(0.5)).then(() => r.res());
    }
    T.update = dt => {
      const p = T.piece; if (!p) return;
      p.x += (x0 + p.tcol * cs - p.x) * Math.min(1, dt * 14);
      if (p.st === 'fall') {
        p.y += p.speed * dt;
        if (p.y >= rowBottom()) {
          p.y = rowBottom();
          if (fits(p.tcol, p.len)) land(p);
          else { p.st = 'up'; api.sfx('boing'); api.miss(); if (!saidBusy) { saidBusy = true; api.say('w2_l6_busy'); } }
        }
      } else if (p.st === 'up') { p.y -= p.speed * 7 * dt; if (p.y <= p.top) { p.y = p.top; p.st = 'fall'; } }
    };
    T.steer = pt => { const p = T.piece; if (p) p.tcol = G.clamp(Math.round((pt.x - x0) / cs - p.len / 2), 0, o.cols - p.len); };
    T.roofDrop = () => { T.roofK = 0.001; return api.tween(T, { roofK: 1 }, 0.7, 'bounce'); };
    T.hint = () => { const p = T.piece; if (!p) return; const col = firstFit(p.len); if (col >= 0) api.finger(x0 + (col + p.len / 2) * cs, rowBottom() - fh * 0.4); };
    T.auto = () => { const p = T.piece; if (p && p.st === 'fall') { const col = firstFit(p.len); if (col >= 0) p.tcol = col; } };
    T.top = () => gy - T.floors.length * fh - (T.roofK > 0 ? fh * 1.3 : 0);
    T.draw = c => {
      const w = o.cols * cs;
      shadow(c, api.W / 2, gy + 6, w * 1.3, 0.16);
      c.fillStyle = '#A3ABB6'; roundRect(c, x0 - cs * 0.15, gy - 3, w + cs * 0.3, Math.max(10, fh * 0.2), 6); c.fill();
      T.floors.forEach((f, i) => {
        const y = gy - (i + 1) * fh;
        wall(c, x0, y, w, fh);
        windowArch(c, x0 + w / 2, y + fh * 0.52, Math.min(cs * 0.9, fh * 0.62), fh * 0.74, f.animal, f.k);
      });
      if (T.row) {
        const yb = rowBottom();
        c.strokeStyle = 'rgba(255,255,255,.75)'; c.setLineDash([9, 8]); c.lineWidth = 3;
        roundRect(c, x0, yb - fh, w, fh, 12); c.stroke(); c.setLineDash([]);
        T.row.logs.forEach(l => log(c, x0 + l.col * cs + 3, yb - fh * 0.9, l.len * cs - 6, fh * 0.8));
        const p = T.piece;
        if (p) {
          c.fillStyle = fits(p.tcol, p.len) ? 'rgba(120,230,120,.4)' : 'rgba(255,120,120,.4)';
          roundRect(c, x0 + p.tcol * cs + 3, yb - fh * 0.9, p.len * cs - 6, fh * 0.8, fh * 0.4); c.fill();
          c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2;
          c.beginPath(); c.moveTo(p.x + p.len * cs / 2, p.y); c.lineTo(p.x + p.len * cs / 2, yb - fh); c.stroke();
          log(c, p.x + 3, p.y - fh * 0.9, p.len * cs - 6, fh * 0.8);
        }
      }
      if (T.roofK > 0) roof(c, x0, rowBottom() - (1 - T.roofK) * api.H * 0.4, w, fh * 1.3);
    };
    return T;
  }

  // =====================================================================
  // 6. Строим теремок — Тетрис: брёвна падают, собранный ряд становится этажом, заселяется зверь.
  // =====================================================================
  G.level({
    id: 'w2l1', world: 'w2', n: 1, title: 'Строим теремок', icon: 'teremok', music: 'meadow',
    sprites: [...FOREST, 'mouse', 'frog', 'hare'],
    create(api) {
      const bg = meadow(api, 0.86);
      const T = tower(api, bg, { cols: 4, floors: 3, countLogs: true, longLine: 'w2_l6_long' });
      const resize = () => { bg.resize(); T.layout(); };
      resize();
      return {
        resize,
        async run() {
          api.rounds(3); api.round(0);
          await api.say('w2_l6_intro');
          await T.floor([1, 1, 1, 1], 'mouse', 'w2_l6_floor1', 4.4);
          api.round(1);
          await T.floor([2, 1, 1], 'frog', 'w2_l6_floor2', 4.1);
          api.round(2);
          await T.floor([1, 2, 1], 'hare', 'w2_l6_floor3', 3.8);
          await T.roofDrop(); api.sfx('cheer');
          await api.say('w2_l6_roof');
          api.round(3);
        },
        update: dt => T.update(dt),
        draw(c) { bg.draw(c, 0); T.draw(c); },
        down: p => T.steer(p), move: p => T.steer(p),
        hint() { T.hint(); api.say('c_hint'); },
        auto: () => T.auto()
      };
    }
  });

  // =====================================================================
  // 7. Кто в теремочке живёт? — Мемори: пары зверей, потом «цифра ↔ столько же яблок».
  // =====================================================================
  G.level({
    id: 'w2l2', world: 'w2', n: 2, title: 'Кто в теремочке живёт?', icon: 'mouse', music: 'meadow',
    sprites: [...FOREST, 'mouse', 'frog', 'hare', 'apple'],
    create(api) {
      const bg = meadow(api, 0.92);
      let cards = [], open = [], busy = false, R = null, matched = 0, saidNo = false;
      function layout() {
        bg.resize();
        const n = cards.length || 4, W = api.W, H = api.H;
        const cols = n <= 4 ? 2 : (W > H ? 3 : 2), rows = Math.ceil(n / cols);
        const gap = Math.min(W, H) * 0.04, top = Math.max(100, H * 0.14), availH = H * 0.84 - top;
        const cw = Math.min(190, (W * 0.86 - gap * (cols - 1)) / cols, (availH - gap * (rows - 1)) / rows / 1.2), ch = cw * 1.2;
        const x0 = W / 2 - (cols * cw + (cols - 1) * gap) / 2, y0 = top + (availH - (rows * ch + (rows - 1) * gap)) / 2;
        cards.forEach((cd, i) => { cd.w = cw; cd.h = ch; cd.x = x0 + (i % cols) * (cw + gap) + cw / 2; cd.y = y0 + Math.floor(i / cols) * (ch + gap) + ch / 2; });
      }
      function round(faces, kind) {
        cards = G.shuffle(faces).map(f => Object.assign({ k: 0, st: 'down', pop: 0, glow: 0 }, f));
        open = []; busy = false; matched = 0; layout();
        cards.forEach((cd, i) => api.tween(cd, { pop: 1 }, 0.3 + i * 0.07, 'back'));
        R = { kind }; api.expect(true);
        return new Promise(r => { R.res = r; });
      }
      const flip = (cd, up) => { cd.st = up ? 'up' : 'down'; api.sfx('flip'); return api.tween(cd, { k: up ? 1 : 0 }, 0.26, 'inOut'); };
      function tap(cd) {
        if (busy || !R || cd.st !== 'down') return;
        flip(cd, true); open.push(cd);
        if (cd.kind === 'animal') api.say(SAYA[cd.v]); else if (cd.kind === 'num') api.say('n' + cd.v);
        if (open.length < 2) return;
        busy = true;
        const [a, b] = open;
        if (a.key === b.key) {
          api.after(0.45, () => {
            a.st = b.st = 'matched'; open = []; busy = false; matched += 2;
            api.burst(a.x, a.y, { n: 10 }); api.burst(b.x, b.y, { n: 10 }); api.sfx('good'); api.good(); G.buzz(15);
            if (R.kind === 'num') api.say('w2_l7_m' + a.key);
            if (matched >= cards.length) { api.expect(false); api.after(R.kind === 'num' ? 2.4 : 1.2, () => { const f = R.res; R.res = null; f && f(); }); }
          });
        } else {
          api.miss();
          api.after(1.1, () => { flip(a, false); flip(b, false); open = []; busy = false; });
          if (!saidNo) { saidNo = true; api.after(0.6, () => api.say('w2_l7_nomatch')); } else api.after(0.5, () => api.sfx('wrong'));
        }
      }
      function drawApples(c, n, w, h) {
        const pos = { 3: [[-0.2, -0.17], [0.2, -0.17], [0, 0.19]], 4: [[-0.2, -0.17], [0.2, -0.17], [-0.2, 0.19], [0.2, 0.19]],
          5: [[-0.22, -0.24], [0.22, -0.24], [0, 0], [-0.22, 0.24], [0.22, 0.24]] }[n] || [];
        const s = Math.min(w, h) * (n === 5 ? 0.3 : 0.34);
        pos.forEach(([px, py]) => G.art.draw(c, 'apple', px * w, py * h, s));
      }
      function drawCard(c, cd) {
        const sx = Math.max(0.03, Math.abs(Math.cos(cd.k * Math.PI))), front = cd.k > 0.5, w = cd.w, h = cd.h;
        c.save(); c.translate(cd.x, cd.y); c.scale(sx * cd.pop, cd.pop);
        c.fillStyle = 'rgba(40,60,20,.18)'; roundRect(c, -w / 2 + 3, -h / 2 + 7, w, h, w * 0.14); c.fill();
        if (!front) {
          const g = c.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, '#DDA05F'); g.addColorStop(1, '#A8662E');
          c.fillStyle = g; roundRect(c, -w / 2, -h / 2, w, h, w * 0.14); c.fill();
          c.strokeStyle = '#FFE2A8'; c.lineWidth = w * 0.05;
          roundRect(c, -w * 0.38, -h * 0.38, w * 0.76, h * 0.76, w * 0.08); c.stroke();
          c.beginPath(); c.moveTo(0, -h * 0.38); c.lineTo(0, h * 0.38); c.stroke();
          c.fillStyle = '#FFE2A8';
          c.beginPath(); c.arc(-w * 0.1, 0, w * 0.04, 0, 7); c.fill(); c.beginPath(); c.arc(w * 0.1, 0, w * 0.04, 0, 7); c.fill();
        } else {
          c.fillStyle = cd.st === 'matched' ? '#EAFBE0' : '#FFF8EA'; roundRect(c, -w / 2, -h / 2, w, h, w * 0.14); c.fill();
          c.strokeStyle = cd.st === 'matched' ? '#7CD06A' : '#E8D2A8'; c.lineWidth = w * 0.045; c.stroke();
          if (cd.kind === 'animal') G.art.draw(c, cd.v, 0, h * 0.03, h * 0.66);
          else if (cd.kind === 'num') api.glyph(c, String(cd.v), 0, 0, h * 0.58, { color: '#6A4BD6' });
          else drawApples(c, cd.v, w, h);
        }
        if (cd.glow > 0.02) { c.strokeStyle = `rgba(255,190,40,${cd.glow})`; c.lineWidth = w * 0.08; roundRect(c, -w / 2, -h / 2, w, h, w * 0.14); c.stroke(); }
        c.restore();
      }
      const hit = p => cards.find(cd => Math.abs(p.x - cd.x) < cd.w / 2 && Math.abs(p.y - cd.y) < cd.h / 2);
      const pairOf = cd => cards.find(x => x !== cd && x.key === cd.key && x.st !== 'matched');
      return {
        resize: layout,
        async run() {
          api.rounds(3); api.round(0);
          const pair = v => [{ key: v, kind: 'animal', v }, { key: v, kind: 'animal', v }];
          const r1 = round([...pair('mouse'), ...pair('frog')], 'animal');
          await api.say('w2_l7_intro');
          await r1;
          await api.praise(); api.round(1);
          await round([...pair('mouse'), ...pair('frog'), ...pair('hare')], 'animal');
          await api.praise(); api.round(2);
          const r3 = round([3, 4, 5].flatMap(n => [{ key: n, kind: 'num', v: n }, { key: n, kind: 'apples', v: n }]), 'num');
          await api.say('w2_l7_r3');
          await r3;
          api.round(3); await api.wait(0.3);
        },
        update(dt) { cards.forEach(cd => { cd.glow = Math.max(0, cd.glow - dt * 0.8); }); },
        draw(c) { bg.draw(c, 0); cards.forEach(cd => drawCard(c, cd)); },
        down(p) { const cd = hit(p); if (cd) tap(cd); },
        hint() {
          if (busy || !R) return;
          if (open.length === 1) { const pr = pairOf(open[0]); if (pr) { pr.glow = 1; api.finger(pr.x, pr.y); } return; }
          const a = cards.find(x => x.st === 'down'); if (!a) return;
          const b = pairOf(a); busy = true; api.say('c_hint');
          flip(a, true); flip(b, true);
          // показали пару — закрыли — и палец на одну из них: малышу трудно запомнить сразу обе
          api.after(1.1, () => { flip(a, false); flip(b, false); api.after(0.3, () => { busy = false; api.finger(a.x, a.y); }); });
        },
        auto() {
          if (busy || !R) return;
          if (open.length === 1) { const pr = pairOf(open[0]); if (pr) tap(pr); return; }
          const a = cards.find(x => x.st === 'down'); if (a) tap(a);
        }
      };
    }
  });

  // =====================================================================
  // 8. Окошки — сортер фигур: перетащить фигуру в окошко такой же формы (потом — и цвета).
  // =====================================================================
  const COL = { yellow: ['#FFE98A', '#F5B400', '#C98F00'], red: ['#FF9A9A', '#E53935', '#B71C1C'], blue: ['#9CCBFF', '#2F6FE0', '#1C4FA8'] };
  function shapePath(c, kind, x, y, s) {
    c.beginPath();
    if (kind === 'circle') c.arc(x, y, s * 0.5, 0, 7);
    else if (kind === 'square') { const a = s * 0.86; roundRect(c, x - a / 2, y - a / 2, a, a, s * 0.08); }
    else if (kind === 'triangle') { const r = s * 0.6; c.moveTo(x, y - r); c.lineTo(x + r * 0.96, y + r * 0.6); c.lineTo(x - r * 0.96, y + r * 0.6); c.closePath(); }
    else { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? s * 0.25 : s * 0.56; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); }
  }
  G.level({
    id: 'w2l3', world: 'w2', n: 3, title: 'Окошки', icon: 'hare', music: 'meadow',
    sprites: [...FOREST, 'mouse', 'frog', 'hare', 'fox'],
    create(api) {
      const bg = meadow(api, 0.66);
      let holes = [], pieces = [], R = null, drag = null, sel = null, S = 60, F = { x: 0, y: 0, w: 0, h: 0 }, saidWrong = false;
      function layout() {
        bg.resize();
        const W = api.W, H = api.H, n = holes.length || 3, cols = n <= 3 ? n : 2, rows = Math.ceil(n / cols);
        S = Math.min(W * 0.2, H * 0.105);
        F.w = Math.min(W * 0.86, cols * S * 1.85 + S * 0.5); F.h = rows * S * 1.5 + S * 0.55;
        F.x = W / 2 - F.w / 2; F.y = bg.gy - F.h;
        holes.forEach((hl, i) => { hl.x = F.x + F.w * ((i % cols) + 0.5) / cols; hl.y = F.y + S * 0.3 + (Math.floor(i / cols) + 0.5) * S * 1.5; });
        // фигуры лежат на траве; если крайняя правая задевает кнопку подсказки — ряд выше
        let ty = bg.gy + (H - bg.gy) * 0.48;
        const n2 = pieces.length || 3;
        if (underHint(api, W * n2 / (n2 + 1), ty, S * 0.65)) ty = Math.max(bg.gy + S * 0.7, api.hintBox().y - S * 0.65);
        pieces.forEach((p, i) => { p.hx = W * (i + 1) / (pieces.length + 1); p.hy = ty; if (!p.hole && p !== drag) { p.x = p.hx; p.y = p.hy; } });
      }
      const sayOf = (kind, color) => R && R.color ? `w2_s_${color}_${kind}` : 'w2_s_' + kind;
      function round(defs, color) {
        const peek = ['mouse', 'frog', 'hare', 'fox'];
        holes = defs.map((d, i) => ({ kind: d[0], color: d[1], filled: null, k: 0, animal: peek[i % 4] }));
        pieces = G.shuffle(defs).map(d => ({ kind: d[0], color: d[1], x: 0, y: 0, hx: 0, hy: 0, hole: null, s: 0, wob: 0 }));
        drag = sel = null; layout();
        pieces.forEach((p, i) => api.tween(p, { s: 1 }, 0.3 + i * 0.08, 'back'));
        R = { color }; api.expect(true);
        return new Promise(r => { R.res = r; });
      }
      function place(p, hl) {
        p.hole = hl; hl.filled = p; drag = sel = null;
        api.tween(p, { x: hl.x, y: hl.y }, 0.15, 'out');
        api.sfx('good'); G.buzz(15); api.good(); api.burst(hl.x, hl.y, { n: 12 });
        api.say(sayOf(p.kind, p.color));
        if (holes.every(h => h.filled)) {
          api.expect(false);
          holes.forEach((h, i) => api.after(0.4 + i * 0.15, () => { api.tween(h, { k: 1 }, 0.4, 'back'); api.sfx('peek'); }));
          api.after(2.2, () => { const f = R.res; R.res = null; f && f(); });
        }
      }
      function sendBack(p) { api.tween(p, { x: p.hx, y: p.hy }, 0.35, 'back'); p.wob = 1; }
      function tryDrop(p, hl) {
        if (hl.kind === p.kind && (!R.color || hl.color === p.color)) { place(p, hl); return; }
        api.sfx('wrong'); api.miss(); sendBack(p);
        if (R.color && hl.kind === p.kind) api.say('w2_l8_color');
        else if (!saidWrong) { saidWrong = true; api.say('w2_l8_wrong'); }
      }
      const holeAt = (x, y, r) => holes.filter(h => !h.filled).map(h => [h, Math.hypot(h.x - x, h.y - y)]).filter(a => a[1] < r).sort((a, b) => a[1] - b[1]).map(a => a[0])[0];
      function drawShape(c, kind, color, x, y, s, alpha = 1) {
        const [l, m, d] = COL[color || 'yellow'];
        const g = c.createLinearGradient(x, y - s / 2, x, y + s / 2); g.addColorStop(0, l); g.addColorStop(1, m);
        c.save(); c.globalAlpha *= alpha;
        shapePath(c, kind, x, y + s * 0.05, s); c.fillStyle = 'rgba(0,0,0,.15)'; c.fill();
        shapePath(c, kind, x, y, s); c.fillStyle = g; c.fill(); c.lineWidth = s * 0.06; c.strokeStyle = d; c.stroke();
        c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(x - s * 0.14, y - s * 0.16, s * 0.1, s * 0.06, -0.6, 0, 7); c.fill();
        c.restore();
      }
      return {
        resize: layout,
        async run() {
          api.rounds(3); api.round(0);
          const r1 = round([['circle'], ['square'], ['triangle']], false);
          await api.say('w2_l8_intro');
          await r1;
          await api.praise(); api.round(1);
          const r2 = round([['circle'], ['square'], ['triangle'], ['star']], false);
          await api.say('w2_l8_r2'); await r2;
          await api.praise(); api.round(2);
          const r3 = round([['circle', 'red'], ['circle', 'blue'], ['triangle', 'red'], ['triangle', 'blue']], true);
          await api.say('w2_l8_r3'); await r3;
          await api.say('w2_l8_done');
          api.round(3);
        },
        update(dt) { pieces.forEach(p => { p.wob = Math.max(0, p.wob - dt * 2); }); },
        draw(c, W, H) {
          bg.draw(c, 0);
          // фасад теремка
          shadow(c, W / 2, F.y + F.h + 4, F.w * 1.2, 0.16);
          const lh = Math.max(14, S * 0.34);
          for (let y = F.y; y < F.y + F.h - 1; y += lh) log(c, F.x - lh * 0.2, y, F.w + lh * 0.4, Math.min(lh, F.y + F.h - y));
          const rh = Math.min(S * 1.2, F.y - 84); if (rh > 10) roof(c, F.x, F.y + 2, F.w, rh);
          holes.forEach(h => {
            shapePath(c, h.kind, h.x, h.y, S * 1.12); c.fillStyle = '#2E3D5C'; c.fill();
            c.lineWidth = S * 0.12; c.strokeStyle = h.color ? COL[h.color][1] : '#FFF3D6'; c.stroke();
            if (h.filled) {
              drawShape(c, h.kind, h.color, h.filled.x, h.filled.y, S);
              if (h.k > 0.01) { c.save(); shapePath(c, h.kind, h.x, h.y, S); c.clip(); G.art.draw(c, h.animal, h.x, h.y + S * 0.5 + (1 - h.k) * S, S * 0.95, { anchor: 'b', alpha: 0.95 }); c.restore(); }
            }
          });
          // лоток с фигурами
          pieces.forEach(p => {
            if (p.hole) return;
            const s = S * p.s * (p === drag ? 1.12 : 1) * (p === sel ? 1.12 + Math.sin(api.t * 8) * 0.04 : 1);
            drawShape(c, p.kind, p.color, p.x + Math.sin(p.wob * 25) * 8 * p.wob, p.y, s);
          });
          if (drag) drawShape(c, drag.kind, drag.color, drag.x, drag.y, S * 1.12);
        },
        down(pt) {
          if (!R) return;
          const p = pieces.filter(x => !x.hole).find(x => Math.hypot(x.x - pt.x, x.y - pt.y) < S * 0.75);
          if (p) { drag = p; p.ox = pt.x - p.x; p.oy = pt.y - p.y; p.sx = pt.x; p.sy = pt.y; api.sfx('tap'); return; }
          if (sel) { const hl = holeAt(pt.x, pt.y, S * 0.9); if (hl) tryDrop(sel, hl); }
        },
        move(pt) { if (drag) { drag.x = pt.x - drag.ox; drag.y = pt.y - drag.oy; } },
        up(pt) {
          const p = drag; if (!p) return; drag = null;
          if (Math.hypot(pt.x - p.sx, pt.y - p.sy) < 10) { sel = p; p.x = p.hx; p.y = p.hy; return; } // нажал без перетаскивания — выбрал
          const hl = holeAt(p.x, p.y, S * 0.95);
          if (hl) tryDrop(p, hl); else sendBack(p);
        },
        hint() {
          const hl = holes.find(h => !h.filled); if (!hl) return;
          const p = pieces.find(x => !x.hole && x.kind === hl.kind && (!R.color || x.color === hl.color)); if (!p) return;
          api.finger(p.x, p.y); api.say('c_hint'); api.after(1, () => api.finger(hl.x, hl.y));
        },
        auto() {
          if (drag) return;
          const hl = holes.find(h => !h.filled); if (!hl || !R) return;
          const p = pieces.find(x => !x.hole && x.kind === hl.kind && (!R.color || x.color === hl.color)); if (p) place(p, hl);
        }
      };
    }
  });

  // =====================================================================
  // 9. Лягушка и буква «О» — Змейка: ведём лягушку пальцем, она ест только «О», хвостик из кувшинок растёт.
  // =====================================================================
  G.level({
    id: 'w2l4', world: 'w2', n: 4, title: 'Лягушка и буква «О»', icon: 'frog', music: 'meadow',
    sprites: [...FOREST, 'frog'],
    create(api) {
      const bg = meadow(api, 0.28);
      const P = { x: 0, y: 0, w: 1, h: 1 }, frog = { x: 0, y: 0, a: -Math.PI / 2, r: 30, flip: false };
      let trail = [], items = [], tgt = null, R = null, eaten = 0, saidBad = false, active = false, tail = 0;
      function layout() {
        bg.resize();
        const W = api.W, H = api.H, top = Math.max(bg.gy + 6, 104);
        P.x = W * 0.04; P.y = top; P.w = W * 0.92; P.h = H * 0.95 - top;
        frog.r = Math.min(W, H) * 0.075;
        if (!frog.x) { frog.x = W / 2; frog.y = P.y + P.h * 0.62; }
      }
      layout();
      function freeSpot() {
        const m = frog.r * 1.4;
        for (let k = 0; k < 40; k++) {
          const x = G.rand(P.x + m, P.x + P.w - m), y = G.rand(P.y + m, P.y + P.h - m);
          if (Math.hypot(x - frog.x, y - frog.y) < frog.r * 3.5) continue;
          if (underHint(api, x, y, frog.r)) continue;
          if (items.some(it => !it.gone && Math.hypot(it.x - x, it.y - y) < frog.r * 2.2)) continue;
          return { x, y };
        }
        return { x: P.x + P.w / 2, y: P.y + P.h * 0.3 };
      }
      function add(ch) { const s = freeSpot(); const it = { ch, x: s.x, y: s.y, t: Math.random() * 6, cool: 0, s: 0, gone: false }; items.push(it); api.tween(it, { s: 1 }, 0.35, 'back'); }
      function round(o) {
        R = o; eaten = 0; items = []; active = true;
        for (let i = 0; i < o.os; i++) add('О');
        o.others.forEach(add);
        api.expect(true);
        return new Promise(r => { R.res = r; });
      }
      function eat(it) {
        if (it.ch === 'О') {
          it.gone = true; eaten++; tail = Math.min(eaten, 10);
          api.sfx('coin'); G.buzz(12); api.good(); api.burst(it.x, it.y, { n: 10, scale: 0.7 });
          api.say('n' + Math.min(eaten, 10));
          if (eaten >= R.need) { active = false; api.expect(false); api.after(0.9, () => { const f = R.res; R.res = null; f && f(); }); }
          else api.after(0.7, () => { if (active) add('О'); });
          items = items.filter(x => !x.gone);
        } else {
          it.cool = 1.6; api.sfx('wrong'); api.miss();
          const s = freeSpot(); api.tween(it, { x: s.x, y: s.y }, 0.5, 'out');
          if (!saidBad) { saidBad = true; api.say('w2_l9_bad'); }
        }
      }
      const nearestO = () => items.filter(it => it.ch === 'О' && !it.gone).sort((a, b) => Math.hypot(a.x - frog.x, a.y - frog.y) - Math.hypot(b.x - frog.x, b.y - frog.y))[0];
      function tailPoints() {
        const pts = [], gap = frog.r * 1.15; let need = gap, acc = 0;
        for (let i = 1; i < trail.length && pts.length < tail; i++) {
          acc += Math.hypot(trail[i].x - trail[i - 1].x, trail[i].y - trail[i - 1].y);
          if (acc >= need) { pts.push(trail[i]); need += gap; }
        }
        return pts;
      }
      return {
        resize: layout,
        async run() {
          api.rounds(3); api.round(0);
          api.card('О', { caption: 'буква О', dur: 3.2 });
          await api.say('w2_l9_intro');
          const r1 = round({ need: 3, os: 3, others: ['А', 'У'], speed: 0.2 });
          await api.say('w2_l9_r1'); await r1;
          await api.praise(); api.round(1); tail = 0;
          const r2 = round({ need: 5, os: 3, others: ['А', 'У', 'М'], speed: 0.23 });
          await api.say('w2_l9_r2'); await r2;
          api.card(5, { caption: 'пять букв О' }); await api.say('w2_l9_five');
          api.round(2); tail = 0;
          const r3 = round({ need: 5, os: 2, others: ['А', 'У', 'М', 'И'], speed: 0.25 });
          await api.say('w2_l9_r3'); await r3;
          await api.praise(); api.round(3);
        },
        update(dt) {
          items.forEach(it => { it.t += dt; it.cool = Math.max(0, it.cool - dt); });
          if (!active || !R) return;
          const sp = R.speed * Math.min(api.W, api.H);
          if (tgt) {
            const d = Math.hypot(tgt.x - frog.x, tgt.y - frog.y);
            if (!tgt.hold && d < frog.r * 0.6) tgt = null;
            else if (d > frog.r * 0.5) {
              const want = Math.atan2(tgt.y - frog.y, tgt.x - frog.x);
              const da = ((want - frog.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
              frog.a += G.clamp(da, -6 * dt, 6 * dt);
            }
          }
          frog.x += Math.cos(frog.a) * sp * dt; frog.y += Math.sin(frog.a) * sp * dt;
          const m = frog.r * 0.9;
          if (frog.x < P.x + m) { frog.x = P.x + m; frog.a = Math.PI - frog.a; }
          if (frog.x > P.x + P.w - m) { frog.x = P.x + P.w - m; frog.a = Math.PI - frog.a; }
          if (frog.y < P.y + m) { frog.y = P.y + m; frog.a = -frog.a; }
          if (frog.y > P.y + P.h - m) { frog.y = P.y + P.h - m; frog.a = -frog.a; }
          if (Math.abs(Math.cos(frog.a)) > 0.2) frog.flip = Math.cos(frog.a) > 0;
          trail.unshift({ x: frog.x, y: frog.y }); if (trail.length > 500) trail.pop();
          for (const it of items) if (!it.gone && it.cool <= 0 && Math.hypot(it.x - frog.x, it.y - frog.y) < frog.r * 1.2) { eat(it); break; }
        },
        draw(c, W, H) {
          bg.draw(c, 0);
          // пруд
          const g = c.createLinearGradient(0, P.y, 0, P.y + P.h); g.addColorStop(0, '#7FD3F5'); g.addColorStop(1, '#3E9BD6');
          c.fillStyle = '#6FBF5A'; roundRect(c, P.x - 8, P.y - 8, P.w + 16, P.h + 16, 46); c.fill();
          c.fillStyle = g; roundRect(c, P.x, P.y, P.w, P.h, 40); c.fill();
          c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 3;
          for (let i = 0; i < 6; i++) { const rx = P.x + P.w * ((i * 0.37 + 0.1) % 1), ry = P.y + P.h * ((i * 0.53 + 0.2) % 1), rr = 14 + ((api.t * 12 + i * 9) % 30); c.globalAlpha = 1 - rr / 44; c.beginPath(); c.ellipse(rx, ry, rr, rr * 0.4, 0, 0, 7); c.stroke(); }
          c.globalAlpha = 1;
          // хвостик из кувшинок
          const pts = tailPoints();
          for (let i = pts.length - 1; i >= 0; i--) {
            const p = pts[i], r = frog.r * 0.62;
            c.fillStyle = '#3FA34D'; c.beginPath(); c.moveTo(p.x, p.y); c.arc(p.x, p.y, r, 0.35 + i, Math.PI * 2 - 0.35 + i); c.closePath(); c.fill();
            c.fillStyle = '#62C25E'; c.beginPath(); c.moveTo(p.x, p.y); c.arc(p.x, p.y, r * 0.8, 0.4 + i, Math.PI * 2 - 0.4 + i); c.closePath(); c.fill();
            if (i % 2 === 0) { c.fillStyle = '#FF9FC2'; c.beginPath(); c.arc(p.x, p.y, r * 0.22, 0, 7); c.fill(); }
          }
          // буквы-пузыри
          items.forEach(it => {
            if (it.gone) return;
            const r = frog.r * 0.85 * it.s, y = it.y + Math.sin(it.t * 2) * 4;
            c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(it.x, y, r, 0, 7); c.fill();
            c.strokeStyle = 'rgba(80,140,200,.4)'; c.lineWidth = 3; c.stroke();
            api.glyph(c, it.ch, it.x, y, r * 1.25, { color: '#6A4BD6', alpha: it.cool > 0 ? 0.5 : 1 });
          });
          // лягушка
          const fr = frog.r * 2.3;
          shadow(c, frog.x, frog.y + fr * 0.36, fr * 0.8, 0.2);
          G.art.draw(c, 'frog', frog.x, frog.y, fr, { flip: frog.flip, rot: Math.sin(api.t * 6) * 0.06 });
          if (tgt && active) { c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3; c.beginPath(); c.arc(tgt.x, tgt.y, 16 + Math.sin(api.t * 8) * 3, 0, 7); c.stroke(); }
        },
        // Можно вести пальцем, а можно просто нажать: лягушка доплывёт до места касания
        down(p) { tgt = { x: p.x, y: p.y, hold: true }; },
        move(p) { if (tgt && tgt.hold) { tgt.x = p.x; tgt.y = p.y; } },
        up() { if (tgt) tgt.hold = false; },
        hint() { const o = nearestO(); if (o) { api.finger(o.x, o.y); api.say('c_hint'); } },
        auto() { const o = nearestO(); tgt = o ? { x: o.x, y: o.y } : null; }
      };
    }
  });

  // =====================================================================
  // 10. Босс: теремок на пять этажей — строим, звери заселяются, медведь ставит крышу, загадки.
  // =====================================================================
  G.level({
    id: 'w2l5', world: 'w2', n: 5, title: 'Теремок на 5 этажей', icon: 'bear', music: 'meadow',
    sprites: [...FOREST, 'mouse', 'frog', 'hare', 'fox', 'wolf_plain', 'bear'],
    create(api) {
      const bg = meadow(api, 0.88);
      const T = tower(api, bg, { cols: 3, floors: 5, countLogs: false });
      const bear = { x: -0.4, j: 0 }; // медведь приходит слева: справа внизу кнопка подсказки
      let waitBear = null;
      const resize = () => { bg.resize(); T.layout(); };
      resize();
      const bearPos = () => ({ x: api.W * bear.x, y: bg.gy + 4, h: Math.min(api.H * 0.2, api.W * 0.36) });
      return {
        resize,
        async run() {
          api.rounds(4); api.round(0);
          await api.say('w2_l10_intro');
          const A = ['mouse', 'frog', 'hare', 'fox', 'wolf_plain'], plans = [[1, 1, 1], [2, 1], [1, 2], [2, 1], [1, 1, 1]];
          for (let i = 0; i < 5; i++) {
            if (i === 0) api.say('w2_l10_knock');
            await T.floor(plans[i], A[i], null, 3.7 - i * 0.15);
            await api.say(SAYA[A[i]]);
            if (i < 3) await api.say('n' + (i + 1));
            else if (i === 3) { api.card(4, { caption: 'четыре этажа' }); await api.say('w2_l10_four'); }
            else { api.card(5, { caption: 'пять этажей' }); await api.say('w2_l10_five'); }
            if (i === 1) api.round(1);
            if (i === 3) api.round(2);
          }
          await api.tween(bear, { x: 0.18 }, 1.2, 'inOut');
          await api.say('w2_l10_bear');
          api.say('w2_l10_roof'); api.expect(true);
          await new Promise(r => { waitBear = r; });
          api.expect(false);
          api.tween(bear, { j: 1 }, 0.2).then(() => api.tween(bear, { j: 0 }, 0.4, 'bounce'));
          await T.roofDrop(); api.sfx('cheer'); api.burst(api.W / 2, T.top(), { n: 30, power: 1.3 });
          api.round(3); await api.wait(0.6);
          await api.choose({ items: [{ label: 4 }, { label: 5 }, { label: 6 }], correct: 1, say: 'w2_l10_q1' });
          await api.choose({ items: [{ label: 'А' }, { label: 'У' }, { label: 'О' }], correct: 2, say: 'w2_l10_q2' });
          await api.choose({ items: [{ label: '■' }, { label: '●' }, { label: '▲' }], correct: 1, say: 'w2_l10_q3' });
          await api.say('w2_l10_end');
          api.round(4); await api.wait(0.3);
        },
        update: dt => T.update(dt),
        draw(c) {
          bg.draw(c, 0); T.draw(c);
          if (bear.x > -0.3) { const b = bearPos(); shadow(c, b.x, b.y, b.h * 0.7); G.art.draw(c, 'bear', b.x, b.y - bear.j * b.h * 0.2, b.h, { anchor: 'b' }); }
        },
        down(p) {
          if (waitBear) { const f = waitBear; waitBear = null; f(); return; }
          T.steer(p);
        },
        move: p => T.steer(p),
        hint() {
          if (waitBear) { const b = bearPos(); api.finger(b.x, b.y - b.h * 0.5); api.say('w2_l10_roof'); return; }
          T.hint(); api.say('c_hint');
        },
        auto() { if (waitBear) { const f = waitBear; waitBear = null; f(); return; } T.auto(); }
      };
    }
  });
})();
