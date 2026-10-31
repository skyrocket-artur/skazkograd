'use strict';
// Мир 1 «Колобок»: раннер, ловилка «Ну, погоди!», тир «буква А», шарики Волка, песенка Колобка.
(function () {
  const { FOREST, forest, shadow, roundRect, U } = G.lv;

  // =====================================================================
  // 1. Катись, Колобок! — раннер. Нажатие — прыжок через пенёк, ягоды — в корзинку, потом счёт.
  // =====================================================================
  G.level({
    id: 'w1l1', world: 'w1', n: 1, title: 'Катись, Колобок!', icon: 'kolobok', music: 'forest',
    sprites: [...FOREST, 'kolobok', 'stump', 'berry_red', 'basket_back', 'basket_front'],
    create(api) {
      const bg = forest(api, { ground: 0.76, path: true });
      const K = { x: 0, h: 0, vy: 0, air: false, sq: 1 };
      let r = 30, scroll = 0, speed = 0, target = 0, maxSpeed = 200, minSpeed = 110;
      let objs = [], fly = [], basket = [], roundEnd = null, running = false, tips = true, oops = false, jumps = 0;
      const g = () => 27.2 * r, v0 = () => 13.6 * r;
      const stumpH = () => r * 1.9, stumpW = () => G.art.width('stump', stumpH());
      const hud = () => ({ x: U(api) * 4 + r * 1.4, y: 74 + r * 1.2, h: r * 2.2 });

      function resize() {
        bg.resize(); r = G.clamp(U(api) * 12, 28, 66); K.x = api.W * 0.26;
        maxSpeed = G.clamp(api.W * 0.42, 150, 300); minSpeed = maxSpeed * 0.6;
      }
      resize();
      function jump() {
        if (K.air || !running) return;
        K.air = true; K.vy = v0(); K.sq = 1.18; jumps++; api.sfx('jump'); api.fingerOff();
      }
      // Трасса: 's' — пенёк, 'sb' — пенёк с ягодой над ним, 'b' — ягода на земле
      function course(list) {
        objs = []; let x = scroll + api.W * 1.15;
        const gap = Math.max(api.W * 0.85, maxSpeed * 2.3);
        for (const it of list) {
          if (it === 's' || it === 'sb') objs.push({ k: 's', x });
          if (it === 'sb') objs.push({ k: 'b', x, y: r * 3.7 });
          if (it === 'b') objs.push({ k: 'b', x, y: r });
          x += gap;
        }
        return new Promise(res => { roundEnd = res; running = true; target = Math.min(target || maxSpeed * 0.8, maxSpeed); });
      }
      function collect(o, sx, sy) {
        o.done = true; api.sfx('coin'); api.burst(sx, sy, { n: 8, scale: 0.7, ring: false });
        const f = { x: sx, y: sy, s: 1 };
        fly.push(f);
        const H = hud();
        api.tween(f, { x: H.x, y: H.y - H.h * 0.15, s: 0.55 }, 0.55, 'inOut').then(() => { fly.splice(fly.indexOf(f), 1); basket.push({ p: 1 }); api.sfx('tick'); });
      }

      async function countTogether(n) {
        await api.say('c_count');
        for (let i = 0; i < n; i++) { basket[i] && (basket[i].p = 1.6); await api.say('n' + (i + 1)); }
      }
      async function ask() {
        await api.wait(0.7);
        const n = G.clamp(basket.length, 1, 3);
        await api.choose({ items: [1, 2, 3].map(v => ({ label: v })), correct: n - 1, say: 'w1_l1_q', onWrong: k => { if (k === 1) countTogether(n); else api.sfx('wrong'); } });
        api.card(n, { caption: ['одна ягодка', 'две ягодки', 'три ягодки'][n - 1] });
        await api.say(['w1_l1_one', 'w1_l1_two', 'w1_l1_three'][n - 1]);
        await api.wait(0.6);
      }

      return {
        resize,
        async run() {
          api.rounds(3); api.round(0);
          target = 0; await api.say('w1_l1_intro');
          // Раунд 1: три пенька, в конце — одна ягодка
          tips = true; await course(['s', 's', 's', 'b']);
          while (basket.length < 1) await course(['b']);
          api.card(1, { caption: 'одна ягодка' }); await api.say('w1_l1_one'); await api.wait(0.4);
          api.round(1); basket = []; tips = jumps === 0;
          api.say('w1_l1_r2'); await api.wait(1.2);
          await course(['sb', 'sb']);
          while (basket.length < 1) await course(['b']);
          await ask();
          api.round(2); basket = [];
          api.say('w1_l1_r2'); await api.wait(1);
          await course(['b', 'sb', 's', 'sb']);
          while (basket.length < 1) await course(['b']);
          await ask();
          api.round(3);
        },
        update(dt) {
          speed += (target - speed) * Math.min(1, dt * 2.2);
          scroll += speed * dt;
          if (K.air) {
            K.vy -= g() * dt; K.h += K.vy * dt;
            if (K.h <= 0) { K.h = 0; K.air = false; K.vy = 0; K.sq = 0.8; api.sfx('land'); }
          }
          K.sq += (1 - K.sq) * Math.min(1, dt * 9);
          basket.forEach(b => { b.p += (1 - b.p) * Math.min(1, dt * 6); });
          if (!running) return;
          let pending = 0;
          for (const o of objs) {
            const sx = o.x - scroll;
            if (o.k === 's') {
              if (!o.done) {
                pending++;
                const half = stumpW() * 0.3 + r * 0.55;
                if (!o.tip && sx > K.x && sx - K.x < speed * 1.05 && tips && !K.air) { o.tip = true; api.finger(K.x + r * 0.2, bg.gy - r * 3.2); if (!o.said) { o.said = true; api.say('w1_l1_tap'); } }
                if (Math.abs(sx - K.x) < half) {
                  o.done = true;
                  if (K.h > r * 0.3) {
                    if (K.h < stumpH() * 0.85 && K.vy < 0) { K.vy = v0() * 0.6; K.air = true; api.sfx('boing'); }
                    target = Math.min(maxSpeed, target * 1.04 + 4); api.good(); tips = false;
                  } else {
                    K.air = true; K.vy = v0() * 0.95; K.sq = 1.2; api.sfx('boing');
                    target = Math.max(minSpeed, target * 0.88); api.miss();
                    if (!oops) { oops = true; api.say('w1_l1_oops'); }
                  }
                }
              }
            } else if (!o.done) {
              pending++;
              const by = bg.gy - o.y, ky = bg.gy - K.h - r;
              if (Math.hypot(sx - K.x, by - ky) < r * 1.6) collect(o, sx, by);
              else if (sx < K.x - r * 2) o.done = true; // проскочили — не страшно
            }
          }
          const last = objs.length ? objs[objs.length - 1].x - scroll : -1;
          if (!pending && last < K.x - r * 2 && !fly.length) {
            target = 0;
            if (speed < 6 && !K.air) { running = false; const f = roundEnd; roundEnd = null; f && f(); }
          }
        },
        draw(c, W, H) {
          bg.draw(c, scroll);
          const gy = bg.gy;
          for (const o of objs) {
            const sx = o.x - scroll; if (sx < -120 || sx > W + 120) continue;
            if (o.k === 's') { shadow(c, sx, gy + 4, stumpW() * 0.9); G.art.draw(c, 'stump', sx, gy + stumpH() * 0.06, stumpH(), { anchor: 'b' }); }
          }
          for (const o of objs) {
            const sx = o.x - scroll; if (o.k !== 'b' || o.done || sx < -60 || sx > W + 60) continue;
            G.art.draw(c, 'berry_red', sx, gy - o.y + Math.sin(api.t * 4 + o.x) * 3, r * 1.15);
          }
          shadow(c, K.x, gy + 3, r * 1.8 * (1 - Math.min(0.5, K.h / (r * 7))));
          const rock = running ? Math.sin(api.t * 11) * 0.07 : Math.sin(api.t * 3) * 0.03;
          G.art.draw(c, 'kolobok', K.x, gy + 2 - K.h, r * 2.1, { anchor: 'b', rot: rock, sx: 1 / K.sq, sy: K.sq });
          fly.forEach(f => G.art.draw(c, 'berry_red', f.x, f.y, r * 1.15 * f.s));
          // корзинка с ягодами
          const Hh = hud();
          G.art.draw(c, 'basket_back', Hh.x, Hh.y, Hh.h);
          basket.forEach((b, i) => G.art.draw(c, 'berry_red', Hh.x + (i - (basket.length - 1) / 2) * Hh.h * 0.3, Hh.y - Hh.h * 0.12, Hh.h * 0.34 * b.p));
          G.art.draw(c, 'basket_front', Hh.x, Hh.y, Hh.h);
        },
        down() { jump(); },
        hint() {
          const nx = objs.find(o => o.k === 's' && !o.done && o.x - scroll > K.x);
          api.finger(K.x + r * 0.2, bg.gy - r * 3.2);
          if (nx) api.say('w1_l1_tap'); else api.say('c_hint');
        },
        auto() {
          const nx = objs.find(o => o.k === 's' && !o.done && o.x - scroll > K.x);
          if (nx && !K.air && nx.x - scroll - K.x < speed * 0.42 + stumpW() * 0.3) jump();
        }
      };
    }
  });

  // =====================================================================
  // 2. Ягодки в корзинку — «Ну, погоди!» с Электроники: 4 жёлоба, корзинка в одном из четырёх углов.
  // =====================================================================
  G.level({
    id: 'w1l2', world: 'w1', n: 2, title: 'Ягодки в корзинку', icon: 'bear', music: 'forest',
    sprites: [...FOREST, 'bear', 'berry_red', 'berry_blue', 'basket_back', 'basket_front'],
    create(api) {
      const bg = forest(api, { ground: 0.8 });
      let L = null, pos = 1, bk = { x: 0, y: 0 }, berries = [], inBasket = [];
      let R = null, caught = 0, lastSpawn = -9, T = 3.6, saidBlue = false, saidMiss = false, active = false, blueRow = 0;
      function layout() {
        bg.resize();
        const W = api.W, H = api.H, gy = bg.gy;
        // Медведь крупный, корзинка у него в лапе: вверху — на уровне головы, внизу — у живота.
        // Жёлоба кончаются прямо над корзинкой, поэтому лапа короткая и растёт из плеча, а не из головы.
        const bearH = Math.min(H * 0.38, W * 0.5), bearW = bearH * 200 / 228;
        const bh = G.clamp(Math.min(W * 0.2, H * 0.1), 50, 120);
        const reach = bearW * 0.5 + bh * 0.45, rise = H * 0.13;
        const topBy = gy - bearH * 0.68, botBy = gy - bearH * 0.16;
        L = {
          gy, br: G.clamp(U(api) * 4.6, 16, 34), bh, bearH,
          shX: bearH * 0.2, shY: gy - bearH * 0.23, split: (topBy + botBy) / 2 - bh * 0.62,
          ch: [[-1, topBy], [-1, botBy], [1, topBy], [1, botBy]].map(([side, by]) => {
            const ex = W / 2 + side * (reach + W * 0.035), ey = by - bh * 0.62;
            return { sx: side < 0 ? -20 : W + 20, sy: ey - rise, ex, ey, side, bx: W / 2 + side * reach, by };
          })
        };
        bk.x = L.ch[pos].bx; bk.y = L.ch[pos].by;
      }
      layout();
      function moveTo(i) {
        if (i === pos) return;
        pos = i; api.sfx('lcd');
        api.tween(bk, { x: L.ch[i].bx, y: L.ch[i].by }, 0.1, 'out');
      }
      function spawn() {
        let blue = R.blue && Math.random() < 0.4 && blueRow < 2;
        blueRow = blue ? blueRow + 1 : 0;
        const k = G.irand(0, 3);
        berries.push({ k, t: 0, st: 'roll', x: L.ch[k].sx, y: L.ch[k].sy, vy: 0, vx: 0, rot: 0, blue, a: 1 });
        lastSpawn = api.t;
      }
      function want(b) { return !b.blue; }
      function round(o) {
        R = o; caught = 0; inBasket = []; active = true; lastSpawn = api.t - 9; T = o.T;
        api.expect(true);
        return new Promise(res => { R.res = res; });
      }
      function finishRound() { active = false; api.expect(false); const f = R.res; R.res = null; f && f(); }

      return {
        resize: layout,
        async run() {
          api.rounds(3); api.round(0);
          await api.say('w1_l2_intro');
          await round({ need: 5, T: 3.6, max: 1, gap: 0.6, blue: false });
          await api.praise(); api.round(1);
          await api.say('w1_l2_r2');
          await round({ need: 4, T: 3.4, max: 2, gap: 1.7, blue: true });
          await api.praise(); api.round(2);
          await api.say('w1_l2_r3');
          await round({ need: 3, T: 3.2, max: 1, gap: 0.6, blue: false, exact: true });
          api.card(3, { caption: 'три ягодки' });
          await api.say('w1_l2_full'); await api.wait(0.5);
          api.round(3);
        },
        update(dt) {
          if (!L) return;
          inBasket.forEach(b => { b.p += (1 - b.p) * Math.min(1, dt * 7); });
          if (active && R && caught < R.need) {
            const flying = berries.filter(b => b.st === 'roll' || b.st === 'fall').length;
            if (flying < R.max && api.t - lastSpawn > R.gap) spawn();
          }
          for (let i = berries.length - 1; i >= 0; i--) {
            const b = berries[i], ch = L.ch[b.k];
            if (b.st === 'roll') {
              b.t += dt / T;
              const k = Math.min(1, b.t);
              b.x = G.lerp(ch.sx, ch.ex, k); b.y = G.lerp(ch.sy, ch.ey, k) - L.br * 0.9;
              b.rot += -ch.side * dt * (Math.hypot(ch.ex - ch.sx, ch.ey - ch.sy) / T) / L.br;
              if (b.t >= 0.86 && !b.beep) { b.beep = true; api.sfx('tick'); }
              if (k >= 1) { b.st = 'fall'; b.vx = -ch.side * 30; b.vy = 40; }
            } else if (b.st === 'fall') {
              b.vy += 1500 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
              const mouth = bk.y - L.bh * 0.3;
              if (b.y >= mouth && b.y - b.vy * dt < mouth + 4) {
                if (pos === b.k && Math.abs(bk.x - ch.bx) < 8) {
                  if (want(b)) {
                    b.st = 'gone'; caught++; inBasket.push({ p: 1.7, blue: false });
                    api.sfx('coin'); G.buzz(10); api.burst(bk.x, mouth, { n: 8, scale: 0.6, ring: false }); api.good();
                    if (R.exact) api.say('n' + caught);
                    if (caught >= R.need) api.after(0.5, finishRound);
                  } else {
                    b.st = 'bounce'; b.vy = -620; b.vx = -ch.side * 160; api.sfx('wrong'); api.miss();
                    if (!saidBlue) { saidBlue = true; api.say('w1_l2_blue'); }
                  }
                }
              }
              if (b.st === 'fall' && b.y > L.gy - L.br) {
                b.st = 'miss'; b.vy = -180; b.vx = ch.side * -1 * 120 * (Math.random() < 0.5 ? 1 : -1);
                api.sfx('drop');
                if (want(b)) { T = Math.min(T * 1.08, 4.6); api.miss(); if (!saidMiss) { saidMiss = true; api.say('w1_l2_miss'); } }
              }
            } else if (b.st === 'bounce' || b.st === 'miss') {
              b.vy += 1500 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
              if (b.y > L.gy - L.br * 0.8) { b.y = L.gy - L.br * 0.8; b.vy *= -0.35; b.vx *= 0.9; }
              b.rot += b.vx * dt / L.br;
              b.a -= dt * 0.5;
              if (b.a <= 0) b.st = 'gone';
            }
            if (b.st === 'gone') berries.splice(i, 1);
          }
        },
        draw(c, W, H) {
          bg.draw(c, 0);
          if (!L) return;
          // жёлоба
          for (const ch of L.ch) {
            c.lineCap = 'round';
            c.strokeStyle = '#7A4A22'; c.lineWidth = L.br * 0.9; c.beginPath(); c.moveTo(ch.sx, ch.sy); c.lineTo(ch.ex, ch.ey); c.stroke();
            c.strokeStyle = '#C07D3E'; c.lineWidth = L.br * 0.6; c.beginPath(); c.moveTo(ch.sx, ch.sy); c.lineTo(ch.ex, ch.ey); c.stroke();
            c.strokeStyle = 'rgba(255,220,160,.6)'; c.lineWidth = L.br * 0.16; c.beginPath(); c.moveTo(ch.sx, ch.sy - L.br * 0.12); c.lineTo(ch.ex, ch.ey - L.br * 0.12); c.stroke();
          }
          // табло как на Электронике
          const pw = Math.min(W * 0.36, 170), ph = 44, px = W / 2 - pw / 2, py = 70;
          c.fillStyle = '#2E3B2A'; roundRect(c, px - 5, py - 5, pw + 10, ph + 10, 14); c.fill();
          c.fillStyle = '#B9C9A0'; roundRect(c, px, py, pw, ph, 10); c.fill();
          c.fillStyle = '#2E3B2A'; c.font = '900 30px Nunito, ui-rounded, system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText(R ? `${Math.min(caught, R.need)} / ${R.need}` : '0', W / 2, py + ph / 2 + 2);
          // медведь с корзинкой: рабочая лапа из плеча (за туловищем), вторая опущена вдоль бока
          const bx = W / 2, side = bk.x < bx ? -1 : 1, aw = L.bearH * 0.1;
          const arm = (x0, y0, x1, y1, ex, ey) => {
            c.lineCap = 'round';
            c.strokeStyle = '#7A4A2A'; c.lineWidth = aw * 1.25; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(ex, ey, x1, y1); c.stroke();
            c.strokeStyle = '#A5683E'; c.lineWidth = aw; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(ex, ey, x1, y1); c.stroke();
          };
          const paw = (x, y) => { c.fillStyle = '#7A4A2A'; c.beginPath(); c.arc(x, y, aw * 0.72, 0, 7); c.fill(); c.fillStyle = '#C98A57'; c.beginPath(); c.arc(x, y, aw * 0.55, 0, 7); c.fill(); };
          // лапа держит корзинку сбоку за стенку (ближнюю к медведю), а не сверху — ягодки внутри видны
          const sx = bx + side * L.shX, hx = bk.x - side * L.bh * 0.42, hy = bk.y + L.bh * 0.2;
          shadow(c, bx, L.gy + 4, L.bearH * 0.75);
          arm(sx, L.shY, hx, hy, (sx + hx) / 2 + side * L.bearH * 0.05, Math.max(L.shY, hy) + L.bearH * 0.06);
          G.art.draw(c, 'bear', bx, L.gy + L.bearH * 0.04, L.bearH, { anchor: 'b', flip: side > 0 });
          const ox = bx - side * L.shX * 1.05;
          arm(ox, L.shY - aw * 0.2, ox - side * L.bearH * 0.06, L.shY + L.bearH * 0.13, ox - side * L.bearH * 0.07, L.shY + L.bearH * 0.04);
          paw(ox - side * L.bearH * 0.06, L.shY + L.bearH * 0.13);
          G.art.draw(c, 'basket_back', bk.x, bk.y, L.bh);
          inBasket.slice(-5).forEach((b, i, a) => G.art.draw(c, 'berry_red', bk.x + (i - (a.length - 1) / 2) * L.bh * 0.19, bk.y - L.bh * 0.2, L.bh * 0.3 * b.p));
          for (const b of berries) {
            c.save(); c.globalAlpha = Math.max(0, b.a);
            G.art.draw(c, b.blue ? 'berry_blue' : 'berry_red', b.x, b.y, L.br * 2, { rot: b.rot });
            c.restore();
          }
          G.art.draw(c, 'basket_front', bk.x, bk.y, L.bh);
          paw(hx, hy);
        },
        down(p) {
          if (!L) return;
          const left = p.x < api.W / 2, top = p.y < L.split;
          moveTo(left ? (top ? 0 : 1) : (top ? 2 : 3));
        },
        hint() {
          const b = berries.filter(x => x.st === 'roll' && want(x)).sort((a, z) => z.t - a.t)[0];
          if (b) { const ch = L.ch[b.k]; api.finger(ch.bx, ch.by); api.say('c_hint'); }
        },
        auto() {
          const b = berries.filter(x => (x.st === 'roll' || x.st === 'fall') && want(x)).sort((a, z) => (z.st === 'fall') - (a.st === 'fall') || z.t - a.t)[0];
          if (b) moveTo(b.k);
          else {
            const bad = berries.find(x => x.st === 'roll' && !want(x) && x.k === pos && x.t > 0.7);
            if (bad) moveTo((pos + 1) % 4);
          }
        }
      };
    }
  });

  // =====================================================================
  // 3. Заяц прячет «А» — тир: из кустов выглядывают картинки, нажимаем те, что на «А».
  // =====================================================================
  const GOOD = ['arbuz', 'apelsin', 'avtobus', 'ananas', 'aist'];
  const BAD = ['myach', 'mushroom', 'dom', 'ryba', 'grusha'];
  const SAYP = { arbuz: 'w1_p_arbuz', apelsin: 'w1_p_apelsin', avtobus: 'w1_p_avtobus', ananas: 'w1_p_ananas', aist: 'w1_p_aist', myach: 'w1_p_myach', mushroom: 'w1_p_grib', dom: 'w1_p_dom', ryba: 'w1_p_ryba', grusha: 'w1_p_grusha' };
  const OTHER = ['О', 'У', 'М', 'К', 'Б'];
  G.level({
    id: 'w1l3', world: 'w1', n: 3, title: 'Заяц прячет «А»', icon: 'hare', music: 'forest',
    sprites: [...FOREST, 'hare', ...GOOD, ...BAD],
    create(api) {
      // Поляна: задний ряд кустов у кромки леса, передний — ближе и крупнее
      const bg = forest(api, { ground: 0.5 });
      let slots = [], P = 90, bw = 120, R = null, got = [], lastSlot = -1, nextAt = 0, active = false, hare = { k: 0 };
      const bushH = s => (s && s.front ? bw * 1.15 : bw * 0.9) / G.art.size('bush')[0] * G.art.size('bush')[1];
      function layout() {
        bg.resize();
        const W = api.W, H = api.H;
        bw = Math.min(W * 0.34, H * 0.22); P = Math.min(W * 0.24, H * 0.14);
        const pos = [[0.18, 0.6], [0.5, 0.58], [0.82, 0.6], [0.3, 0.82], [0.7, 0.82]];
        if (!slots.length) slots = pos.map(([x, y], i) => ({ i, st: 'idle', k: 0, shake: 0, front: i > 2 }));
        slots.forEach((s, i) => { s.x = W * pos[i][0]; s.y = H * pos[i][1]; });
      }
      layout();
      const picY = (s, k = s.k) => s.y - bushH(s) * 0.55 - P * 0.5 * k + P * 0.6 * (1 - k);
      function pickItem(forceGood) {
        const wantGood = forceGood || (R.kind === 'pic' && !R.mix) ? true
          : (!slots.some(s => s.st !== 'idle' && s.item && s.item.good) ? true : Math.random() < 0.45);
        if (R.kind === 'pic') return { kind: 'pic', name: G.pick(wantGood ? GOOD : BAD), good: wantGood };
        return { kind: 'let', ch: wantGood ? 'А' : G.pick(OTHER), good: wantGood };
      }
      function spawn(forceGood) {
        const free = slots.filter(s => s.st === 'idle' && s.i !== lastSlot);
        if (!free.length) return;
        const s = G.pick(free); lastSlot = s.i;
        s.item = pickItem(forceGood); s.st = 'up'; s.until = api.t + R.stay;
        api.tween(s, { k: 1 }, 0.35, 'back'); api.sfx('peek');
      }
      function hide(s) {
        if (s.st !== 'up') return;
        s.st = 'down'; api.sfx('hide');
        api.tween(s, { k: 0 }, 0.28, 'inOut').then(() => { s.st = 'idle'; s.item = null; });
      }
      function round(o) { R = o; got = []; active = true; nextAt = api.t + 0.6; api.expect(true); return new Promise(r => { R.res = r; }); }
      function hit(s) {
        const it = s.item;
        if (it.good) {
          s.st = 'taken'; got.push(it); api.good(); G.buzz(15);
          const y = picY(s); api.burst(s.x, y, { n: 12 }); api.sfx('coin');
          api.say(it.kind === 'pic' ? SAYP[it.name] : 'w1_l3_yesA');
          const bar = barPos(got.length - 1);
          const f = { x: s.x, y, sc: 1, it };
          s.fly = f;
          api.tween(f, { x: bar.x, y: bar.y, sc: 0.42 }, 0.5, 'inOut').then(() => { s.fly = null; s.k = 0; s.st = 'idle'; s.item = null; });
          if (got.length >= R.need) { active = false; api.expect(false); api.after(1.6, () => { const f2 = R.res; R.res = null; f2 && f2(); }); }
        } else {
          s.shake = 1; api.sfx('wrong'); api.miss(); R.stay = Math.min(R.stay + 0.4, 5.5);
          api.say(it.kind === 'pic' ? SAYP[it.name] : 'w1_l3_notA');
          api.after(0.5, () => hide(s));
        }
      }
      function barPos(i) {
        const n = R ? R.need : 4, sz = Math.min(api.W * 0.12, 54), x0 = api.W / 2 - ((n - 1) * sz * 1.15) / 2 + sz * 0.6;
        return { x: x0 + i * sz * 1.15, y: 70 + sz * 0.75, sz };
      }
      function drawItem(c, it, x, y, size, rot = 0) {
        c.save(); c.translate(x, y); c.rotate(rot);
        c.fillStyle = 'rgba(255,255,255,.92)'; c.beginPath(); c.arc(0, 0, size * 0.62, 0, 7); c.fill();
        c.strokeStyle = 'rgba(255,107,61,.25)'; c.lineWidth = size * 0.05; c.stroke();
        if (it.kind === 'pic') G.art.draw(c, it.name, 0, 0, size * 0.8);
        else api.glyph(c, it.ch, 0, 0, size * 0.85, { color: '#6A4BD6' });
        c.restore();
      }
      return {
        resize: layout,
        async run() {
          api.rounds(3); api.round(0);
          api.card('А', { caption: 'буква А', dur: 3.2 });
          await api.say('w1_l3_intro');
          await api.wait(0.4);
          api.say('w1_l3_r1');
          await round({ kind: 'pic', mix: false, need: 3, max: 1, stay: 4.2 });
          api.round(1); api.sfx('cheer'); await api.tween(hare, { k: 1 }, 0.4, 'back'); await api.praise(); api.tween(hare, { k: 0 }, 0.3);
          api.say('w1_l3_r2');
          await round({ kind: 'pic', mix: true, need: 4, max: 2, stay: 3.8 });
          api.round(2); api.sfx('cheer'); await api.tween(hare, { k: 1 }, 0.4, 'back'); await api.praise(); api.tween(hare, { k: 0 }, 0.3);
          api.say('w1_l3_r3');
          await round({ kind: 'let', mix: true, need: 4, max: 2, stay: 3.8 });
          api.round(3); api.sfx('cheer'); await api.tween(hare, { k: 1 }, 0.4, 'back'); await api.wait(0.6);
        },
        update(dt) {
          slots.forEach(s => { if (s.shake) s.shake = Math.max(0, s.shake - dt * 2.5); });
          if (!active || !R) return;
          slots.forEach(s => { if (s.st === 'up' && api.t > s.until) hide(s); });
          const up = slots.filter(s => s.st === 'up').length;
          if (up < R.max && api.t > nextAt) { spawn(); nextAt = api.t + (R.max > 1 ? 1.1 : 0.7); }
        },
        draw(c, W, H) {
          bg.draw(c, 0);
          const drawRow = front => {
            slots.filter(s => s.front === front).forEach(s => {
              const bh = bushH(s);
              if (s.item && s.k > 0.02 && s.st !== 'taken') drawItem(c, s.item, s.x + Math.sin(s.shake * 30) * 8 * s.shake, picY(s), P);
              shadow(c, s.x, s.y + bh * 0.08, bh * 1.7, 0.14);
              G.art.draw(c, 'bush', s.x, s.y + bh * 0.1, bh, { anchor: 'b' });
            });
          };
          drawRow(false);
          if (hare.k > 0.01) G.art.draw(c, 'hare', W * 0.5, H * 0.82 + bushH(slots[3]) * 0.1 - hare.k * P * 1.3, P * 1.9, { anchor: 'b' });
          drawRow(true);
          // полоска находок
          if (R) {
            for (let i = 0; i < R.need; i++) {
              const b = barPos(i);
              c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(b.x, b.y, b.sz * 0.5, 0, 7); c.fill();
              if (got[i] && !slots.some(s => s.fly && s.fly.it === got[i])) drawItem(c, got[i], b.x, b.y, b.sz * 0.95);
            }
            const b0 = barPos(0); api.glyph(c, 'А', b0.x - b0.sz * 1.2, b0.y, b0.sz * 0.95, { color: '#FF6B3D' });
          }
          slots.forEach(s => { if (s.fly) drawItem(c, s.fly.it, s.fly.x, s.fly.y, P * s.fly.sc); });
        },
        down(p) {
          if (!active) return;
          let best = null, bd = 1e9;
          slots.forEach(s => {
            if (s.st !== 'up' || s.k < 0.5) return;
            const d = Math.hypot(p.x - s.x, p.y - picY(s));
            if (d < P * 0.75 && d < bd) { bd = d; best = s; }
          });
          if (best) hit(best);
        },
        hint() {
          let s = slots.find(x => x.st === 'up' && x.item && x.item.good);
          if (!s && active) { spawn(true); s = slots.find(x => x.st === 'up' && x.item && x.item.good); }
          // палец — туда, где картинка будет, когда выглянет целиком (а не в куст, откуда она только вылезает)
          if (s) { s.until = Math.max(s.until, api.t + 3); api.finger(s.x, picY(s, 1)); api.say('c_hint'); }
        },
        auto() {
          const s = slots.find(x => x.st === 'up' && x.k > 0.9 && x.item && x.item.good);
          if (s) hit(s);
        }
      };
    }
  });

  // =====================================================================
  // 4. Шарики для Волка — лопаем шарики с цифрами (по порядку, только «2», ровно три).
  // =====================================================================
  const BCOL = [
    { col: '#FF5C7A', light: '#FFB8C6', dark: '#C42E4E' }, { col: '#FFB020', light: '#FFE39A', dark: '#C27400' },
    { col: '#3FB6F2', light: '#B0E6FF', dark: '#1C7BB5' }, { col: '#6FD35A', light: '#C6F3B2', dark: '#379427' },
    { col: '#A98BFF', light: '#DFD3FF', dark: '#6A4CD0' }
  ];
  G.level({
    id: 'w1l4', world: 'w1', n: 4, title: 'Шарики для Волка', icon: 'wolf', music: 'forest',
    sprites: [...FOREST, 'wolf', 'cake'],
    create(api) {
      const bg = forest(api, { ground: 0.84 });
      let balls = [], BR = 40, R = null, next = 1, popped = 0, saidNot2 = false, wolfJ = { y: 0 }, cake = null;
      function layout() { bg.resize(); BR = G.clamp(Math.min(api.W * 0.11, api.H * 0.065), 28, 64); }
      layout();
      function make(nums, rise) {
        const n = nums.length, xs = G.shuffle(nums.map((_, i) => 0.14 + 0.72 * (n === 1 ? 0.5 : i / (n - 1))));
        balls = nums.map((num, i) => ({ num, bx: xs[i], ph: Math.random() * 6, y: api.H * (0.5 + i * 0.13), rise, s: 1, wob: 0, c: BCOL[i % BCOL.length], gone: false }));
      }
      const bxOf = b => api.W * b.bx + Math.sin(api.t * 0.8 + b.ph) * api.W * 0.035;
      function pop(b) {
        b.gone = true; api.sfx('pop'); G.buzz(12);
        api.burst(bxOf(b), b.y, { n: 16, colors: [b.c.col, b.c.light, '#fff'], ringSize: BR * 1.4 });
        api.tween(wolfJ, { y: 1 }, 0.15).then(() => api.tween(wolfJ, { y: 0 }, 0.25, 'bounce'));
      }
      function tap(b) {
        if (R.mode === 'order') {
          if (b.num === next) { pop(b); api.good(); api.say('n' + next); next++; if (next > 3) end(); }
          else { wobble(b); api.say('w1_l4_need' + next); }
        } else if (R.mode === 'two') {
          if (b.num === 2) { pop(b); api.good(); popped++; api.sfx('good'); if (popped >= 3) end(); }
          else { wobble(b); if (!saidNot2) { saidNot2 = true; api.say('w1_l4_not2'); } }
        } else {
          pop(b); api.good(); popped++; api.say('n' + popped);
          if (popped >= 3) { end(); balls.forEach(x => { x.rise *= 6; }); }
        }
      }
      function wobble(b) { b.wob = 1; api.sfx('wrong'); api.miss(); }
      function end() { const f = R && R.res; if (R) R.res = null; R = Object.assign({}, R, { done: true }); api.expect(false); api.after(0.9, () => f && f()); }
      function round(o) { R = o; next = 1; popped = 0; api.expect(true); return new Promise(r => { R.res = r; }); }
      function target() {
        const live = balls.filter(b => !b.gone && b.y > BR && b.y < api.H * 0.8);
        if (!R || R.done) return null;
        if (R.mode === 'order') return live.find(b => b.num === next);
        if (R.mode === 'two') return live.find(b => b.num === 2);
        return live[0];
      }
      function drawBalloon(c, b) {
        const x = bxOf(b), y = b.y, Rr = BR * (1 + Math.sin(b.wob * 18) * 0.08 * b.wob);
        c.strokeStyle = 'rgba(70,60,90,.45)'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(x, y + Rr * 1.2);
        c.quadraticCurveTo(x + Math.sin(api.t * 2 + b.ph) * Rr * 0.4, y + Rr * 2, x - Math.sin(api.t * 1.6 + b.ph) * Rr * 0.2, y + Rr * 2.8); c.stroke();
        c.fillStyle = b.c.dark; c.beginPath(); c.moveTo(x, y + Rr * 1.1); c.lineTo(x - Rr * 0.13, y + Rr * 1.3); c.lineTo(x + Rr * 0.13, y + Rr * 1.3); c.fill();
        const g = c.createRadialGradient(x - Rr * 0.35, y - Rr * 0.45, Rr * 0.1, x, y, Rr * 1.25);
        g.addColorStop(0, b.c.light); g.addColorStop(0.5, b.c.col); g.addColorStop(1, b.c.dark);
        c.fillStyle = g; c.beginPath(); c.ellipse(x, y, Rr, Rr * 1.15, 0, 0, 7); c.fill();
        c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(x - Rr * 0.42, y - Rr * 0.5, Rr * 0.17, Rr * 0.3, -0.5, 0, 7); c.fill();
        api.glyph(c, String(b.num), x, y, Rr * 1.15, { color: '#FFFFFF', color2: '#FFFFFF', stroke: b.c.dark });
      }
      function hitAt(p) {
        let best = null, bd = 1e9;
        balls.forEach(b => { if (b.gone) return; const d = Math.hypot((p.x - bxOf(b)) / 1, (p.y - b.y) / 1.15); if (d < BR * 1.25 && d < bd) { bd = d; best = b; } });
        return best;
      }
      return {
        resize: layout,
        async run() {
          api.rounds(3); api.round(0);
          make([1, 2, 3], api.H * 0.06);
          await api.say('w1_l4_intro');
          await round({ mode: 'order' });
          await api.praise(); api.round(1);
          make([2, 1, 2, 3, 2, 1], api.H * 0.07);
          api.say('w1_l4_r2');
          await round({ mode: 'two' });
          await api.praise(); api.round(2);
          make(G.shuffle([1, 2, 3, 1, 2]), api.H * 0.07);
          api.say('w1_l4_r3');
          await round({ mode: 'any' });
          cake = { y: 1, lit: true };
          await api.tween(cake, { y: 0 }, 0.6, 'back');
          api.card(3, { caption: 'три года', dur: 2.6 });
          await api.say('w1_l4_cake');
          cake.lit = false; api.sfx('whoosh'); api.burst(api.W / 2, api.H * 0.62, { n: 24, power: 1.2 });
          await api.tween(wolfJ, { y: 1 }, 0.2); await api.tween(wolfJ, { y: 0 }, 0.35, 'bounce');
          api.round(3); await api.wait(0.4);
        },
        update(dt) {
          balls.forEach(b => {
            if (b.gone) return;
            if (!(b.hold > api.t)) b.y -= b.rise * dt; // по подсказке шарик ждёт, пока до него дотянутся
            b.wob = Math.max(0, b.wob - dt * 1.6);
            if (b.y < -BR * 3.2) { if (R && R.done) b.gone = true; else b.y = api.H + BR * 1.5; }
          });
        },
        draw(c, W, H) {
          bg.draw(c, 0);
          // флажки
          const cols = ['#FF5C7A', '#FFD23F', '#3FB6F2', '#6FD35A', '#A98BFF'];
          c.strokeStyle = 'rgba(90,70,110,.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 96); c.quadraticCurveTo(W / 2, 136, W, 96); c.stroke();
          const n = Math.max(6, Math.round(W / 44));
          for (let i = 0; i < n; i++) {
            const t = (i + 0.5) / n, x = t * W, y = (1 - t) * (1 - t) * 96 + 2 * (1 - t) * t * 136 + t * t * 96;
            c.fillStyle = cols[i % cols.length]; c.beginPath(); c.moveTo(x - 13, y); c.lineTo(x + 13, y); c.lineTo(x, y + 26); c.closePath(); c.fill();
          }
          const wh = Math.min(H * 0.26, W * 0.5), gy = bg.gy;
          shadow(c, W / 2, gy + 4, wh * 0.7);
          G.art.draw(c, 'wolf', W / 2, gy + wh * 0.05 - wolfJ.y * wh * 0.18, wh, { anchor: 'b', sy: 1 + wolfJ.y * 0.05 });
          if (cake) {
            const cw = Math.min(W * 0.5, 220), cy = gy - wh * 0.15 + cake.y * H * 0.5, ch = cw / 1.5;
            G.art.draw(c, 'cake', W / 2, cy, ch, { anchor: 'b' });
            for (let i = 0; i < 3; i++) {
              const x = W / 2 + (i - 1) * cw * 0.22, top = cy - ch * 0.86;
              c.fillStyle = ['#5AB4FF', '#FFD23F', '#FF6B8B'][i]; roundRect(c, x - 5, top - ch * 0.26, 10, ch * 0.28, 4); c.fill();
              if (cake.lit) {
                const fl = 1 + Math.sin(api.t * 18 + i) * 0.12;
                c.fillStyle = '#FFB020'; c.beginPath(); c.ellipse(x, top - ch * 0.33, 6 * fl, 11 * fl, 0, 0, 7); c.fill();
                c.fillStyle = '#FFF4B0'; c.beginPath(); c.ellipse(x, top - ch * 0.31, 3, 6, 0, 0, 7); c.fill();
              }
            }
          }
          balls.forEach(b => { if (!b.gone) drawBalloon(c, b); });
        },
        down(p) { if (!R || R.done) return; const b = hitAt(p); if (b) tap(b); },
        move(p) {
          if (!R || R.done) return;
          const b = hitAt(p);
          if (b && ((R.mode === 'order' && b.num === next) || (R.mode === 'two' && b.num === 2) || R.mode === 'any')) tap(b);
        },
        hint() {
          let b = target(), y = b && b.y;
          // нужный шарик улетел за край — подплывает на виду
          if (!b && R && !R.done) {
            b = balls.find(x => !x.gone && (R.mode === 'order' ? x.num === next : R.mode === 'two' ? x.num === 2 : true));
            if (b) { y = api.H * 0.62; api.tween(b, { y }, 0.5, 'out'); }
          }
          if (b) { b.hold = api.t + 3.5; api.finger(bxOf(b), y); api.say(R.mode === 'order' ? 'w1_l4_need' + next : 'c_hint'); }
        },
        auto() { const b = target(); if (b) tap(b); }
      };
    }
  });

  // =====================================================================
  // 5. Песенка Колобка — ритм-игра + загадки Лисы. Каждое попадание — нота и слог песенки.
  // =====================================================================
  const SONG = [
    { syl: ['Я', 'Ко', 'ло', 'бок,', 'Ко', 'ло', 'бок!'], beats: [1, 1, 1, 2, 1, 1, 2], notes: [67, 69, 71, 72, 71, 69, 67], bt: 0.9, split: 4 },
    { syl: ['Я', 'по', 'ле', 'су', 'ка', 'чусь,', 'ни', 'ко', 'го', 'не', 'бо', 'юсь!'], beats: [1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2], notes: [67, 67, 69, 71, 72, 71, 69, 69, 71, 72, 74, 72], bt: 0.78, split: 6 },
    { syl: ['Пе', 'сен', 'ку', 'по', 'ю,', 'всех', 'дру', 'зей', 'лю', 'блю!'], beats: [1, 1, 1, 1, 2, 1, 1, 1, 1, 2], notes: [72, 71, 69, 71, 67, 69, 71, 72, 74, 72], bt: 0.75, split: 5 }
  ];
  G.level({
    id: 'w1l5', world: 'w1', n: 5, title: 'Песенка Колобка', icon: 'fox',
    sprites: [...FOREST, 'kolobok', 'fox', 'stump', 'berry_red', 'berry_blue', 'mushroom'],
    create(api) {
      const bg = forest(api, { ground: 0.8, sky1: '#8FC9F7', sky2: '#D8EEFF' });
      let notes = [], song = null, win = 0.42, travel = 1.9, ringX = 0, laneY = 0, sq = 1, glow = 0;
      let fox = { x: 1.15, s: 0.8 }, mush = 0, resRound = null, hearts = false;
      function layout() { bg.resize(); ringX = api.W * 0.22; laneY = api.H * 0.3; }
      layout();
      const spd = () => (api.W + 60 - ringX) / travel;
      function play(s, slow) {
        song = s; win = slow ? 0.5 : 0.42;
        const bt = s.bt * (slow ? 1.2 : 1);
        let t = api.t + travel + 0.4;
        notes = s.syl.map((syl, i) => { const n = { i, syl, n: s.notes[i], t, st: 'wait', blue: i % 2 === 1 }; t += s.beats[i] * bt; return n; });
        api.expect(true);
        return new Promise(r => { resRound = () => { r(notes.filter(n => n.st === 'hit').length / notes.length); }; });
      }
      function hitNote(n) {
        n.st = 'hit'; G.sfx.note(n.n); sq = 1.25; glow = 1; api.good();
        api.burst(ringX, laneY, { n: 8, scale: 0.6, ring: true, ringSize: 50 });
      }
      return {
        resize: layout,
        async run() {
          api.rounds(4); api.round(0);
          await api.say('w1_l5_intro');
          let k = await play(SONG[0]);
          if (k < 0.3) { await api.say('w1_l5_again'); await play(SONG[0], true); }
          api.round(1); await api.say('w1_l5_r2');
          k = await play(SONG[1]);
          if (k < 0.3) { await api.say('w1_l5_again'); await play(SONG[1], true); }
          api.round(2);
          api.tween(fox, { x: 0.78, s: 1 }, 1.2, 'inOut');
          await api.say('w1_l5_r3');
          await play(SONG[2]);
          song = null; notes = [];
          api.round(3); api.sfx('clap'); api.after(0.25, () => api.sfx('clap')); api.after(0.5, () => api.sfx('clap'));
          await api.say('w1_l5_quiz');
          await api.choose({ items: [{ label: 2 }, { label: 3 }, { label: 1 }], correct: 1, say: 'w1_q1' });
          await api.choose({ items: [{ label: 'О' }, { label: 'У' }, { label: 'А' }], correct: 2, say: 'w1_q2' });
          mush = 2;
          await api.choose({ items: [{ label: 1 }, { label: 2 }, { label: 3 }], correct: 1, say: 'w1_q3' });
          mush = 0;
          api.tween(fox, { x: 0.6, s: 1.05 }, 0.8, 'inOut'); hearts = true;
          await api.say('w1_l5_friend');
          api.round(4); await api.wait(0.5);
        },
        update(dt) {
          sq += (1 - sq) * Math.min(1, dt * 8); glow = Math.max(0, glow - dt * 3);
          if (hearts && Math.random() < dt * 3) api.burst(api.W * 0.42, api.H * 0.55, { n: 3, colors: ['#FF6B8B', '#FF9AB0'], ring: false, scale: 0.8 });
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
          const gy = bg.gy, kr = Math.min(W * 0.17, H * 0.1);
          // сцена: пенёк и Колобок
          const sh = kr * 1.1;
          shadow(c, W * 0.3, gy + 4, sh * 1.6);
          G.art.draw(c, 'stump', W * 0.3, gy + sh * 0.06, sh, { anchor: 'b' });
          G.art.draw(c, 'kolobok', W * 0.3, gy - sh * 0.62, kr * 1.5, { anchor: 'b', sx: 1 / sq, sy: sq, rot: Math.sin(api.t * 5) * 0.05 });
          const fh = kr * 1.9 * fox.s, fx = W * fox.x;
          shadow(c, fx, gy + 4, fh * 0.6);
          G.art.draw(c, 'fox', fx, gy + fh * 0.04, fh, { anchor: 'b', flip: true, rot: Math.sin(api.t * 2.4) * 0.04 });
          if (mush) for (let i = 0; i < mush; i++) G.art.draw(c, 'mushroom', W * (0.42 + i * 0.16), gy + 4, kr * 0.75, { anchor: 'b' });
          if (!song) return;
          // дорожка нот
          c.fillStyle = 'rgba(255,255,255,.45)'; roundRect(c, ringX - 40, laneY - 34, W - ringX + 60, 68, 34); c.fill();
          const near = notes.some(n => n.st === 'wait' && Math.abs(n.t - api.t) < win);
          c.strokeStyle = near ? '#FFB020' : '#fff'; c.lineWidth = 7 + glow * 5;
          c.beginPath(); c.arc(ringX, laneY, 34 + glow * 6, 0, 7); c.stroke();
          for (const n of notes) {
            if (n.st === 'hit') continue;
            const x = ringX + (n.t - api.t) * spd();
            if (x > W + 60 || x < -60) continue;
            G.art.draw(c, n.blue ? 'berry_blue' : 'berry_red', x, laneY, 52, { alpha: n.st === 'miss' ? 0.35 : 1 });
          }
          // слова песенки
          const fs = G.clamp(W * 0.075, 20, 40);
          c.font = `900 ${fs}px Nunito, ui-rounded, system-ui, sans-serif`; c.textBaseline = 'middle'; c.textAlign = 'left';
          const rows = [song.syl.slice(0, song.split), song.syl.slice(song.split)];
          const curI = (notes.find(n => n.st === 'wait') || {}).i;
          rows.forEach((row, ri) => {
            const off = ri ? song.split : 0;
            const ws = row.map(s => c.measureText(s).width), gap = fs * 0.28, tot = ws.reduce((a, b) => a + b, 0) + gap * (row.length - 1);
            let x = W / 2 - tot / 2; const y = laneY + 70 + ri * fs * 1.35;
            row.forEach((s, i) => {
              const n = notes[off + i];
              if (n.i === curI) { c.fillStyle = 'rgba(255,210,63,.9)'; roundRect(c, x - 6, y - fs * 0.62, ws[i] + 12, fs * 1.24, fs * 0.4); c.fill(); }
              c.fillStyle = n.st === 'hit' ? '#FF5A2E' : n.st === 'miss' ? '#9B87B5' : '#4A3F66';
              c.fillText(s, x, y + 1); x += ws[i] + gap;
            });
          });
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
})();
