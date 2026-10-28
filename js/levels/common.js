'use strict';
// Общее для уровней: лесной фон с параллаксом, тень, скруглённый прямоугольник, единица размера.
(function () {
  const FOREST = ['tree_fir', 'tree_round', 'bush', 'cloud', 'grass'];

  // ---------- общий лесной фон: небо, солнце, холмы и деревья с параллаксом ----------
  function forest(api, o = {}) {
    const st = { gy: 0 };
    let sky, far, mid, W = 1, H = 1, farTop = 0, midTop = 0;
    const mk = (w, h) => {
      const d = api.dpr, c = document.createElement('canvas');
      c.width = Math.max(1, Math.ceil(w * d)); c.height = Math.max(1, Math.ceil(h * d));
      const x = c.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); return [c, x];
    };
    function hill(x, top, amp, per, col, ph) {
      x.fillStyle = col; x.beginPath(); x.moveTo(0, st.gy - top + 4);
      for (let i = 0; i <= 64; i++) {
        const px = i / 64 * W;
        x.lineTo(px, st.gy - top - amp * 0.55 - Math.sin(px / W * Math.PI * 2 * per + ph) * amp * 0.35 - Math.sin(px / W * Math.PI * 2 * (per + 2) + ph * 2) * amp * 0.12);
      }
      x.lineTo(W, st.gy - top + 4); x.closePath(); x.fill();
    }
    st.resize = () => {
      W = api.W; H = api.H; st.gy = Math.round(H * ((typeof o.ground === 'function' ? o.ground() : o.ground) || 0.8));
      let x;
      [sky, x] = mk(W, H);
      const g = x.createLinearGradient(0, 0, 0, st.gy);
      g.addColorStop(0, o.sky1 || '#79C6F4'); g.addColorStop(0.65, o.sky2 || '#BFE8FF'); g.addColorStop(1, '#F2FBFF');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      const sx = W * 0.84, sy = Math.min(H * 0.17, 150), sr = Math.min(W, H) * 0.085;
      const sg = x.createRadialGradient(sx, sy, sr * 0.3, sx, sy, sr * 2.4);
      sg.addColorStop(0, 'rgba(255,240,170,.9)'); sg.addColorStop(0.45, 'rgba(255,230,140,.3)'); sg.addColorStop(1, 'rgba(255,230,140,0)');
      x.fillStyle = sg; x.fillRect(sx - sr * 2.4, sy - sr * 2.4, sr * 4.8, sr * 4.8);
      x.fillStyle = '#FFE27A'; x.beginPath(); x.arc(sx, sy, sr, 0, 7); x.fill();
      // дальние холмы — полоса над землёй
      const fh = H * 0.22; farTop = st.gy - fh;
      [far, x] = mk(W, fh + 6); x.translate(0, -farTop);
      hill(x, 0, H * 0.13, 2, '#B3E3A3', 0); hill(x, 0, H * 0.075, 3, '#8ED283', 1.3);
      // деревья
      const mh = H * 0.42; midTop = st.gy - mh;
      [mid, x] = mk(W, mh + 8); x.translate(0, -midTop);
      // o.trees — густота леса (1 — лес, 0.4 — поляна с редкими деревьями)
      const dens = o.trees == null ? 1 : o.trees, n = Math.max(2, Math.round(W / 120 * dens));
      for (let i = 0; i < n; i++) {
        const tx = (i + 0.5) * W / n + ((i * 37) % 23 - 11), th = H * (0.2 + ((i * 53) % 9) / 100);
        const nm = i % 3 === 1 ? 'tree_round' : 'tree_fir';
        for (const off of [-W, 0, W]) G.art.draw(x, nm, tx + off, st.gy + 6, th, { anchor: 'b' });
      }
      for (let i = 0; i < n; i++) {
        const bx = (i + 0.1) * W / n;
        for (const off of [-W, 0, W]) G.art.draw(x, 'bush', bx + off, st.gy + 8, H * 0.06, { anchor: 'b' });
      }
    };
    const tile = (c, img, top, off, h) => {
      const ox = -(((off % W) + W) % W);
      c.drawImage(img, ox, top, W, h); c.drawImage(img, ox + W, top, W, h);
    };
    st.draw = (c, scroll = 0) => {
      c.drawImage(sky, 0, 0, W, H);
      for (let i = 0; i < 3; i++) {
        const span = W + 260;
        const cx = (((i * 0.41 * W + api.t * (10 + i * 5) - scroll * 0.05) % span) + span) % span - 130;
        G.art.draw(c, 'cloud', cx, H * (0.12 + 0.08 * i), Math.min(H * 0.07, 70) * (1 + i * 0.15), { alpha: 0.95 });
      }
      tile(c, far, farTop, scroll * 0.15, H * 0.22 + 6);
      tile(c, mid, midTop, scroll * 0.45, H * 0.42 + 8);
      const gg = c.createLinearGradient(0, st.gy, 0, H);
      gg.addColorStop(0, o.ground1 || '#7DCB5F'); gg.addColorStop(1, o.ground2 || '#4F9E46');
      c.fillStyle = gg; c.fillRect(0, st.gy, W, H - st.gy);
      if (o.path) {
        c.fillStyle = '#E8C98F'; c.fillRect(0, st.gy + 2, W, Math.max(10, H * 0.035));
        c.fillStyle = 'rgba(160,110,60,.25)';
        for (let i = 0; i < 12; i++) { const px = (((i * 97 - scroll) % W) + W) % W; c.fillRect(px, st.gy + 6 + (i % 3) * 4, 10, 3); }
      }
      c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(0, st.gy, W, 2);
      if (o.flowers) {
        const cols = ['#FFFFFF', '#FFD23F', '#FF8FB1', '#B7A6FF'];
        for (let i = 0; i < 18; i++) {
          const fx = ((i * 0.618 * W * 1.7) % W), fy = st.gy + 14 + ((i * 47) % 100) / 100 * (H - st.gy - 28), r = 3 + (i % 3);
          c.fillStyle = cols[i % 4];
          for (let k = 0; k < 5; k++) { const a = k * 1.2566; c.beginPath(); c.arc(fx + Math.cos(a) * r, fy + Math.sin(a) * r, r * 0.75, 0, 7); c.fill(); }
          c.fillStyle = '#FFB020'; c.beginPath(); c.arc(fx, fy, r * 0.6, 0, 7); c.fill();
        }
      }
      const gw = 90, gh = Math.min(H * 0.035, 30), off = ((scroll % gw) + gw) % gw;
      for (let x = -off; x < W + gw; x += gw) G.art.draw(c, 'grass', x, st.gy + 3, gh, { anchor: 'b' });
    };
    return st;
  }
  function shadow(c, x, y, w, a = 0.18) {
    c.fillStyle = `rgba(30,40,20,${a})`; c.beginPath(); c.ellipse(x, y, w / 2, w * 0.13, 0, 0, 7); c.fill();
  }
  const U = api => Math.min(api.W, api.H) / 100;

  function roundRect(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }

  G.lv = { FOREST, forest, shadow, roundRect, U };
})();
