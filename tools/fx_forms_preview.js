// 스킬 이펙트 미리보기: js/fx_gl.js + js/fx_forms.js 의 연출을 표로 찍는다 (게임에 붙이기 전 확인용).
// 사용법: node tools/fx_forms_preview.js [출력 폴더]
// 한 칸 = 아래 동그라미(시전자)가 위 동그라미(대상)에게 쓴 연출을 약 0.07초 간격으로 겹쳐 그린 것(움직임이 한 장에 보이게).
const path = require('path'); const fs = require('fs'); const { chromium } = require('playwright');
const out = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist', 'fx_preview')); fs.mkdirSync(out, { recursive: true });
const ELS = [['none', '무속성'], ['fire', '염'], ['bolt', '뇌'], ['water', '수'], ['wood', '목'], ['holy', '성'], ['dark', '암']];
const NAMES = { slash: '검기', cleave: '내려찍기', thrust: '창 찌르기', fist: '주먹', stab: '단검', arrow: '화살', bullet: '총알', bomb: '폭탄', shield: '방패', orb: '마법구', beam: '광선', smite: '빛기둥', talisman: '부적', curse: '저주', psychic: '염동', claw: '발톱', bite: '물기', spirit: '정령', note: '음표', rift: '균열', ground: '지면 분출', whirl: '회전', meteor: '유성', swords: '검의 비', hands: '손아귀', clock: '시간', cloud: '독안개', dragon: '용', bird: '불새', bone: '뼈창' };
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  // rows: [{label, cells:[{form, el, type, aoe, sup, impact, pal, cap}]}]
  const sheet = async (file, rows, cols, cell, title, moments = [0.1, 0.22, 0.36, 0.55]) => {
    const M = moments.length, CW = cell[0], CH = cell[1], LW = 96, TH = 56, W = LW + cols.length * CW * M, H = TH + rows.length * CH;
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    const errs = []; page.on('pageerror', (e) => errs.push(e.message));
    await page.setContent(`<body style="margin:0;background:#0a0f18;overflow:hidden"><canvas id="acc" width="${W}" height="${H}" style="position:fixed;left:0;top:0"></canvas></body>`);
    await page.addScriptTag({ path: path.join(__dirname, '..', 'js', 'fx_gl.js') }); await page.addScriptTag({ path: path.join(__dirname, '..', 'js', 'fx_forms.js') });
    const bad = await page.evaluate(({ rows, cols, CW, CH, LW, TH, W, H, title, moments }) => {
      const acc = document.getElementById('acc').getContext('2d'); const G = FXG;
      G.S.manual = true; if (!G.init()) return 'WebGL 초기화 실패'; G.resize(CW, CH, 1); G.S.cv.style.display = 'none'; // 칸 크기 캔버스에 그려 칸마다 옮겨 붙인다(큰 캔버스는 느리다)
      acc.fillStyle = '#0a0f18'; acc.fillRect(0, 0, W, H); acc.font = '700 16px sans-serif'; acc.fillStyle = '#e8eef7'; acc.fillText(title, 10, 24); acc.font = '600 13px sans-serif'; acc.textAlign = 'center';
      const M = moments.length; cols.forEach((c, i) => { acc.fillStyle = '#9fb0c8'; acc.fillText(c, LW + i * CW * M + CW * M / 2, 46); });
      rows.forEach((r, ri) => { acc.textAlign = 'left'; acc.fillStyle = '#e8eef7'; acc.font = '700 13px sans-serif'; String(r.label).split('\n').forEach((ln, li) => acc.fillText(ln, 8, TH + ri * CH + CH / 2 + li * 17));
        r.cells.forEach((c, ci) => { const x0 = LW + ci * CW * M, y0 = TH + ri * CH;
          const bg = acc.createLinearGradient(0, y0, 0, y0 + CH); bg.addColorStop(0, '#0d1422'); bg.addColorStop(1, '#131b2b'); acc.fillStyle = bg; acc.fillRect(x0 + 1, y0 + 1, CW - 2, CH - 2);
          const from = { x: CW / 2, y: CH - 46, w: 50, h: 60 }; const ty = CH * 0.34;
          const tg = c.aoe ? [0.2, 0.5, 0.8].map((k) => ({ x: CW * k, y: ty, w: 50, h: 60 })) : [{ x: CW / 2, y: c.sup ? CH * 0.55 : ty, w: 50, h: 60 }];
          const dot = (q, fill, line) => { acc.fillStyle = fill; acc.strokeStyle = line; acc.lineWidth = 2; acc.beginPath(); acc.ellipse(x0 + q.x, y0 + q.y, 20, 24, 0, 0, 7); acc.fill(); acc.stroke(); };
          const ally = c.sup && c.sup !== 'debuff' && c.sup !== 'linger' && c.sup !== 'drain';
          if (!c.sup || c.sup === 'drain') dot(from, '#16324a', '#3f6e94'); for (const t of tg) dot(t, ally ? '#16324a' : '#3a1c26', ally ? '#3f6e94' : '#8f4257');
          if (c.cap) { acc.fillStyle = '#9fb0c8'; acc.font = '600 13px sans-serif'; acc.textAlign = 'center'; acc.fillText(c.cap, x0 + CW * M / 2, y0 + CH - 8); }
          G.S.items = []; const o = { el: c.el, pal: c.pal, type: c.type || 'dmg', big: c.type === 'crit', flask: c.flask };
          if (c.impact) FXF.accent(c.pal || c.el, tg[0].x, tg[0].y, 1.1);
          else if (c.sup === 'drain') FXF.drain(tg[0], from, c.el);
          else if (c.sup) FXF.support(c.sup, tg[0], c.el, { kind: c.kind });
          else if (c.aoe) FXF.playAoe(c.form, from, { x: CW / 2, y: ty, w: CW * 0.8, h: 80 }, tg, o);
          else FXF.play(c.form, from, tg[0], o);
          acc.save();
          const ms = c.moments || moments; let f = 0;
          ms.forEach((tm, mi) => { const xx = x0 + mi * CW; if (mi) { acc.fillStyle = bg; acc.fillRect(xx + 1, y0 + 1, CW - 2, CH - 2); if (!c.sup || c.sup === 'drain') dot({ x: from.x + mi * CW, y: from.y }, '#16324a', '#3f6e94'); for (const t of tg) dot({ x: t.x + mi * CW, y: t.y }, ally ? '#16324a' : '#3a1c26', ally ? '#3f6e94' : '#8f4257'); }
            while (f < Math.round(tm * 60)) { G.step(1 / 60); f++; } acc.drawImage(G.S.cv, xx, y0); acc.fillStyle = '#5f6e86'; acc.font = '500 10px sans-serif'; acc.textAlign = 'right'; acc.fillText(tm.toFixed(2) + '초', xx + CW - 5, y0 + 13); });
          acc.restore(); acc.strokeStyle = '#33415c'; acc.lineWidth = 1; acc.strokeRect(x0 + .5, y0 + .5, CW * M - 1, CH - 1);
        }); });
      return '';
    }, { rows, cols, CW, CH, LW, TH, W, H, title, moments });
    await page.screenshot({ path: path.join(out, file) }); await page.close(); console.log(file, bad || '', errs.slice(0, 2).join(' | '));
  };
  const elRow = (form, type) => ELS.map(([e]) => ({ form, el: e, type }));
  const EC = ELS.map((e) => e[1]);
  const only = process.argv[3];
  const run = async (n, fn) => { if (!only || only.split(',').includes(String(n))) await fn(); };
  const TWO = [0.12, 0.34];
  await run(1, () => sheet('01_속성별_타격.png', [{ label: '맞는 자리', cells: ELS.map(([e]) => ({ el: e, impact: true })) }, { label: '마법구', cells: elRow('orb') }, { label: '지면 분출', cells: elRow('ground') }], EC, [120, 250], '속성별 모양 — 같은 스킬에 속성만 바꾼 것 (각 속성마다 두 순간)', TWO));
  const forms = Object.keys(NAMES); const natural = { slash: 'none', cleave: 'fire', thrust: 'bolt', fist: 'fire', stab: 'dark', arrow: 'wood', bullet: 'bolt', bomb: 'fire', shield: 'none', orb: 'fire', beam: 'holy', smite: 'holy', talisman: 'water', curse: 'dark', psychic: 'none', claw: 'wood', bite: 'none', spirit: 'dark', note: 'water', rift: 'dark', ground: 'none', whirl: 'bolt', meteor: 'fire', swords: 'holy', hands: 'dark', clock: 'none', cloud: 'wood', dragon: 'fire', bird: 'fire', bone: 'dark' };
  for (let i = 0; i < 5; i++) await run(2 + i, () => sheet(`0${2 + i}_스킬_모양_${i + 1}.png`, [0, 1, 2].map((r) => ({ label: '', cells: forms.slice(i * 6 + r * 2, i * 6 + r * 2 + 2).map((f) => ({ form: f, el: natural[f], cap: NAMES[f] })) })), ['', ''], [190, 330], `스킬 모양 (${i + 1}/5) — 한 스킬의 네 순간`));
  const types = [['crit', '치명'], ['multi', '연속'], ['pierce', '관통']];
  await run(7, () => sheet('07_스킬_종류별.png', ['slash', 'fist', 'arrow', 'bullet'].map((f) => ({ label: NAMES[f], cells: [...types.map(([t]) => ({ form: f, el: natural[f], type: t })), { form: f, el: natural[f], aoe: true }] })), [...types.map((t) => t[1]), '전체'], [150, 300], '같은 모양도 스킬 종류에 따라 다르게 (각 세 순간)', [0.12, 0.26, 0.42]));
  await run(8, () => sheet('08_전체_공격_속성별.png', [0, 1].map((r) => ({ label: '', cells: ELS.slice(1).slice(r * 3, r * 3 + 3).map(([e, n]) => ({ form: 'orb', el: e, aoe: true, cap: n })) })), ['', '', ''], [230, 340], '전체 공격 — 속성별 (불비·낙뢰·해일·꽃잎 폭풍·빛의 비·공허), 각 두 순간', [0.3, 0.5]));
  const sup = [['heal', '회복'], ['shield', '보호막'], ['buff', '강화'], ['debuff', '약화'], ['revive', '부활'], ['summon', '소환'], ['taunt', '도발'], ['evade', '회피'], ['linger', '지속 피해'], ['drain', '흡수']];
  await run(9, () => sheet('09_보조_스킬.png', [0, 1, 2, 3, 4].map((r) => ({ label: '', cells: sup.slice(r * 2, r * 2 + 2).map(([k, n]) => ({ sup: k, el: k === 'heal' || k === 'revive' ? 'holy' : k === 'shield' ? 'water' : k === 'buff' ? 'fire' : k === 'linger' ? 'fire' : 'dark', cap: n })) })), ['', ''], [190, 280], '보조 스킬 — 각 네 순간', [0.12, 0.3, 0.5, 0.75]));
  await run(10, () => sheet('10_회복_속성별.png', [{ label: '회복', cells: [['holy', '성'], ['water', '수'], ['wood', '목'], ['dark', '암']].map(([e, n]) => ({ sup: 'heal', el: e, cap: n })) }, { label: '보호막', cells: [['holy', '성'], ['water', '수'], ['wood', '목'], ['fire', '염']].map(([e, n]) => ({ sup: 'shield', el: e, cap: n })) }], ['', '', '', ''], [170, 280], '회복·보호막 — 속성별 (각 두 순간)', [0.25, 0.5]));
  await browser.close();
})();
