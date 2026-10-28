'use strict';
// Звук. Эффекты и музыка синтезируются (скачивать нечего), озвучка — из пакетов audio/*.mp3,
// а пока пакета нет — голос браузера. Ничто здесь не блокирует игру: say() можно не ждать.
(function () {
  const S = () => G.store.s;
  const A = G.audio = {
    ctx: null, master: null, sfxBus: null, musicBus: null, voiceBus: null, gestured: false,

    // Контекст можно создать заранее (для декодирования озвучки), запустится он по первому касанию.
    ensure() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC || this.ctx) return this.ctx;
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* ok */ }
      const c = this.ctx = new AC();
      this.master = c.createGain(); this.master.connect(c.destination);
      this.sfxBus = c.createGain(); this.sfxBus.connect(this.master);
      this.musicBus = c.createGain(); this.musicBus.connect(this.master);
      this.voiceBus = c.createGain(); this.voiceBus.connect(this.master);
      this.apply();
      return c;
    },
    // Будит звук. Телефоны разрешают включить звук только по «настоящему» нажатию — когда палец
    // отпущен (touchend / click), а не в момент касания. Поэтому будим на всех событиях и пока
    // контекст не заработал — повторяем каждый раз.
    wake(gesture) {
      const c = this.ensure(); if (!c) return;
      if (c.state !== 'running') {
        try { const p = c.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ok */ }
        try { const b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); } catch (e) { /* ok */ }
      }
      if (gesture && !this.gestured) {
        this.gestured = true; unmuteIOS();
        if (!Object.keys(G.VOICE_PACKS || {}).length) V.unlockTTS(); // голос браузера нужен, только если записей нет
      }
    },
    // Подождать, пока звук заработает (не дольше ms). true — работает.
    runWait(ms) {
      if (this.ok) return Promise.resolve(true);
      if (!this.ctx) return Promise.resolve(false);
      try { const p = this.ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ok */ }
      return new Promise(res => {
        const t0 = performance.now();
        const chk = () => { if (this.ok) res(true); else if (performance.now() - t0 > ms) res(false); else setTimeout(chk, 40); };
        chk();
      });
    },
    // Применить настройки: «весь звук выкл» глушит всё сразу, музыка выключается отдельно
    apply() {
      if (S().mute) { try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { /* ok */ } }
      if (this.ctx) {
        const t = this.ctx.currentTime;
        this.master.gain.setValueAtTime(S().mute ? 0 : 0.9, t);
        this.sfxBus.gain.setValueAtTime(S().sfx ? 0.9 : 0, t);
        this.voiceBus.gain.setValueAtTime(S().voice ? 1 : 0, t);
        this.duck(V.speaking);
      }
      M.sync();
    },
    duck(on) {
      if (!this.ctx) return;
      const g = this.musicBus.gain, t = this.ctx.currentTime;
      g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
      g.setTargetAtTime(S().music && !S().mute ? (on ? 0.25 : 0.7) : 0, t, 0.12);
    },
    get ok() { return !!(this.ctx && this.ctx.state === 'running'); }
  };

  // Сворачивание: глушим контекст (экономия батареи), при возврате — будим.
  document.addEventListener('visibilitychange', () => {
    if (!A.ctx) return;
    if (document.hidden) { V.stop(); try { A.ctx.suspend(); } catch (e) { /* ok */ } }
    else { try { A.ctx.resume(); } catch (e) { /* ok */ } }
  });
  window.addEventListener('pageshow', () => { if (A.ctx) try { A.ctx.resume(); } catch (e) { /* ok */ } });
  window.addEventListener('pointerdown', () => A.wake(false), { capture: true, passive: true });
  ['pointerup', 'touchend', 'click', 'keydown'].forEach(ev => window.addEventListener(ev, () => A.wake(true), { capture: true, passive: true }));

  // iPhone с выключенным звонком (переключатель сбоку) глушит Web Audio, но не обычный <audio>.
  // Тихий зацикленный <audio> переводит страницу в режим «плеер», и голос с музыкой становятся слышны.
  // На iOS 17+ то же делает navigator.audioSession — тогда трюк не нужен.
  let unmuteEl = null;
  function unmuteIOS() {
    const iOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (!iOS || unmuteEl || navigator.audioSession) return;
    const rate = 8000, n = 4000, buf = new ArrayBuffer(44 + n), v = new DataView(buf);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
    v.setUint16(22, 1, true); v.setUint32(24, rate, true); v.setUint32(28, rate, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
    w(36, 'data'); v.setUint32(40, n, true); for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
    unmuteEl = document.createElement('audio');
    unmuteEl.setAttribute('x-webkit-airplay', 'deny'); unmuteEl.setAttribute('playsinline', '');
    unmuteEl.loop = true; unmuteEl.src = URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
    try { const p = unmuteEl.play(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ok */ }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) unmuteEl.pause(); else { const p = unmuteEl.play(); if (p && p.catch) p.catch(() => {}); }
    });
  }

  // ---------- синтез ----------
  function tone({ f = 440, type = 'sine', t = 0, dur = 0.2, vol = 0.25, attack = 0.005, slide = 0, dest }) {
    const c = A.ctx; if (!c || c.state !== 'running') return;
    const t0 = c.currentTime + Math.max(0, t);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || A.sfxBus);
    o.start(t0); o.stop(t0 + dur + 0.03);
  }
  let noiseBuf = null;
  function noise({ t = 0, dur = 0.1, vol = 0.2, freq = 1500, q = 0.7, kind = 'lowpass', sweep = 0, dest }) {
    const c = A.ctx; if (!c || c.state !== 'running') return;
    if (!noiseBuf) {
      noiseBuf = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t0 = c.currentTime + Math.max(0, t);
    const s = c.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const fl = c.createBiquadFilter(); fl.type = kind; fl.frequency.setValueAtTime(freq, t0); fl.Q.value = q;
    if (sweep) fl.frequency.exponentialRampToValueAtTime(sweep, t0 + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(fl); fl.connect(g); g.connect(dest || A.sfxBus);
    s.start(t0); s.stop(t0 + dur + 0.03);
  }
  G.tone = tone; G.noise = noise;
  const nf = n => 440 * Math.pow(2, (n - 69) / 12); // midi → Гц
  G.nf = nf;

  const SFX = G.sfx = {
    tap() { tone({ f: 880, slide: 1100, type: 'triangle', dur: 0.06, vol: 0.12 }); },
    pop() { tone({ f: 420, slide: 1500, dur: 0.08, vol: 0.28 }); noise({ dur: 0.06, vol: 0.18, freq: 3500, kind: 'highpass' }); },
    jump() { tone({ f: 300, slide: 760, type: 'square', dur: 0.16, vol: 0.07 }); tone({ f: 600, slide: 1300, dur: 0.16, vol: 0.1 }); },
    land() { tone({ f: 140, slide: 70, dur: 0.12, vol: 0.25 }); },
    coin() { tone({ f: 988, type: 'square', dur: 0.07, vol: 0.06 }); tone({ f: 1319, type: 'square', t: 0.07, dur: 0.22, vol: 0.06 }); tone({ f: 1319, t: 0.07, dur: 0.25, vol: 0.12 }); },
    good() { tone({ f: 784, type: 'triangle', dur: 0.12, vol: 0.2 }); tone({ f: 1175, type: 'triangle', t: 0.09, dur: 0.22, vol: 0.18 }); },
    wrong() { tone({ f: 392, slide: 349, type: 'triangle', dur: 0.16, vol: 0.16 }); tone({ f: 330, slide: 311, type: 'triangle', t: 0.15, dur: 0.22, vol: 0.14 }); },
    star() { [1568, 2093, 2637].forEach((f, i) => tone({ f, t: i * 0.06, dur: 0.3, vol: 0.07 })); },
    fanfare() {
      [[72, 0], [76, 0.12], [79, 0.24], [84, 0.36], [79, 0.56], [84, 0.68]].forEach(([n, t]) => {
        tone({ f: nf(n), type: 'square', t, dur: 0.22, vol: 0.05 }); tone({ f: nf(n), type: 'triangle', t, dur: 0.3, vol: 0.16 });
      });
      tone({ f: nf(48), type: 'triangle', t: 0.36, dur: 0.8, vol: 0.2 });
      for (let i = 0; i < 6; i++) tone({ f: G.rand(2000, 3200), t: 0.7 + i * 0.05, dur: 0.12, vol: 0.04 });
    },
    whoosh() { noise({ dur: 0.35, vol: 0.14, freq: 500, sweep: 2600, kind: 'bandpass', q: 1.4 }); },
    flip() { noise({ dur: 0.12, vol: 0.12, freq: 900, sweep: 3200, kind: 'bandpass', q: 1.2 }); tone({ f: 700, slide: 1000, type: 'triangle', dur: 0.06, vol: 0.06 }); },
    boing() { tone({ f: 180, slide: 420, dur: 0.12, vol: 0.2 }); tone({ f: 420, slide: 200, t: 0.12, dur: 0.18, vol: 0.16 }); },
    lcd() { tone({ f: 2093, type: 'square', dur: 0.045, vol: 0.05 }); },
    drop() { tone({ f: 260, slide: 120, dur: 0.1, vol: 0.18 }); noise({ dur: 0.08, vol: 0.1, freq: 800 }); },
    peek() { tone({ f: 600, slide: 900, type: 'triangle', dur: 0.09, vol: 0.12 }); },
    hide() { tone({ f: 700, slide: 380, type: 'triangle', dur: 0.1, vol: 0.1 }); },
    cheer() { [0, 0.07, 0.14].forEach((t, i) => tone({ f: [880, 1109, 1319][i], type: 'triangle', t, dur: 0.16, vol: 0.12 })); },
    clap() { noise({ dur: 0.06, vol: 0.22, freq: 1600, kind: 'bandpass', q: 0.9 }); noise({ t: 0.02, dur: 0.05, vol: 0.12, freq: 2400, kind: 'bandpass' }); },
    tick() { tone({ f: 1500, type: 'square', dur: 0.025, vol: 0.03 }); },
    note(n, vol = 0.22) { tone({ f: nf(n), type: 'triangle', dur: 0.45, vol }); tone({ f: nf(n + 12), dur: 0.2, vol: vol * 0.3 }); tone({ f: nf(n), type: 'square', dur: 0.12, vol: vol * 0.12 }); },
    soft(n) { tone({ f: nf(n), type: 'triangle', dur: 0.35, vol: 0.06 }); }
  };

  // ---------- музыка (чиптюн-петли с планировщиком) ----------
  // Ноты — midi; null — пауза. Каждый шаг — восьмая.
  const TRACKS = {
    map: { bpm: 104, lead: [72, null, 76, 79, null, 76, 74, null, 72, null, 69, 72, null, null, 74, null, 76, null, 79, 81, null, 79, 76, null, 74, null, 72, 74, null, null, null, null],
      bass: [48, null, null, null, 55, null, null, null, 45, null, null, null, 52, null, null, null, 53, null, null, null, 48, null, null, null, 50, null, null, null, 55, null, null, null] },
    forest: { bpm: 116, lead: [74, 76, 78, null, 81, null, 78, null, 76, 74, 76, null, 71, null, null, null, 74, 76, 78, null, 81, null, 83, 81, 78, null, 76, null, 74, null, null, null],
      bass: [50, null, 57, null, 50, null, 57, null, 47, null, 54, null, 47, null, 54, null, 43, null, 50, null, 43, null, 50, null, 45, null, 52, null, 50, null, null, null] },
    meadow: { bpm: 112, lead: [79, null, 76, null, 74, 76, 79, null, 81, null, 79, 76, 74, null, null, null, 76, null, 74, null, 72, 74, 76, null, 74, 72, 71, null, 67, null, null, null],
      bass: [43, null, null, null, 50, null, null, null, 48, null, null, null, 50, null, null, null, 52, null, null, null, 48, null, null, null, 50, null, null, null, 43, null, 50, null] },
    garden: { bpm: 120, lead: [67, null, 67, 69, 71, null, 67, null, 72, null, 71, 69, 67, null, null, null, 69, null, 69, 71, 72, null, 69, null, 71, 69, 67, 66, 67, null, null, null],
      bass: [43, null, 50, null, 43, null, 50, null, 48, null, 55, null, 43, null, 50, null, 45, null, 52, null, 48, null, 55, null, 50, null, 54, null, 43, null, 50, null] },
    bears: { bpm: 100, lead: [62, null, 65, null, 69, null, 67, 65, 64, null, 62, null, 64, null, null, null, 65, null, 69, null, 72, null, 70, 69, 67, null, 65, 64, 62, null, null, null],
      bass: [38, null, null, null, 45, null, null, null, 43, null, null, null, 45, null, null, null, 41, null, null, null, 38, null, null, null, 43, null, null, null, 45, null, 38, null] },
    sea: { bpm: 96, lead: [72, null, 71, 72, 74, null, 76, null, 79, null, 76, null, 74, null, null, null, 72, null, 71, 69, 67, null, 69, null, 71, null, 72, null, 74, null, null, null],
      bass: [48, null, 55, null, 52, null, 55, null, 45, null, 52, null, 48, null, 52, null, 41, null, 48, null, 45, null, 48, null, 43, null, 50, null, 47, null, 50, null] }
  };
  // want — какая музыка должна играть на этом экране; если музыка выключена, планировщик не крутится вовсе
  const M = G.music = {
    cur: null, want: null, timer: null, step: 0, next: 0,
    play(name) { this.want = name; this.sync(); },
    stop() { this.want = null; this.halt(); },
    halt() { clearInterval(this.timer); this.timer = null; this.cur = null; },
    sync() {
      const name = this.want;
      if (!A.ctx || !name || !S().music || S().mute) { this.halt(); return; }
      if (this.cur === name && this.timer) return;
      this.halt();
      const tr = TRACKS[name]; if (!tr) return;
      this.cur = name; this.step = 0; this.next = A.ctx.currentTime + 0.15;
      A.duck(V.speaking);
      const dt = 60 / tr.bpm / 2;
      this.timer = setInterval(() => {
        const c = A.ctx; if (!c || c.state !== 'running') return;
        if (this.next < c.currentTime - 0.5) this.next = c.currentTime + 0.05; // после паузы не догоняем
        while (this.next < c.currentTime + 0.25) {
          const t = this.next - c.currentTime, i = this.step % tr.lead.length;
          const l = tr.lead[i], b = tr.bass[i];
          if (l != null) { tone({ f: nf(l), type: 'square', t, dur: dt * 0.9, vol: 0.022, dest: A.musicBus }); tone({ f: nf(l), type: 'triangle', t, dur: dt * 1.2, vol: 0.05, dest: A.musicBus }); }
          if (b != null) tone({ f: nf(b), type: 'triangle', t, dur: dt * 3, vol: 0.09, dest: A.musicBus });
          if (i % 4 === 2) noise({ t, dur: 0.03, vol: 0.02, freq: 7000, kind: 'highpass', dest: A.musicBus });
          this.step++; this.next += dt;
        }
      }, 60);
    }
  };

  // ---------- озвучка ----------
  const V = G.voice = {
    lines: {}, packs: {}, speaking: false, token: null, ruVoice: null, ttsOk: false,
    // Пакет: один mp3 на мир + смещения реплик (генерирует tools/voice.mjs → js/voice-packs.js)
    has(id) { const p = this.packOf(id); return !!(p && this.packs[p] && this.packs[p].buf); },
    packOf(id) { const P = G.VOICE_PACKS || {}; for (const k in P) if (P[k].lines[id]) return k; return null; },
    async loadPack(name, onProgress) {
      const P = (G.VOICE_PACKS || {})[name];
      if (!P || (this.packs[name] && this.packs[name].buf)) { onProgress && onProgress(1); return; }
      if (!A.ensure()) return;
      if (this.packs[name] && this.packs[name].loading) return this.packs[name].loading;
      const job = (async () => {
        const ctl = window.AbortController ? new AbortController() : null;
        const to = setTimeout(() => ctl && ctl.abort(), 20000);
        try {
          const r = await fetch(P.file, ctl ? { signal: ctl.signal } : undefined);
          if (!r.ok) throw new Error('voice ' + r.status);
          let ab;
          const total = +r.headers.get('content-length') || 0;
          if (r.body && r.body.getReader && total && onProgress) {
            const rd = r.body.getReader(), parts = []; let got = 0;
            for (;;) { const { done, value } = await rd.read(); if (done) break; parts.push(value); got += value.length; onProgress(Math.min(0.95, got / total)); }
            const u = new Uint8Array(got); let o = 0; parts.forEach(p => { u.set(p, o); o += p.length; }); ab = u.buffer;
          } else ab = await r.arrayBuffer();
          const buf = await new Promise((res, rej) => { const pr = A.ctx.decodeAudioData(ab, res, rej); if (pr && pr.then) pr.then(res, rej); });
          this.packs[name] = { buf };
        } catch (e) { console.warn('Озвучка не загрузилась, будет голос браузера', name, e); this.packs[name] = { failed: true, err: String(e && e.message || e) }; }
        finally { clearTimeout(to); onProgress && onProgress(1); }
      })();
      this.packs[name] = { loading: job };
      return job;
    },
    // Для вступлений: подождать пакет с этой репликой (не дольше maxMs), потом сказать
    sayWhenReady(id, maxMs = 2500) {
      const pk = this.packOf(id);
      if (!pk || this.has(id)) return this.say(id);
      const tk = this.pending = {};
      // Если за это время прозвучало что-то другое или звук остановили — вступление уже не к месту
      return Promise.race([this.loadPack(pk), new Promise(r => setTimeout(r, maxMs))]).then(() => { if (this.pending === tk) return this.say(id); });
    },
    // Сказать реплику. Возвращает промис «договорила» — ждать его не обязательно.
    say(id) {
      this.pending = null;
      const text = this.lines[id];
      if (text == null) { console.warn('Нет реплики', id); return Promise.resolve(); }
      this.stop();
      const token = { id }; this.token = token;
      this.speaking = true; A.duck(true);
      G.emit('speak', { on: true, id, text });
      let p;
      const on = S().voice && !S().mute;
      if (G.TEST) p = new Promise(r => setTimeout(r, 40));
      else if (on && this.has(id)) {
        // Есть запись Марины — ждём, пока звук проснётся (до 1,5 с), и только если не проснулся — голос браузера
        p = A.runWait(1500).then(ok => {
          if (this.token !== token) return;
          this.mode = ok ? 'pack' : 'tts';
          return ok ? this.playPack(id, token) : (S().tts ? this.tts(text, token) : undefined);
        });
      }
      else if (on && S().tts) { this.mode = 'tts'; p = this.tts(text, token); }
      else p = new Promise(r => { const t = setTimeout(r, 700 + text.length * 55); token.stop = () => { clearTimeout(t); r(); }; });
      const fin = () => { if (this.token === token) { this.token = null; this.speaking = false; A.duck(false); G.emit('speak', { on: false, id }); } };
      return p.then(fin, fin);
    },
    playPack(id, token) {
      const pk = this.packOf(id), [st, dur] = G.VOICE_PACKS[pk].lines[id], buf = this.packs[pk].buf;
      return new Promise(res => {
        const s = A.ctx.createBufferSource(); s.buffer = buf; s.connect(A.voiceBus);
        let done = false; const end = () => { if (!done) { done = true; clearTimeout(g); res(); } };
        const g = setTimeout(end, (dur + 0.5) * 1000);
        s.onended = end;
        token.stop = () => { try { s.stop(); } catch (e) { /* ok */ } end(); };
        s.start(0, st, dur);
      });
    },
    unlockTTS() {
      const ss = window.speechSynthesis; if (!ss || !window.SpeechSynthesisUtterance) return;
      try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; ss.speak(u); } catch (e) { /* ok */ }
    },
    pickVoice() {
      const ss = window.speechSynthesis; if (!ss) return;
      const vs = ss.getVoices().filter(v => /^ru/i.test(v.lang)); if (!vs.length) return;
      const score = v => (/milena|милена|katya|катя|alena|алёна|irina|ирина|svetlana|anna|google|yandex|female|жен/i.test(v.name) ? 10 : 0)
        + (/enhanced|premium|улучш|natural/i.test(v.name) ? 5 : 0) - (/yuri|юрий|maxim|pavel|dmitr|male/i.test(v.name) ? 8 : 0) + (v.localService ? 1 : 0);
      vs.sort((a, b) => score(b) - score(a)); this.ruVoice = vs[0]; this.ttsOk = true;
    },
    tts(text, token) {
      return new Promise(res => {
        const ss = window.speechSynthesis;
        const est = 900 + text.length * 70;
        let done = false;
        const end = () => { if (done) return; done = true; clearTimeout(guard); res(); };
        const guard = setTimeout(end, est * 1.7 + 1200); // Chrome иногда «теряет» onend
        token.stop = () => { end(); try { ss && ss.cancel(); } catch (e) { /* ok */ } };
        if (!ss || !window.SpeechSynthesisUtterance) return;
        const u = new SpeechSynthesisUtterance(text.replace(/[«»]/g, '').replace(/-/g, ' '));
        u.lang = 'ru-RU'; if (this.ruVoice) u.voice = this.ruVoice;
        u.rate = 0.95; u.pitch = 1.1;
        u.onend = end; u.onerror = end;
        this._u = u; // держим ссылку, иначе onend может не прийти
        try { ss.speak(u); } catch (e) { end(); }
      });
    },
    stop() {
      this.pending = null;
      const t = this.token; this.token = null;
      if (t && t.stop) t.stop();
      if (this.speaking) { this.speaking = false; A.duck(false); G.emit('speak', { on: false }); }
    }
  };
  if (window.speechSynthesis) {
    V.pickVoice();
    try { speechSynthesis.addEventListener('voiceschanged', () => V.pickVoice()); } catch (e) { /* ok */ }
  }
  // Регистрация реплик: G.lines({ id: 'текст' })
  G.lines = obj => Object.assign(V.lines, obj);
})();
