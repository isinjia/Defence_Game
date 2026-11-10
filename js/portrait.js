// ===== 게이트 크로니클: 캐릭터 일러스트 생성기 =====
// 한국 웹툰 헌터물 그림체. 셀 음영, 갸름한 얼굴, 날카로운 눈매, 뾰족한 머리 결.
// 시드에서 머리·눈·의상·장신구를 골라 상반신 SVG를 그린다. (viewBox 200×240)

const PORTRAIT = (() => {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  const hex2 = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const toHex = (r, g, b) => '#' + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('');
  const shade = (h, t) => { const [r, g, b] = hex2(h); return t >= 0 ? toHex(r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t) : toHex(r * (1 + t), g * (1 + t), b * (1 + t)); };
  const mix = (a, b, t) => { const A = hex2(a), B = hex2(b); return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); };
  const f = (n) => n.toFixed(1);

  const SKIN = ['#f6e2d3', '#f1d8c5', '#ead0bb', '#e2c3aa', '#d6b394'];
  const HAIR = ['#121219', '#121219', '#1b1a24', '#24202a', '#2f2420', '#3c2c24', '#1c2338', '#cfd3dc', '#e9ebf0', '#4a1f2c'];
  const EYES = ['#3a2a22', '#2a2026', '#4a3426', '#262a36'];
  const OUTFIT = ['#121722', '#16161c', '#1d1a22', '#161e22', '#22202a', '#f0eee8'];

  // 앞머리: 헤어라인에서 뻗는 뾰족한 결 뭉치들
  function bangs(r, style) {
    const n = style === 'curtain' ? 6 : 7;
    let d = '';
    for (let k = 0; k < n; k++) {
      // 맨 바깥 두 가닥은 옆머리에 가려 가는 조각만 남으므로 그리지 않는다
      if (style !== 'cover' && (k === 0 || k === n - 1)) continue;
      const t0 = k / n, t1 = (k + 1) / n;
      const ang = (t) => Math.PI * (1.06 - t * 1.12);
      const rx = 34, ry = 30, cx = 100, cy = 78;
      const x0 = cx + Math.cos(ang(t0)) * rx, y0 = cy - Math.sin(ang(t0)) * ry;
      const x1 = cx + Math.cos(ang(t1)) * rx, y1 = cy - Math.sin(ang(t1)) * ry;
      const mid = (t0 + t1) / 2;
      let len = 30 + r() * 16;
      let lean = (mid - 0.5) * 18 + (r() - 0.5) * 8;
      if (style === 'curtain') { lean = (mid < 0.5 ? -1 : 1) * (10 + r() * 6); len = 26 + r() * 10 + Math.abs(mid - 0.5) * 30; }
      if (style === 'swept') { lean = -12 - r() * 8; len = 28 + mid * 26; }
      if (style === 'spiky') { len = 22 + r() * 14; lean = (mid - 0.5) * 30; }
      if (style === 'cover' && k === (n >> 1) + 1) { len = 58; lean = 10; }
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
      // 바깥쪽 가닥이 얼굴 밖으로 삐져나와 가는 선처럼 보이지 않게, 끝을 옆머리 안쪽으로 모은다
      const tx = Math.max(72, Math.min(128, mx + lean)), ty = Math.min(my + len, 116);
      d += `M${f(x0)} ${f(y0)}Q${f(x0 + (tx - x0) * 0.35 - 3)} ${f(y0 + (ty - y0) * 0.6)} ${f(tx)} ${f(ty)}Q${f(x1 + (tx - x1) * 0.4 + 3)} ${f(y1 + (ty - y1) * 0.55)} ${f(x1)} ${f(y1)}Z`;
    }
    return d;
  }
  // 머리 광택: 정수리 곡선을 따라 끊어지는 짧은 빛
  function shine(r) {
    const off = r() * 6 - 3;
    return `M${f(76 + off)} ${f(50)}Q${f(84 + off)} ${f(42)} ${f(93 + off)} ${f(40)}M${f(104 + off)} ${f(39)}Q${f(113 + off)} ${f(40)} ${f(119 + off)} ${f(45)}`;
  }

  function make(seed, gender, element, rankIdx, opts = {}) {
    const r = FX.rng(FX.hash(seed + '|wt'));
    const pick = (a) => a[Math.floor(r() * a.length)];
    const id = FX.uid();
    const pal = FX.PAL[element] || FX.PAL.none;
    const ec = element && ELEMENTS[element] ? elemColor(element) : '#46e0d0';
    const rank = rankIdx == null ? 0 : rankIdx;
    const F = gender === 'F';
    const years = opts.age == null ? 25 : opts.age;
    const st = typeof ageStage === 'function' ? ageStage(years) : 'adult';
    const race = opts.race || 'human';
    const young = st === 'baby' || st === 'child';
    const old = st === 'elder' || st === 'middle';
    const RSKIN = { orc: ['#7f9c5c', '#6f8c4f', '#8aa86a', '#627e48'], elf: ['#f6ece4', '#f1e6de', '#ece2dc'], dwarf: ['#eab99c', '#dca386', '#e5ad90'], dragonkin: ['#efdccb', '#e6cfbd'] };
    const RHAIR = { orc: ['#141414', '#24201c', '#3a2a20'], elf: ['#e9ebf0', '#e6d39a', '#cfd8b8', '#b9c6d8'], dwarf: ['#8a3a1e', '#a8582a', '#5a3a22', '#c0682e'], dragonkin: ['#3a1a1e', '#14141a', '#5a2026'] };
    const skin = RSKIN[race] ? pick(RSKIN[race]) : pick(SKIN);
    let hair = RHAIR[race] ? pick(RHAIR[race]) : r() < 0.1 ? shade(ec, -0.45) : pick(HAIR);
    // 나이가 들수록 머리가 센다
    if (st === 'middle') hair = mix(hair, '#a9a9b0', 0.3);
    if (st === 'elder') hair = mix(hair, '#e4e4ea', Math.min(0.92, 0.55 + (years - 65) / 40));
    const light = hex2(hair).reduce((a, b) => a + b, 0) > 450;
    const outfit = pick(OUTFIT);
    const glowEyes = !young && (rank >= 4 || r() < 0.12);
    const iris = glowEyes ? ec : pick(EYES);
    const bangStyle = young ? pick(['curtain', 'swept']) : F ? pick(['curtain', 'swept', 'cover', 'curtain']) : pick(['swept', 'spiky', 'cover', 'curtain', 'swept']);
    const back = st === 'baby' ? 'none' : st === 'child' ? (F ? pick(['bob', 'pony']) : 'none') : F ? pick(['long', 'long', 'pony', 'bob']) : pick(['none', 'none', 'nape', 'tail']);
    const outfitKind = pick(['coat', 'hanbok', 'mandarin', 'tactical']);
    const acc = young ? { hairpin: F && r() < 0.5 } : { earpiece: r() < 0.18, scar: !F && r() < 0.2, marks: rank >= 5 || r() < 0.12, earring: F ? r() < 0.45 : r() < 0.2, mask: !F && race === 'human' && r() < 0.1, hairpin: F && r() < 0.35 };
    const beard = race === 'dwarf' ? (!F || r() < 0.15) : !F && (st === 'elder' ? r() < 0.45 : st === 'middle' ? r() < 0.2 : 0);

    const skinSh = mix(skin, '#8a5a6a', 0.28), skinDeep = mix(skin, '#5a3040', 0.45);
    const hairHi = light ? '#ffffff' : shade(hair, 0.45), hairSh = light ? shade(hair, -0.3) : shade(hair, -0.5);
    const line = mix(hair, '#000000', 0.55);

    // ---- 배경: 어두운 무드, 대각 광선, 등급 오라
    const aura = 0.18 + rank * 0.06;
    const bg = `<rect width="200" height="240" fill="url(#${id}bg)"/>
      <path d="M-20 200L120 -20L150 -20L10 200ZM60 240L210 30L222 46L84 240Z" fill="${ec}" opacity=".07"/>
      <circle cx="100" cy="104" r="${74 + rank * 5}" fill="url(#${id}aura)"/>
      ${Array.from({ length: 4 + rank * 2 }, () => { const x = r() * 200, y = r() * 200, l = 4 + r() * 10; return `<path d="M${f(x)} ${f(y)}l${f(l * 0.4)} ${f(-l)}" stroke="${ec}" stroke-width="1" opacity="${(0.25 + r() * 0.5).toFixed(2)}"/>`; }).join('')}`;

    // ---- 뒷머리
    const BACK = {
      none: '',
      nape: 'M66 104C62 130 66 148 74 154L126 154C134 148 138 130 134 104Z',
      tail: 'M118 64C150 70 158 120 150 176L146 162L142 178C140 140 138 104 116 82Z',
      long: 'M64 98C56 150 62 200 50 240L72 228L84 240L100 230L116 240L128 228L150 240C138 200 144 150 136 98Z',
      pony: 'M120 50C162 52 170 120 156 196L150 180L144 200C146 150 142 100 118 76Z',
      bob: 'M62 100C58 128 62 150 68 162L80 154L90 164L100 156L110 164L120 154L132 162C138 150 142 128 138 100Z',
    };
    const backSvg = BACK[back] ? `<path d="${BACK[back]}" fill="${hair}"/><path d="${BACK[back]}" fill="none" stroke="${line}" stroke-width="1"/>` : '';

    // ---- 의상
    const babyCol = pick(['#f2c6d0', '#c6dcf2', '#f2e6b8', '#cfe8c8']);
    const cloth = st === 'baby' ? babyCol : st === 'child' ? pick(['#3a5a8a', '#8a3a4a', '#4a7a5a', '#6a4a8a']) : outfit, clothSh = shade(outfit, outfit === '#f0eee8' ? -0.25 : -0.45), clothHi = shade(outfit, outfit === '#f0eee8' ? 0.3 : 0.18);
    let body = `<path d="M22 240C26 206 50 186 84 178L116 178C150 186 174 206 178 240Z" fill="${cloth}"/>
      <path d="M22 240C26 206 50 186 84 178L92 190C70 200 56 216 52 240Z" fill="${clothSh}"/>`;
    if (st === 'baby') body += `<circle cx="100" cy="200" r="5" fill="#fff" opacity=".8"/><path d="M84 186Q100 196 116 186" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/>`;
    else if (st === 'child') body += `<path d="M84 178Q100 190 116 178" stroke="${clothHi}" stroke-width="4" fill="none"/><rect x="88" y="206" width="24" height="14" rx="3" fill="${clothHi}" opacity=".6"/>`;
    else if (outfitKind === 'coat') body += `
      <path d="M70 164L84 200L100 212L116 200L130 164L140 176L126 214L100 226L74 214L60 176Z" fill="${clothSh}" stroke="${line}" stroke-width="1"/>
      <path d="M140 176L126 214L100 226" stroke="${ec}" stroke-width="1.4" fill="none" opacity=".8"/>
      <path d="M100 226V240" stroke="${line}" stroke-width="1.5"/>`;
    else if (outfitKind === 'hanbok') body += `
      <path d="M84 178L118 178L72 240L52 240Z" fill="${clothHi}"/>
      <path d="M118 178L128 186L82 240L72 240Z" fill="${shade(ec, -0.35)}"/>
      <path d="M119 179L76 238" stroke="#f4f1ea" stroke-width="3.2"/>
      <path d="M84 178L100 206" stroke="${line}" stroke-width="1.2"/>
      <path d="M96 212Q108 214 118 222M96 212Q100 226 96 238" stroke="${ec}" stroke-width="2" fill="none" opacity=".85"/>`;
    else if (outfitKind === 'mandarin') body += `
      <path d="M82 166Q100 172 118 166L120 184Q100 192 80 184Z" fill="${clothSh}" stroke="${line}" stroke-width="1"/>
      <path d="M100 188V240" stroke="${line}" stroke-width="1.4"/>
      ${[198, 210, 222, 234].map((y) => `<path d="M94 ${y}H106" stroke="${ec}" stroke-width="2.2" stroke-linecap="round"/><circle cx="100" cy="${y}" r="1.6" fill="${ec}"/>`).join('')}`;
    else body += `
      <path d="M76 172L100 192L124 172L128 188L100 206L72 188Z" fill="${clothSh}"/>
      <path d="M50 214L84 198M150 214L116 198" stroke="${shade(outfit, 0.3)}" stroke-width="3"/>
      <path d="M100 206V240" stroke="${ec}" stroke-width="1.6" opacity=".9"/>
      <rect x="112" y="216" width="22" height="9" fill="${clothSh}"/><rect x="115" y="219" width="7" height="2" fill="${ec}"/>`;

    // ---- 목과 얼굴 (V라인)
    const faceD = young ? 'M68 92C68 62 82 48 100 48C118 48 132 62 132 92C132 118 121 136 100 143C79 136 68 118 68 92Z'
      : race === 'orc' ? 'M66 88C66 60 82 46 100 46C118 46 134 60 134 88C134 112 132 130 121 142L100 151L79 142C68 130 66 112 66 88Z'
      : race === 'dwarf' ? 'M67 92C67 62 82 48 100 48C118 48 133 62 133 92C133 116 125 134 100 143C75 134 67 116 67 92Z'
      : F ? 'M71 92C71 64 84 50 100 50C116 50 129 64 129 92C129 112 124 128 115 140L100 153L85 140C76 128 71 112 71 92Z'
      : 'M70 90C70 62 84 48 100 48C116 48 130 62 130 90C130 112 125 128 116 140L100 155L84 140C75 128 70 112 70 90Z';
    const neck = `<path d="M89 134L111 134L113 182Q100 188 87 182Z" fill="${skin}"/>
      <path d="M89 140L100 156L111 140L112 162Q100 170 88 162Z" fill="${skinSh}"/>
      <path d="M89 134L111 134L113 182Q100 188 87 182Z" fill="none" stroke="${skinDeep}" stroke-width=".8" opacity=".6"/>`;
    const ears = race === 'elf' ? `<path d="M71 98L44 76Q52 96 64 110Q68 116 72 116Z" fill="${skinSh}" stroke="${skinDeep}" stroke-width=".8"/><path d="M129 98L156 76Q148 96 136 110Q132 116 128 116Z" fill="${skin}" stroke="${skinDeep}" stroke-width=".8"/>`
      : race === 'beastkin' ? '' : race === 'orc' ? `<path d="M70 96L58 90Q60 106 72 116Z" fill="${skinSh}"/><path d="M130 96L142 90Q140 106 128 116Z" fill="${skin}"/>`
      : `<path d="M70 98Q63 96 64 106Q66 116 72 116Z" fill="${skinSh}"/><path d="M130 98Q137 96 136 106Q134 116 128 116Z" fill="${skin}"/>`;
    const face = `${ears}<path d="${faceD}" fill="${skin}"/>
      <path d="M71 92C71 112 76 128 85 140L100 153L92 141C82 128 77 112 77 94Z" fill="${skinSh}"/>
      <path d="M129 92C129 112 124 128 115 140L113 138C121 126 126 110 127 92Z" fill="${ec}" opacity=".45"/>
      <path d="${faceD}" fill="none" stroke="${skinDeep}" stroke-width="1"/>
      ${F ? `<ellipse cx="83" cy="121" rx="6" ry="2.4" fill="#ff8a9a" opacity=".22"/><ellipse cx="117" cy="121" rx="6" ry="2.4" fill="#ff8a9a" opacity=".22"/>` : ''}
      <path d="M101 113L98.5 121L102 121.5" stroke="${skinDeep}" stroke-width="1.1" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;

    let feat = '';
    if (old) feat += `<path d="M92 121Q88 128 91 135M108 121Q112 128 109 135" stroke="${skinDeep}" stroke-width="${st === 'elder' ? 1.1 : 0.8}" fill="none" opacity=".6" stroke-linecap="round"/>`;
    if (st === 'elder') feat += `<path d="M70 104l-5 -2M70 107l-5 1M130 104l5 -2M130 107l5 1M77 110Q85 114 92 110M108 110Q115 114 123 110" stroke="${skinDeep}" stroke-width=".9" fill="none" opacity=".6" stroke-linecap="round"/>`;
    if (race === 'orc' && !young) feat += `<path d="M90 140L87 127L94 136Z" fill="#f2ead2" stroke="#8a7a5a" stroke-width=".6"/><path d="M110 140L113 127L106 136Z" fill="#f2ead2" stroke="#8a7a5a" stroke-width=".6"/><path d="M96 118Q100 122 104 118" stroke="${skinDeep}" stroke-width="1.4" fill="none"/>`;
    if (race === 'dragonkin') feat += `<path d="M120 112q4 -2 6 1M118 118q4 -2 6 1M74 112q4 -3 6 0" stroke="${ec}" stroke-width="1.2" fill="none" opacity=".8"/>`;
    // ---- 눈 (가늘고 날카로운 눈매)
    const sc = F ? 'M76 104Q84 96.5 94.5 101.5Q87 108.5 77.5 106.5Z' : 'M76 104Q85 98.5 94.5 102Q87 107.5 77.5 105.5Z';
    // 아이 눈은 세로로 크게, 가로는 조금만 (가로로 키우면 두 눈이 이어져 안경처럼 보인다)
    const eyeK = st === 'baby' ? 'translate(84 104) scale(1.12 1.45) translate(-86 -104)' : st === 'child' ? 'translate(85 104) scale(1.08 1.28) translate(-86 -104)' : st === 'elder' ? 'translate(86 104) scale(1 .82) translate(-86 -104)' : '';
    const eyeOne = (flip) => `<g ${flip ? 'transform="translate(200 0) scale(-1 1)"' : ''}><g transform="${eyeK}">
        <path d="${sc}" fill="#f8f7fb"/>
        <clipPath id="${id}e${flip ? 1 : 0}"><path d="${sc}"/></clipPath>
        <g clip-path="url(#${id}e${flip ? 1 : 0})">
          <ellipse cx="86.5" cy="103.5" rx="${F ? 4.9 : 4.4}" ry="${F ? 6.2 : 5.2}" fill="url(#${id}iris)"/>
          <ellipse cx="86.5" cy="104" rx="${race === 'dragonkin' ? 0.8 : 1.9}" ry="${F ? 3.2 : 2.6}" fill="#07070c"/>
          <path d="M70 92H100V101Q86 98 70 103Z" fill="${skinDeep}" opacity=".35"/>
        </g>
        <circle cx="88" cy="101.6" r="1.3" fill="#fff"/>
        <path d="${F ? 'M72.5 102Q83 94 95.5 101.2' : 'M73 102.5Q84 96.5 95.5 101.8'}" stroke="${line}" stroke-width="${F ? 2.6 : 2.3}" fill="none" stroke-linecap="round"/>
        <path d="${F ? 'M73 102L69.5 100.2' : 'M73.5 102.5L70 101.6'}" stroke="${line}" stroke-width="${F ? 1.8 : 1.4}" stroke-linecap="round"/>
        <path d="M79 107Q85 108.6 90 107.4" stroke="${line}" stroke-width=".8" fill="none" opacity=".55"/>
        ${glowEyes ? `<ellipse cx="86.5" cy="103.5" rx="8" ry="5" fill="${ec}" opacity=".25"/><path d="M76 104L66 106" stroke="${ec}" stroke-width="1" opacity=".7"/>` : ''}
      </g></g>`;
    const browD = F ? 'M75 93.5Q85 90.5 95 93.5' : pick(['M74 92.5L96 95.5', 'M74 94L96 94.5', 'M75 91.5Q86 90 96 94']);
    const browC = st === 'elder' ? mix(hair, '#ffffff', 0.3) : hairSh;
    const browW = (F ? 1.6 : 2.3) * (st === 'elder' || race === 'orc' || race === 'dwarf' ? 1.5 : young ? 0.8 : 1);
    const brows = `<path d="${browD}" stroke="${browC}" stroke-width="${browW}" fill="none" stroke-linecap="round"/>
      <path d="${browD}" transform="translate(200 0) scale(-1 1)" stroke="${browC}" stroke-width="${browW}" fill="none" stroke-linecap="round"/>`;
    const mouth = young ? `<path d="M96 133Q100 137 104 133" stroke="${shade(skin, -0.45)}" stroke-width="1.4" fill="none" stroke-linecap="round"/><ellipse cx="82" cy="122" rx="6" ry="3" fill="#ff8a9a" opacity=".3"/><ellipse cx="118" cy="122" rx="6" ry="3" fill="#ff8a9a" opacity=".3"/>` : F
      ? `<path d="M95.5 133.5Q100 135 104.5 133.5" stroke="${shade(skin, -0.45)}" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M97 135.6Q100 136.8 103 135.6" stroke="#d4707e" stroke-width="1.4" fill="none" opacity=".6"/>`
      : `<path d="${pick(['M95 134L105 133.6', 'M95 134.2Q101 135 105.5 132.8'])}" stroke="${shade(skin, -0.5)}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;

    // ---- 머리카락
    const MASS = 'M62 122C53 60 76 27 100 27C124 27 147 60 138 122C135 130 131 131 128 126L127 104L73 104L72 126C69 131 65 130 62 122Z';
    const CAP = 'M66 92C63 56 80 35 100 35C120 35 137 56 134 92C129 72 117 63 100 63C83 63 71 72 66 92Z';
    // 옆머리: 관자놀이에서 윗머리 밑으로 이어져 귀를 덮고, 뺨선을 따라 부드럽게 끝난다 (톱니 끝 없이)
    const shortLock = back === 'none' || back === 'tail';
    const LOCK = shortLock ? 'M66 60C61 84 62 108 68 124C70.5 119 73 112 75 104C75.5 92 77.5 80 83 64Z' : 'M65 60C59 92 61 124 69 146C72.5 137 75.5 124 77 110C77.5 96 78.5 82 83 64Z';
    // 윤곽선은 얼굴 쪽 안쪽 선과 뒷머리 아래로 나온 끝부분에만 긋는다 (뒷머리와 겹치는 바깥 선은 이음매로 보인다)
    const LOCK_IN = shortLock ? 'M68 124C70.5 119 73 112 75 104C75.5 92 77.5 80 83 64' : 'M69 146C72.5 137 75.5 124 77 110C77.5 96 78.5 82 83 64';
    const LOCK_OUT = shortLock ? 'M66 60C61 84 62 108 68 124' : 'M65 60C59 92 61 124 69 146';
    const bangD = bangs(r, bangStyle);
    let extra = '';
    if (race === 'beastkin') { const fox = r() < 0.5; extra += `<path d="M70 58L${fox ? 60 : 64} ${fox ? 16 : 24}L90 42Z" fill="${hair}" stroke="${line}" stroke-width=".9"/><path d="M73 52L66 28L84 42Z" fill="#e8a8b0" opacity=".7"/><path d="M130 58L${fox ? 140 : 136} ${fox ? 16 : 24}L110 42Z" fill="${hair}" stroke="${line}" stroke-width=".9"/><path d="M127 52L134 28L116 42Z" fill="#e8a8b0" opacity=".7"/>`; }
    if (race === 'dragonkin') extra += `<path d="M76 54Q58 34 66 12Q70 30 84 46Z" fill="#2a2228" stroke="${ec}" stroke-width="1"/><path d="M124 54Q142 34 134 12Q130 30 116 46Z" fill="#2a2228" stroke="${ec}" stroke-width="1"/>`;
    if (beard) extra += race === 'dwarf' || st === 'elder'
      ? `<path d="M70 112C71 150 86 174 100 178C114 174 129 150 130 112C122 128 112 134 100 134C88 134 78 128 70 112Z" fill="${hair}" stroke="${line}" stroke-width=".9"/><path d="M84 132Q100 124 116 132Q108 128 100 130Q92 128 84 132Z" fill="${shade(hair, 0.15)}"/><path d="M92 146L94 166M100 148V172M108 146L106 166" stroke="${hairSh}" stroke-width="1" opacity=".6"/>`
      : `<path d="M80 128Q100 150 120 128Q114 146 100 150Q86 146 80 128Z" fill="${hair}" opacity=".85"/>`;
    // 옆머리 → 앞머리 → 윗머리 순서로 그린다. 앞머리가 옆머리를 덮어 둘이 만나는 곳에 이음매 선이 생기지 않고, 윗머리가 뿌리를 덮는다
    const hairFront = st === 'baby' ? `<path d="M74 70C76 52 88 46 100 46C112 46 124 52 126 70C118 60 110 58 100 58C90 58 82 60 74 70Z" fill="${hair}"/><path d="M98 47Q104 36 111 42Q104 42 101 49Z" fill="${hair}" stroke="${line}" stroke-width=".8"/>` : `<path d="${LOCK}" fill="${hair}"/><path d="${LOCK}" transform="translate(200 0) scale(-1 1)" fill="${hair}"/>
      <clipPath id="${id}lk"><rect x="0" y="93" width="200" height="160"/></clipPath><clipPath id="${id}lo"><rect x="0" y="128" width="200" height="120"/></clipPath>
      <g fill="none" stroke="${line}" stroke-width=".9" stroke-linecap="round"><g clip-path="url(#${id}lk)"><path d="${LOCK_IN}"/><path d="${LOCK_IN}" transform="translate(200 0) scale(-1 1)"/></g>
      <g clip-path="url(#${id}lo)"><path d="${LOCK_OUT}"/><path d="${LOCK_OUT}" transform="translate(200 0) scale(-1 1)"/></g></g>
      <path d="${bangD}" fill="${hair}"/><mask id="${id}bm"><path d="${faceD}" fill="#fff"/><path d="${LOCK}" fill="#000"/><path d="${LOCK}" transform="translate(200 0) scale(-1 1)" fill="#000"/></mask><path d="${bangD}" fill="none" stroke="${line}" stroke-width=".9" stroke-linejoin="round" mask="url(#${id}bm)"/>
      <path d="${CAP}" fill="${hair}"/>
      <path d="${shine(r)}" stroke="${hairHi}" stroke-width="2.4" fill="none" opacity="${light ? 0.55 : 0.4}" stroke-linecap="round"/>`;
    const massSvg = st === 'baby' ? '' : `<path d="${MASS}" fill="${hair}"/><path d="${MASS}" fill="none" stroke="${line}" stroke-width="1"/>
      <path d="M72 82C80 68 90 64 100 64C110 64 120 68 128 82L128 104L72 104Z" fill="${hairSh}" opacity=".55"/>
      <path d="M138 120C146 60 124 28 100 28" stroke="${ec}" stroke-width="2" fill="none" opacity=".55"/>`;
    // 앞머리가 이마에 드리우는 그림자
    const bangShadow = st === 'baby' ? '' : `<clipPath id="${id}fc"><path d="${faceD}"/></clipPath><g clip-path="url(#${id}fc)"><path d="${bangD}" fill="${skinDeep}" opacity=".35" transform="translate(-2 4)"/></g>`;

    // ---- 장신구
    let accSvg = '';
    // 흉터는 피부 층: 눈·눈썹·앞머리보다 먼저 그리고 얼굴 안으로 자른다. 눈알 구간은 끊어 눈썹 위~눈꺼풀, 눈 아래~뺨 두 조각.
    let scarSvg = '';
    if (acc.scar) {
      const scarC = mix(skin, '#8a2f3a', 0.55), scarHi = mix(skin, '#ffffff', 0.4);
      scarSvg = `<clipPath id="${id}sc"><path d="${faceD}"/></clipPath><g clip-path="url(#${id}sc)" fill="none" stroke-linecap="round">
        <path d="M111.6 85.5Q112.6 91 113.9 96.6" stroke="${scarC}" stroke-width="1.7"/><path d="M112.5 86Q113.4 91 114.6 96.2" stroke="${scarHi}" stroke-width=".6" opacity=".7"/>
        <path d="M115.9 109.6Q117 114 117.6 119" stroke="${scarC}" stroke-width="1.7"/><path d="M116.8 110Q117.8 114 118.4 118.6" stroke="${scarHi}" stroke-width=".6" opacity=".7"/></g>`;
    }
    if (acc.marks) accSvg += `<path d="M77 116L82 112L80 120M123 116L118 112L120 120" stroke="${ec}" stroke-width="1.3" fill="none"/><path d="M100 64L97 70L100 76L103 70Z" fill="${ec}" opacity=".9"/>`;
    if (acc.earring) accSvg += `<path d="M66 114V122" stroke="${ec}" stroke-width="1.4"/><circle cx="66" cy="123.5" r="1.8" fill="${ec}"/><path d="M134 114V122" stroke="${ec}" stroke-width="1.4"/><circle cx="134" cy="123.5" r="1.8" fill="${ec}"/>`;
    if (acc.hairpin) accSvg += `<path d="M120 58L140 48" stroke="#d9c9a0" stroke-width="2.4" stroke-linecap="round"/><circle cx="121" cy="57.5" r="3" fill="${ec}"/>`;
    if (acc.mask) accSvg += `<path d="M76 120Q100 114 124 120L118 142L100 152L82 142Z" fill="#101219" stroke="${line}" stroke-width="1"/><path d="M88 132H112" stroke="${ec}" stroke-width="1.3" opacity=".8"/>`;
    if (acc.earpiece) accSvg += `<path d="M131 100Q138 100 137 110Q136 116 131 116" fill="#151a24" stroke="${ec}" stroke-width="1.2"/><circle cx="134" cy="107" r="1.6" fill="${ec}"/>`;

    const defs = `<defs>
      <linearGradient id="${id}bg" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="${pal.mid}"/><stop offset=".5" stop-color="${pal.dark}"/><stop offset="1" stop-color="#040508"/></linearGradient>
      <radialGradient id="${id}aura"><stop offset="0" stop-color="${ec}" stop-opacity="${aura}"/><stop offset="1" stop-color="${ec}" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}iris" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(iris, -0.5)}"/><stop offset=".55" stop-color="${iris}"/><stop offset="1" stop-color="${shade(iris, 0.5)}"/></linearGradient>
    </defs>`;
    // 아이는 머리를 크게, 몸을 작게 (아기는 더 과장)
    const headT = st === 'baby' ? 'translate(100 118) scale(1.32) translate(-100 -96)' : st === 'child' ? 'translate(100 108) scale(1.14) translate(-100 -96)' : st === 'teen' ? 'translate(100 100) scale(1.04) translate(-100 -96)' : '';
    const bodyT = st === 'baby' ? 'translate(100 240) scale(.62) translate(-100 -240)' : st === 'child' ? 'translate(100 240) scale(.8) translate(-100 -240)' : '';
    const content = `${defs}${bg}<g transform="${headT}">${backSvg}</g><g transform="${bodyT}">${body}${neck}</g>
      <g transform="${headT}">${massSvg}${face}${feat}${scarSvg}${bangShadow}${eyeOne(false)}${eyeOne(true)}${brows}${mouth}${extra}${hairFront}${accSvg}</g>`;
    return { content, id, ring: RANKS[rank].color, ec };
  }

  // assets/portraits/portraits.js 에 등록된 그림 파일이 있으면 우선 사용
  const images = () => (typeof PORTRAIT_IMAGES !== 'undefined' && Array.isArray(PORTRAIT_IMAGES) ? PORTRAIT_IMAGES : []);
  function imageFor(seed, gender) {
    const list = images().filter((p) => !p.gender || p.gender === gender);
    if (!list.length) return null;
    return 'assets/portraits/' + list[FX.hash(seed + '|img') % list.length].file;
  }

  return {
    imageFor,
    // 상반신 일러스트 카드
    card(seed, gender, element, rankIdx, w = 200, opts = {}) {
      const src = opts.race && opts.race !== 'human' ? null : imageFor(seed, gender);
      const ring = RANKS[rankIdx == null ? 0 : rankIdx].color;
      if (src) return `<div class="portrait-img" style="width:${w}px;--rc:${ring}"><img src="${src}" alt="캐릭터 일러스트" loading="lazy"></div>`;
      const p = make(seed, gender, element, rankIdx, opts);
      const c = p.ring;
      return `<svg xmlns="http://www.w3.org/2000/svg" class="portrait" width="${w}" height="${Math.round(w * 1.2)}" viewBox="0 0 200 240" role="img" aria-label="캐릭터 일러스트">${p.content}
        <rect x="1" y="1" width="198" height="238" fill="none" stroke="${c}" stroke-width="1.5" opacity=".7"/>
        <path d="M1 22V1H22M178 1H199V22M199 218V239H178M22 239H1V218" stroke="${c}" stroke-width="4" fill="none"/></svg>`;
    },
    // 원형 얼굴 아이콘
    avatar(seed, gender, element, rankIdx, size = 56, opts = {}) {
      const src = opts.race && opts.race !== 'human' ? null : imageFor(seed, gender);
      if (src) return `<span class="avatar avatar-img" style="width:${size}px;height:${size}px;--rc:${RANKS[rankIdx == null ? 0 : rankIdx].color}"><img src="${src}" alt=""></span>`;
      const p = make(seed, gender, element, rankIdx, opts);
      // 아이는 머리가 크고 아래에 있어서 자르는 영역을 맞춘다
      const st = opts.age == null ? 'adult' : ageStage(opts.age);
      const [cy, rr] = st === 'baby' ? [116, 70] : st === 'child' ? [106, 62] : opts.race === 'elf' || opts.race === 'dragonkin' || opts.race === 'beastkin' ? [90, 62] : [96, 56];
      return `<svg xmlns="http://www.w3.org/2000/svg" class="avatar" width="${size}" height="${size}" viewBox="${100 - rr} ${cy - rr} ${rr * 2} ${rr * 2}" role="img" aria-label="초상화">
        <defs><clipPath id="${p.id}c"><circle cx="100" cy="${cy}" r="${rr - 1}"/></clipPath></defs>
        <g clip-path="url(#${p.id}c)">${p.content}</g>
        <circle cx="100" cy="${cy}" r="${rr - 1.5}" fill="none" stroke="${p.ring}" stroke-width="${rr / 18}"/></svg>`;
    },
  };
})();
