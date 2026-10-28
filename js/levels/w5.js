'use strict';
// Мир 5 «Золотая рыбка»: «Ну, погоди!» с неводом (до десяти), мячик-рогатка с гласными, ракушки по корзинкам 1–10,
// «Одна да одна» — сложение до пяти, финал — каждый друг загадывает загадку, рыбка исполняет желания.
(function () {
  const { shadow, roundRect } = G.lv;
  const FISH = ['fish', 'fish_o', 'fish_g', 'fish_p'];

  // ---------- море: небо (если есть поверхность), вода с лучами, песок; водоросли и пузырьки ----------
  function sea(api, o = {}) {
    const st = { surf: 0, sand: 0 };
    let cv = null;
    st.resize = () => {
      const W = api.W, H = api.H, d = api.dpr;
      st.surf = Math.round(H * (o.surface || 0)); st.sand = Math.round(H * (o.sand || 0.9));
      cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(W * d)); cv.height = Math.max(1, Math.ceil(H * d));
      const c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0);
      if (st.surf > 0) {
        const sk = c.createLinearGradient(0, 0, 0, st.surf); sk.addColorStop(0, '#86CFF7'); sk.addColorStop(1, '#E2F5FF');
        c.fillStyle = sk; c.fillRect(0, 0, W, st.surf);
        const sx = W * 0.84, sy = Math.min(st.surf * 0.55, 140), sr = Math.min(W, H) * 0.07;
        c.fillStyle = 'rgba(255,230,140,.35)'; c.beginPath(); c.arc(sx, sy, sr * 1.8, 0, 7); c.fill();
        c.fillStyle = '#FFE27A'; c.beginPath(); c.arc(sx, sy, sr, 0, 7); c.fill();
      }
      const wg = c.createLinearGradient(0, st.surf, 0, H);
      wg.addColorStop(0, '#74D3F2'); wg.addColorStop(0.5, '#3398D6'); wg.addColorStop(1, '#1D64A6');
      c.fillStyle = wg; c.fillRect(0, st.surf, W, H - st.surf);
      c.fillStyle = 'rgba(255,255,255,.08)';
      for (let i = 0; i < 5; i++) {
        const x = W * (0.1 + i * 0.21);
        c.beginPath(); c.moveTo(x, st.surf); c.lineTo(x + W * 0.06, st.surf); c.lineTo(x + W * 0.16, st.sand); c.lineTo(x + W * 0.02, st.sand); c.closePath(); c.fill();
      }
      const sg = c.createLinearGradient(0, st.sand, 0, H); sg.addColorStop(0, '#F4DFA4'); sg.addColorStop(1, '#D8B46C');
      c.fillStyle = sg; c.beginPath(); c.moveTo(0, H); c.lineTo(0, st.sand);
      for (let i = 0; i <= 24; i++) { const x = i / 24 * W; c.lineTo(x, st.sand + Math.sin(i * 1.3) * 5); }
      c.lineTo(W, H); c.closePath(); c.fill();
      c.fillStyle = 'rgba(180,130,60,.35)';
      for (let i = 0; i < 14; i++) { c.beginPath(); c.arc((i * 0.618 * W * 2.7) % W, st.sand + 10 + ((i * 37) % 30) / 30 * (H - st.sand - 14), 2.5, 0, 7); c.fill(); }
      // кораллы по краям
      [[0.05, '#FF7FA8'], [0.95, '#FF9F5A']].forEach(([fx, col]) => {
        c.strokeStyle = col; c.lineWidth = Math.max(6, W * 0.018); c.lineCap = 'round';
        const x = W * fx, y = st.sand + 6, h = Math.min(H * 0.12, 90);
        c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h); c.moveTo(x, y - h * 0.4); c.quadraticCurveTo(x - h * 0.3, y - h * 0.5, x - h * 0.3, y - h * 0.8);
        c.moveTo(x, y - h * 0.6); c.quadraticCurveTo(x + h * 0.3, y - h * 0.7, x + h * 0.3, y - h); c.stroke();
      });
    };
    st.draw = c => {
      const W = api.W, H = api.H, t = api.t;
      if (cv) c.drawImage(cv, 0, 0, W, H);
      c.lineCap = 'round';
      for (let i = 0; i < 6; i++) {
        const x = W * ((i * 0.37 + 0.12) % 1), y = st.sand + 8, h = Math.min(H * 0.16, 130) * (0.7 + (i % 3) * 0.15), sw = Math.sin(t * 1.4 + i) * h * 0.12;
        c.strokeStyle = i % 2 ? '#3FA34D' : '#2F8A3F'; c.lineWidth = Math.max(5, W * 0.014);
        c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + sw * 2, y - h * 0.5, x + sw, y - h); c.stroke();
      }
      c.fillStyle = 'rgba(255,255,255,.45)';
      const span = Math.max(1, st.sand - st.surf);
      for (let i = 0; i < 9; i++) {
        const y = st.sand - ((t * 38 + i * 97) % span), x = W * ((i * 0.29 + 0.07) % 1) + Math.sin(t * 2 + i) * 6;
        c.beginPath(); c.arc(x, y, 3 + (i % 3) * 2, 0, 7); c.fill();
      }
      if (st.surf > 0) {
        c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.moveTo(0, st.surf + 6);
        for (let i = 0; i <= 30; i++) { const x = i / 30 * W; c.lineTo(x, st.surf + Math.sin(i * 0.9 + t * 2) * 3); }
        c.lineTo(W, st.surf + 6); c.closePath(); c.fill();
      }
    };
    return st;
  }
  function badge(api, c, x, y, s, text) {
    c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.arc(x, y, s * 0.5, 0, 7); c.fill();
    api.glyph(c, String(text), x, y, s * 0.68, { color: '#6A4BD6' });
  }

  // =====================================================================
  // 21. Рыбки в невод — «Ну, погоди!» под водой: рыбки плывут по четырём дорожкам, ставим невод.
  // =====================================================================
  G.level({
    id: 'w5l1', world: 'w5', n: 1, title: 'Рыбки в невод', icon: 'fish', music: 'sea',
    sprites: [...FISH, 'boat', 'ded'],
    create(api) {
      const bg = sea(api, { surface: 0.24, sand: 0.95 });
      const NL = 4;
      let lanes = [], netX = 0, netLane = 1, netY = 0, fish = [], R = null, got = 0, pend = 0, nextAt = 0, active = false, speed = 0.17, saidMiss = false, saidNot = false, fs = 60, lastLane = -1;
      function layout() {
        bg.resize();
        const W = api.W, H = api.H;
        lanes = Array.from({ length: NL }, (_, i) => bg.surf + (H * 0.93 - bg.surf) * (i + 0.6) / NL);
        netX = W * 0.2; fs = Math.min(H * 0.11, W * 0.22, (lanes[1] - lanes[0]) * 0.85);
        if (!netY) netY = lanes[netLane];
      }
      layout();
      function barPos(i) {
        const n = R ? R.need : 5, sz = Math.min((api.W - 40) / (n * 1.12), 34, api.H * 0.07), x0 = api.W / 2 - ((n - 1) * sz * 1.12) / 2;
        return { x: x0 + i * sz * 1.12, y: 96 + sz * 0.5, sz };
      }
      function spawn() {
        let lane = Math.floor(Math.random() * NL); if (lane === lastLane) lane = (lane + 1 + Math.floor(Math.random() * (NL - 1))) % NL;
        lastLane = lane;
        const good = !R.digit || Math.random() < 0.45 || !fish.some(f => f.good && f.st === 'swim');
        const d = R.digit ? (good ? 10 : 1 + Math.floor(Math.random() * 9)) : null;
        fish.push({ lane, x: api.W + fs, d, good: R.digit ? d === 10 : true, art: G.pick(FISH), st: 'swim', t: Math.random() * 6, s: 1 });
      }
      function round(o) { R = o; got = 0; pend = 0; fish = []; active = true; nextAt = api.t + 0.4; saidNot = false; api.expect(true); return new Promise(r => { R.res = r; }); }
      function caught(f) {
        f.st = 'caught'; const slot = got + pend; pend++;
        api.sfx('coin'); G.buzz(12); api.good(); api.burst(netX, lanes[f.lane], { n: 10, scale: 0.7 });
        const b = barPos(slot);
        api.tween(f, { x: b.x, s: b.sz / fs * 1.3 }, 0.5, 'inOut');
        f.fy = lanes[f.lane]; api.tween(f, { fy: b.y }, 0.5, 'inOut').then(() => {
          f.st = 'bar'; pend--; got++; api.say('n' + got);
          if (got >= R.need) { active = false; api.expect(false); api.after(1.1, () => { const fn = R.res; R.res = null; fn && fn(); }); }
        });
      }
      return {
        resize: layout,
        async run() {
          api.rounds(3); api.round(0);
          const r1 = round({ need: 5, max: 1, gap: 1.2 }); await api.say('w5_l21_intro'); await r1;
          await api.praise(); api.round(1);
          speed = Math.max(speed, 0.16);
          const r2 = round({ need: 3, max: 2, gap: 1.3, digit: true }); await api.say('w5_l21_r2'); await r2;
          await api.praise(); api.round(2);
          const r3 = round({ need: 10, max: 2, gap: 0.9 }); await api.say('w5_l21_r3'); await r3;
          api.card(10, { caption: 'десять рыбок' }); await api.say('w5_l21_ten');
          api.round(3); await api.wait(0.3);
        },
        update(dt) {
          netY += (lanes[netLane] - netY) * Math.min(1, dt * 14);
          const W = api.W;
          for (const f of fish) {
            f.t += dt;
            if (f.st !== 'swim' && f.st !== 'free') continue;
            f.x -= speed * W * dt;
            if (f.st === 'swim' && f.x <= netX + fs * 0.35) {
              if (f.lane === netLane && Math.abs(netY - lanes[netLane]) < fs * 0.5) {
                if (f.good && active) caught(f);
                else { f.st = 'free'; api.sfx('boing'); if (R && R.digit && !saidNot) { saidNot = true; api.say('w5_l21_not'); } }
              } else {
                f.st = 'free';
                if (f.good && active) { api.miss(); speed = Math.max(0.1, speed * 0.9); if (!saidMiss) { saidMiss = true; api.say('w5_l21_miss'); } }
              }
            }
          }
          fish = fish.filter(f => !(f.st === 'free' && f.x < -fs));
          if (active && R && api.t > nextAt && fish.filter(f => f.st === 'swim').length < R.max && got + pend < R.need) { spawn(); nextAt = api.t + R.gap + Math.random() * 0.6; }
        },
        draw(c, W, H) {
          bg.draw(c);
          // лодка со стариком
          const bw = Math.min(W * 0.4, H * 0.24), dh = Math.min(H * 0.14, W * 0.24), bxx = netX;
          G.art.draw(c, 'ded', bxx - bw * 0.08, bg.surf + dh * 0.15, dh, { anchor: 'b', rot: Math.sin(api.t * 1.5) * 0.03 });
          G.art.draw(c, 'boat', bxx, bg.surf + bw * 0.12, bw * 0.42, { rot: Math.sin(api.t * 1.5) * 0.03 });
          // верёвка и невод
          c.strokeStyle = '#8B6B4A'; c.lineWidth = 3; c.beginPath(); c.moveTo(bxx + bw * 0.12, bg.surf); c.lineTo(netX, netY - fs * 0.55); c.stroke();
          const nr = fs * 0.62;
          c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.arc(netX, netY, nr, -Math.PI / 2, Math.PI / 2, true); c.closePath(); c.fill();
          c.strokeStyle = 'rgba(255,255,255,.65)'; c.lineWidth = 1.6;
          for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(netX, netY + k * nr * 0.35); c.lineTo(netX - Math.sqrt(Math.max(0, nr * nr - (k * nr * 0.35) ** 2)), netY + k * nr * 0.35); c.stroke(); }
          for (let k = 1; k <= 3; k++) { c.beginPath(); c.arc(netX, netY, nr * k / 3.4, Math.PI / 2, Math.PI * 1.5); c.stroke(); }
          c.strokeStyle = '#C99A62'; c.lineWidth = Math.max(4, fs * 0.09); c.beginPath(); c.moveTo(netX, netY - nr); c.lineTo(netX, netY + nr); c.stroke();
          // дорожки — пунктир
          c.strokeStyle = 'rgba(255,255,255,.18)'; c.setLineDash([6, 12]); c.lineWidth = 2;
          lanes.forEach(y => { c.beginPath(); c.moveTo(netX + fs * 0.5, y); c.lineTo(W, y); c.stroke(); }); c.setLineDash([]);
          // рыбки
          fish.forEach(f => {
            const y = f.st === 'caught' || f.st === 'bar' ? f.fy : lanes[f.lane] + Math.sin(f.t * 3) * fs * 0.06;
            if (f.st === 'bar') return;
            G.art.draw(c, f.art, f.x, y, fs * 0.8 * f.s, { rot: Math.sin(f.t * 6) * 0.05 });
            if (f.d != null && f.st === 'swim') badge(api, c, f.x - fs * 0.05, y - fs * 0.02, fs * 0.5, f.d);
          });
          if (R) for (let i = 0; i < R.need; i++) {
            const b = barPos(i);
            c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(b.x, b.y, b.sz * 0.5, 0, 7); c.fill();
            if (i < got) G.art.draw(c, 'fish', b.x, b.y, b.sz * 0.7);
          }
        },
        down(p) {
          let best = 0, bd = 1e9; lanes.forEach((y, i) => { const d = Math.abs(p.y - y); if (d < bd) { bd = d; best = i; } });
          if (best !== netLane) { netLane = best; api.sfx('tick'); }
        },
        move(p) { this.down(p); },
        hint() {
          const f = fish.filter(x => x.st === 'swim' && x.good).sort((a, b) => a.x - b.x)[0]; if (!f) return;
          api.finger(netX + fs * 0.6, lanes[f.lane]); api.say('c_hint');
        },
        auto() { const f = fish.filter(x => x.st === 'swim' && x.good).sort((a, b) => a.x - b.x)[0]; if (f) netLane = f.lane; else { const bad = fish.find(x => x.st === 'swim'); if (bad) netLane = (bad.lane + 2) % NL; } }
      };
    }
  });

  // =====================================================================
  // 22. Мячик-рогатка — Angry Birds без птиц: сбиваем коробку с нужной гласной.
  // =====================================================================
  const CODE = { 'А': 'a', 'О': 'o', 'У': 'u', 'И': 'i', 'Ы': 'y' };
  G.level({
    id: 'w5l2', world: 'w5', n: 2, title: 'Мячик-рогатка', icon: 'fish_o', music: 'sea',
    sprites: ['fish_g', 'fish_o', 'shell'],
    create(api) {
      const bg = sea(api, { surface: 0.42, sand: 0.74 });
      let gy = 0, bs = 50, sx = 0, sy = 0, rr = 14, g = 600, maxPull = 80, towers = [], boxes = [], R = null, want = null, saidWrong = false, hitAny = false;
      const ball = { x: 0, y: 0, vx: 0, vy: 0, st: 'ready' };
      function layout() {
        bg.resize();
        const W = api.W, H = api.H;
        gy = H * 0.88; bs = Math.min(W * 0.15, H * 0.12); rr = Math.min(W, H) * 0.035;
        sx = W * 0.18; sy = gy - H * 0.16; g = H * 1.6; maxPull = Math.min(W, H) * 0.2;
        if (ball.st !== 'fly') { ball.x = sx; ball.y = sy; }
        stack();
      }
      function stack() {
        const xs = towers.length > 1 ? [0.6, 0.82] : [0.72];
        towers.forEach((t, ti) => {
          const alive = t.filter(b => b.st === 'ok');
          alive.forEach((b, k) => { b.x = api.W * xs[ti]; b.ty = gy - bs * (k + 0.5); if (b.y == null) b.y = b.ty; });
        });
      }
      function round(cols, asks) {
        towers = cols.map(col => G.shuffle(col.slice()).map(ch => ({ ch, st: 'ok', y: null, wob: 0, rot: 0 })));
        boxes = towers.flat(); stack();
        R = { asks: asks.slice(), i: 0 };
        return new Promise(r => { R.res = r; nextAsk(); });
      }
      function nextAsk() {
        if (R.i >= R.asks.length) { want = null; api.expect(false); const f = R.res; R.res = null; api.after(0.6, () => f && f()); return; }
        want = R.asks[R.i]; saidWrong = false; api.expect(true); api.say('w5_l22_' + CODE[want]);
      }
      const center = b => ({ x: b.x, y: b.y });
      function launchTo(b) {
        if (ball.st !== 'ready') return;
        const T = 0.85, p = center(b);
        ball.vx = (p.x - sx) / T; ball.vy = (p.y - sy) / T - 0.5 * g * T; ball.st = 'fly'; ball.home = b; hitAny = false; api.sfx('whoosh');
      }
      function reset() { ball.st = 'ready'; ball.x = sx; ball.y = sy; ball.vx = ball.vy = 0; ball.home = null; }
      function hit(b) {
        hitAny = true;
        if (b.ch === want) {
          b.st = 'fly'; b.vx = Math.max(ball.vx * 0.5, api.W * 0.25); b.vy = -api.H * 0.7; b.vr = 7;
          api.sfx('pop'); api.sfx('drop'); G.buzz([15, 20, 15]); api.good(); api.burst(b.x, b.y, { n: 18 });
          api.say('w5_l22_hit'); reset(); stack();
          R.i++; api.after(1.1, nextAsk);
        } else {
          b.wob = 1; api.sfx('wrong'); api.miss(); ball.home = null;
          ball.vx = -Math.abs(ball.vx) * 0.3; ball.vy = -api.H * 0.3;
          if (!saidWrong) { saidWrong = true; api.say('w5_l22_wrong'); }
        }
      }
      return {
        resize: layout,
        async run() {
          api.rounds(3); api.round(0);
          layout();
          await api.say('w5_l22_intro');
          await round([['А', 'О', 'У']], G.shuffle(['А', 'О', 'У']));
          await api.praise(); api.round(1);
          await api.say('w5_l22_r2');
          await round([['И', 'Ы', 'О']], G.shuffle(['Ы', 'И']));
          await api.praise(); api.round(2);
          await api.say('w5_l22_r3');
          await round([['А', 'О', 'У'], ['И', 'Ы']], G.shuffle(['А', 'О', 'У', 'И', 'Ы']).slice(0, 3));
          api.sfx('cheer'); api.round(3); await api.wait(0.4);
        },
        update(dt) {
          boxes.forEach(b => {
            b.wob = Math.max(0, b.wob - dt * 2.5);
            if (b.st === 'ok') b.y += (b.ty - b.y) * Math.min(1, dt * 10);
            else if (b.st === 'fly') { b.vy += g * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.rot += b.vr * dt; if (b.y > api.H + bs) b.st = 'gone'; }
          });
          if (ball.st !== 'fly') return;
          ball.vy += g * dt; ball.x += ball.vx * dt; ball.y += ball.vy * dt;
          // нажали на коробку — мяч летит точно в неё; выстрел рогаткой — честные столкновения с подтягиванием к нужной букве
          if (ball.home) { if (ball.home.st === 'ok' && Math.hypot(ball.x - ball.home.x, ball.y - ball.home.y) < bs * 0.9) hit(ball.home); }
          else {
            const wb = boxes.find(b => b.st === 'ok' && b.ch === want);
            if (wb && Math.hypot(ball.x - wb.x, ball.y - wb.y) < bs * 0.8) { hit(wb); return; }
            const hb = boxes.find(b => b.st === 'ok' && b.wob < 0.5 && Math.abs(ball.x - b.x) < bs / 2 + rr && Math.abs(ball.y - b.y) < bs / 2 + rr);
            if (hb) { hit(hb); return; }
          }
          if (ball.st !== 'fly') return;
          if (ball.y > gy - rr || ball.x > api.W + 40 || ball.x < -40) { if (!hitAny) api.miss(); reset(); }
        },
        draw(c, W, H) {
          bg.draw(c);
          // рогатка
          c.strokeStyle = '#8A5A2E'; c.lineWidth = Math.max(8, rr * 0.7); c.lineCap = 'round';
          const fy = sy - rr * 0.2, fw = rr * 1.8;
          c.beginPath(); c.moveTo(sx, gy); c.lineTo(sx, fy + rr * 2); c.lineTo(sx - fw, fy); c.moveTo(sx, fy + rr * 2); c.lineTo(sx + fw, fy); c.stroke();
          if (ball.st !== 'fly') { c.strokeStyle = '#5E3618'; c.lineWidth = 3; c.beginPath(); c.moveTo(sx - fw, fy); c.lineTo(ball.x, ball.y); c.lineTo(sx + fw, fy); c.stroke(); }
          // прицел
          if (ball.st === 'drag') {
            const vx = (sx - ball.x) * Math.sqrt(0.9 * W * g) / maxPull, vy = (sy - ball.y) * Math.sqrt(0.9 * W * g) / maxPull;
            c.fillStyle = 'rgba(255,255,255,.85)';
            for (let t = 0.08; t < 1.3; t += 0.08) { const x = ball.x + vx * t, y = ball.y + vy * t + 0.5 * g * t * t; if (y > gy) break; c.beginPath(); c.arc(x, y, 3.5, 0, 7); c.fill(); }
          }
          // коробки
          boxes.forEach(b => {
            if (b.st === 'gone') return;
            c.save(); c.translate(b.x + Math.sin(b.wob * 30) * 6 * b.wob, b.y); c.rotate(b.rot);
            c.fillStyle = 'rgba(60,40,10,.2)'; roundRect(c, -bs / 2 + 3, -bs / 2 + 5, bs, bs, bs * 0.12); c.fill();
            const gr = c.createLinearGradient(0, -bs / 2, 0, bs / 2); gr.addColorStop(0, '#F2C37E'); gr.addColorStop(1, '#C88A44');
            c.fillStyle = gr; roundRect(c, -bs / 2, -bs / 2, bs, bs, bs * 0.12); c.fill();
            c.strokeStyle = '#9A6228'; c.lineWidth = Math.max(2, bs * 0.05); roundRect(c, -bs / 2 + bs * 0.08, -bs / 2 + bs * 0.08, bs * 0.84, bs * 0.84, bs * 0.08); c.stroke();
            api.glyph(c, b.ch, 0, 0, bs * 0.66, { color: b.ch === want && b.st === 'ok' ? '#FF6B3D' : '#6A4BD6' });
            c.restore();
          });
          // мячик
          const bg2 = c.createRadialGradient(ball.x - rr * 0.3, ball.y - rr * 0.3, rr * 0.1, ball.x, ball.y, rr);
          bg2.addColorStop(0, '#FFF2B0'); bg2.addColorStop(0.5, '#FF6B6B'); bg2.addColorStop(1, '#C62828');
          c.fillStyle = bg2; c.beginPath(); c.arc(ball.x, ball.y, rr, 0, 7); c.fill();
          c.strokeStyle = '#fff'; c.lineWidth = rr * 0.18; c.beginPath(); c.arc(ball.x, ball.y, rr * 0.62, -0.6, 1.2); c.stroke();
          // какую букву ищем
          if (want) { const s = Math.min(W * 0.16, 64); c.fillStyle = 'rgba(255,255,255,.85)'; roundRect(c, W / 2 - s * 0.6, 92, s * 1.2, s * 1.1, s * 0.25); c.fill(); api.glyph(c, want, W / 2, 92 + s * 0.55, s * 0.8, { color: '#FF6B3D' }); }
        },
        down(p) {
          if (ball.st !== 'ready') return;
          if (Math.hypot(p.x - ball.x, p.y - ball.y) < rr * 3) { ball.st = 'drag'; return; }
          const b = boxes.find(x => x.st === 'ok' && Math.abs(p.x - x.x) < bs * 0.6 && Math.abs(p.y - x.y) < bs * 0.6);
          if (b) launchTo(b);
        },
        move(p) {
          if (ball.st !== 'drag') return;
          let dx = p.x - sx, dy = p.y - sy; const d = Math.hypot(dx, dy);
          if (d > maxPull) { dx *= maxPull / d; dy *= maxPull / d; }
          ball.x = sx + dx; ball.y = sy + dy;
        },
        up() {
          if (ball.st !== 'drag') return;
          const d = Math.hypot(ball.x - sx, ball.y - sy);
          if (d < 15) { reset(); return; }
          const k = Math.sqrt(0.9 * api.W * g) / maxPull;
          ball.vx = (sx - ball.x) * k; ball.vy = (sy - ball.y) * k; ball.st = 'fly'; hitAny = false; api.sfx('whoosh');
        },
        hint() { const b = boxes.find(x => x.st === 'ok' && x.ch === want); if (b) { api.finger(b.x, b.y); api.say('c_hint'); } },
        auto() { const b = boxes.find(x => x.st === 'ok' && x.ch === want); if (b && ball.st === 'ready') launchTo(b); }
      };
    }
  });

  // =====================================================================
  // 23. Ракушки по корзинкам — падающая ракушка с цифрой, ведём её в корзинку с такой же цифрой (1–10).
  // =====================================================================
  G.level({
    id: 'w5l3', world: 'w5', n: 3, title: 'Ракушки по корзинкам', icon: 'shell', music: 'sea',
    sprites: ['shell', 'basket_back', 'basket_front'],
    create(api) {
      const bg = sea(api, { surface: 0, sand: 0.86 });
      let baskets = [], shell = null, R = null, queue = [], saidWrong = false, bh = 80, ss = 60, rim = 0, top = 150;
      function layout() {
        bg.resize();
        const W = api.W, H = api.H, n = baskets.length || 3;
        bh = Math.min(W * 0.8 / n / 1.18, H * 0.16); ss = Math.min(bh * 0.85, H * 0.11);
        rim = H * 0.86 - bh * 0.5; top = Math.max(110, H * 0.16);
        baskets.forEach((b, i) => { b.x = W * (0.07 + 0.76 * (i + 0.5) / n); });
        if (shell) { shell.top = top; const b = baskets[shell.col]; if (b) shell.tx = b.x; }
      }
      function spawn() {
        const num = queue.shift(); if (num == null) return;
        const right = baskets.findIndex(b => b.num === num);
        let col = Math.floor(Math.random() * baskets.length); if (col === right) col = (col + 1) % baskets.length;
        shell = { num, col, x: baskets[col].x, tx: baskets[col].x, y: top, top, st: 'fall', speed: (rim - top) / R.fallT };
        api.expect(true);
      }
      function round(nums, fallT) {
        baskets = nums.map(num => ({ num, n: 0, glow: 0 })); queue = G.shuffle(nums.slice());
        R = { left: nums.length, fallT }; saidWrong = false; layout(); spawn();
        return new Promise(r => { R.res = r; });
      }
      function land() {
        const b = baskets[shell.col];
        if (b.num === shell.num) {
          b.n++; b.glow = 1; api.sfx('coin'); G.buzz(15); api.good(); api.burst(b.x, rim, { n: 14 });
          api.say('n' + b.num); shell = null; R.left--;
          if (R.left <= 0) { api.expect(false); api.after(1, () => { const f = R.res; R.res = null; f && f(); }); }
          else api.after(0.9, spawn);
        } else {
          shell.st = 'up'; api.sfx('boing'); api.miss();
          if (!saidWrong) { saidWrong = true; api.say('w5_l23_wrong'); }
        }
      }
      function steer(p) {
        if (!shell) return;
        let best = 0, bd = 1e9; baskets.forEach((b, i) => { const d = Math.abs(p.x - b.x); if (d < bd) { bd = d; best = i; } });
        shell.col = best; shell.tx = baskets[best].x;
      }
      return {
        resize: layout,
        async run() {
          api.rounds(3); api.round(0);
          const r1 = round([1, 2, 3], 5); await api.say('w5_l23_intro'); await r1;
          await api.praise(); api.round(1);
          const r2 = round([4, 5, 6, 7], 4.6); await api.say('w5_l23_r2'); await r2;
          await api.praise(); api.round(2);
          const r3 = round([8, 9, 10], 4.4); await api.say('w5_l23_r3'); await r3;
          await api.praise(); api.round(3); await api.wait(0.3);
        },
        update(dt) {
          baskets.forEach(b => { b.glow = Math.max(0, b.glow - dt); });
          const s = shell; if (!s) return;
          s.x += (s.tx - s.x) * Math.min(1, dt * 10);
          if (s.st === 'fall') { s.y += s.speed * dt; if (s.y >= rim - ss * 0.3 && Math.abs(s.x - s.tx) < 4) land(); else if (s.y >= rim - ss * 0.3) s.y = rim - ss * 0.3; }
          else { s.y -= s.speed * 5 * dt; if (s.y <= rim - (rim - s.top) * 0.6) s.st = 'fall'; }
        },
        draw(c) {
          bg.draw(c);
          baskets.forEach(b => {
            if (b.glow > 0.02) { c.fillStyle = `rgba(255,230,120,${b.glow * 0.5})`; c.beginPath(); c.ellipse(b.x, rim, bh * 0.8, bh * 0.6, 0, 0, 7); c.fill(); }
            G.art.draw(c, 'basket_back', b.x, rim + bh * 0.03, bh);
            for (let k = 0; k < b.n; k++) G.art.draw(c, 'shell', b.x + (k - (b.n - 1) / 2) * ss * 0.4, rim - ss * 0.05, ss * 0.7);
            G.art.draw(c, 'basket_front', b.x, rim + bh * 0.03, bh);
            const s = bh * 0.36, ty = rim + bh * 0.24;
            c.fillStyle = '#FFF8EA'; roundRect(c, b.x - s / 2, ty - s / 2, s, s, s * 0.28); c.fill();
            api.glyph(c, String(b.num), b.x, ty, s * (b.num >= 10 ? 0.62 : 0.78), { color: '#6A4BD6' });
          });
          const s = shell;
          if (s) {
            c.strokeStyle = 'rgba(255,255,255,.45)'; c.setLineDash([6, 8]); c.lineWidth = 3;
            c.beginPath(); c.moveTo(s.x, s.y + ss * 0.5); c.lineTo(s.x, rim - bh * 0.3); c.stroke(); c.setLineDash([]);
            G.art.draw(c, 'shell', s.x, s.y, ss, { rot: Math.sin(api.t * 3) * 0.08 });
            badge(api, c, s.x, s.y - ss * 0.05, ss * 0.5, s.num);
          }
        },
        down: p => steer(p), move: p => steer(p),
        hint() { if (!shell) return; const b = baskets.find(x => x.num === shell.num); api.finger(b.x, rim - bh * 0.2); api.say('c_hint'); },
        auto() { if (!shell) return; const i = baskets.findIndex(x => x.num === shell.num); shell.col = i; shell.tx = baskets[i].x; }
      };
    }
  });

  // =====================================================================
  // 24. Одна да одна — сложение: две стайки рыбок сплываются, сколько всего?
  // =====================================================================
  G.level({
    id: 'w5l4', world: 'w5', n: 4, title: 'Одна да одна', icon: 'fish_g', music: 'sea',
    sprites: [...FISH],
    create(api) {
      const bg = sea(api, { surface: 0, sand: 0.9 });
      let fish = [], P = null, fsz = 50, nums = 0;
      const mg = { k: 0, plus: 0 };
      const layout = () => { bg.resize(); fsz = Math.min(api.W * 0.22, api.H * (api.W > api.H ? 0.12 : 0.13)); };
      const midY = () => api.H * (api.W > api.H ? 0.76 : 0.55);
      layout();
      function spot(i, n, cx) {
        const cols = n > 4 ? 3 : 2, rows = Math.ceil(n / cols), r = Math.floor(i / cols), inRow = Math.min(cols, n - r * cols), c = i % cols;
        return { x: cx + (c - (inRow - 1) / 2) * fsz * 1.25, y: midY() + (r - (rows - 1) / 2) * fsz * 0.9 };
      }
      function pos(f) {
        const W = api.W, a = spot(f.gi, f.gn, f.g ? W * 0.74 : W * 0.26), b = spot(f.i, P.a + P.b, W / 2);
        return { x: a.x + (b.x - a.x) * mg.k, y: a.y + (b.y - a.y) * mg.k };
      }
      async function problem(a, b, line) {
        P = { a, b }; mg.k = 0; nums = 0;
        const artA = G.pick(FISH), artB = G.pick(FISH.filter(x => x !== artA));
        fish = [];
        for (let i = 0; i < a; i++) fish.push({ g: 0, gi: i, gn: a, i, art: artA, s: 0, t: Math.random() * 6 });
        for (let i = 0; i < b; i++) fish.push({ g: 1, gi: i, gn: b, i: a + i, art: artB, s: 0, t: Math.random() * 6 });
        fish.forEach((f, k) => api.tween(f, { s: 1 }, 0.3 + k * 0.08, 'back'));
        mg.plus = 0; api.tween(mg, { plus: 1 }, 0.4);
        await api.say(line);
        api.tween(mg, { plus: 0 }, 0.3);
        await api.tween(mg, { k: 1 }, 1.1, 'inOut');
        const sum = a + b, opts = G.shuffle([sum - 1, sum, sum + 1].filter(x => x > 0).slice(0, 3));
        while (opts.length < 3) opts.push(sum + opts.length);
        let counting = false;
        await api.choose({
          items: opts.map(x => ({ label: x })), correct: opts.indexOf(sum),
          onWrong: () => { api.sfx('wrong'); if (!counting) { counting = true; api.say('c_count'); for (let k = 1; k <= sum; k++) api.after(0.6 * k, () => { nums = k; api.sfx('tick'); }); } }
        });
        nums = sum;
        api.card(sum, { caption: `${a} + ${b} = ${sum}` });
        await api.say('n' + sum);
        await api.wait(0.8);
      }
      return {
        resize: layout,
        async run() {
          api.rounds(4); api.round(0);
          await api.say('w5_l24_intro');
          await problem(1, 1, 'w5_l24_q11'); api.round(1);
          await problem(2, 1, 'w5_l24_q21'); api.round(2);
          await problem(2, 2, 'w5_l24_q22'); api.round(3);
          await problem(3, 2, 'w5_l24_q32'); api.round(4);
          await api.wait(0.3);
        },
        update(dt) { fish.forEach(f => { f.t += dt; }); },
        draw(c, W, H) {
          bg.draw(c);
          fish.forEach(f => {
            const p = pos(f);
            G.art.draw(c, f.art, p.x, p.y + Math.sin(f.t * 2) * 4, fsz * 0.75 * f.s, { flip: f.g === 0 && mg.k < 0.5 });
            if (nums > f.i) badge(api, c, p.x, p.y - fsz * 0.55, fsz * 0.42, f.i + 1);
          });
          if (mg.plus > 0.01) api.glyph(c, '+', W / 2, midY(), fsz * 1.1, { color: '#FFD23F', alpha: mg.plus });
        },
        hint() { if (P) nums = P.a + P.b; }
      };
    }
  });

  // =====================================================================
  // 25. Финал: Желание для всех — каждый друг загадывает загадку, рыбка исполняет желания.
  // =====================================================================
  const WISH = [
    { n: 'kolobok', line: 'w5_l25_kolobok', items: [{ label: 'О' }, { label: 'А' }, { label: 'У' }], correct: 1 },
    { n: 'mouse', line: 'w5_l25_mouse', items: [{ label: '■' }, { label: '▲' }, { label: '●' }], correct: 2 },
    { n: 'ded', line: 'w5_l25_ded', items: [{ label: 7 }, { label: 1 }, { label: 4 }], correct: 0 },
    { n: 'mishutka', line: 'w5_l25_bear', items: [{ label: 'И' }, { label: 'О' }, { label: 'Ы' }], correct: 2 },
    { n: 'rybka', line: 'w5_l25_fish', items: [{ label: 4 }, { label: 5 }, { label: 6 }], correct: 1 }
  ];
  G.level({
    id: 'w5l5', world: 'w5', n: 5, title: 'Желание для всех', icon: 'rybka', music: 'sea',
    sprites: ['rybka', 'kolobok', 'mouse', 'ded', 'mishutka'],
    create(api) {
      const bg = sea(api, { surface: 0, sand: 0.86 });
      const heroes = WISH.map(w => ({ n: w.n, k: 0, star: 0, j: 0, act: 0 })), fishO = { spin: 0 };
      const layout = () => bg.resize();
      layout();
      const spotX = i => api.W * (0.1 + i * 0.165), spotY = () => api.H * 0.86;
      const hh = () => Math.min(api.H * 0.14, api.W * 0.2);
      function hop(o) { api.tween(o, { j: 1 }, 0.16).then(() => api.tween(o, { j: 0 }, 0.4, 'bounce')); }
      return {
        resize: layout,
        async run() {
          api.rounds(5); api.round(0);
          await api.say('w5_l25_intro');
          for (let i = 0; i < WISH.length; i++) {
            const h = heroes[i], w = WISH[i];
            await api.tween(h, { k: 1 }, 0.4, 'back'); h.act = 1; hop(h);
            await api.choose({ items: w.items, correct: w.correct, say: w.line });
            h.act = 0; api.tween(h, { star: 1 }, 0.4, 'back'); hop(h); api.sfx('star');
            api.burst(spotX(i), spotY() - hh() * 1.1, { n: 16, colors: ['#FFD23F', '#FFF2B0', '#FF9F38'] });
            await api.say('w5_l25_wish');
            api.round(i + 1);
          }
          api.tween(fishO, { spin: 1 }, 1.2, 'inOut'); api.sfx('fanfare');
          heroes.forEach((h, i) => api.after(i * 0.12, () => hop(h)));
          for (let k = 0; k < 4; k++) api.after(k * 0.35, () => api.burst(api.W * (0.2 + Math.random() * 0.6), api.H * (0.3 + Math.random() * 0.25), { n: 24, power: 1.3 }));
          await api.say('w5_l25_end');
          await api.wait(0.3);
        },
        draw(c, W, H) {
          bg.draw(c);
          const land = W > H, fs = Math.min(W * 0.42, H * (land ? 0.3 : 0.2)), fx = (land ? W * 0.86 : W / 2) + Math.sin(api.t * 0.8) * W * (land ? 0.03 : 0.08), fy = H * (land ? 0.5 : 0.56) + Math.sin(api.t * 1.6) * 8;
          c.fillStyle = 'rgba(255,240,150,.25)'; c.beginPath(); c.arc(fx, fy, fs * 0.75, 0, 7); c.fill();
          G.art.draw(c, 'rybka', fx, fy, fs * 0.7, { flip: Math.cos(api.t * 0.8) > 0, rot: fishO.spin * Math.PI * 2 });
          heroes.forEach((h, i) => {
            if (h.k < 0.01) return;
            const x = spotX(i), y = spotY(), s = hh() * (h.act ? 1.15 + Math.sin(api.t * 5) * 0.03 : 1) * h.k;
            shadow(c, x, y + 2, s * 0.6, 0.18);
            G.art.draw(c, h.n, x, y + 2 - h.j * s * 0.15, s * (h.n === 'rybka' ? 0.6 : 1), { anchor: 'b' });
            if (h.star > 0.01) { c.save(); c.translate(x, y - s * 1.15); c.scale(h.star, h.star); c.fillStyle = '#FFD23F'; G.starPath(c, s * 0.18); c.fill(); c.strokeStyle = '#E8A000'; c.lineWidth = 2; c.stroke(); c.restore(); }
          });
        }
      };
    }
  });
})();
