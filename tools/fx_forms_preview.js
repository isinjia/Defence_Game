// 스킬 이펙트 미리보기: js/fx_forms.js 의 모양 × 속성을 한 장에 찍는다 (게임에 붙이기 전 확인용).
// 사용법: node tools/fx_forms_preview.js [출력 폴더]
// 한 칸 = 아래 동그라미(시전자)에서 위 동그라미(대상)로 쏜 이펙트를 약 0.08초 간격으로 겹쳐 그린 것(움직임이 한 장에 보이게).
const path = require('path'); const fs = require('fs'); const { chromium } = require('playwright');
const out = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist', 'fx_preview')); fs.mkdirSync(out, { recursive: true });
const ELS = [['none', '무속성'], ['fire', '염'], ['bolt', '뇌'], ['water', '수'], ['wood', '목'], ['holy', '성'], ['dark', '암']];
const NAMES = { slash: '검기', cleave: '내려찍기', thrust: '창 찌르기', fist: '주먹', stab: '단검', arrow: '화살', bullet: '총알', bomb: '폭탄', shield: '방패', orb: '마법구', beam: '광선', smite: '빛기둥', talisman: '부적', curse: '저주', psychic: '염동', claw: '발톱', bite: '물기', spirit: '정령', note: '음표', rift: '균열', ground: '지면 분출', whirl: '회전' };
(async () => {
  const browser = await chromium.launch();
  const sheet = async (file, rows, cols, cell, title) => {
    // rows: [{label, cells:[{form, el, type, aoe}]}], cols: 열 제목
    const CW = cell[0], CH = cell[1], LW = 92, TH = 54, W = LW + cols.length * CW, H = TH + rows.length * CH;
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    await page.setContent(`<body style="margin:0;background:#0b111c;overflow:hidden"><canvas id="acc" width="${W}" height="${H}" style="position:fixed;left:0;top:0"></canvas></body>`);
    await page.addScriptTag({ path: path.join(__dirname, '..', 'js', 'fx_forms.js') });
    await page.evaluate(({ rows, cols, CW, CH, LW, TH, W, H, title }) => {
      const acc = document.getElementById('acc').getContext('2d');
      FXF.S.manual = true; FXF.S.dpr = 1; FXF.init(); FXF.S.dpr = 1; FXF.S.cv.width = W; FXF.S.cv.height = H; FXF.S.cv.style.display = 'none';
      // 바탕: 칸 테두리, 시전자·대상 자리, 글자
      acc.fillStyle = '#0b111c'; acc.fillRect(0, 0, W, H); acc.font = '700 15px sans-serif'; acc.fillStyle = '#e8eef7'; acc.fillText(title, 10, 22); acc.font = '600 13px sans-serif'; acc.textAlign = 'center';
      cols.forEach((c, i) => { acc.fillStyle = '#9fb0c8'; acc.fillText(c, LW + i * CW + CW / 2, 44); });
      rows.forEach((r, ri) => { acc.textAlign = 'left'; acc.fillStyle = '#e8eef7'; acc.font = '700 13px sans-serif'; acc.fillText(r.label, 8, TH + ri * CH + CH / 2);
        r.cells.forEach((c, ci) => { const x0 = LW + ci * CW, y0 = TH + ri * CH; acc.strokeStyle = '#1f2a3d'; acc.strokeRect(x0 + .5, y0 + .5, CW - 1, CH - 1);
          const from = { x: x0 + CW / 2, y: y0 + CH - 30 }; const tg = c.aoe ? [0.2, 0.5, 0.8].map((k) => ({ x: x0 + CW * k, y: y0 + 46, w: 40, h: 40 })) : [{ x: x0 + CW / 2, y: y0 + 46, w: 40, h: 40 }];
          acc.fillStyle = '#18324a'; acc.strokeStyle = '#3f6e94'; acc.beginPath(); acc.arc(from.x, from.y, 14, 0, 7); acc.fill(); acc.stroke();
          for (const t of tg) { acc.fillStyle = '#3a1c26'; acc.strokeStyle = '#8f4257'; acc.beginPath(); acc.arc(t.x, t.y, 16, 0, 7); acc.fill(); acc.stroke(); }
          const o = { el: c.el, type: c.type || 'dmg', big: c.type === 'crit', flask: c.flask };
          if (c.impact) FXF.accent(c.el, tg[0].x, tg[0].y, 1.2);
          else if (c.aoe) FXF.playAoe(c.form, from, { x: x0 + CW / 2, y: y0 + 46, w: CW * 0.8, h: 60 }, tg, o);
          else FXF.play(c.form, from, tg[0], o);
        }); });
      // 약 0.08초마다 한 장씩 겹쳐 그려 움직임을 한 장에 남긴다
      const dt = 1 / 60; for (let f = 0; f < 54; f++) { FXF.step(dt); if (f % 5 === 4) acc.drawImage(FXF.S.cv, 0, 0); }
    }, { rows, cols, CW, CH, LW, TH, W, H, title });
    await page.screenshot({ path: path.join(out, file) }); await page.close(); console.log(file);
  };
  const forms = Object.keys(NAMES);
  const elRow = (form, type) => ELS.map(([e]) => ({ form, el: e, type }));
  await sheet('01_속성_타격모양.png', [{ label: '맞는 자리', cells: ELS.map(([e]) => ({ el: e, impact: true })) }, { label: '마법구', cells: elRow('orb') }, { label: '검기', cells: elRow('slash') }, { label: '화살', cells: elRow('arrow') }, { label: '주먹', cells: elRow('fist') }], ELS.map((e) => e[1]), [150, 200], '속성별 모양 — 같은 스킬 모양에 속성만 바꾼 것');
  await sheet('02_모양_1.png', forms.slice(0, 11).map((f) => ({ label: NAMES[f], cells: elRow(f) })), ELS.map((e) => e[1]), [150, 190], '스킬 모양 (1/2) × 속성');
  await sheet('03_모양_2.png', forms.slice(11).map((f) => ({ label: NAMES[f], cells: elRow(f) })), ELS.map((e) => e[1]), [150, 190], '스킬 모양 (2/2) × 속성');
  const types = [['dmg', '기본'], ['crit', '치명'], ['multi', '연속'], ['pierce', '관통'], ['stun', '기절']];
  await sheet('04_스킬종류별.png', ['slash', 'thrust', 'fist', 'stab', 'arrow', 'bullet'].map((f) => ({ label: NAMES[f], cells: [...types.map(([t]) => ({ form: f, el: f === 'bullet' ? 'bolt' : f === 'arrow' ? 'wood' : f === 'fist' ? 'fire' : 'none', type: t })), { form: f, el: f === 'bullet' ? 'bolt' : f === 'arrow' ? 'wood' : f === 'fist' ? 'fire' : 'none', aoe: true }] })), [...types.map((t) => t[1]), '전체'], [175, 200], '같은 모양도 스킬 종류에 따라 다르게');
  await browser.close();
})();
