// 고등급(A·S·SS) 스킬 고유 연출 미리보기: js/fx_sig.js 의 연출을 스킬마다 네 순간씩 찍는다.
// 사용법: node tools/fx_sig_preview.js <스킬 정보 JSON> [출력 폴더] [한 장당 스킬 수]
//   스킬 정보 JSON: [{name, type, elem, clsName, rankReq}] 또는 {skills:[...], ranks:[...]}
// 결과: 표 이미지 여러 장 + 오류 목록(errors.json). 한 칸 = 한 스킬의 네 순간(아래 파란 원 시전자, 위 붉은 원 대상).
const path = require('path'); const fs = require('fs'); const { chromium } = require('playwright');
const info = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); const all = info.skills || info; const ranks = info.ranks || ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS'];
const out = path.resolve(process.argv[3] || path.join(__dirname, '..', 'dist', 'fx_sig_preview')); fs.mkdirSync(out, { recursive: true });
const per = +process.argv[4] || 12;
const SUP = /^(heal|heal_ally|heal_all|revive|buff|buff_all|shield|shield_all|summon|evade|taunt)$/;
(async () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'fx_sig.js'), 'utf8');
  const names = [...src.matchAll(/^  S\('([^']+)'/gm)].map((m) => m[1]);
  const list = names.map((n) => { const s = all.find((x) => x.name === n) || { name: n, type: 'dmg', elem: null }; return { name: n, type: s.type, elem: s.elem && s.elem !== 'self' ? s.elem : 'none', cls: s.clsName || '', rank: ranks[s.rankReq] || '?' }; });
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const MOM = [0.15, 0.35, 0.6, 0.9], CW = 170, CH = 290, COLS = 3, M = MOM.length, LW = 0, TH = 30, W = COLS * CW * M, errors = [];
  for (let pg = 0; pg * per < list.length; pg++) {
    const part = list.slice(pg * per, pg * per + per), rows = Math.ceil(part.length / COLS), H = TH + rows * CH;
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    const perr = []; page.on('pageerror', (e) => perr.push(e.message));
    await page.setContent(`<body style="margin:0;background:#0a0f18;overflow:hidden"><canvas id="acc" width="${W}" height="${H}" style="position:fixed;left:0;top:0"></canvas></body>`);
    for (const f of ['fx_gl.js', 'fx_forms.js', 'fx_sig.js']) await page.addScriptTag({ path: path.join(__dirname, '..', 'js', f) });
    const res = await page.evaluate(({ part, MOM, CW, CH, COLS, M, TH, W, H, SUPS, pg }) => {
      const SUP = new RegExp(SUPS); const acc = document.getElementById('acc').getContext('2d'); const G = FXG; const bad = [];
      G.S.manual = true; if (!G.init()) return ['WebGL 실패']; G.resize(CW, CH, 1); G.S.cv.style.display = 'none';
      acc.fillStyle = '#0a0f18'; acc.fillRect(0, 0, W, H); acc.font = '700 15px sans-serif'; acc.fillStyle = '#e8eef7'; acc.fillText(`고등급 스킬 고유 연출 (${pg + 1})`, 8, 21);
      part.forEach((sk, idx) => {
        const x0 = (idx % COLS) * CW * M, y0 = TH + Math.floor(idx / COLS) * CH, sup = SUP.test(sk.type), aoe = /aoe/.test(sk.type) || (FXS.SIG[sk.name] && FXS.SIG[sk.name].aoe && !FXS.SIG[sk.name].hit && !sup);
        const from = { x: CW / 2, y: CH - 50, w: 46, h: 56 }, ty = CH * 0.36, tg = aoe ? [0.2, 0.5, 0.8].map((k) => ({ x: CW * k, y: ty, w: 40, h: 50 })) : [{ x: CW / 2, y: sup ? CH * 0.52 : ty, w: 46, h: 56 }];
        const dot = (q, ally, xx) => { acc.fillStyle = ally ? '#16324a' : '#3a1c26'; acc.strokeStyle = ally ? '#3f6e94' : '#8f4257'; acc.lineWidth = 2; acc.beginPath(); acc.ellipse(xx + q.x, y0 + q.y, 18, 22, 0, 0, 7); acc.fill(); acc.stroke(); };
        G.S.items = []; let ok = false;
        try { const E = G.el(sk.elem); if (sk.rank === 'S' || sk.rank === 'SS') FXS.K.tier(sk.rank === 'SS' ? 7 : 6, from, E); ok = sup ? FXS.run(sk.name, 'sup', { f: from, t: tg[0], e: sk.elem, i: 0 }) : aoe ? FXS.run(sk.name, 'aoe', { f: from, a: { x: CW / 2, y: ty, w: CW * 0.8, h: 80 }, s: tg, e: sk.elem }) : FXS.run(sk.name, 'hit', { f: from, t: tg[0], e: sk.elem }); } catch (e) { bad.push(sk.name + ': ' + e.message); }
        if (!ok) bad.push(sk.name + ': 처리기 없음(' + (sup ? 'sup' : aoe ? 'aoe' : 'hit') + ')');
        let f = 0; MOM.forEach((tm, mi) => { const xx = x0 + mi * CW; const bg = acc.createLinearGradient(0, y0, 0, y0 + CH); bg.addColorStop(0, '#0d1422'); bg.addColorStop(1, '#131b2b'); acc.fillStyle = bg; acc.fillRect(xx + 1, y0 + 1, CW - 2, CH - 2); if (!sup) dot(from, true, xx); for (const t of tg) dot(t, sup, xx);
          while (f < Math.round(tm * 60)) { try { G.step(1 / 60); } catch (e) { bad.push(sk.name + ' 그리기: ' + e.message); break; } f++; } acc.drawImage(G.S.cv, xx, y0); acc.fillStyle = '#5f6e86'; acc.font = '500 10px sans-serif'; acc.textAlign = 'right'; acc.fillText(tm.toFixed(2) + '초', xx + CW - 5, y0 + 13); });
        acc.textAlign = 'left'; acc.fillStyle = '#e8eef7'; acc.font = '700 13px sans-serif'; acc.fillText(`${sk.rank} ${sk.name}`, x0 + 7, y0 + 18); acc.fillStyle = '#8fa0b8'; acc.font = '500 11px sans-serif'; acc.fillText(`${sk.cls} · ${sk.type}${sk.elem !== 'none' ? '/' + sk.elem : ''}`, x0 + 7, y0 + 33);
        acc.strokeStyle = '#33415c'; acc.lineWidth = 1; acc.strokeRect(x0 + .5, y0 + .5, CW * M - 1, CH - 1);
      });
      return bad;
    }, { part, MOM, CW, CH, COLS, M, TH, W, H, SUPS: SUP.source, pg });
    errors.push(...res, ...perr.map((e) => 'page: ' + e));
    const file = `sig_${String(pg + 1).padStart(2, '0')}.png`; await page.screenshot({ path: path.join(out, file) }); await page.close(); process.stdout.write(file + ' ');
  }
  await browser.close(); fs.writeFileSync(path.join(out, 'errors.json'), JSON.stringify(errors, null, 1)); console.log('\n오류', errors.length); errors.slice(0, 30).forEach((e) => console.log(' ', e));
})();
