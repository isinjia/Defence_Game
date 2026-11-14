// 스킬 이펙트 자동 채점: 사람 판단 없이 렌더링한 화면을 수치로 재서 100점으로 매긴다.
// 사용법: node tools/fx_eval.js <스킬 정보 JSON> [출력 폴더] [게임 index.html 경로(선택: 명령 버튼 가림·자동 품질 측정)]
//   스킬 정보 JSON: {skills:[{name,type,elem,clsName,rankReq,form}], ranks:[...]} (form = 이름·직업 규칙으로 고른 모양)
// 배점 (측정 전에 고정):
//   1. 커버리지 25 = 25 × (A급 이상 중 고유 연출이 있는 비율 × 0.7 + A급 미만 공격 스킬 중 이름·직업 규칙으로 모양이 정해진 비율 × 0.3)
//   2. 스킬 간 구별 25 = 25 × (고유 연출 중 가장 비슷한 다른 스킬과의 거리 > 잡음 기준 × 2 인 비율)
//        잡음 기준 = 같은 스킬을 두 번 그렸을 때 거리의 중앙값(입자 무작위 차이)
//   3. 속성 간 구별 20 = 20 × (6속성+무속성 21쌍 중 거리 > 잡음 기준 × 2 인 비율) — 같은 모양(타격·마법구·검기)에 속성만 바꿔 비교
//   4. 가독성 15 = 10 × (모든 순간에 하얗게 탄 화소가 칸의 5% 미만인 스킬 비율) + 5 × (SS 연출 중 명령 버튼 영역 밝기 변화 < 8%)
//   5. 안정성·성능 15 = 8 × (오류 0이면 1) + 4 × (동시 입자 1500 이하인 스킬 비율) + 3 × (느린 기기에서 자동 품질이 내려가면 1)
// 화면 특징: 칸을 8×12 격자로 나눈 평균 색(R,G,B) × 세 순간(0.25·0.5·0.8초). 거리 = 특징 벡터 L2 / √차원.
const path = require('path'); const fs = require('fs'); const { chromium } = require('playwright');
const info = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); const all = info.skills || info;
const out = path.resolve(process.argv[3] || path.join(__dirname, '..', 'dist', 'fx_eval')); fs.mkdirSync(out, { recursive: true });
const gameHtml = process.argv[4];
const SUP = '^(heal|heal_ally|heal_all|revive|buff|buff_all|shield|shield_all|summon|evade|taunt)$';
const CW = 300, CH = 460, MOM = [0.25, 0.5, 0.8], GX = 8, GY = 12;
(async () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'fx_sig.js'), 'utf8');
  const sigNames = new Set([...src.matchAll(/^  S\('([^']+)'/gm)].map((m) => m[1]));
  const hi = all.filter((s) => s.rankReq >= 5 && s.rankReq < 90), lo = all.filter((s) => s.rankReq < 5 && /^(dmg|crit|pierce|multi|stun|dot|drain|aoe|debuff)$/.test(s.type));
  const covHi = hi.filter((s) => sigNames.has(s.name)).length / hi.length;
  const covLo = lo.filter((s) => s.formSrc ? s.formSrc !== 'fallback' : s.form !== 'orb' || /(원소|흑마|결계|화염|패스|정령|소환)/.test(s.clsName || '')).length / Math.max(1, lo.length);
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: CW, height: CH }, deviceScaleFactor: 1 }); const perr = []; page.on('pageerror', (e) => perr.push(e.message));
  await page.setContent('<body style="margin:0;background:#0d1422"></body>');
  for (const f of ['fx_gl.js', 'fx_forms.js', 'fx_sig.js']) await page.addScriptTag({ path: path.join(__dirname, '..', 'js', f) });
  await page.evaluate(({ CW, CH, MOM, GX, GY, SUPS }) => {
    const G = FXG; G.S.manual = true; G.init(); G.resize(CW, CH, 1); G.S.cv.style.display = 'none';
    const c2 = document.createElement('canvas'); c2.width = CW; c2.height = CH; const x2 = c2.getContext('2d', { willReadFrequently: true });
    const SUP = new RegExp(SUPS);
    // 한 연출을 그려 세 순간의 특징·하얀 비율·최대 입자 수를 잰다. play() 가 연출을 시작한다
    window.measure = (play) => { G.S.items = []; let err = ''; try { play(); } catch (e) { err = e.message; } const feat = [], white = []; let f = 0, peak = 0;
      for (const tm of MOM) { while (f < Math.round(tm * 60)) { try { G.step(1 / 60); } catch (e) { err = err || e.message; } peak = Math.max(peak, G.S.items.length); f++; }
        x2.fillStyle = '#0d1422'; x2.fillRect(0, 0, CW, CH); x2.drawImage(G.S.cv, 0, 0); const d = x2.getImageData(0, 0, CW, CH).data; let w = 0; const sum = new Float64Array(GX * GY * 3), cnt = new Float64Array(GX * GY);
        for (let y = 0; y < CH; y += 2) for (let x = 0; x < CW; x += 2) { const i = (y * CW + x) * 4, r = d[i], g = d[i + 1], b = d[i + 2]; if (r > 235 && g > 235 && b > 235) w++; const ci = Math.min(GY - 1, Math.floor(y / CH * GY)) * GX + Math.min(GX - 1, Math.floor(x / CW * GX)); sum[ci * 3] += r; sum[ci * 3 + 1] += g; sum[ci * 3 + 2] += b; cnt[ci]++; }
        for (let ci = 0; ci < GX * GY; ci++) for (let k = 0; k < 3; k++) feat.push(sum[ci * 3 + k] / cnt[ci] / 255);
        white.push(w / ((CW / 2) * (CH / 2))); }
      return { feat, white, peak, err }; };
    const from = { x: CW / 2, y: CH - 70, w: 50, h: 60 }, one = { x: CW / 2, y: CH * 0.3, w: 50, h: 60 }, three = [0.2, 0.5, 0.8].map((k) => ({ x: CW * k, y: CH * 0.3, w: 46, h: 56 })), ally = { x: CW / 2, y: CH * 0.5, w: 50, h: 60 };
    window.sigPlay = (sk) => () => { const e = sk.elem && sk.elem !== 'self' ? sk.elem : 'none', sup = SUP.test(sk.type), aoe = /aoe/.test(sk.type) || (FXS.SIG[sk.name] && FXS.SIG[sk.name].aoe && !FXS.SIG[sk.name].hit && !sup); const tier = sk.rankReq;
      if (tier >= 6) FXS.K.tier(tier, from, G.el(e)); const ok = sup ? FXS.run(sk.name, 'sup', { f: from, t: ally, e, i: 0 }) : aoe ? FXS.run(sk.name, 'aoe', { f: from, a: { x: CW / 2, y: CH * 0.3, w: CW * 0.8, h: 90 }, s: three, e, tier }) : FXS.run(sk.name, 'hit', { f: from, t: one, e, tier }); if (!ok) throw new Error('처리기 없음'); };
    window.elPlay = (kind, e) => () => { if (kind === 'impact') FXF.accent(e, one.x, one.y, 1.1); else FXF.play(kind, from, one, { el: e }); };
  }, { CW, CH, MOM, GX, GY, SUPS: SUP });
  const dist = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2; return Math.sqrt(s / a.length); };
  // 고유 연출 전부
  const sigs = hi.filter((s) => sigNames.has(s.name)); const res = []; let n = 0;
  for (const sk of sigs) { const r = await page.evaluate((sk) => window.measure(window.sigPlay(sk)), sk); res.push({ name: sk.name, rank: sk.rankReq, ...r }); if (++n % 30 === 0) process.stdout.write(`${n} `); }
  // 잡음 기준: 20개를 한 번 더 그려 같은 스킬 두 번 사이 거리
  const noise = []; for (const sk of sigs.filter((_, i) => i % 9 === 0).slice(0, 20)) { const r = await page.evaluate((sk) => window.measure(window.sigPlay(sk)), sk); noise.push(dist(r.feat, res.find((x) => x.name === sk.name).feat)); }
  noise.sort((a, b) => a - b); const noiseMed = noise[Math.floor(noise.length / 2)];
  const nn = res.map((a) => { let m = 1e9, who = ''; for (const b of res) if (b !== a) { const d = dist(a.feat, b.feat); if (d < m) { m = d; who = b.name; } } return { name: a.name, d: m, who }; });
  const distinctFrac = nn.filter((x) => x.d > noiseMed * 2).length / nn.length;
  // 속성
  const ELS = ['none', 'fire', 'bolt', 'water', 'wood', 'holy', 'dark'], elRes = {}, elNoise = [];
  for (const kind of ['impact', 'orb', 'slash']) for (const e of ELS) { elRes[kind + e] = await page.evaluate(([k, e]) => window.measure(window.elPlay(k, e)), [kind, e]); if (kind === 'impact') { const again = await page.evaluate(([k, e]) => window.measure(window.elPlay(k, e)), [kind, e]); elNoise.push(dist(again.feat, elRes[kind + e].feat)); } }
  elNoise.sort((a, b) => a - b); const elNoiseMed = elNoise[Math.floor(elNoise.length / 2)]; const pairs = [];
  for (let i = 0; i < ELS.length; i++) for (let j = i + 1; j < ELS.length; j++) { const d = ['impact', 'orb', 'slash'].map((k) => dist(elRes[k + ELS[i]].feat, elRes[k + ELS[j]].feat)).reduce((a, b) => a + b) / 3; pairs.push({ a: ELS[i], b: ELS[j], d }); }
  const elFrac = pairs.filter((x) => x.d > elNoiseMed * 2).length / pairs.length;
  const whiteOk = res.filter((r) => Math.max(...r.white) < 0.05).length / res.length, peakOk = res.filter((r) => r.peak <= 1500).length / res.length;
  const errs = res.filter((r) => r.err).map((r) => r.name + ': ' + r.err).concat(perr);
  await page.close();
  // 게임 화면: SS 연출 중 명령 버튼 영역 밝기 변화, 느린 기기 자동 품질
  let cmdDelta = null, autoQ = null;
  if (gameHtml) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); await ctx.addInitScript(() => { window.TUT_AUTO_TAP = true; });
    const g = await ctx.newPage(); g.on('pageerror', (e) => errs.push('게임: ' + e.message));
    await g.goto('file://' + path.resolve(gameHtml)); await g.click('[data-opening="skip"]'); await g.waitForFunction(() => GateBoot.ready);
    await g.evaluate(() => { UI.handle('new'); UI.handle('mode-manual'); UI.create.name = '채점'; UI.handle('c-start'); for (let i = 0; i < 12 && UI.modalOpen(); i++) UI.closeModal(); G.queue = []; G.player.examDone = true; if (UI.exam) UI.exam.skipped = true; UI.renderGame(); const pl = G.player; const m = { id: 88001, kind: 'mob', x: pl.x, y: pl.y, region: pl.region, tier: 0, elem: 'fire', name: '쥐', shape: 'beast', count: 3, born: G.monthKey() }; G.mobs.push(m); UI.startMob(m.id); });
    await g.waitForTimeout(1500);
    const box = await g.evaluate(() => { const c = document.getElementById('cb-ctrl') || document.querySelector('#modal-box .ctrl-row'); const r = c && c.getBoundingClientRect(); return r ? { x: r.left, y: r.top, width: r.width, height: r.height } : null; });
    const lum = async () => { const buf = await g.screenshot({ clip: box }); return buf; };
    if (box) { const shot = async () => { const b = await g.screenshot({ clip: box }); const p2 = await browser.newPage(); const v = await p2.evaluate(async (b64) => { const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; return s / (d.length / 4); }, b.toString('base64')); await p2.close(); return v; };
      await g.evaluate(() => { const c = UI.ctx.combat; if (!c.auto) c.toggleAuto(); c.toggleAuto(); }); await g.waitForTimeout(300); const before = await shot();
      await g.evaluate(() => { const c = UI.ctx.combat, me = c.units.find((u) => u.side === 'ally'), foe = c.units.find((u) => u.side === 'enemy' && u.alive); UI.applyEvent({ t: '', ev: { k: 'cast', src: me.id, elem: 'none', side: 'ally', name: '특이점', mp: me.mp } }); UI.applyEvent({ t: 'x', ev: { k: 'dmg', src: me.id, dst: foe.id, amt: 1, hp: c.units.find((u) => u.id === foe.id).hp, elem: 'none' } }); });
      await g.waitForTimeout(450); const during = await shot(); cmdDelta = Math.abs(during - before) / Math.max(1, before); }
    autoQ = await g.evaluate(async () => { FXG.S.auto = 1; const start = performance.now(); const hog = () => { const t = performance.now(); while (performance.now() - t < 40); }; for (let i = 0; i < 60; i++) { FXG.p('glow', 100, 100, { life: 2 }); await new Promise((ok) => requestAnimationFrame(() => { hog(); ok(); })); } return FXG.S.auto; });
    await ctx.close();
  }
  await browser.close();
  const sc = {
    '커버리지 (25)': 25 * (covHi * 0.7 + covLo * 0.3),
    '스킬 간 구별 (25)': 25 * distinctFrac,
    '속성 간 구별 (20)': 20 * elFrac,
    '가독성 (15)': 10 * whiteOk + (cmdDelta == null ? 0 : cmdDelta < 0.08 ? 5 : 0),
    '안정성·성능 (15)': (errs.length ? 0 : 8) + 4 * peakOk + (autoQ != null && autoQ < 1 ? 3 : 0),
  };
  const total = Object.values(sc).reduce((a, b) => a + b, 0);
  const report = { total: +total.toFixed(1), score: Object.fromEntries(Object.entries(sc).map(([k, v]) => [k, +v.toFixed(1)])), measures: { covHi, covLo, sigCount: sigs.length, noiseMed, distinctFrac, closest: nn.sort((a, b) => a.d - b.d).slice(0, 10), elNoiseMed, elFrac, elPairs: pairs.sort((a, b) => a.d - b.d).slice(0, 8), whiteOk, whiteWorst: res.map((r) => ({ name: r.name, w: Math.max(...r.white) })).sort((a, b) => b.w - a.w).slice(0, 8), peakMax: Math.max(...res.map((r) => r.peak)), peakOk, cmdDelta, autoQ, errors: errs } };
  fs.writeFileSync(path.join(out, 'fx_eval.json'), JSON.stringify(report, null, 1));
  console.log('\n이펙트 자동 채점'); for (const [k, v] of Object.entries(report.score)) console.log(`  ${k.padEnd(14)} ${v}`); console.log(`  합계 ${report.total}`);
  console.log(JSON.stringify(report.measures, (k, v) => (typeof v === 'number' ? +v.toFixed(4) : v)).slice(0, 2500));
})().catch((e) => { console.error(e); process.exitCode = 1; });
