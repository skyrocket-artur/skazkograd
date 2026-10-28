'use strict';
// Экраны: заставка, карта сказок, тропинка мира, «сказка пройдена», экран родителей, «Поделиться».
(function () {
  const { h } = G;
  const S = () => G.store.s;
  const save = () => G.store.save();

  const I = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
  G.ICON = {
    home: I('<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>'),
    back: I('<path d="M15 5l-7 7 7 7"/>'),
    lamp: I('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2h5c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3z" fill="#FFE36B" stroke="#7A5A00"/>'),
    star: '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.2l-5.9 3.2 1.3-6.5L2.5 9.3l6.6-.8z" fill="#FFD23F" stroke="#E8A400" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    lock: I('<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
    gear: I('<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v2.6M12 18.9v2.6M4.6 4.6l1.9 1.9M17.5 17.5l1.9 1.9M2.5 12h2.6M18.9 12h2.6M4.6 19.4l1.9-1.9M17.5 6.5l1.9-1.9"/>'),
    share: I('<path d="M12 3v12"/><path d="M7.5 7.5 12 3l4.5 4.5"/><path d="M5 12v7.5h14V12"/>'),
    play: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>',
    music: I('<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>'),
    musicOff: I('<path d="M9 18V5l11-2v13" opacity=".45"/><circle cx="6" cy="18" r="3" opacity=".45"/><circle cx="17" cy="16" r="3" opacity=".45"/><path d="M3 3l18 18" stroke="#D9481C"/>'),
    sound: I('<path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>'),
    soundOff: I('<path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" opacity=".45"/><path d="M16 9l5 6M21 9l-5 6" stroke="#D9481C"/>'),
    close: I('<path d="M6 6l12 12M18 6 6 18"/>')
  };

  // Кнопки «музыка» и «весь звук» — на каждом экране. Состояние общее, все копии перерисовываются вместе.
  function paintSound(box) {
    const s = S(), [mus, snd] = box.children, musOn = s.music && !s.mute;
    mus.innerHTML = musOn ? G.ICON.music : G.ICON.musicOff; mus.classList.toggle('off', !musOn);
    mus.setAttribute('aria-label', musOn ? 'Выключить музыку' : 'Включить музыку');
    snd.innerHTML = s.mute ? G.ICON.soundOff : G.ICON.sound; snd.classList.toggle('off', !!s.mute);
    snd.setAttribute('aria-label', s.mute ? 'Включить звук' : 'Выключить весь звук');
  }
  function soundChanged() { save(); G.audio.apply(); document.querySelectorAll('.sound-btns').forEach(paintSound); }
  G.soundBtns = function () {
    const mus = h('button', { class: 'icon-btn' }), snd = h('button', { class: 'icon-btn' });
    mus.addEventListener('click', () => {
      const s = S();
      if (s.mute || !s.music) { s.mute = false; s.music = true; } else s.music = false;
      soundChanged(); G.sfx.tap();
    });
    snd.addEventListener('click', () => {
      const s = S(); s.mute = !s.mute;
      if (s.mute) G.voice.stop();
      soundChanged(); if (!s.mute) G.sfx.tap();
    });
    const box = h('div', { class: 'sound-btns' }, mus, snd);
    paintSound(box);
    return box;
  };

  G.WORLDS = [
    { id: 'w1', title: 'Колобок', learn: 'цифры 1–3 · буква А · цвета', art: 'kolobok', open: true, cls: 'w-forest', task: 'w1_task', done: 'w1_done', intro: 'w1_intro',
      music: 'forest', friends: ['hare', 'wolf', 'kolobok', 'bear', 'fox'], deco: ['tree_fir', 'tree_round', 'tree_fir', 'bush'] },
    { id: 'w2', title: 'Теремок', learn: 'цифры 4–5 · буква О · фигуры', art: 'teremok', open: true, cls: 'w-meadow', task: 'w2_task', done: 'w2_done', intro: 'w2_intro',
      music: 'meadow', friends: ['mouse', 'frog', 'teremok', 'hare', 'fox'], deco: ['tree_round', 'bush', 'tree_round', 'bush'] },
    { id: 'w3', title: 'Репка', learn: 'цифры 6–7 · буква У · порядок', art: 'repka', cls: 'w-garden' },
    { id: 'w4', title: 'Три медведя', learn: 'цифры 8–9 · буквы И, Ы · размеры', art: 'bear', cls: 'w-bears' },
    { id: 'w5', title: 'Золотая рыбка', learn: 'цифра 10 · сложение', art: 'rybka', cls: 'w-sea' }
  ];
  const levelsOf = w => G.LEVELS.filter(l => l.world === w.id).sort((a, b) => a.n - b.n);
  const isDone = l => !!S().done[l.id];
  const unlocked = (w, l) => S().unlockAll || l.n === 1 || levelsOf(w).filter(x => x.n < l.n).every(isDone);
  const worldDone = w => { const ls = levelsOf(w); return ls.length > 0 && ls.every(isDone); };

  // ---------- смена экранов ----------
  const app = () => G.$('#app');
  let cur = null;
  const ui = G.ui = {
    mount(el) {
      const old = cur; cur = el;
      el.classList.add('enter');
      app().append(el);
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('enter')));
      if (old) { old.classList.add('leave'); setTimeout(() => old.remove(), 320); }
    }
  };

  // ---------- заставка ----------
  ui.splash = function () {
    const play = h('button', { class: 'btn huge play', html: G.ICON.play + '<span>Играть</span>' });
    const el = h('div', { class: 'screen splash' },
      h('div', { class: 'sun' }),
      h('div', { class: 'splash-top' }, G.soundBtns()),
      G.art.img('cloud', 'cl c1'), G.art.img('cloud', 'cl c2'),
      h('div', { class: 'logo' }, h('h1', null, 'Сказкоград'), h('p', null, 'буквы и цифры в сказках')),
      h('div', { class: 'friends' }, G.art.img('hare', 'f hare'), G.art.img('kolobok', 'f kol'), G.art.img('fox', 'f fox')),
      h('div', { class: 'splash-bottom' }, play, h('small', null, 'для детей 3–4 лет · без рекламы')));
    play.addEventListener('click', () => {
      G.audio.wake(); G.sfx.tap();
      if (!S().greeted) { S().greeted = true; save(); G.voice.sayWhenReady('c_hello'); }
      ui.map();
    });
    ui.mount(el);
  };

  // ---------- карта сказок ----------
  ui.map = function () {
    G.music.play('map');
    const gear = h('button', { class: 'icon-btn hold ghost', 'aria-label': 'Для родителей', html: G.ICON.gear + '<i class="ring"></i>' });
    const list = h('div', { class: 'worlds' });
    G.WORLDS.forEach((w, i) => {
      const ls = levelsOf(w), got = ls.filter(isDone).length;
      const open = w.open && ls.length > 0;
      const card = h('button', { class: `world-card ${w.cls}${open ? '' : ' locked'} pop-in`, style: { animationDelay: i * 60 + 'ms' } },
        h('div', { class: 'wc-art' }, G.art.img(w.art)),
        h('div', { class: 'wc-text' }, h('h3', null, w.title), h('p', null, w.learn),
          open ? h('div', { class: 'wc-prog' }, h('i', { style: { width: (ls.length ? got / ls.length * 100 : 0) + '%' } }), h('span', null, `${got} из ${ls.length}`))
            : h('div', { class: 'wc-soon', html: G.ICON.lock + '<span>Скоро</span>' })),
        worldDone(w) ? h('div', { class: 'wc-badge', html: G.ICON.star }) : null);
      card.addEventListener('click', () => {
        G.sfx.tap();
        if (!open) { wiggle(card); G.voice.say('c_soon'); return; }
        ui.world(w);
      });
      list.append(card);
    });
    const el = h('div', { class: 'screen map' },
      h('header', { class: 'bar' }, h('h2', null, 'Сказкоград'), h('div', { class: 'bar-right' }, G.soundBtns(), gear)),
      list,
      h('footer', { class: 'map-foot' }, h('button', { class: 'btn ghost share-btn', html: G.ICON.share + '<span>Поделиться игрой</span>', onclick: () => G.share() })));
    G.holdButton(gear, 1200, () => ui.parents());
    ui.mount(el);
  };

  // ---------- мир: тропинка уровней ----------
  const PATH = [[26, 82], [70, 68], [30, 52], [70, 36], [48, 17]];
  const prepared = {};
  function prepareWorld(w, onP) {
    if (prepared[w.id]) return prepared[w.id];
    const sprites = [...new Set(levelsOf(w).flatMap(l => l.sprites || []))];
    let pv = 0, pc = 0;
    const rep = () => onP && onP((pv + pc) / 2);
    const px = Math.round(Math.min(420, 220 * Math.min(2, window.devicePixelRatio || 1)));
    prepared[w.id] = Promise.all([
      Promise.all([G.voice.loadPack('c'), G.voice.loadPack(w.id, p => { pv = p; rep(); })]).then(() => { pv = 1; rep(); }),
      G.art.ready(sprites, px).then(() => { pc = 1; rep(); }),
      G.fontsReady()
    ]);
    return prepared[w.id];
  }

  ui.world = function (w, justDone) {
    G.music.play(w.music || 'forest');
    const ls = levelsOf(w);
    const back = h('button', { class: 'icon-btn', 'aria-label': 'Назад', html: G.ICON.back });
    const field = h('div', { class: 'path-field' });
    const svgPath = PATH.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ');
    field.append(h('div', { class: 'path-line', html: `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="${svgPath}" /></svg>` }));
    (w.deco || ['tree_fir', 'tree_round', 'tree_fir', 'bush']).forEach((t, i) => field.append(G.art.img(t, 'deco d' + i)));
    const next = ls.find(l => !isDone(l) && unlocked(w, l));
    ls.forEach((l, i) => {
      const p = PATH[i] || [50, 50];
      const lock = !unlocked(w, l), done = isDone(l), boss = i === ls.length - 1;
      const st = h('button', { class: 'stone' + (done ? ' done' : '') + (lock ? ' locked' : '') + (l === next ? ' next' : '') + (boss ? ' boss' : ''),
        style: { left: p[0] + '%', top: p[1] + '%', animationDelay: i * 70 + 'ms' }, 'aria-label': l.title },
      h('span', { class: 'st-art' }, G.art.img(l.icon)),
      h('span', { class: 'st-num' }, String(l.n)),
      done ? h('span', { class: 'st-star', html: G.ICON.star }) : null,
      lock ? h('span', { class: 'st-lock', html: G.ICON.lock }) : null,
      h('span', { class: 'st-title' }, l.title));
      st.addEventListener('click', () => {
        G.sfx.tap();
        if (lock) { wiggle(st); G.voice.say('c_locked'); if (next) { const n = field.querySelector('.stone.next'); n && wiggle(n); } return; }
        startLevel(w, l);
      });
      field.append(st);
    });
    const loader = h('div', { class: 'loader' }, h('i'));
    const el = h('div', { class: 'screen world ' + w.cls },
      h('header', { class: 'bar three' }, back, h('h2', null, w.title), G.soundBtns()),
      field, G.art.img(w.art, 'world-host'), loader);
    back.addEventListener('click', () => { G.sfx.tap(); ui.map(); });
    ui.mount(el);
    prepareWorld(w, p => { loader.firstChild.style.width = Math.round(p * 100) + '%'; }).then(() => loader.classList.add('hide'));
    if (!S()['seen_' + w.id]) { S()['seen_' + w.id] = true; save(); G.voice.sayWhenReady(w.intro, 4000); }
    else if (justDone && next) G.voice.say('c_next');
  };

  async function startLevel(w, l) {
    const veil = h('div', { class: 'veil' }, h('div', { class: 'spinner' }));
    app().append(veil);
    // Ждём подготовку мира, но не дольше 12 с — потом играем с голосом браузера.
    await Promise.race([prepareWorld(w), new Promise(r => setTimeout(r, 12000))]);
    veil.remove();
    G.voice.stop();
    const res = await G.runLevel(l);
    if (res === 'done') {
      const was = worldDone(w);
      S().done[l.id] = 1; save();
      if (!was && worldDone(w)) { ui.worldDone(w); return; }
      if (G.AUTO) { const nx = levelsOf(w).find(x => !isDone(x)); if (nx) { setTimeout(() => startLevel(w, nx), 300); } else ui.worldDone(w); return; }
    }
    ui.world(w, res === 'done');
  }
  G.startLevel = (wid, lid) => { const w = G.WORLDS.find(x => x.id === wid); const l = G.LEVELS.find(x => x.id === lid); if (w && l) startLevel(w, l); };

  // ---------- сказка пройдена ----------
  ui.worldDone = function (w) {
    G.music.stop(); G.sfx.fanfare();
    const name = (S().name || '').trim();
    const share = h('button', { class: 'btn big share-btn', html: G.ICON.share + '<span>Поделиться</span>', onclick: () => { G.sfx.tap(); G.share(); } });
    const toMap = h('button', { class: 'btn ghost', onclick: () => { G.sfx.tap(); ui.map(); } }, 'На карту сказок');
    const rest = S().rests ? h('div', { class: 'rest-card' }, h('h3', null, 'Глазкам пора отдохнуть'), h('p', null, G.voice.lines[w.task] || '')) : null;
    const el = h('div', { class: 'screen world-done ' + w.cls },
      h('div', { class: 'confetti' }),
      h('div', { class: 'gramota pop-in' },
        h('div', { class: 'stars big' }, h('i', { html: G.ICON.star }), h('i', { html: G.ICON.star }), h('i', { html: G.ICON.star })),
        h('h2', null, `Сказка «${w.title}» пройдена!`),
        name ? h('p', { class: 'gr-name' }, `Молодец, ${name}!`) : null,
        h('div', { class: 'gr-friends' }, ...(w.friends || ['hare', 'wolf', 'kolobok', 'bear', 'fox']).map(n => G.art.img(n)))),
      rest,
      h('div', { class: 'wd-actions' }, share, toMap));
    ui.mount(el);
    (async () => {
      await G.voice.say(w.done);
      if (rest && cur === el) await G.voice.say('c_rest');
      if (rest && cur === el) await G.voice.say(w.task);
      if (cur === el) G.voice.say('c_share');
    })();
    if (G.AUTO) { G.autoDone = true; G.emit('auto-done', w.id); }
  };

  // ---------- поделиться ----------
  G.share = async function () {
    const C = G.CONFIG, data = { title: C.title, text: C.shareText, url: C.shareUrl };
    if (navigator.share) {
      try { await navigator.share(data); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    const u = encodeURIComponent(C.shareUrl), t = encodeURIComponent(C.shareText);
    const copy = h('button', { class: 'sh-item' }, 'Скопировать ссылку');
    const sheet = h('div', { class: 'sheet-wrap' }, h('div', { class: 'sheet pop-in' },
      h('h3', null, 'Поделиться игрой'),
      h('a', { class: 'sh-item tg', href: `https://t.me/share/url?url=${u}&text=${t}`, target: '_blank', rel: 'noopener' }, 'Telegram'),
      h('a', { class: 'sh-item wa', href: `https://wa.me/?text=${t}%20${u}`, target: '_blank', rel: 'noopener' }, 'WhatsApp'),
      h('a', { class: 'sh-item vk', href: `https://vk.com/share.php?url=${u}`, target: '_blank', rel: 'noopener' }, 'ВКонтакте'),
      copy,
      h('button', { class: 'sh-close btn ghost' }, 'Закрыть')));
    const close = () => sheet.remove();
    sheet.addEventListener('click', e => { if (e.target === sheet || e.target.classList.contains('sh-close')) close(); });
    copy.addEventListener('click', async () => {
      let ok = false;
      try { await navigator.clipboard.writeText(C.shareUrl); ok = true; } catch (e) {
        const ta = h('textarea', { style: { position: 'fixed', opacity: 0 } }); ta.value = C.shareUrl; document.body.append(ta); ta.select();
        try { ok = document.execCommand('copy'); } catch (er) { /* ok */ } ta.remove();
      }
      copy.textContent = ok ? 'Ссылка скопирована ✓' : C.shareUrl;
    });
    document.body.append(sheet);
  };

  // ---------- для родителей ----------
  ui.parents = function () {
    const s = S();
    const tog = (key, label, onChange) => {
      const inp = h('input', { type: 'checkbox' }); inp.checked = !!s[key];
      inp.addEventListener('change', () => { s[key] = inp.checked; save(); G.audio.apply(); onChange && onChange(); });
      return h('label', { class: 'p-row' }, h('span', null, label), inp);
    };
    const name = h('input', { type: 'text', maxlength: 24, placeholder: 'Например, Маша', value: s.name || '', autocomplete: 'off' });
    name.addEventListener('input', () => { s.name = name.value; save(); });
    const confirmRow = h('div', { class: 'p-confirm', hidden: true },
      h('span', null, 'Стереть весь прогресс?'),
      h('button', { class: 'btn small danger', onclick: () => { G.store.reset(); ui.map(); } }, 'Да'),
      h('button', { class: 'btn small ghost', onclick: () => { confirmRow.hidden = true; } }, 'Нет'));
    const voiceInfo = G.VOICE_PACKS && G.VOICE_PACKS.w1 ? 'Озвучка: голос «Марина».' : 'Озвучка пока голосом браузера.';
    // Проверка звука: видно, загрузилась ли запись и что звучит на этом телефоне
    const sndStatus = h('p', { class: 'muted snd-status' });
    const paintStatus = () => {
      const V = G.voice, pk = V.packs.c || {}, ctx = G.audio.ctx;
      const rows = [
        V.has('c_good1') ? '✓ Запись голоса загружена' : pk.failed ? '✗ Запись голоса не загрузилась (' + (pk.err || 'сеть') + ')' : '… Запись голоса загружается',
        ctx && ctx.state === 'running' ? '✓ Звук включён' : '… Звук ещё не включён — нажмите «Проверить голос»',
        V.mode === 'pack' ? '✓ Сейчас звучит Марина' : V.mode === 'tts' ? '✗ Сейчас звучит голос браузера' : ''
      ].filter(Boolean);
      sndStatus.innerHTML = rows.join('<br>');
    };
    const testBtn = h('button', { class: 'btn ghost small' }, 'Проверить голос');
    testBtn.addEventListener('click', () => {
      if (s.mute) { s.mute = false; save(); G.audio.apply(); }
      G.voice.loadPack('c').then(() => G.voice.say('c_good1')).then(paintStatus);
      setTimeout(paintStatus, 1700);
    });
    paintStatus();
    const el = h('div', { class: 'screen parents' },
      h('header', { class: 'bar' }, h('button', { class: 'icon-btn', 'aria-label': 'Назад', html: G.ICON.back, onclick: () => ui.map() }), h('h2', null, 'Для родителей'), h('div', { class: 'tb-space' })),
      h('div', { class: 'p-body' },
        h('section', { class: 'p-card' },
          h('h3', null, 'Что в игре'),
          h('p', null, '5 сказок по 5 уровней, около часа игры. Цифры от 1 до 10, гласные буквы, цвета, фигуры, размеры и порядок. Проиграть нельзя, подсказка всегда бесплатная. Без рекламы и покупок.'),
          h('p', { class: 'muted' }, 'Сейчас открыты сказки «Колобок» и «Теремок», остальные — скоро. После каждой сказки игра предлагает отдохнуть: для 3–4 лет лучше играть по 15–20 минут.')),
        h('section', { class: 'p-card' },
          h('label', { class: 'p-row col' }, h('span', null, 'Имя ребёнка (для грамоты)'), name),
          h('p', { class: 'muted' }, 'Имя хранится только на этом телефоне и никуда не отправляется.')),
        h('section', { class: 'p-card' },
          tog('music', 'Музыка'), tog('sfx', 'Звуки'), tog('voice', 'Голос'), tog('tts', 'Голос браузера, если нет записи'),
          tog('rests', 'Предлагать отдых после сказки'), tog('unlockAll', 'Открыть все уровни'),
          h('p', { class: 'muted' }, voiceInfo)),
        h('section', { class: 'p-card' },
          h('h3', null, 'Проверка звука'), sndStatus, testBtn,
          h('p', { class: 'muted' }, 'На iPhone без звука? Проверьте переключатель беззвучного режима сбоку и громкость.')),
        h('section', { class: 'p-card' },
          h('button', { class: 'btn ghost share-btn', html: G.ICON.share + '<span>Поделиться игрой</span>', onclick: () => G.share() }),
          h('button', { class: 'btn ghost', onclick: () => { confirmRow.hidden = false; } }, 'Сбросить прогресс'), confirmRow)));
    ui.mount(el);
  };

  function wiggle(el) { el.classList.remove('wiggle'); void el.offsetWidth; el.classList.add('wiggle'); }
  G.wiggle = wiggle;
})();
