'use strict';
// Рисунки. Всё — векторные SVG прямо в коде: грузить нечего, первый экран появляется сразу.
// Для canvas каждый рисунок один раз растрируется в кэш (G.art.ready), для экранов — <img> с data-URL.
(function () {
  const rg = (id, stops, cx = '38%', cy = '32%', r = '75%') =>
    `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</radialGradient>`;
  const lg = (id, stops, x2 = 0, y2 = 1) =>
    `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  const eye = (x, y, rx = 12, ry = 14, pr = 8) =>
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff"/><circle cx="${x + 1.5}" cy="${y + 3}" r="${pr}" fill="#2B2140"/>` +
    `<circle cx="${x + 4.5}" cy="${y - 1}" r="${pr * 0.36}" fill="#fff"/><circle cx="${x - 1}" cy="${y + 6}" r="${pr * 0.18}" fill="#fff"/>`;
  const cheek = (x, y, id = 'ck', rx = 13, ry = 8) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#${id})"/>`;
  const CK = rg('ck', [[0, '#FF7F8F', 0.75], [1, '#FF7F8F', 0]], '50%', '50%', '50%');
  const shine = (x, y, rx, ry, rot = -25, o = 0.45) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${o}" transform="rotate(${rot} ${x} ${y})"/>`;

  const ART = {
    // ---------- герои ----------
    kolobok: { w: 200, h: 200, svg:
      `<defs>${rg('kb', [[0, '#FFF3C2'], [0.35, '#FFD56E'], [0.78, '#F4A53A'], [1, '#D47F27']])}${CK}</defs>` +
      `<circle cx="100" cy="104" r="80" fill="url(#kb)"/>` +
      `<g fill="#D98A2C" opacity=".35"><ellipse cx="58" cy="142" rx="6" ry="3"/><ellipse cx="142" cy="150" rx="5" ry="2.5"/><ellipse cx="154" cy="84" rx="4" ry="2"/><ellipse cx="50" cy="90" rx="3.5" ry="2"/><ellipse cx="112" cy="168" rx="4" ry="2"/></g>` +
      shine(68, 58, 26, 15) +
      `<path d="M62 76 Q76 67 89 75 M111 75 Q124 67 138 76" stroke="#9A5A1C" stroke-width="4.5" stroke-linecap="round" fill="none"/>` +
      eye(76, 97) + eye(124, 97) + cheek(60, 124) + cheek(140, 124) +
      `<ellipse cx="100" cy="113" rx="5" ry="3.5" fill="#E08E33" opacity=".7"/>` +
      `<path d="M76 124 Q100 131 124 124 Q118 152 100 152 Q82 152 76 124 Z" fill="#7A2E33"/>` +
      `<path d="M88 143 Q100 135 112 143 Q106 151 100 151 Q94 151 88 143 Z" fill="#FF7B8A"/>` },

    hare: { w: 200, h: 236, svg:
      `<defs>${rg('hb', [[0, '#FFFFFF'], [0.55, '#E9EBF2'], [1, '#C3C9D8']])}${CK}</defs>` +
      `<g transform="rotate(-12 74 60)"><ellipse cx="74" cy="60" rx="18" ry="52" fill="url(#hb)"/><ellipse cx="74" cy="64" rx="8.5" ry="38" fill="#FFB7C5"/></g>` +
      `<g transform="rotate(14 128 60)"><ellipse cx="128" cy="60" rx="18" ry="52" fill="url(#hb)"/><ellipse cx="128" cy="64" rx="8.5" ry="38" fill="#FFB7C5"/></g>` +
      `<ellipse cx="100" cy="186" rx="52" ry="44" fill="url(#hb)"/><ellipse cx="100" cy="194" rx="30" ry="28" fill="#fff"/>` +
      `<ellipse cx="70" cy="226" rx="21" ry="10" fill="#D9DDE8"/><ellipse cx="130" cy="226" rx="21" ry="10" fill="#D9DDE8"/>` +
      `<ellipse cx="62" cy="180" rx="11" ry="16" fill="#E4E7EF"/><ellipse cx="138" cy="180" rx="11" ry="16" fill="#E4E7EF"/>` +
      `<ellipse cx="100" cy="122" rx="54" ry="48" fill="url(#hb)"/>` + shine(76, 92, 18, 10) +
      eye(80, 116, 11, 13, 7.5) + eye(120, 116, 11, 13, 7.5) + cheek(68, 142) + cheek(132, 142) +
      `<ellipse cx="100" cy="142" rx="22" ry="15" fill="#fff"/><ellipse cx="100" cy="133" rx="7" ry="5" fill="#FF7D9C"/>` +
      `<path d="M100 138 v6 M100 144 q-7 6 -12 1 M100 144 q7 6 12 1" stroke="#6B5B70" stroke-width="2.5" fill="none" stroke-linecap="round"/>` +
      `<rect x="94.5" y="146" width="11" height="9" rx="2" fill="#fff" stroke="#D5D8E0" stroke-width="1.5"/>` +
      `<path d="M74 140 L50 134 M74 146 L50 148 M126 140 L150 134 M126 146 L150 148" stroke="#A9AEBD" stroke-width="1.6" stroke-linecap="round"/>` },

    wolf: { w: 200, h: 228, svg:
      `<defs>${rg('wb', [[0, '#C9D3E2'], [0.6, '#98A6BD'], [1, '#6E7C96']])}${lg('hat', [[0, '#FF8FB1'], [1, '#FF5C8A']])}${CK}</defs>` +
      `<path d="M50 84 L58 30 L94 66 Z" fill="url(#wb)"/><path d="M58 74 L62 44 L82 64 Z" fill="#F4BFCB"/>` +
      `<path d="M150 84 L142 30 L106 66 Z" fill="url(#wb)"/><path d="M142 74 L138 44 L118 64 Z" fill="#F4BFCB"/>` +
      `<ellipse cx="100" cy="186" rx="50" ry="40" fill="url(#wb)"/><ellipse cx="100" cy="194" rx="30" ry="27" fill="#EEF2F8"/>` +
      `<ellipse cx="70" cy="222" rx="20" ry="9" fill="#7D8AA3"/><ellipse cx="130" cy="222" rx="20" ry="9" fill="#7D8AA3"/>` +
      `<ellipse cx="100" cy="108" rx="60" ry="52" fill="url(#wb)"/>` +
      `<path d="M42 116 L52 124 L46 132 L60 136 L56 146 L76 144 Q100 160 124 144 L144 146 L140 136 L154 132 L148 124 L158 116 Q140 150 100 150 Q60 150 42 116 Z" fill="#EEF2F8"/>` +
      shine(74, 76, 20, 11) +
      `<path d="M64 82 Q76 76 88 84 M112 84 Q124 76 136 82" stroke="#4E5A72" stroke-width="4" stroke-linecap="round" fill="none"/>` +
      eye(78, 98, 10, 12, 7) + eye(122, 98, 10, 12, 7) + cheek(62, 124) + cheek(138, 124) +
      `<ellipse cx="100" cy="130" rx="30" ry="21" fill="#F4F6FA"/><ellipse cx="100" cy="116" rx="11" ry="8" fill="#2B2140"/><circle cx="96" cy="113" r="2.5" fill="#fff"/>` +
      `<path d="M80 132 Q100 152 120 132" stroke="#2B2140" stroke-width="3.5" fill="none" stroke-linecap="round"/>` +
      `<path d="M93 142 Q100 156 107 142 Z" fill="#FF7B8A"/>` +
      `<g transform="rotate(14 112 40)"><path d="M90 66 L112 6 L134 66 Z" fill="url(#hat)"/><path d="M98 46 L126 46 M104 30 L120 30 M93 60 L131 60" stroke="#FFE36B" stroke-width="5" stroke-linecap="round"/><circle cx="112" cy="6" r="8" fill="#FFE36B"/></g>` },

    bear: { w: 200, h: 228, svg:
      `<defs>${rg('bb', [[0, '#D9A273'], [0.6, '#A5683E'], [1, '#7A4A2A']])}${CK}</defs>` +
      `<circle cx="52" cy="58" r="23" fill="url(#bb)"/><circle cx="52" cy="58" r="12" fill="#E2AE86"/><circle cx="148" cy="58" r="23" fill="url(#bb)"/><circle cx="148" cy="58" r="12" fill="#E2AE86"/>` +
      `<ellipse cx="100" cy="184" rx="60" ry="42" fill="url(#bb)"/><ellipse cx="100" cy="190" rx="35" ry="29" fill="#E8C29B"/>` +
      `<ellipse cx="56" cy="210" rx="20" ry="12" fill="#8A5634"/><ellipse cx="144" cy="210" rx="20" ry="12" fill="#8A5634"/>` +
      `<circle cx="100" cy="102" r="62" fill="url(#bb)"/>` + shine(72, 66, 22, 12) +
      `<ellipse cx="78" cy="94" rx="7.5" ry="8.5" fill="#2B2140"/><circle cx="80.5" cy="91" r="2.8" fill="#fff"/><ellipse cx="122" cy="94" rx="7.5" ry="8.5" fill="#2B2140"/><circle cx="124.5" cy="91" r="2.8" fill="#fff"/>` +
      cheek(62, 120) + cheek(138, 120) +
      `<ellipse cx="100" cy="124" rx="31" ry="25" fill="#EBC9A3"/><ellipse cx="100" cy="112" rx="12" ry="8.5" fill="#3A2418"/><circle cx="96" cy="109" r="2.6" fill="#fff"/>` +
      `<path d="M100 120 v8 M100 128 q-9 8 -16 2 M100 128 q9 8 16 2" stroke="#3A2418" stroke-width="3" fill="none" stroke-linecap="round"/>` },

    fox: { w: 220, h: 228, svg:
      `<defs>${rg('fb', [[0, '#FFC27A'], [0.6, '#F57F2E'], [1, '#D1561B']])}${CK}</defs>` +
      `<path d="M140 206 Q214 200 206 132 Q200 96 176 108 Q190 156 138 174 Z" fill="url(#fb)"/><path d="M196 112 Q210 100 206 132 Q204 150 196 162 Q200 134 186 118 Z" fill="#FFF6EC"/>` +
      `<path d="M46 84 L56 20 L96 62 Z" fill="url(#fb)"/><path d="M56 74 L60 36 L82 60 Z" fill="#5A3A2E"/>` +
      `<path d="M154 84 L144 20 L104 62 Z" fill="url(#fb)"/><path d="M144 74 L140 36 L118 60 Z" fill="#5A3A2E"/>` +
      `<ellipse cx="100" cy="184" rx="46" ry="38" fill="url(#fb)"/><ellipse cx="100" cy="192" rx="26" ry="26" fill="#FFF6EC"/>` +
      `<ellipse cx="72" cy="220" rx="17" ry="9" fill="#5A3A2E"/><ellipse cx="128" cy="220" rx="17" ry="9" fill="#5A3A2E"/>` +
      `<ellipse cx="100" cy="106" rx="58" ry="50" fill="url(#fb)"/>` +
      `<path d="M42 110 Q66 156 100 148 Q134 156 158 110 Q132 130 100 126 Q68 130 42 110 Z" fill="#FFF6EC"/>` + shine(74, 74, 20, 11) +
      `<path d="M68 98 Q79 86 90 98 M110 98 Q121 86 132 98" stroke="#3B2621" stroke-width="5" stroke-linecap="round" fill="none"/>` +
      cheek(62, 120) + cheek(138, 120) +
      `<ellipse cx="100" cy="128" rx="8.5" ry="6.5" fill="#3B2621"/><circle cx="97" cy="126" r="2" fill="#fff"/>` +
      `<path d="M90 136 Q100 144 110 136" stroke="#3B2621" stroke-width="3" fill="none" stroke-linecap="round"/>` },

    // ---------- ягоды, корзинка ----------
    berry_red: { w: 100, h: 100, svg:
      `<defs>${rg('br', [[0, '#FF9AA6'], [0.45, '#F2334E'], [1, '#B01A35']])}</defs>` +
      `<circle cx="50" cy="56" r="36" fill="url(#br)"/>` + shine(38, 42, 10, 6, -30, 0.6) +
      `<path d="M50 22 Q52 10 60 6" stroke="#5E8C2E" stroke-width="4" fill="none" stroke-linecap="round"/>` +
      `<path d="M52 20 Q66 6 80 14 Q68 26 52 20 Z" fill="#6CC04A"/>` },
    berry_blue: { w: 100, h: 100, svg:
      `<defs>${rg('bl', [[0, '#A9C6FF'], [0.45, '#4C74E8'], [1, '#2643A6']])}</defs>` +
      `<circle cx="50" cy="56" r="36" fill="url(#bl)"/>` + shine(38, 42, 10, 6, -30, 0.55) +
      `<path d="M42 26 L46 32 L50 24 L54 32 L58 26 L56 36 L44 36 Z" fill="#1F2F6E" opacity=".75"/>` +
      `<path d="M52 22 Q66 8 80 16 Q68 28 52 22 Z" fill="#6CC04A"/>` },
    basket_back: { w: 200, h: 170, svg:
      `<defs>${lg('bk', [[0, '#E9B46A'], [1, '#B4732F']])}</defs>` +
      `<path d="M28 78 Q28 6 100 6 Q172 6 172 78" stroke="url(#bk)" stroke-width="12" fill="none" stroke-linecap="round"/>` +
      `<ellipse cx="100" cy="80" rx="82" ry="20" fill="#7A4A1E"/>` },
    basket_front: { w: 200, h: 170, svg:
      `<defs>${lg('bf', [[0, '#F0BE76'], [1, '#A9692A']])}</defs>` +
      `<path d="M18 80 Q100 104 182 80 L164 152 Q100 172 36 152 Z" fill="url(#bf)"/>` +
      `<g stroke="#8E5420" stroke-width="3" opacity=".55" fill="none"><path d="M24 104 Q100 126 176 104"/><path d="M30 128 Q100 148 170 128"/>` +
      `<path d="M52 92 L56 158 M76 97 L78 164 M100 99 L100 166 M124 97 L122 164 M148 92 L144 158"/></g>` +
      `<path d="M16 80 Q100 106 184 80" stroke="#F7D29A" stroke-width="9" fill="none" stroke-linecap="round"/>` },

    // ---------- лес ----------
    stump: { w: 140, h: 112, svg:
      `<defs>${lg('st', [[0, '#A87449'], [1, '#6A4226']], 1, 0)}</defs>` +
      `<path d="M22 40 L22 90 Q14 104 4 108 L136 108 Q126 104 118 90 L118 40 Z" fill="url(#st)"/>` +
      `<path d="M40 52 L42 96 M70 50 L70 100 M98 52 L96 96" stroke="#5A361D" stroke-width="3" opacity=".4"/>` +
      `<ellipse cx="70" cy="40" rx="48" ry="16" fill="#E8C08A"/>` +
      `<ellipse cx="70" cy="40" rx="34" ry="11" fill="none" stroke="#C49460" stroke-width="2.5"/><ellipse cx="70" cy="40" rx="18" ry="6" fill="none" stroke="#C49460" stroke-width="2.5"/>` +
      `<path d="M104 30 Q110 18 120 22" stroke="#5E9C3C" stroke-width="3" fill="none"/><ellipse cx="122" cy="20" rx="7" ry="4" fill="#7CC459"/>` },
    tree_fir: { w: 160, h: 260, svg:
      `<defs>${lg('tf', [[0, '#5FBF78'], [1, '#1F6A43']])}</defs>` +
      `<rect x="70" y="210" width="20" height="46" rx="4" fill="#7A4D2C"/>` +
      `<path d="M80 6 L130 92 Q80 82 30 92 Z" fill="url(#tf)"/><path d="M80 56 L146 160 Q80 146 14 160 Z" fill="url(#tf)"/><path d="M80 112 L156 224 Q80 208 4 224 Z" fill="url(#tf)"/>` +
      `<path d="M80 18 L60 62 M80 70 L52 120 M80 126 L46 186" stroke="#fff" stroke-width="5" opacity=".18" stroke-linecap="round"/>` },
    tree_round: { w: 180, h: 240, svg:
      `<defs>${rg('tr', [[0, '#A8E290'], [0.6, '#5DB565'], [1, '#2F7D47']])}</defs>` +
      `<path d="M80 236 L84 140 L96 140 L100 236 Z" fill="#7A4D2C"/><path d="M90 170 L60 140 M92 160 L120 130" stroke="#7A4D2C" stroke-width="7" stroke-linecap="round"/>` +
      `<circle cx="58" cy="110" r="46" fill="url(#tr)"/><circle cx="124" cy="104" r="50" fill="url(#tr)"/><circle cx="90" cy="64" r="56" fill="url(#tr)"/>` +
      `<g fill="#FF5A6E"><circle cx="60" cy="96" r="6"/><circle cx="118" cy="72" r="6"/><circle cx="132" cy="120" r="6"/><circle cx="84" cy="128" r="5"/></g>` },
    bush: { w: 220, h: 120, svg:
      `<defs>${rg('bu', [[0, '#9BDB7E'], [0.65, '#4FA95A'], [1, '#2D7542']], '45%', '30%', '80%')}</defs>` +
      `<circle cx="50" cy="78" r="42" fill="url(#bu)"/><circle cx="110" cy="58" r="54" fill="url(#bu)"/><circle cx="172" cy="78" r="44" fill="url(#bu)"/>` +
      `<rect x="10" y="80" width="200" height="40" rx="20" fill="#3E9150"/>` +
      `<path d="M70 40 Q90 26 110 30" stroke="#fff" stroke-width="6" opacity=".2" fill="none" stroke-linecap="round"/>` },
    cloud: { w: 200, h: 110, svg:
      `<defs>${lg('cl', [[0, '#FFFFFF'], [1, '#DDE9F8']])}</defs>` +
      `<path d="M40 96 Q8 96 10 72 Q12 50 40 52 Q44 20 80 22 Q104 4 130 24 Q166 18 170 52 Q196 54 192 78 Q190 98 160 96 Z" fill="url(#cl)"/>` },
    grass: { w: 100, h: 44, svg:
      `<path d="M10 44 Q20 18 16 4 Q30 22 30 44 M28 44 Q40 10 50 2 Q48 26 46 44 M44 44 Q60 14 74 8 Q66 28 62 44 M60 44 Q78 26 92 22 Q80 34 78 44 Z" fill="#5DBB5E"/>` },
    mushroom: { w: 110, h: 116, svg:
      `<defs>${rg('mc', [[0, '#FF8A80'], [0.6, '#E8392C'], [1, '#B11E1E']])}</defs>` +
      `<path d="M38 60 Q34 102 42 110 L68 110 Q76 102 72 60 Z" fill="#FFF4E2"/><path d="M42 106 L68 106" stroke="#E5D3B8" stroke-width="3"/>` +
      `<path d="M6 64 Q8 8 55 8 Q102 8 104 64 Q80 74 55 72 Q30 74 6 64 Z" fill="url(#mc)"/>` +
      `<g fill="#fff"><circle cx="34" cy="36" r="8"/><circle cx="62" cy="24" r="6"/><circle cx="80" cy="46" r="9"/><circle cx="50" cy="54" r="5"/></g>` },

    // ---------- картинки на «А» ----------
    arbuz: { w: 140, h: 100, svg:
      `<path d="M8 22 A62 62 0 0 0 132 22 Z" fill="#2E9E4A"/><path d="M16 22 A54 54 0 0 0 124 22 Z" fill="#E9FBD8"/><path d="M22 22 A48 48 0 0 0 118 22 Z" fill="#FF4F64"/>` +
      `<g fill="#2B2140"><ellipse cx="44" cy="40" rx="3.5" ry="5.5" transform="rotate(-20 44 40)"/><ellipse cx="70" cy="50" rx="3.5" ry="5.5"/><ellipse cx="96" cy="40" rx="3.5" ry="5.5" transform="rotate(20 96 40)"/><ellipse cx="58" cy="30" rx="3" ry="5"/><ellipse cx="84" cy="30" rx="3" ry="5"/></g>` +
      `<path d="M26 26 Q70 34 114 26" stroke="#fff" stroke-width="4" opacity=".35" fill="none" stroke-linecap="round"/>` },
    apelsin: { w: 110, h: 116, svg:
      `<defs>${rg('ap', [[0, '#FFD27A'], [0.6, '#FF9A1F'], [1, '#E0700B']])}</defs>` +
      `<circle cx="55" cy="64" r="46" fill="url(#ap)"/>` + shine(38, 46, 13, 8, -30, 0.5) +
      `<g fill="#E07A10" opacity=".45"><circle cx="70" cy="80" r="2"/><circle cx="80" cy="66" r="2"/><circle cx="60" cy="94" r="2"/><circle cx="34" cy="80" r="2"/></g>` +
      `<path d="M55 20 L56 10" stroke="#6B4A2A" stroke-width="4" stroke-linecap="round"/><path d="M57 14 Q74 0 90 10 Q74 24 57 14 Z" fill="#5CB547"/>` },
    avtobus: { w: 170, h: 116, svg:
      `<defs>${lg('bs', [[0, '#FFD64D'], [1, '#F2A900']])}</defs>` +
      `<rect x="6" y="14" width="158" height="78" rx="18" fill="url(#bs)"/><rect x="6" y="66" width="158" height="8" fill="#F06A3A"/>` +
      `<g fill="#BDE6FF"><rect x="20" y="26" width="26" height="28" rx="5"/><rect x="54" y="26" width="26" height="28" rx="5"/><rect x="88" y="26" width="26" height="28" rx="5"/></g>` +
      `<rect x="124" y="26" width="28" height="56" rx="5" fill="#9FD6F5"/><path d="M138 28 v52" stroke="#7DB9DE" stroke-width="2"/>` +
      `<circle cx="158" cy="84" r="5" fill="#FFF6C2"/>` +
      `<circle cx="44" cy="94" r="16" fill="#2B2140"/><circle cx="44" cy="94" r="7" fill="#C7CCD8"/><circle cx="126" cy="94" r="16" fill="#2B2140"/><circle cx="126" cy="94" r="7" fill="#C7CCD8"/>` +
      `<path d="M22 22 Q60 18 100 20" stroke="#fff" stroke-width="4" opacity=".4" fill="none" stroke-linecap="round"/>` },
    ananas: { w: 110, h: 160, svg:
      `<defs>${rg('an', [[0, '#FFE27A'], [0.6, '#FFB52E'], [1, '#D98612']])}<clipPath id="anc"><ellipse cx="55" cy="108" rx="38" ry="48"/></clipPath></defs>` +
      `<path d="M55 64 Q40 30 22 22 Q44 30 50 52 Q44 20 54 2 Q60 24 58 52 Q66 26 88 20 Q70 34 58 64 Z" fill="#4FAE4A"/>` +
      `<ellipse cx="55" cy="108" rx="38" ry="48" fill="url(#an)"/>` +
      `<g clip-path="url(#anc)" stroke="#C47612" stroke-width="2.5" opacity=".55"><path d="M0 70 L110 180 M0 100 L90 190 M10 50 L110 150 M40 50 L110 120 M110 70 L0 180 M110 100 L20 190 M100 50 L0 150 M70 50 L0 120"/></g>` },
    aist: { w: 150, h: 170, svg:
      `<path d="M66 118 L60 166 M84 118 L96 140 L84 166" stroke="#F0613A" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<ellipse cx="74" cy="96" rx="40" ry="26" fill="#fff" stroke="#E2E6EE" stroke-width="2"/>` +
      `<path d="M50 84 Q84 70 116 96 Q100 116 70 112 Q60 100 50 84 Z" fill="#2B2140"/>` +
      `<path d="M44 92 Q30 70 40 48 Q48 30 44 18" stroke="#fff" stroke-width="13" fill="none" stroke-linecap="round"/>` +
      `<circle cx="46" cy="18" r="13" fill="#fff" stroke="#E2E6EE" stroke-width="2"/><circle cx="48" cy="15" r="3" fill="#2B2140"/>` +
      `<path d="M56 16 L96 24 L56 24 Z" fill="#F0613A"/>` },
    // ---------- картинки-«не А» ----------
    myach: { w: 110, h: 110, svg:
      `<defs><clipPath id="mb"><circle cx="55" cy="55" r="48"/></clipPath></defs>` +
      `<g clip-path="url(#mb)"><rect width="110" height="110" fill="#FF5A5F"/><path d="M-10 40 Q55 10 120 40 L120 70 Q55 40 -10 70 Z" fill="#FFD23F"/><path d="M-10 80 Q55 50 120 80 L120 120 L-10 120 Z" fill="#3D7BF2"/></g>` +
      shine(38, 32, 14, 8, -30, 0.5) },
    dom: { w: 140, h: 130, svg:
      `<rect x="96" y="20" width="16" height="34" fill="#B5523B"/><rect x="22" y="58" width="96" height="68" rx="4" fill="#FFE2B6"/>` +
      `<path d="M8 64 L70 10 L132 64 Z" fill="#E8503A"/><rect x="58" y="86" width="26" height="40" rx="4" fill="#9A5B33"/>` +
      `<rect x="30" y="72" width="22" height="22" rx="3" fill="#9FD6F5"/><path d="M41 72 v22 M30 83 h22" stroke="#fff" stroke-width="2.5"/><circle cx="78" cy="106" r="2.5" fill="#FFD23F"/>` },
    ryba: { w: 150, h: 100, svg:
      `<defs>${lg('rb', [[0, '#7FD3FF'], [1, '#2F8FE0']])}</defs>` +
      `<path d="M112 50 L146 20 L140 50 L146 80 Z" fill="#2F7FD0"/><ellipse cx="68" cy="50" rx="56" ry="34" fill="url(#rb)"/>` +
      `<path d="M60 18 Q76 2 92 20 Z" fill="#2F7FD0"/>` +
      `<g stroke="#fff" stroke-width="2.5" fill="none" opacity=".5"><path d="M70 32 Q78 50 70 68"/><path d="M86 32 Q94 50 86 68"/></g>` +
      `<circle cx="34" cy="44" r="8" fill="#fff"/><circle cx="32" cy="45" r="4.5" fill="#2B2140"/><path d="M14 58 Q22 62 28 58" stroke="#1D5FA8" stroke-width="3" fill="none" stroke-linecap="round"/>` },
    grusha: { w: 110, h: 140, svg:
      `<defs>${rg('gr', [[0, '#F0F59A'], [0.6, '#BCD94A'], [1, '#86AE2A']])}</defs>` +
      `<path d="M55 26 Q74 26 74 52 Q74 64 86 80 Q100 100 90 120 Q78 138 55 138 Q32 138 20 120 Q10 100 24 80 Q36 64 36 52 Q36 26 55 26 Z" fill="url(#gr)"/>` +
      shine(38, 88, 8, 14, 10, 0.4) +
      `<path d="M55 28 Q56 14 62 6" stroke="#6B4A2A" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M60 14 Q78 4 92 16 Q76 26 60 14 Z" fill="#5CB547"/>` },

    // ---------- праздник, карта миров ----------
    cake: { w: 180, h: 120, svg:
      `<rect x="20" y="40" width="140" height="70" rx="14" fill="#FFB3C7"/><rect x="20" y="40" width="140" height="22" rx="11" fill="#FFF3F6"/>` +
      `<path d="M28 60 Q40 74 52 60 Q64 74 76 60 Q88 74 100 60 Q112 74 124 60 Q136 74 148 60 Q156 70 160 62" stroke="#FFF3F6" stroke-width="8" fill="none" stroke-linecap="round"/>` +
      `<g fill="#FF5C8A"><circle cx="50" cy="90" r="5"/><circle cx="90" cy="96" r="5"/><circle cx="130" cy="90" r="5"/></g><rect x="8" y="104" width="164" height="12" rx="6" fill="#E8EDF5"/>` },
    teremok: { w: 160, h: 170, svg:
      `<defs>${lg('tw', [[0, '#E3A869'], [1, '#B06D35']])}</defs>` +
      `<rect x="26" y="70" width="108" height="96" rx="6" fill="url(#tw)"/>` +
      `<g stroke="#8B5124" stroke-width="3" opacity=".45"><path d="M26 92 H134 M26 114 H134 M26 136 H134 M26 158 H134"/></g>` +
      `<path d="M14 76 L80 10 L146 76 Z" fill="#D94A3A"/><path d="M26 76 L80 22 L134 76" stroke="#FFD26B" stroke-width="5" fill="none"/>` +
      `<path d="M60 108 Q80 84 100 108 V140 H60 Z" fill="#9FD6F5" stroke="#FFF0D0" stroke-width="5"/><path d="M80 92 V140 M60 116 H100" stroke="#FFF0D0" stroke-width="3"/>` +
      `<circle cx="80" cy="54" r="10" fill="#FFF0D0"/><circle cx="80" cy="54" r="5" fill="#9FD6F5"/>` },
    repka: { w: 140, h: 170, svg:
      `<defs>${rg('rp', [[0, '#FFFBE0'], [0.55, '#FFE36B'], [1, '#E8B92C']])}</defs>` +
      `<path d="M70 62 Q50 20 30 12 Q54 18 66 44 Q60 10 70 2 Q80 10 74 44 Q86 18 110 12 Q90 20 70 62 Z" fill="#4FAE4A"/>` +
      `<path d="M70 60 Q124 66 120 112 Q116 148 74 160 Q72 168 70 170 Q68 166 66 160 Q24 148 20 112 Q16 66 70 60 Z" fill="url(#rp)"/>` +
      shine(46, 92, 10, 16, 15, 0.5) + `<path d="M56 130 Q66 136 78 132" stroke="#D9A21E" stroke-width="2.5" fill="none" opacity=".6"/>` },
    rybka: { w: 160, h: 120, svg:
      `<defs>${lg('gf', [[0, '#FFE680'], [1, '#F5A300']])}</defs>` +
      `<path d="M116 64 Q150 26 156 40 Q146 64 156 88 Q150 102 116 64 Z" fill="#FFB800"/><ellipse cx="72" cy="64" rx="56" ry="38" fill="url(#gf)"/>` +
      `<path d="M58 28 Q78 8 98 30 Z" fill="#FFB800"/><g stroke="#fff" stroke-width="2.5" fill="none" opacity=".55"><path d="M74 44 Q82 64 74 84"/><path d="M90 44 Q98 64 90 84"/></g>` +
      `<circle cx="40" cy="58" r="9" fill="#fff"/><circle cx="38" cy="59" r="5" fill="#2B2140"/><path d="M18 74 Q26 79 32 74" stroke="#C47A00" stroke-width="3" fill="none" stroke-linecap="round"/>` +
      `<path d="M48 26 L52 8 L60 20 L68 4 L74 20 L82 8 L84 26 Z" fill="#FFD23F" stroke="#E89B00" stroke-width="2"/>` },
    // ---------- мир 2: Теремок ----------
    mouse: { w: 200, h: 214, svg:
      `<defs>${rg('ms', [[0, '#F6F2FC'], [0.6, '#CCC4DE'], [1, '#9E95B6']])}${CK}</defs>` +
      `<path d="M146 192 Q198 188 190 150 Q184 124 160 132" stroke="#EBA8BA" stroke-width="7" fill="none" stroke-linecap="round"/>` +
      `<circle cx="52" cy="62" r="36" fill="url(#ms)"/><circle cx="52" cy="62" r="23" fill="#FFC4D3"/>` +
      `<circle cx="148" cy="62" r="36" fill="url(#ms)"/><circle cx="148" cy="62" r="23" fill="#FFC4D3"/>` +
      `<ellipse cx="100" cy="172" rx="46" ry="36" fill="url(#ms)"/><ellipse cx="100" cy="180" rx="28" ry="24" fill="#FBF8FF"/>` +
      `<ellipse cx="76" cy="206" rx="16" ry="7" fill="#F2A9BC"/><ellipse cx="124" cy="206" rx="16" ry="7" fill="#F2A9BC"/>` +
      `<ellipse cx="100" cy="112" rx="54" ry="48" fill="url(#ms)"/>` + shine(78, 82, 18, 10) +
      eye(80, 106, 11, 13, 7.5) + eye(120, 106, 11, 13, 7.5) + cheek(64, 130) + cheek(136, 130) +
      `<ellipse cx="100" cy="134" rx="21" ry="14" fill="#FBF8FF"/><ellipse cx="100" cy="128" rx="8" ry="6" fill="#FF7D9C"/>` +
      `<path d="M100 134 v5 M100 139 q-6 5 -10 1 M100 139 q6 5 10 1" stroke="#6B5B70" stroke-width="2.5" fill="none" stroke-linecap="round"/>` +
      `<path d="M78 132 L52 126 M78 138 L52 140 M122 132 L148 126 M122 138 L148 140" stroke="#A9A2BD" stroke-width="1.6" stroke-linecap="round"/>` +
      `<ellipse cx="82" cy="160" rx="10" ry="8" fill="#E6E0F0"/><ellipse cx="118" cy="160" rx="10" ry="8" fill="#E6E0F0"/>` },
    frog: { w: 220, h: 196, svg:
      `<defs>${rg('fg', [[0, '#BDF292'], [0.55, '#6CCB4A'], [1, '#3D9A2E']])}${CK}</defs>` +
      `<ellipse cx="44" cy="164" rx="32" ry="18" fill="url(#fg)" transform="rotate(-20 44 164)"/><ellipse cx="176" cy="164" rx="32" ry="18" fill="url(#fg)" transform="rotate(20 176 164)"/>` +
      `<ellipse cx="110" cy="132" rx="72" ry="54" fill="url(#fg)"/><ellipse cx="110" cy="152" rx="44" ry="32" fill="#E9FBD2"/>` +
      `<circle cx="68" cy="64" r="31" fill="url(#fg)"/><circle cx="152" cy="64" r="31" fill="url(#fg)"/>` + shine(60, 48, 12, 7) +
      eye(68, 64, 19, 20, 11) + eye(152, 64, 19, 20, 11) + cheek(62, 120, 'ck', 15, 9) + cheek(158, 120, 'ck', 15, 9) +
      `<circle cx="101" cy="100" r="2.5" fill="#2E6B24"/><circle cx="119" cy="100" r="2.5" fill="#2E6B24"/>` +
      `<path d="M66 112 Q110 152 154 112" stroke="#2E6B24" stroke-width="5" fill="none" stroke-linecap="round"/>` +
      `<path d="M100 128 Q110 138 120 128 Q110 124 100 128 Z" fill="#FF7B8A"/>` +
      `<ellipse cx="80" cy="184" rx="20" ry="8" fill="#4DAA36"/><ellipse cx="140" cy="184" rx="20" ry="8" fill="#4DAA36"/>` },
    apple: { w: 100, h: 112, svg:
      `<defs>${rg('apl', [[0, '#FF9A8A'], [0.5, '#F23A3A'], [1, '#B51C24']])}</defs>` +
      `<path d="M50 32 C20 18 4 42 8 68 C12 94 32 110 50 102 C68 110 88 94 92 68 C96 42 80 18 50 32 Z" fill="url(#apl)"/>` +
      shine(30, 50, 8, 14, 20, 0.5) +
      `<path d="M50 32 Q52 18 58 10" stroke="#6B4A2A" stroke-width="5" fill="none" stroke-linecap="round"/>` +
      `<path d="M56 20 Q74 6 90 16 Q74 30 56 20 Z" fill="#5CB547"/>` },
    // ---------- мир 3: Репка ----------
    ded: { w: 200, h: 250, svg:
      `<defs>${rg('dsk', [[0, '#FFEBD8'], [0.6, '#FFD2AE'], [1, '#EDAE85']])}${rg('dsh', [[0, '#FF8A6E'], [0.6, '#E0533D'], [1, '#B8382A']])}${rg('dbd', [[0, '#FFFFFF'], [0.7, '#EEF0F5'], [1, '#C9CEDB']])}${CK}</defs>` +
      `<ellipse cx="76" cy="238" rx="24" ry="11" fill="#6B4A2A"/><ellipse cx="124" cy="238" rx="24" ry="11" fill="#6B4A2A"/>` +
      `<rect x="62" y="204" width="30" height="34" rx="10" fill="#4C6FA8"/><rect x="108" y="204" width="30" height="34" rx="10" fill="#4C6FA8"/>` +
      `<ellipse cx="46" cy="176" rx="16" ry="30" fill="url(#dsh)" transform="rotate(18 46 176)"/><ellipse cx="154" cy="176" rx="16" ry="30" fill="url(#dsh)" transform="rotate(-18 154 176)"/>` +
      `<circle cx="39" cy="202" r="12" fill="url(#dsk)"/><circle cx="161" cy="202" r="12" fill="url(#dsk)"/>` +
      `<path d="M52 214 Q48 150 100 142 Q152 150 148 214 Q100 226 52 214 Z" fill="url(#dsh)"/>` +
      `<path d="M52 198 Q100 210 148 198 L148 208 Q100 220 52 208 Z" fill="#FFD23F"/>` +
      `<ellipse cx="54" cy="94" rx="13" ry="16" fill="url(#dsk)"/><ellipse cx="146" cy="94" rx="13" ry="16" fill="url(#dsk)"/>` +
      `<circle cx="100" cy="90" r="52" fill="url(#dsk)"/>` + shine(84, 54, 17, 9) +
      `<path d="M50 88 Q44 62 64 54 Q58 72 66 90 Z" fill="url(#dbd)"/><path d="M150 88 Q156 62 136 54 Q142 72 134 90 Z" fill="url(#dbd)"/>` +
      `<path d="M66 72 Q78 62 92 70 M108 70 Q122 62 134 72" stroke="#B9BFCC" stroke-width="7" stroke-linecap="round" fill="none"/>` +
      eye(80, 90, 10, 12, 7) + eye(120, 90, 10, 12, 7) + cheek(64, 110) + cheek(136, 110) +
      `<path d="M52 100 Q48 160 100 190 Q152 160 148 100 Q136 122 100 120 Q64 122 52 100 Z" fill="url(#dbd)"/>` +
      `<path d="M90 132 Q100 140 110 132" stroke="#C9737A" stroke-width="3.5" fill="none" stroke-linecap="round"/>` +
      `<path d="M100 114 Q86 104 72 114 Q84 128 100 120 Q116 128 128 114 Q114 104 100 114 Z" fill="#fff" stroke="#D9DDE6" stroke-width="1.5"/>` +
      `<ellipse cx="100" cy="106" rx="11" ry="9" fill="#F2A98A"/><ellipse cx="96" cy="103" rx="4" ry="2.5" fill="#fff" opacity=".6"/>` },

    babka: { w: 200, h: 240, svg:
      `<defs>${rg('bsk', [[0, '#FFEBD8'], [0.6, '#FFD2AE'], [1, '#EDAE85']])}${rg('bdr', [[0, '#8DB2F5'], [0.6, '#4A78D0'], [1, '#2F55A8']])}${rg('bsc', [[0, '#FF8A8A'], [0.6, '#E53950'], [1, '#B31E3A']])}${CK}</defs>` +
      `<ellipse cx="78" cy="230" rx="20" ry="9" fill="#6B4A2A"/><ellipse cx="122" cy="230" rx="20" ry="9" fill="#6B4A2A"/>` +
      `<ellipse cx="50" cy="172" rx="15" ry="28" fill="url(#bdr)" transform="rotate(16 50 172)"/><ellipse cx="150" cy="172" rx="15" ry="28" fill="url(#bdr)" transform="rotate(-16 150 172)"/>` +
      `<circle cx="44" cy="196" r="11" fill="url(#bsk)"/><circle cx="156" cy="196" r="11" fill="url(#bsk)"/>` +
      `<path d="M60 142 Q100 130 140 142 Q162 196 160 226 Q100 238 40 226 Q38 196 60 142 Z" fill="url(#bdr)"/>` +
      `<path d="M74 160 Q100 154 126 160 L132 222 Q100 230 68 222 Z" fill="#FFF6E8"/>` +
      `<path d="M72 176 L80 170 L88 176 L96 170 L104 176 L112 170 L120 176 L128 170" stroke="#E53950" stroke-width="3" fill="none" stroke-linejoin="round"/>` +
      `<path d="M40 100 Q36 30 100 28 Q164 30 160 100 Q162 136 136 148 L100 138 L64 148 Q38 136 40 100 Z" fill="url(#bsc)"/>` +
      `<circle cx="100" cy="98" r="44" fill="url(#bsk)"/>` +
      `<path d="M64 78 Q80 66 100 68 Q120 66 136 78 Q118 74 100 76 Q82 74 64 78 Z" fill="#D9DDE6"/>` +
      `<path d="M52 94 Q54 46 100 44 Q146 46 148 94 Q140 64 100 62 Q60 64 52 94 Z" fill="url(#bsc)"/>` +
      `<g fill="#fff" opacity=".9"><circle cx="72" cy="44" r="4"/><circle cx="100" cy="35" r="4"/><circle cx="128" cy="44" r="4"/><circle cx="50" cy="78" r="3.5"/><circle cx="150" cy="78" r="3.5"/><circle cx="86" cy="54" r="3"/><circle cx="114" cy="54" r="3"/><circle cx="48" cy="116" r="3"/><circle cx="152" cy="116" r="3"/></g>` +
      eye(82, 100, 10, 12, 7) + eye(118, 100, 10, 12, 7) + cheek(68, 118) + cheek(132, 118) +
      `<ellipse cx="100" cy="112" rx="6" ry="5" fill="#F2A98A"/>` +
      `<path d="M86 124 Q100 134 114 124" stroke="#8A3B44" stroke-width="3.5" fill="none" stroke-linecap="round"/>` +
      `<path d="M92 140 L100 134 L108 140 L104 158 L100 150 L96 158 Z" fill="#C92642"/><circle cx="100" cy="140" r="7" fill="#E53950"/>` },

    vnuchka: { w: 200, h: 236, svg:
      `<defs>${rg('vsk', [[0, '#FFEFE0'], [0.6, '#FFD8B8'], [1, '#F0B48E']])}${rg('vdr', [[0, '#FFB3CC'], [0.6, '#FF6F9F'], [1, '#D9437A']])}${rg('vhr', [[0, '#FFE7A0'], [0.6, '#F6C24E'], [1, '#D99A2A']])}${CK}</defs>` +
      `<path d="M138 96 Q172 138 160 188" stroke="#E2AA3A" stroke-width="18" stroke-linecap="round" fill="none"/>` +
      `<path d="M148 120 l12 4 M154 140 l12 2 M157 160 l11 0 M157 176 l10 -2" stroke="#C98A22" stroke-width="3" stroke-linecap="round"/>` +
      `<rect x="74" y="204" width="16" height="22" rx="7" fill="#fff"/><rect x="110" y="204" width="16" height="22" rx="7" fill="#fff"/>` +
      `<ellipse cx="80" cy="228" rx="17" ry="8" fill="#D9437A"/><ellipse cx="120" cy="228" rx="17" ry="8" fill="#D9437A"/>` +
      `<ellipse cx="58" cy="166" rx="13" ry="24" fill="#FFF3F7" transform="rotate(16 58 166)"/><ellipse cx="142" cy="166" rx="13" ry="24" fill="#FFF3F7" transform="rotate(-16 142 166)"/>` +
      `<circle cx="53" cy="188" r="10" fill="url(#vsk)"/><circle cx="147" cy="188" r="10" fill="url(#vsk)"/>` +
      `<path d="M72 140 Q100 132 128 140 L152 216 Q100 228 48 216 Z" fill="url(#vdr)"/>` +
      `<path d="M78 140 Q100 150 122 140 L118 156 Q100 162 82 156 Z" fill="#FFF3F7"/>` +
      `<circle cx="100" cy="176" r="4" fill="#FFD23F"/><circle cx="100" cy="194" r="4" fill="#FFD23F"/>` +
      `<path d="M52 208 Q100 220 148 208" stroke="#FFD23F" stroke-width="5" fill="none"/>` +
      `<path d="M150 192 L136 180 L138 202 Z M172 192 L186 180 L184 202 Z" fill="#4C8DF0"/><circle cx="161" cy="192" r="6" fill="#2F6FE0"/>` +
      `<circle cx="100" cy="94" r="48" fill="url(#vsk)"/>` +
      `<path d="M50 98 Q44 38 100 36 Q156 38 150 98 Q146 70 124 60 Q112 74 100 68 Q88 74 76 60 Q54 70 50 98 Z" fill="url(#vhr)"/>` +
      `<path d="M56 70 Q100 40 144 70" stroke="#E53950" stroke-width="7" fill="none" stroke-linecap="round"/>` +
      eye(82, 98, 11, 13, 7.5) + eye(118, 98, 11, 13, 7.5) +
      `<path d="M70 88 l-5 -4 M74 85 l-3 -5 M130 88 l5 -4 M126 85 l3 -5" stroke="#2B2140" stroke-width="2.5" stroke-linecap="round"/>` +
      cheek(66, 118) + cheek(134, 118) + `<ellipse cx="100" cy="112" rx="4" ry="3" fill="#F0A487"/>` +
      `<path d="M88 122 Q100 132 112 122 Q106 130 100 130 Q94 130 88 122 Z" fill="#C2405A"/>` },

    zhuchka: { w: 210, h: 200, svg:
      `<defs>${rg('zb', [[0, '#857A92'], [0.6, '#544A60'], [1, '#2F2838']])}${rg('zm', [[0, '#FFF6E8'], [1, '#E5CDAE']])}${CK}</defs>` +
      `<path d="M158 150 Q198 126 186 92" stroke="#544A60" stroke-width="16" stroke-linecap="round" fill="none"/>` +
      `<ellipse cx="108" cy="154" rx="56" ry="40" fill="url(#zb)"/><ellipse cx="98" cy="162" rx="30" ry="26" fill="url(#zm)"/>` +
      `<ellipse cx="78" cy="190" rx="18" ry="9" fill="#E5CDAE"/><ellipse cx="122" cy="190" rx="18" ry="9" fill="#E5CDAE"/>` +
      `<ellipse cx="98" cy="86" rx="54" ry="48" fill="url(#zb)"/>` + shine(78, 56, 14, 8, -25, 0.3) +
      `<path d="M52 56 Q22 68 30 120 Q46 126 58 94 Z" fill="#2B2433"/><path d="M144 56 Q174 68 166 120 Q150 126 138 94 Z" fill="#2B2433"/>` +
      `<ellipse cx="98" cy="110" rx="30" ry="22" fill="url(#zm)"/>` +
      `<circle cx="78" cy="64" r="6" fill="#E5B98A"/><circle cx="118" cy="64" r="6" fill="#E5B98A"/>` +
      eye(78, 82, 11, 13, 7.5) + eye(118, 82, 11, 13, 7.5) +
      `<ellipse cx="98" cy="100" rx="11" ry="8" fill="#1E1A24"/><ellipse cx="94" cy="97" rx="4" ry="2" fill="#fff" opacity=".6"/>` +
      `<path d="M98 108 v5 M98 113 q-8 6 -14 0 M98 113 q8 6 14 0" stroke="#3A2F2A" stroke-width="3" fill="none" stroke-linecap="round"/>` +
      `<path d="M92 117 Q98 134 104 117 Z" fill="#FF7B8A"/>` +
      `<path d="M60 128 Q98 146 136 128" stroke="#E53935" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="98" cy="142" r="7" fill="#FFD23F"/>` },

    koshka: { w: 200, h: 214, svg:
      `<defs>${rg('kc', [[0, '#FFD29A'], [0.6, '#F7A04A'], [1, '#D9772A']])}${CK}</defs>` +
      `<path d="M146 190 Q196 186 184 140 Q178 118 162 124" stroke="#E98A36" stroke-width="14" fill="none" stroke-linecap="round"/>` +
      `<ellipse cx="100" cy="168" rx="48" ry="40" fill="url(#kc)"/><ellipse cx="100" cy="176" rx="28" ry="26" fill="#FFF3E2"/>` +
      `<ellipse cx="78" cy="204" rx="16" ry="8" fill="#FFF3E2"/><ellipse cx="122" cy="204" rx="16" ry="8" fill="#FFF3E2"/>` +
      `<path d="M48 84 L52 24 L94 56 Z" fill="#F29A44"/><path d="M58 72 L61 40 L82 58 Z" fill="#FFB7C5"/>` +
      `<path d="M152 84 L148 24 L106 56 Z" fill="#F29A44"/><path d="M142 72 L139 40 L118 58 Z" fill="#FFB7C5"/>` +
      `<ellipse cx="100" cy="100" rx="56" ry="48" fill="url(#kc)"/>` + shine(80, 70, 16, 9) +
      `<path d="M100 56 V70 M86 58 L90 70 M114 58 L110 70" stroke="#D9772A" stroke-width="5" stroke-linecap="round"/>` +
      `<ellipse cx="100" cy="124" rx="24" ry="16" fill="#FFF3E2"/>` +
      eye(78, 100, 12, 14, 8) + eye(122, 100, 12, 14, 8) + cheek(64, 122) + cheek(136, 122) +
      `<path d="M93 114 L107 114 L100 122 Z" fill="#FF7D9C"/>` +
      `<path d="M100 122 v4 M100 126 q-6 5 -11 1 M100 126 q6 5 11 1" stroke="#7A4A2A" stroke-width="2.5" fill="none" stroke-linecap="round"/>` +
      `<path d="M78 122 L50 116 M78 128 L50 132 M122 122 L150 116 M122 128 L150 132" stroke="#B9875A" stroke-width="1.8" stroke-linecap="round"/>` },

    carrot: { w: 80, h: 170, svg:
      `<defs>${lg('crt', [[0, '#FFB45C'], [1, '#EE6A16']], 1, 0)}</defs>` +
      `<path d="M40 42 Q22 18 12 2 Q34 12 42 30 Q44 8 52 0 Q56 18 46 36 Q62 20 78 16 Q66 32 44 46 Z" fill="#4FAE4A"/>` +
      `<path d="M16 48 Q40 36 64 48 Q62 102 44 166 Q40 172 36 166 Q18 102 16 48 Z" fill="url(#crt)"/>` +
      `<path d="M22 72 L34 74 M48 94 L58 92 M28 116 L38 118 M46 136 L53 134" stroke="#C85A12" stroke-width="3" stroke-linecap="round" opacity=".6"/>` +
      shine(28, 72, 5, 16, 5, 0.45) },

    duck: { w: 186, h: 172, svg:
      `<defs>${rg('dk', [[0, '#FFF6B0'], [0.6, '#FFD93D'], [1, '#F2B200']])}${CK}</defs>` +
      `<ellipse cx="74" cy="164" rx="16" ry="6" fill="#FF8A1F"/><ellipse cx="110" cy="164" rx="16" ry="6" fill="#FF8A1F"/>` +
      `<path d="M38 110 L14 90 L42 100 Z" fill="#F2B200"/>` +
      `<ellipse cx="92" cy="118" rx="58" ry="44" fill="url(#dk)"/>` +
      `<path d="M58 112 Q90 94 112 116 Q96 142 62 128 Z" fill="#F7C51E"/>` +
      `<circle cx="122" cy="66" r="40" fill="url(#dk)"/>` +
      `<path d="M118 28 Q112 10 124 6 Q120 20 130 26 Z" fill="#F2B200"/>` + shine(110, 46, 12, 7) +
      eye(134, 62, 9, 11, 6.5) + cheek(124, 86, 'ck', 9, 6) +
      `<path d="M152 72 Q182 70 180 82 Q168 94 148 86 Z" fill="#FF8A1F"/><path d="M150 80 Q166 82 180 80" stroke="#D9620A" stroke-width="2" fill="none"/>` },
    // ---------- мир 4: Три медведя ----------
    bowl: { w: 160, h: 96, svg:
      `<defs>${lg('bwl', [[0, '#8DB8FF'], [1, '#2F64C9']])}</defs>` +
      `<path d="M104 34 L142 6" stroke="#C99A62" stroke-width="8" stroke-linecap="round"/>` +
      `<ellipse cx="80" cy="36" rx="72" ry="18" fill="#F7DFA8"/><ellipse cx="66" cy="32" rx="22" ry="6" fill="#FFF3D0"/>` +
      `<ellipse cx="100" cy="36" rx="14" ry="6" fill="#C99A62"/>` +
      `<path d="M6 36 Q12 92 80 94 Q148 92 154 36 Q80 60 6 36 Z" fill="url(#bwl)"/>` +
      `<ellipse cx="80" cy="36" rx="73" ry="18" fill="none" stroke="#A9C9FF" stroke-width="5"/>` +
      `<path d="M22 54 Q80 74 138 54" stroke="#fff" stroke-width="4" fill="none" opacity=".55"/>` +
      `<g fill="#fff" opacity=".9"><circle cx="48" cy="72" r="4"/><circle cx="80" cy="78" r="4.5"/><circle cx="112" cy="72" r="4"/></g>` },
    chair: { w: 120, h: 164, svg:
      `<defs>${lg('chr', [[0, '#E8AE6E'], [1, '#A8662E']])}</defs>` +
      `<rect x="20" y="98" width="13" height="64" rx="5" fill="#8E5426"/><rect x="87" y="98" width="13" height="64" rx="5" fill="#8E5426"/>` +
      `<rect x="20" y="8" width="13" height="96" rx="5" fill="url(#chr)"/><rect x="87" y="8" width="13" height="96" rx="5" fill="url(#chr)"/>` +
      `<path d="M26 16 Q60 0 94 16 L94 62 Q60 52 26 62 Z" fill="url(#chr)"/>` +
      `<path d="M60 50 C48 40 40 32 48 25 C54 20 60 26 60 29 C60 26 66 20 72 25 C80 32 72 40 60 50 Z" fill="#E8433A"/>` +
      `<path d="M10 94 L110 94 L104 112 L16 112 Z" fill="#B87437"/><rect x="8" y="86" width="104" height="12" rx="5" fill="#E8AE6E"/>` },
    bed: { w: 200, h: 136, svg:
      `<defs>${lg('bdw', [[0, '#E8AE6E'], [1, '#A8662E']])}</defs>` +
      `<rect x="14" y="116" width="10" height="16" rx="3" fill="#7A4A1E"/><rect x="178" y="116" width="10" height="16" rx="3" fill="#7A4A1E"/>` +
      `<path d="M8 124 L8 34 Q8 10 30 10 Q52 10 52 34 L52 124 Z" fill="url(#bdw)"/><circle cx="30" cy="40" r="9" fill="#E8433A"/>` +
      `<path d="M166 124 L166 64 Q166 48 180 48 Q194 48 194 64 L194 124 Z" fill="url(#bdw)"/>` +
      `<rect x="22" y="84" width="166" height="26" rx="8" fill="#A8662E"/>` +
      `<ellipse cx="66" cy="70" rx="26" ry="15" fill="#fff"/><ellipse cx="62" cy="66" rx="12" ry="5" fill="#EEF2FA"/>` +
      `<path d="M78 62 Q130 52 178 62 L178 98 Q130 108 78 98 Z" fill="#E8433A"/>` +
      `<g fill="#FFD23F"><circle cx="100" cy="72" r="4"/><circle cx="128" cy="68" r="4"/><circle cx="156" cy="72" r="4"/><circle cx="112" cy="88" r="4"/><circle cx="142" cy="86" r="4"/></g>` },
    cup: { w: 124, h: 100, svg:
      `<defs>${lg('cpb', [[0, '#FF9A8A'], [1, '#D7342C']])}</defs>` +
      `<ellipse cx="60" cy="88" rx="56" ry="11" fill="#DCE4F2"/><ellipse cx="60" cy="86" rx="42" ry="7" fill="#fff"/>` +
      `<path d="M94 40 Q118 38 114 58 Q110 72 92 68" stroke="#D7342C" stroke-width="8" fill="none" stroke-linecap="round"/>` +
      `<path d="M20 30 L100 30 Q98 82 60 84 Q22 82 20 30 Z" fill="url(#cpb)"/>` +
      `<ellipse cx="60" cy="30" rx="40" ry="9" fill="#B5652A" stroke="#fff" stroke-width="4"/>` +
      `<g fill="#fff" opacity=".9"><circle cx="40" cy="52" r="5"/><circle cx="62" cy="62" r="5"/><circle cx="82" cy="50" r="5"/></g>` },
    malina: { w: 100, h: 120, svg:
      `<defs>${rg('ml', [[0, '#FF9DB4'], [0.55, '#E8285A'], [1, '#A81040']])}</defs>` +
      [[30, 42], [50, 40], [70, 42], [22, 60], [41, 60], [60, 60], [78, 60], [30, 78], [50, 78], [70, 78], [40, 95], [60, 95], [50, 106]]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="13" fill="url(#ml)"/><circle cx="${x - 4}" cy="${y - 4}" r="3" fill="#fff" opacity=".55"/>`).join('') +
      `<path d="M50 30 L32 16 L44 26 L40 6 L52 22 L64 6 L60 26 L72 16 L56 32 Z" fill="#4FAE4A"/>` },
    finger: { w: 120, h: 140, svg:
      `<path d="M44 66 L44 18 Q44 4 56 4 Q68 4 68 18 L68 58 Q72 50 82 52 Q92 54 92 64 Q98 58 106 62 Q114 66 112 78 L110 104 Q106 132 78 136 L60 136 Q38 134 28 112 L14 84 Q8 72 18 68 Q28 64 36 76 L44 88 Z" fill="#FFE3C7" stroke="#2B2140" stroke-width="5" stroke-linejoin="round"/>` +
      `<path d="M68 60 L68 80 M92 64 L92 82" stroke="#2B2140" stroke-width="4" stroke-linecap="round"/>` }
  };

  // Волк без праздничного колпака — для «Теремка»
  { const s = ART.wolf.svg, i = s.lastIndexOf('<g transform="rotate(14 112 40)">'); ART.wolf_plain = { w: ART.wolf.w, h: ART.wolf.h, svg: s.slice(0, i) }; }
  // Мама-утка — белая, с бантиком; для «Репки»
  { const sw = { '#FFF6B0': '#FFFFFF', '#FFD93D': '#F1F3F8', '#F2B200': '#C9CEDB', '#F7C51E': '#E1E5EE' };
    ART.duck_mama = { w: ART.duck.w, h: ART.duck.h, svg: ART.duck.svg.replace(/#(FFF6B0|FFD93D|F2B200|F7C51E)/g, m => sw[m]) +
      '<path d="M102 34 L86 22 L88 46 Z M106 34 L122 20 L122 46 Z" fill="#FF6F9F"/><circle cx="104" cy="34" r="6" fill="#E5487E"/>' }; }

  // Медведица, Мишутка и Маша — перекраска готовых рисунков плюс детали
  const recolor = (src, map, extra = '') => ({ w: ART[src].w, h: ART[src].h, svg: ART[src].svg.replace(/#[0-9A-F]{6}/g, m => map[m] || m) + extra });
  ART.bear_mama = recolor('bear', { '#D9A273': '#E6B68A', '#A5683E': '#B97B4E', '#7A4A2A': '#8C5A36' },
    '<path d="M68 170 Q100 162 132 170 L138 214 Q100 224 62 214 Z" fill="#FFF3F7"/><path d="M64 214 Q100 224 136 214" stroke="#FF9FC2" stroke-width="5" fill="none" stroke-dasharray="1 7" stroke-linecap="round"/>' +
    '<path d="M68 42 L50 28 L52 58 Z M76 42 L94 28 L92 58 Z" fill="#FF6F9F"/><circle cx="72" cy="43" r="7" fill="#E5487E"/>');
  ART.mishutka = recolor('bear', { '#D9A273': '#EEC79A', '#A5683E': '#CC9160', '#7A4A2A': '#9E6A42', '#8A5634': '#A87650' },
    '<path d="M48 150 Q100 176 152 150 L150 166 Q100 190 50 166 Z" fill="#E53935"/><path d="M120 170 L136 204 L120 202 L110 174 Z" fill="#C62828"/>' +
    '<path d="M56 160 Q100 180 144 160" stroke="#FFD23F" stroke-width="3" fill="none" stroke-dasharray="6 6"/>');
  ART.masha = recolor('vnuchka', { '#FFB3CC': '#8DB2F5', '#FF6F9F': '#4A78D0', '#D9437A': '#2F55A8', '#FFE7A0': '#C48A5A', '#F6C24E': '#8A5530',
    '#D99A2A': '#5E3A1E', '#E2AA3A': '#7A4A2A', '#C98A22': '#5E3A1E', '#4C8DF0': '#E53950', '#2F6FE0': '#B31E3A' });

  const cache = {};
  const art = G.art = {
    has: n => !!ART[n],
    size: n => ART[n] ? [ART[n].w, ART[n].h] : [1, 1],
    svg(n) { const a = ART[n]; return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${a.w} ${a.h}" width="${a.w}" height="${a.h}">${a.svg}</svg>`; },
    url(n) { return cache['u' + n] || (cache['u' + n] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(this.svg(n))); },
    img(n, cls) { const i = new Image(); i.src = this.url(n); i.alt = ''; i.draggable = false; if (cls) i.className = cls; return i; },
    // Растрирование в canvas-кэш. px — длинная сторона в пикселях.
    c: {},
    ready(names, px) {
      return Promise.all(names.map(n => {
        if (!ART[n]) { console.warn('нет рисунка', n); return null; }
        const key = n;
        if (this.c[key] && this.c[key].px >= px) return null;
        return new Promise(res => {
          const im = new Image();
          let fired = false;
          const done = () => {
            if (fired) return; fired = true;
            const a = ART[n], k = px / Math.max(a.w, a.h);
            const cv = document.createElement('canvas');
            cv.width = Math.max(1, Math.round(a.w * k)); cv.height = Math.max(1, Math.round(a.h * k));
            try { cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); } catch (e) { /* ok */ }
            this.c[key] = { cv, px, ar: a.w / a.h };
            res();
          };
          im.onload = done; im.onerror = () => { console.warn('рисунок не растрировался', n); res(); };
          im.src = this.url(n);
          if (im.complete && im.naturalWidth) done();
        });
      }));
    },
    // Нарисовать по высоте h (CSS px). anchor: 'c' — центр, 'b' — середина низа.
    draw(ctx, n, x, y, h, o = {}) {
      const s = this.c[n]; if (!s) return;
      const w = h * s.ar;
      ctx.save();
      ctx.translate(x, y);
      if (o.rot) ctx.rotate(o.rot);
      ctx.scale((o.flip ? -1 : 1) * (o.sx || 1), o.sy || 1);
      if (o.alpha != null) ctx.globalAlpha *= o.alpha;
      const ay = o.anchor === 'b' ? -h : -h / 2;
      ctx.drawImage(s.cv, -w / 2, ay, w, h);
      ctx.restore();
    },
    width(n, h) { const s = this.c[n]; return s ? h * s.ar : h; }
  };
})();
