'use strict';
// Мир 4 «Три медведя»: раскладка по размеру, лабиринт с грибами 1→8 (Pac-Man), окошки с буквами И и Ы (тир),
// «Малина» — группы из трёх ягод, босс — чай для гостей: сколько гостей, столько чашек.
(function () {
  const { FOREST, forest, shadow, roundRect, underHint } = G.lv;
  const BEARS = ['bear', 'bear_mama', 'mishutka'], BK = [1, 0.82, 0.6], IK = [1, 0.7, 0.48], TO = ['w4_to_papa', 'w4_to_mama', 'w4_to_small'];

  // ---------- изба: стена из брёвен, окно с занавесками, пол с половиком (рисуется один раз) ----------
  function izba(api, floorK) {
    const st = { fy: 0 };
    let cv = null;
    st.resize = () => {
      const W = api.W, H = api.H, d = api.dpr;
      st.fy = Math.round(H * (typeof floorK === 'function' ? floorK() : floorK));
      cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(W * d)); cv.height = Math.max(1, Math.ceil(H * d));
      const c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0);
      const lh = Math.max(26, H * 0.055);
      for (let y = st.fy; y > -lh; y -= lh) {
        const g = c.createLinearGradient(0, y - lh, 0, y);
        g.addColorStop(0, '#E6B47A'); g.addColorStop(0.5, '#CB8C52'); g.addColorStop(1, '#9E6436');
        c.fillStyle = g; c.fillRect(0, y - lh, W, lh);
        c.fillStyle = 'rgba(90,50,20,.22)'; c.fillRect(0, y - 2, W, 2);
        c.fillStyle = 'rgba(255,230,190,.25)'; c.fillRect(0, y - lh + 3, W, 2);
      }
      // окно с занавесками
      const ww = Math.min(W * 0.3, H * 0.19), wh = ww * 0.95, wx = W * 0.74 - ww / 2, wy = Math.max(96, st.fy * 0.24);
      if (wy + wh < st.fy - 20) {
        c.fillStyle = '#FFF3D6'; roundRect(c, wx - 10, wy - 10, ww + 20, wh + 20, 10); c.fill();
        const sk = c.createLinearGradient(0, wy, 0, wy + wh); sk.addColorStop(0, '#8FD3FF'); sk.addColorStop(1, '#D8F2FF');
        c.fillStyle = sk; c.fillRect(wx, wy, ww, wh);
        c.fillStyle = '#5DAE4F'; c.beginPath(); c.ellipse(wx + ww * 0.3, wy + wh, ww * 0.4, wh * 0.25, 0, Math.PI, 0); c.fill();
        c.fillStyle = '#FFF3D6'; c.fillRect(wx + ww / 2 - 4, wy, 8, wh); c.fillRect(wx, wy + wh * 0.45 - 4, ww, 8);
        c.fillStyle = '#E8433A';
        [[wx - 14, 1], [wx + ww + 14, -1]].forEach(([x, s]) => { c.beginPath(); c.moveTo(x, wy - 12); c.lineTo(x + s * ww * 0.32, wy - 12); c.quadraticCurveTo(x + s * ww * 0.08, wy + wh * 0.5, x + s * ww * 0.18, wy + wh + 12); c.lineTo(x, wy + wh + 12); c.closePath(); c.fill(); });
        c.fillStyle = 'rgba(255,255,255,.75)';
        for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(wx - 6 + (i % 2) * 6, wy + i * wh / 5, 2.5, 0, 7); c.fill(); c.beginPath(); c.arc(wx + ww + 6 - (i % 2) * 6, wy + i * wh / 5, 2.5, 0, 7); c.fill(); }
      }
      // пол из досок
      const fg = c.createLinearGradient(0, st.fy, 0, H); fg.addColorStop(0, '#DDAE72'); fg.addColorStop(1, '#B47E46');
      c.fillStyle = fg; c.fillRect(0, st.fy, W, H - st.fy);
      c.strokeStyle = 'rgba(110,60,25,.25)'; c.lineWidth = 2;
      for (let k = 1, y = st.fy; y < H; k++) { y += 10 + k * 7; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
      c.fillStyle = '#7A4A22'; c.fillRect(0, st.fy - 4, W, 8);
      // половик
      const rw = W * 0.86, rh = (H - st.fy) * 0.3, ry = st.fy + (H - st.fy) * 0.3;
      c.globalAlpha = 0.8;
      ['#E8433A', '#FFD23F', '#4A78D0', '#FFF3D6', '#E8433A'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.ellipse(W / 2, ry, rw / 2 * (1 - i * 0.16), rh / 2 * (1 - i * 0.16), 0, 0, 7); c.fill(); });
      c.globalAlpha = 1;
    };
    st.draw = c => { if (cv) c.drawImage(cv, 0, 0, api.W, api.H); };
    return st;
  }

  // ---------- раскладка по размеру: три медведя и три предмета ----------
  function sizeSort(api, bg) {
    const S = { items: [], drag: null, sel: null, R: null, saidWrong: false, hopO: [{ j: 0 }, { j: 0 }, { j: 0 }] };
    const bx = i => api.W * [0.2, 0.5, 0.8][i];
    const by = () => bg.fy + (api.H - bg.fy) * 0.2;
    const bh = () => Math.min(api.H * 0.3, api.W * 0.38);
    const itemW = () => Math.min(api.W * 0.24, api.H * 0.16);
    const trayY = () => api.H * 0.88;
    const tx = k => api.W * [0.16, 0.38, 0.6][k]; // правее — кнопка подсказки
    const ih = it => itemW() * IK[it.size] / G.art.size(it.art)[0] * G.art.size(it.art)[1];
    const spotY = () => by() + api.H * 0.05;
    S.layout = () => S.items.forEach(it => {
      it.hx = tx(it.slot); it.hy = trayY();
      if (it.at != null) { it.x = bx(it.at); it.y = spotY(); } else if (it !== S.drag) { it.x = it.hx; it.y = it.hy; }
    });
    S.round = (art, line) => {
      S.items = G.shuffle([0, 1, 2]).map((size, k) => ({ art, size, slot: k, at: null, x: 0, y: 0, hx: 0, hy: 0, s: 0, wob: 0 }));
      S.drag = S.sel = null; S.saidWrong = false; S.layout();
      S.items.forEach((it, i) => api.tween(it, { s: 1 }, 0.3 + i * 0.08, 'back'));
      S.R = {}; api.expect(true); api.say(line);
      return new Promise(r => { S.R.res = r; });
    };
    S.hop = i => { const o = S.hopO[i]; api.tween(o, { j: 1 }, 0.16).then(() => api.tween(o, { j: 0 }, 0.4, 'bounce')); };
    function place(it, i) {
      it.at = i; S.drag = S.sel = null;
      api.tween(it, { x: bx(i), y: spotY() }, 0.2, 'out');
      api.sfx('good'); G.buzz(15); api.good(); api.burst(bx(i), by() - bh() * BK[i] * 0.5, { n: 12 });
      api.say(TO[i]); S.hop(i);
      if (S.items.every(x => x.at != null)) { api.expect(false); api.after(1.4, () => { const f = S.R && S.R.res; S.R = null; f && f(); }); }
    }
    const back = it => { api.tween(it, { x: it.hx, y: it.hy }, 0.35, 'back'); it.wob = 1; };
    function tryDrop(it, i) {
      if (S.items.some(x => x.at === i)) { back(it); return; }
      if (it.size === i) { place(it, i); return; }
      api.sfx('wrong'); api.miss(); back(it); S.sel = null;
      if (!S.saidWrong) { S.saidWrong = true; api.say('w4_l16_wrong'); }
    }
    const bearAt = p => {
      if (p.y > trayY() - itemW() * 0.4) return -1;
      let b = -1, bd = 1e9; [0, 1, 2].forEach(i => { const d = Math.abs(p.x - bx(i)); if (d < bd) { bd = d; b = i; } });
      return bd < api.W * 0.17 ? b : -1;
    };
    const itemAt = p => S.items.filter(x => x.at == null).find(x => Math.abs(p.x - x.x) < itemW() * 0.6 && p.y < x.y + 24 && p.y > x.y - ih(x) - 30);
    S.down = p => {
      if (!S.R) return;
      const it = itemAt(p);
      if (it) { S.drag = it; it.ox = p.x - it.x; it.oy = p.y - it.y; it.sx = p.x; it.sy = p.y; api.sfx('tap'); return; }
      if (S.sel) { const i = bearAt(p); if (i >= 0) tryDrop(S.sel, i); }
    };
    S.move = p => { if (S.drag) { S.drag.x = p.x - S.drag.ox; S.drag.y = p.y - S.drag.oy; } };
    S.up = p => {
      const it = S.drag; if (!it) return; S.drag = null;
      if (Math.hypot(p.x - it.sx, p.y - it.sy) < 10) { S.sel = it; it.x = it.hx; it.y = it.hy; return; } // нажал без перетаскивания — выбрал
      const i = bearAt({ x: it.x, y: it.y - ih(it) * 0.5 });
      if (i >= 0) tryDrop(it, i); else back(it);
    };
    S.update = dt => S.items.forEach(it => { it.wob = Math.max(0, it.wob - dt * 2); });
    S.draw = c => {
      for (let i = 0; i < 3; i++) {
        const h = bh() * BK[i]; shadow(c, bx(i), by() + 2, h * 0.75);
        G.art.draw(c, BEARS[i], bx(i), by() + 2 - S.hopO[i].j * h * 0.12, h, { anchor: 'b' });
      }
      S.items.filter(x => x.at != null).forEach(it => G.art.draw(c, it.art, it.x, it.y, ih(it), { anchor: 'b' }));
      S.items.filter(x => x.at == null).forEach(it => {
        const k = it.s * (it === S.drag ? 1.1 : 1) * (it === S.sel ? 1.1 + Math.sin(api.t * 8) * 0.04 : 1);
        if (it !== S.drag) shadow(c, it.x, it.y, itemW() * IK[it.size] * 0.9, 0.14);
        G.art.draw(c, it.art, it.x + Math.sin(it.wob * 25) * 8 * it.wob, it.y, ih(it) * k, { anchor: 'b' });
      });
    };
    S.hint = () => {
      const it = S.items.find(x => x.at == null); if (!it) return;
      api.finger(it.x, it.y - ih(it) * 0.5); api.say('c_hint');
      api.after(1, () => api.finger(bx(it.size), by() - bh() * BK[it.size] * 0.4));
    };
    S.auto = () => { if (S.drag || !S.R) return; const it = S.items.find(x => x.at == null); if (it) place(it, it.size); };
    return S;
  }

  // =====================================================================
  // 16. Большой, средний, маленький — миски, стулья и кроватки по размеру.
  // =====================================================================
  G.level({
    id: 'w4l1', world: 'w4', n: 1, title: 'Большой, средний, маленький', icon: 'bowl', music: 'bears',
    sprites: [...BEARS, 'bowl', 'chair', 'bed'],
    create(api) {
      const bg = izba(api, () => (api.W > api.H ? 0.52 : 0.46)), S = sizeSort(api, bg);
      const layout = () => { bg.resize(); S.layout(); };
      layout();
      return {
        resize: layout,
        async run() {
          api.rounds(3); api.round(0);
          await S.round('bowl', 'w4_l16_intro');
          await api.praise(); api.round(1);
          await S.round('chair', 'w4_l16_r2');
          await api.praise(); api.round(2);
          await S.round('bed', 'w4_l16_r3');
          await api.say('w4_l16_done');
          api.round(3); await api.wait(0.3);
        },
        update: dt => S.update(dt),
        draw(c) { bg.draw(c); S.draw(c); },
        down: p => S.down(p), move: p => S.move(p), up: p => S.up(p),
        hint: () => S.hint(), auto: () => S.auto()
      };
    }
  });

  // =====================================================================
  // 17. Тропинка к домику — лабиринт: Маша идёт туда, куда нажали, и собирает грибы по порядку.
  // =====================================================================
  G.level({
    id: 'w4l2', world: 'w4', n: 2, title: 'Тропинка к домику', icon: 'masha', music: 'bears',
    sprites: ['masha', 'mushroom', 'bush', 'tree_fir'],
    create(api) {
      let cols = 5, rows = 7, cs = 50, ox = 0, oy = 0, top = 150, wall = null, R = null, next = 1, path = [], mush = [], saidOrder = false, cache = null, hintPath = null;
      const ms = { c: 0, r: 0, x: 0, y: 0, walk: 0 };
      const id = (c, r) => r * cols + c;
      const cx = c => ox + (c + 0.5) * cs, cy = r => oy + (r + 0.5) * cs;
      function gen() {
        const e = new Array(cols * rows).fill(true), s = new Array(cols * rows).fill(true), seen = new Array(cols * rows).fill(false);
        const open = (c, r, x, y) => { if (x > c) e[id(c, r)] = false; else if (x < c) e[id(x, y)] = false; else if (y > r) s[id(c, r)] = false; else s[id(x, y)] = false; };
        const stack = [[0, rows - 1]]; seen[id(0, rows - 1)] = true;
        while (stack.length) {
          const [c, r] = stack[stack.length - 1];
          const nb = [[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]].filter(([x, y]) => x >= 0 && y >= 0 && x < cols && y < rows && !seen[id(x, y)]);
          if (!nb.length) { stack.pop(); continue; }
          const [x, y] = G.pick(nb); open(c, r, x, y); seen[id(x, y)] = true; stack.push([x, y]);
        }
        // лишние проходы: меньше тупиков, малышу проще
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          if (c < cols - 1 && e[id(c, r)] && Math.random() < 0.2) e[id(c, r)] = false;
          if (r < rows - 1 && s[id(c, r)] && Math.random() < 0.2) s[id(c, r)] = false;
        }
        return { e, s };
      }
      const nbrs = (c, r) => {
        const out = [];
        if (c < cols - 1 && !wall.e[id(c, r)]) out.push([c + 1, r]);
        if (c > 0 && !wall.e[id(c - 1, r)]) out.push([c - 1, r]);
        if (r < rows - 1 && !wall.s[id(c, r)]) out.push([c, r + 1]);
        if (r > 0 && !wall.s[id(c, r - 1)]) out.push([c, r - 1]);
        return out;
      };
      function bfs(a, b) {
        const prev = new Map([[id(a[0], a[1]), null]]), q = [a];
        while (q.length) {
          const [c, r] = q.shift();
          if (c === b[0] && r === b[1]) break;
          for (const n of nbrs(c, r)) { const k = id(n[0], n[1]); if (!prev.has(k)) { prev.set(k, [c, r]); q.push(n); } }
        }
        if (!prev.has(id(b[0], b[1]))) return [];
        const out = []; let cur = b;
        while (cur) { out.unshift(cur); cur = prev.get(id(cur[0], cur[1])); }
        return out;
      }
      function prerender() {
        const W = api.W, H = api.H, d = api.dpr;
        cache = document.createElement('canvas'); cache.width = Math.max(1, Math.ceil(W * d)); cache.height = Math.max(1, Math.ceil(H * d));
        const c = cache.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0);
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#8ED46A'); g.addColorStop(1, '#5AAE4C');
        c.fillStyle = g; c.fillRect(0, 0, W, H);
        const cols4 = ['#FFFFFF', '#FFD23F', '#FF8FB1'];
        for (let i = 0; i < 40; i++) { c.fillStyle = cols4[i % 3]; c.beginPath(); c.arc((i * 0.618 * W * 3.1) % W, (i * 0.41 * H * 2.3) % H, 3, 0, 7); c.fill(); }
        if (!wall) return;
        c.fillStyle = '#EBD3A0'; roundRect(c, ox - 4, oy - 4, cols * cs + 8, rows * cs + 8, cs * 0.3); c.fill();
        const seg = [];
        for (let r = 0; r < rows; r++) for (let cc = 0; cc < cols; cc++) {
          if (cc < cols - 1 && wall.e[id(cc, r)]) seg.push([ox + (cc + 1) * cs, oy + r * cs, ox + (cc + 1) * cs, oy + (r + 1) * cs]);
          if (r < rows - 1 && wall.s[id(cc, r)]) seg.push([ox + cc * cs, oy + (r + 1) * cs, ox + (cc + 1) * cs, oy + (r + 1) * cs]);
        }
        seg.push([ox, oy, ox + cols * cs, oy], [ox, oy + rows * cs, ox + cols * cs, oy + rows * cs], [ox, oy, ox, oy + rows * cs], [ox + cols * cs, oy, ox + cols * cs, oy + rows * cs]);
        c.lineCap = 'round';
        [[cs * 0.26, '#2F7A33'], [cs * 0.2, '#45A043'], [cs * 0.08, '#6CC35E']].forEach(([lw, col], k) => {
          c.strokeStyle = col; c.lineWidth = lw;
          c.beginPath(); seg.forEach(([a, b, x, y]) => { c.moveTo(a, b - k * 2); c.lineTo(x, y - k * 2); }); c.stroke();
        });
      }
      function layout() {
        const W = api.W, H = api.H;
        top = Math.max(150, H * 0.2);
        let bot = H * 0.96;
        cs = Math.min(W * 0.94 / cols, (bot - top) / rows);
        // правый нижний угол лабиринта не должен уходить под кнопку подсказки
        if (underHint(api, W / 2 + cols * cs / 2, bot)) { bot = Math.min(bot, api.hintBox().y); cs = Math.min(W * 0.94 / cols, (bot - top) / rows); }
        ox = W / 2 - cols * cs / 2; oy = top + ((bot - top) - rows * cs) / 2;
        prerender();
        ms.x = cx(ms.c); ms.y = cy(ms.r); path = [];
      }
      function round(n) {
        const land = api.W > api.H;
        cols = land ? 8 : 5; rows = land ? 4 : 7;
        wall = gen(); ms.c = 0; ms.r = rows - 1; next = 1; saidOrder = false; hintPath = null;
        const free = G.shuffle(Array.from({ length: cols * rows }, (_, k) => [k % cols, Math.floor(k / cols)]).filter(([c, r]) => !(c <= 1 && r >= rows - 2)));
        mush = free.slice(0, n).map(([c, r], k) => ({ c, r, n: k + 1, got: false, wob: 0, s: 0, fly: null }));
        mush.forEach((m, k) => api.tween(m, { s: 1 }, 0.3 + k * 0.06, 'back'));
        layout();
        R = { n }; api.expect(true);
        return new Promise(res => { R.res = res; });
      }
      function barPos(i) {
        const n = R ? R.n : 4, sz = Math.min(api.W * 0.1, 44), x0 = api.W / 2 - ((n - 1) * sz * 1.12) / 2;
        return { x: x0 + i * sz * 1.12, y: top - sz * 0.9, sz };
      }
      function enter(c, r) {
        const m = mush.find(x => !x.got && x.c === c && x.r === r); if (!m) return;
        if (m.n === next) {
          m.got = true; next++; api.good(); G.buzz(12); api.sfx('coin');
          api.burst(cx(c), cy(r), { n: 10, scale: 0.7 }); api.say('n' + m.n);
          const b = barPos(m.n - 1); m.fly = { x: cx(c), y: cy(r), k: 1 };
          api.tween(m.fly, { x: b.x, y: b.y }, 0.5, 'inOut').then(() => { m.fly = null; });
          if (next > R.n) { api.expect(false); path = []; api.after(1, () => { const f = R.res; R.res = null; f && f(); }); }
        } else {
          m.wob = 1; api.miss();
          if (!saidOrder) { saidOrder = true; api.say('w4_l17_order'); } else api.sfx('wrong');
        }
      }
      function goTo(cell) {
        if (!wall || !R || next > R.n) return;
        if (path.length) { const nx = path[0]; path = [nx, ...bfs(nx, cell).slice(1)]; }
        else path = bfs([ms.c, ms.r], cell).slice(1);
      }
      const cellAt = p => { const c = Math.floor((p.x - ox) / cs), r = Math.floor((p.y - oy) / cs); return c >= 0 && r >= 0 && c < cols && r < rows ? [c, r] : null; };
      const nextM = () => mush.find(m => !m.got && m.n === next);
      return {
        resize: layout,
        async run() {
          api.rounds(3); api.round(0);
          const r1 = round(4); await api.say('w4_l17_intro'); await r1;
          await api.praise(); api.round(1);
          const r2 = round(6); await api.say('w4_l17_r2'); await r2;
          await api.praise(); api.round(2);
          const r3 = round(8); await api.say('w4_l17_r3'); await r3;
          api.card(8, { caption: 'восемь грибов' }); await api.say('w4_l17_eight');
          api.round(3); await api.wait(0.3);
        },
        update(dt) {
          mush.forEach(m => { m.wob = Math.max(0, m.wob - dt * 2); });
          if (hintPath && api.t > hintPath.until) hintPath = null;
          if (!path.length) { ms.walk = Math.max(0, ms.walk - dt * 4); return; }
          const [c, r] = path[0], tx = cx(c), ty = cy(r), d = Math.hypot(tx - ms.x, ty - ms.y), sp = cs * 3.6 * dt;
          ms.walk = Math.min(1, ms.walk + dt * 6);
          if (d <= sp) { ms.x = tx; ms.y = ty; ms.c = c; ms.r = r; path.shift(); enter(c, r); }
          else { ms.x += (tx - ms.x) / d * sp; ms.y += (ty - ms.y) / d * sp; }
        },
        draw(c, W) {
          if (cache) c.drawImage(cache, 0, 0, api.W, api.H);
          if (hintPath) { c.fillStyle = 'rgba(255,255,255,.85)'; hintPath.cells.forEach(([x, y], k) => { if (k) { c.beginPath(); c.arc(cx(x), cy(y), cs * 0.07, 0, 7); c.fill(); } }); }
          // грибы
          mush.forEach(m => {
            if (m.got) return;
            const x = cx(m.c) + Math.sin(m.wob * 25) * 6 * m.wob, y = cy(m.r), pulse = m.n === next ? 1 + Math.sin(api.t * 5) * 0.06 : 1, h = cs * 0.62 * m.s * pulse;
            G.art.draw(c, 'mushroom', x, y + cs * 0.32, h, { anchor: 'b' });
            c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y - h * 0.38, h * 0.3, 0, 7); c.fill();
            api.glyph(c, String(m.n), x, y - h * 0.38, h * 0.42, { color: '#6A4BD6' });
          });
          // Маша
          const mh = cs * 0.95;
          shadow(c, ms.x, ms.y + mh * 0.42, mh * 0.6, 0.18);
          G.art.draw(c, 'masha', ms.x, ms.y + mh * 0.45 - Math.abs(Math.sin(api.t * 12)) * ms.walk * cs * 0.08, mh, { anchor: 'b', rot: Math.sin(api.t * 12) * ms.walk * 0.06 });
          // полоска собранных грибов
          if (R) for (let i = 0; i < R.n; i++) {
            const b = barPos(i);
            c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(b.x, b.y, b.sz * 0.5, 0, 7); c.fill();
            const m = mush[i];
            if (m && m.got && !m.fly) { G.art.draw(c, 'mushroom', b.x, b.y, b.sz * 0.8); api.glyph(c, String(m.n), b.x, b.y + b.sz * 0.12, b.sz * 0.34, { color: '#6A4BD6' }); }
          }
          mush.forEach(m => { if (m.fly) G.art.draw(c, 'mushroom', m.fly.x, m.fly.y, cs * 0.5); });
        },
        down(p) { const cell = cellAt(p); if (cell) goTo(cell); },
        move(p) { const cell = cellAt(p); if (cell) { const last = path[path.length - 1]; if (!last || last[0] !== cell[0] || last[1] !== cell[1]) goTo(cell); } },
        hint() {
          const m = nextM(); if (!m) return;
          hintPath = { cells: bfs([ms.c, ms.r], [m.c, m.r]), until: api.t + 3 };
          api.finger(cx(m.c), cy(m.r)); api.say('c_hint');
        },
        auto() { const m = nextM(); if (m && !path.length) goTo([m.c, m.r]); }
      };
    }
  });

  // =====================================================================
  // 18. Мишутка говорит «Ы» — тир: в окошках открываются ставни, нажимаем на нужную букву.
  // =====================================================================
  G.level({
    id: 'w4l3', world: 'w4', n: 3, title: 'Мишутка говорит «Ы»', icon: 'mishutka', music: 'bears',
    sprites: ['mishutka', 'grass'],
    create(api) {
      let wins = [], ww = 80, wh = 90, R = null, got = [], nextAt = 0, active = false, lastWin = -1, cache = null, gy = 0;
      const mish = { j: 0 };
      function layout() {
        const W = api.W, H = api.H, land = W > H, cols = land ? 4 : 3;
        ww = land ? Math.min(W * 0.1, H * 0.16) : Math.min(W * 0.2, H * 0.13); wh = ww * 1.15;
        gy = H * (land ? 0.94 : 0.88);
        if (wins.length !== cols * 2) wins = Array.from({ length: cols * 2 }, (_, i) => ({ i, st: 'idle', k: 0, item: null, shake: 0 }));
        wins.forEach((w, i) => {
          w.x = land ? W * (0.24 + (i % cols) * 0.17) : W * [0.2, 0.5, 0.8][i % cols];
          w.y = H * (land ? [0.5, 0.82] : [0.34, 0.58])[Math.floor(i / cols)];
        });
        const d = api.dpr; cache = document.createElement('canvas'); cache.width = Math.max(1, Math.ceil(W * d)); cache.height = Math.max(1, Math.ceil(H * d));
        const c = cache.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0);
        const lh = Math.max(24, H * 0.05);
        for (let y = gy; y > -lh; y -= lh) {
          const g = c.createLinearGradient(0, y - lh, 0, y); g.addColorStop(0, '#D9A066'); g.addColorStop(0.5, '#B9773F'); g.addColorStop(1, '#8A5226');
          c.fillStyle = g; c.fillRect(0, y - lh, W, lh); c.fillStyle = 'rgba(70,35,10,.25)'; c.fillRect(0, y - 2, W, 2);
        }
        const gg = c.createLinearGradient(0, gy, 0, H); gg.addColorStop(0, '#7DCB5F'); gg.addColorStop(1, '#4F9E46');
        c.fillStyle = gg; c.fillRect(0, gy, W, H - gy);
        // наличники
        wins.forEach(w => {
          const x = w.x - ww / 2, y = w.y - wh / 2;
          c.fillStyle = '#FFF3D6';
          roundRect(c, x - ww * 0.14, y - wh * 0.12, ww * 1.28, wh * 1.24, ww * 0.1); c.fill();
          c.beginPath(); c.moveTo(x - ww * 0.2, y - wh * 0.1); c.lineTo(w.x, y - wh * 0.36); c.lineTo(x + ww * 1.2, y - wh * 0.1); c.closePath(); c.fill();
          c.fillStyle = '#E8433A'; c.beginPath(); c.arc(w.x, y - wh * 0.18, ww * 0.07, 0, 7); c.fill();
          c.fillStyle = '#3B2A20'; roundRect(c, x, y, ww, wh, ww * 0.06); c.fill();
        });
      }
      function pickItem() {
        const goodUp = wins.some(w => w.st === 'up' && w.item && w.item.good);
        const good = !goodUp || Math.random() < 0.4;
        return { ch: good ? G.pick(R.targets) : G.pick(R.others), good };
      }
      function spawn() {
        const free = wins.filter(w => w.st === 'idle' && w.i !== lastWin); if (!free.length) return;
        const w = G.pick(free); lastWin = w.i;
        w.item = pickItem(); w.st = 'up'; w.until = api.t + R.stay;
        api.tween(w, { k: 1 }, 0.35, 'back'); api.sfx('peek');
      }
      function hide(w) {
        if (w.st !== 'up') return;
        w.st = 'down'; api.sfx('hide');
        api.tween(w, { k: 0 }, 0.28, 'inOut').then(() => { w.st = 'idle'; w.item = null; });
      }
      function round(o) { R = o; got = []; active = true; nextAt = api.t + 0.6; api.expect(true); return new Promise(r => { R.res = r; }); }
      function barPos(i) {
        const n = R ? R.need : 4, sz = Math.min(api.W * 0.11, 48, api.H * 0.09), x0 = api.W / 2 - ((n - 1) * sz * 1.12) / 2;
        return { x: x0 + i * sz * 1.12, y: 96 + sz * 0.5, sz };
      }
      function hit(w) {
        const it = w.item;
        if (it.good) {
          w.st = 'taken'; got.push(it); api.good(); G.buzz(15); api.sfx('coin'); api.burst(w.x, w.y, { n: 12 });
          api.say(it.ch === 'И' ? 'w4_l18_yesi' : 'w4_l18_yesy');
          api.tween(mish, { j: 1 }, 0.15).then(() => api.tween(mish, { j: 0 }, 0.4, 'bounce'));
          const b = barPos(got.length - 1), f = { x: w.x, y: w.y, sc: 1, it }; w.fly = f;
          api.tween(f, { x: b.x, y: b.y, sc: b.sz / (ww * 0.8) }, 0.5, 'inOut').then(() => { w.fly = null; w.k = 0; w.st = 'idle'; w.item = null; });
          if (got.length >= R.need) { active = false; api.expect(false); api.after(1.4, () => { const f2 = R.res; R.res = null; f2 && f2(); }); }
        } else {
          w.shake = 1; api.sfx('wrong'); api.miss(); R.stay = Math.min(R.stay + 0.4, 5.5);
          api.say(R.wrong);
          api.after(0.5, () => hide(w));
        }
      }
      function drawItem(c, it, x, y, size) {
        c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.arc(x, y, size * 0.5, 0, 7); c.fill();
        api.glyph(c, it.ch, x, y, size * 0.72, { color: '#6A4BD6' });
      }
      function shutter(c, x, y, w, h) {
        c.fillStyle = '#3F7FD0'; roundRect(c, x, y, w, h, Math.min(6, w / 3)); c.fill();
        if (w > 10) { c.strokeStyle = '#FFF3D6'; c.lineWidth = 2.5; c.strokeRect(x + w * 0.2, y + h * 0.15, w * 0.6, h * 0.7); }
      }
      return {
        resize: layout,
        async run() {
          api.rounds(3); api.round(0);
          layout();
          api.card('И', { caption: 'буква И', dur: 3 });
          await api.say('w4_l18_i');
          api.say('w4_l18_r1');
          await round({ targets: ['И'], others: ['А', 'О', 'У', 'М'], wrong: 'w4_l18_noti', need: 4, max: 1, stay: 4.2 });
          await api.praise(); api.round(1);
          api.card('Ы', { caption: 'буква Ы', dur: 3 });
          await api.say('w4_l18_y');
          await round({ targets: ['Ы'], others: ['И', 'А', 'О', 'У'], wrong: 'w4_l18_noty', need: 4, max: 1, stay: 4 });
          await api.praise(); api.round(2);
          api.say('w4_l18_r3');
          await round({ targets: ['И', 'Ы'], others: ['А', 'О', 'У', 'М'], wrong: 'w4_l18_not3', need: 6, max: 2, stay: 3.8 });
          api.round(3); api.sfx('cheer'); await api.wait(0.6);
        },
        update(dt) {
          wins.forEach(w => { if (w.shake) w.shake = Math.max(0, w.shake - dt * 2.5); });
          if (!active || !R) return;
          wins.forEach(w => { if (w.st === 'up' && api.t > w.until) hide(w); });
          if (wins.filter(w => w.st === 'up').length < R.max && api.t > nextAt) { spawn(); nextAt = api.t + (R.max > 1 ? 1.1 : 0.7); }
        },
        draw(c, W, H) {
          if (cache) c.drawImage(cache, 0, 0, W, H);
          wins.forEach(w => {
            const x = w.x - ww / 2, y = w.y - wh / 2;
            if (w.item && w.k > 0.02 && w.st !== 'taken') drawItem(c, w.item, w.x + Math.sin(w.shake * 30) * 6 * w.shake, w.y, ww * 0.8 * Math.min(1, w.k));
            const k = G.clamp(w.k, 0, 1);
            if (k < 0.5) { const pw = ww / 2 * (1 - 2 * k); shutter(c, x, y, pw, wh); shutter(c, x + ww - pw, y, pw, wh); }
            else { const pw = ww / 2 * 0.62 * (2 * k - 1); shutter(c, x - pw - 3, y, pw, wh); shutter(c, x + ww + 3, y, pw, wh); }
          });
          const mh = Math.min(H * 0.2, W * 0.28), mx = W > H ? W * 0.09 : W * 0.15;
          shadow(c, mx, gy + 4, mh * 0.7); G.art.draw(c, 'mishutka', mx, gy + 4 - mish.j * mh * 0.15, mh, { anchor: 'b' });
          if (R) {
            for (let i = 0; i < R.need; i++) {
              const b = barPos(i);
              c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(b.x, b.y, b.sz * 0.5, 0, 7); c.fill();
              if (got[i] && !wins.some(w => w.fly && w.fly.it === got[i])) drawItem(c, got[i], b.x, b.y, b.sz * 0.95);
            }
          }
          wins.forEach(w => { if (w.fly) drawItem(c, w.fly.it, w.fly.x, w.fly.y, ww * 0.8 * w.fly.sc); });
        },
        down(p) {
          if (!active) return;
          const w = wins.filter(x => x.st === 'up' && x.k > 0.5).sort((a, b) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(p.x - b.x, p.y - b.y))[0];
          if (w && Math.hypot(p.x - w.x, p.y - w.y) < ww * 0.75) hit(w);
        },
        hint() {
          let w = wins.find(x => x.st === 'up' && x.item && x.item.good);
          if (!w && active) { spawn(); w = wins.find(x => x.st === 'up' && x.item && x.item.good); }
          if (w) { w.until = Math.max(w.until, api.t + 3); api.finger(w.x, w.y); api.say('c_hint'); }
        },
        auto() { const w = wins.find(x => x.st === 'up' && x.k > 0.9 && x.item && x.item.good); if (w) hit(w); }
      };
    }
  });

  // =====================================================================
  // 19. Малина — группы ягод: нажимаем, где рядом три одинаковые или больше; ягоды падают сверху.
  // =====================================================================
  const BER = ['malina', 'berry_blue', 'apple'];
  G.level({
    id: 'w4l4', world: 'w4', n: 4, title: 'Малина', icon: 'malina', music: 'bears',
    sprites: [...FOREST, ...BER],
    create(api) {
      const bg = forest(api, { ground: 0.3, trees: 0.8 });
      let cols = 5, rows = 6, cs = 50, ox = 0, oy = 0, top = 150, grid = [], R = null, got = 0, pend = 0, fly = [], saidFew = false;
      const cx = c => ox + (c + 0.5) * cs, cy = r => oy + (r + 0.5) * cs;
      function layout() {
        bg.resize();
        const W = api.W, H = api.H, land = W > H;
        top = Math.max(150, H * 0.2);
        let bot = H * (land ? 0.97 : 0.88);
        cs = Math.min(W * 0.9 / cols, (bot - top) / rows);
        if (underHint(api, W / 2 + cols * cs / 2, bot)) { bot = Math.min(bot, api.hintBox().y); cs = Math.min(W * 0.9 / cols, (bot - top) / rows); }
        ox = W / 2 - cols * cs / 2; oy = top + (bot - top - rows * cs) / 2;
      }
      const cell = t => ({ t, y: 0, vy: 0, wob: 0 });
      function group(c, r) {
        const t = grid[c][r] && grid[c][r].t, out = [], seen = new Set([c * 100 + r]), q = [[c, r]];
        if (t == null) return out;
        while (q.length) {
          const [x, y] = q.pop(); out.push([x, y]);
          [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].forEach(([a, b]) => {
            if (a < 0 || b < 0 || a >= cols || b >= rows || seen.has(a * 100 + b)) return;
            const g = grid[a][b]; if (g && g.t === t) { seen.add(a * 100 + b); q.push([a, b]); }
          });
        }
        return out;
      }
      function groups(t) {
        const seen = new Set(), out = [];
        for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
          if (seen.has(c * 100 + r) || !grid[c][r] || (t && grid[c][r].t !== t)) continue;
          const g = group(c, r); g.forEach(([a, b]) => seen.add(a * 100 + b)); if (g.length >= 3) out.push(g);
        }
        return out.sort((a, b) => b.length - a.length);
      }
      function ensure() {
        if (groups(R.t).length) return;
        const c = Math.floor(Math.random() * cols), r = Math.floor(Math.random() * (rows - 2));
        for (let k = 0; k < 3; k++) grid[c][r + k].t = R.t;
      }
      function round(t, need) {
        const land = api.W > api.H;
        cols = land ? 8 : 5; rows = land ? 4 : 6;
        layout();
        R = { t, need }; got = 0; pend = 0; fly = [];
        grid = Array.from({ length: cols }, () => Array.from({ length: rows }, (_, r) => { const x = cell(G.pick(BER)); x.y = r - rows - 1; return x; }));
        ensure(); api.expect(true);
        return new Promise(res => { R.res = res; });
      }
      function barPos(i) {
        const n = R ? R.need : 6, sz = Math.min((api.W - 70) / (n + 0.5) / 1.1, 44), x0 = api.W / 2 - ((n - 1) * sz * 1.1) / 2 + sz * 0.6;
        return { x: x0 + i * sz * 1.1, y: top - sz * 0.95, sz };
      }
      function pop(list) {
        api.sfx('pop'); G.buzz(12); api.good();
        let k = 0;
        list.forEach(([c, r]) => {
          const it = grid[c][r];
          if (it.t === R.t && got + pend < R.need) {
            const slot = got + pend; pend++;
            const f = { t: it.t, x: cx(c), y: cy(r), s: 1 }; fly.push(f);
            const bp = barPos(slot);
            api.after(k++ * 0.5, () => api.tween(f, { x: bp.x, y: bp.y }, 0.45, 'inOut').then(() => {
              fly.splice(fly.indexOf(f), 1); pend--; got++; api.sfx('coin'); api.say('n' + got);
              if (got >= R.need) { api.expect(false); api.after(1, () => { const fn = R.res; R.res = null; fn && fn(); }); }
            }));
          } else api.burst(cx(c), cy(r), { n: 5, scale: 0.5, ring: false });
          grid[c][r] = null;
        });
        for (let c = 0; c < cols; c++) {
          const col = grid[c].filter(Boolean), miss = rows - col.length;
          const fresh = Array.from({ length: miss }, (_, i) => { const x = cell(G.pick(BER)); x.y = -(miss - i) - 0.3; return x; });
          grid[c] = [...fresh, ...col];
        }
        if (got + pend < R.need) ensure();
      }
      return {
        resize: layout,
        async run() {
          api.rounds(3); api.round(0);
          const r1 = round('malina', 6); await api.say('w4_l19_intro'); await r1;
          api.card(6, { caption: 'шесть малинок' }); await api.praise(); api.round(1);
          const r2 = round('berry_blue', 8); await api.say('w4_l19_r2'); await r2;
          api.card(8, { caption: 'восемь черничек' }); await api.say('w4_l19_eight'); api.round(2);
          const r3 = round('malina', 9); await api.say('w4_l19_r3'); await r3;
          api.card(9, { caption: 'девять малинок' }); await api.say('w4_l19_nine');
          api.round(3); await api.wait(0.3);
        },
        update(dt) {
          for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
            const it = grid[c] && grid[c][r]; if (!it) continue;
            it.wob = Math.max(0, it.wob - dt * 2);
            if (it.y < r) { it.vy += 30 * dt; it.y = Math.min(r, it.y + it.vy * dt); if (it.y >= r) { it.vy = 0; } }
            else { it.y = r; it.vy = 0; }
          }
        },
        draw(c) {
          bg.draw(c, 0);
          c.fillStyle = 'rgba(120,70,30,.85)'; roundRect(c, ox - cs * 0.12, oy - cs * 0.12, cols * cs + cs * 0.24, rows * cs + cs * 0.24, cs * 0.25); c.fill();
          c.fillStyle = '#F6E7C8'; roundRect(c, ox - cs * 0.04, oy - cs * 0.04, cols * cs + cs * 0.08, rows * cs + cs * 0.08, cs * 0.2); c.fill();
          c.save(); c.beginPath(); c.rect(ox - cs * 0.1, oy - cs * 0.04, cols * cs + cs * 0.2, rows * cs + cs * 0.1); c.clip();
          for (let x = 0; x < cols; x++) for (let r = 0; r < rows; r++) {
            const it = grid[x] && grid[x][r]; if (!it) continue;
            G.art.draw(c, it.t, cx(x) + Math.sin(it.wob * 25) * 5 * it.wob, oy + (it.y + 0.5) * cs, cs * 0.8);
          }
          c.restore();
          if (R) {
            for (let i = 0; i < R.need; i++) {
              const b = barPos(i);
              c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(b.x, b.y, b.sz * 0.5, 0, 7); c.fill();
              if (i < got) G.art.draw(c, R.t, b.x, b.y, b.sz * 0.8);
            }
            const b0 = barPos(0); G.art.draw(c, R.t, b0.x - b0.sz * 1.25, b0.y, b0.sz * 1.05, { alpha: 0.9 });
          }
          fly.forEach(f => G.art.draw(c, f.t, f.x, f.y, cs * 0.8));
        },
        down(p) {
          if (!R || got + pend >= R.need) return;
          const c = Math.floor((p.x - ox) / cs), r = Math.floor((p.y - oy) / cs);
          if (c < 0 || r < 0 || c >= cols || r >= rows || !grid[c][r] || grid[c][r].y < r - 0.05) return;
          const g = group(c, r);
          if (g.length >= 3) pop(g);
          else { g.forEach(([a, b]) => { grid[a][b].wob = 1; }); api.sfx('wrong'); api.miss(); if (!saidFew) { saidFew = true; api.say('w4_l19_few'); } }
        },
        hint() { if (!R) return; const g = groups(R.t)[0] || groups()[0]; if (g) { api.finger(cx(g[0][0]), cy(g[0][1])); api.say('c_hint'); } },
        auto() {
          if (!R || fly.length || got + pend >= R.need) return;
          if (grid.some((col, c) => col.some((it, r) => it && it.y < r))) return;
          const g = groups(R.t)[0]; if (g) this.down({ x: cx(g[0][0]), y: cy(g[0][1]) });
        }
      };
    }
  });

  // =====================================================================
  // 20. Босс: Чай для гостей — чашки по размеру, потом «сколько гостей, столько чашек» до девяти.
  // =====================================================================
  const GUESTS = ['bear', 'bear_mama', 'mishutka', 'masha', 'kolobok', 'hare', 'fox', 'frog', 'mouse'];
  const GK = { bear: 1, bear_mama: 0.92, mishutka: 0.78, masha: 0.95, kolobok: 0.7, hare: 0.95, fox: 0.95, frog: 0.75, mouse: 0.75 };
  G.level({
    id: 'w4l5', world: 'w4', n: 5, title: 'Чай для гостей', icon: 'cup', music: 'bears',
    sprites: [...GUESTS, 'cup'],
    create(api) {
      const bg = izba(api, () => (api.W > api.H ? 0.52 : 0.46)), S = sizeSort(api, bg);
      let mode = 'sort', seats = [], gs = 60, rowsN = 3, colsN = 3, T = null;
      function layoutT() {
        const W = api.W, H = api.H, land = W > H;
        colsN = land ? 5 : 3; rowsN = Math.ceil(9 / colsN);
        const topY = Math.max(120, H * 0.15), bot = H * (land ? 0.97 : 0.86), rh = (bot - topY) / rowsN, cw = W * 0.92 / colsN;
        gs = Math.min(rh * 0.7, cw * 0.85);
        seats.forEach((s, i) => { s.x = W * 0.04 + cw * (i % colsN + 0.5); s.y = topY + rh * (Math.floor(i / colsN) + 0.68); s.cw = cw; s.rh = rh; });
      }
      const layout = () => { bg.resize(); S.layout(); layoutT(); };
      seats = GUESTS.map(n => ({ n, on: false, k: 0, cup: 0, x: 0, y: 0, cw: 0, rh: 0 }));
      layout();
      function come(i) { const s = seats[i]; s.on = true; api.sfx('peek'); return api.tween(s, { k: 1 }, 0.35, 'back'); }
      function giveCup(s) {
        if (!T || !s.on || s.cup > 0) return;
        s.cup = 0.01; api.tween(s, { cup: 1 }, 0.3, 'back'); api.sfx('good'); G.buzz(12); api.good();
        T.n++; api.say('n' + T.n); api.burst(s.x, s.y - gs * 0.1, { n: 8, scale: 0.6 });
        if (seats.every(x => !x.on || x.cup > 0)) { api.expect(false); const f = T.res; api.after(0.9, () => { T = null; f(); }); }
      }
      const tableY = s => s.y - gs * 0.16;
      return {
        resize: layout,
        async run() {
          api.rounds(4); api.round(0);
          await api.say('w4_l20_intro');
          await S.round('cup', 'w4_l20_r1');
          await api.praise(); api.round(1);
          mode = 'tea';
          for (let i = 0; i < 8; i++) { come(i); await api.wait(0.18); }
          let n = 0;
          await new Promise(res => { T = { n, res }; api.expect(true); api.say('w4_l20_r2'); });
          await api.choose({ items: [{ label: 7 }, { label: 8 }, { label: 9 }], correct: 1, say: 'w4_l20_q' });
          api.card(8, { caption: 'восемь чашек' }); await api.wait(1.2);
          api.round(2);
          await come(8);
          await new Promise(res => { T = { n: 8, res }; api.expect(true); api.say('w4_l20_more'); });
          api.card(9, { caption: 'девять чашек' }); await api.say('w4_l20_nine');
          api.round(3);
          await api.choose({ items: [{ label: 'И' }, { label: 'Ы' }, { label: 'О' }], correct: 1, say: 'w4_l20_q1' });
          await api.choose({ items: [{ label: 8 }, { label: 9 }, { label: 6 }], correct: 1, say: 'w4_l20_q2' });
          await api.choose({ items: [{ art: 'bear' }, { art: 'mishutka' }, { art: 'bear_mama' }], correct: 1, say: 'w4_l20_q3' });
          api.sfx('cheer'); api.burst(api.W / 2, api.H * 0.4, { n: 30, power: 1.2 });
          await api.say('w4_l20_end');
          api.round(4); await api.wait(0.3);
        },
        update: dt => S.update(dt),
        draw(c, W) {
          bg.draw(c);
          if (mode === 'sort') { S.draw(c); return; }
          for (let row = 0; row < rowsN; row++) {
            const rs = seats.filter((s, i) => Math.floor(i / colsN) === row); if (!rs.length) continue;
            rs.forEach(s => { if (s.k > 0.01) G.art.draw(c, s.n, s.x, s.y + gs * (1 - s.k) * 0.4, gs * GK[s.n] * s.k, { anchor: 'b', alpha: Math.min(1, s.k) }); });
            const s0 = rs[0], x0 = s0.x - s0.cw * 0.48, x1 = W * 0.04 + s0.cw * colsN - s0.cw * 0.02, ty = tableY(s0), th = Math.max(16, s0.rh * 0.3);
            c.fillStyle = 'rgba(80,40,10,.25)'; roundRect(c, x0 + 4, ty + 6, x1 - x0, th, 10); c.fill();
            c.fillStyle = '#FFFFFF'; roundRect(c, x0, ty, x1 - x0, th, 10); c.fill();
            c.fillStyle = '#E8433A'; c.fillRect(x0 + 6, ty + th * 0.68, x1 - x0 - 12, th * 0.12);
            rs.forEach(s => { if (s.cup > 0) G.art.draw(c, 'cup', s.x, ty + th * 0.55, gs * 0.36 * s.cup, { anchor: 'b' }); });
          }
        },
        down(p) {
          if (mode === 'sort') { S.down(p); return; }
          if (!T) return;
          const s = seats.filter(x => x.on && !x.cup).sort((a, b) => Math.hypot(p.x - a.x, p.y - (a.y - gs * 0.3)) - Math.hypot(p.x - b.x, p.y - (b.y - gs * 0.3)))[0];
          if (s && Math.abs(p.x - s.x) < s.cw * 0.55 && Math.abs(p.y - (s.y - gs * 0.3)) < s.rh * 0.6) giveCup(s);
        },
        move: p => { if (mode === 'sort') S.move(p); },
        up: p => { if (mode === 'sort') S.up(p); },
        hint() {
          if (mode === 'sort') { S.hint(); return; }
          const s = seats.find(x => x.on && !x.cup); if (s) { api.finger(s.x, s.y - gs * 0.35); api.say('c_hint'); }
        },
        auto() {
          if (mode === 'sort') { S.auto(); return; }
          const s = seats.find(x => x.on && !x.cup); if (s && T) giveCup(s);
        }
      };
    }
  });
})();
