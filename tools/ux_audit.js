// 모바일 UI·UX 점검: 휴대폰 크기로 주요 화면을 차례로 열어 스크린숏을 찍고, 화면마다 수치를 잰다.
// 사용법: bash tools/build.sh && node tools/ux_audit.js [기기] [출력 폴더]
//   기기: se(320×568) · s(360×640) · m(390×844) · l(412×915) · all(기본)
// 재는 것: 가로 넘침, 화면 밖 버튼, 작은 터치 영역(40px 미만), 작은 글자(11px 미만), 낮은 대비, 잘린 글자,
//          겹친 버튼, 세로 스크롤 길이, 주 버튼이 첫 화면에 보이는지.
// 결과: 폴더에 화면별 PNG와 report.json, 콘솔에 요약 표와 점수.
const path = require('path');
const fs = require('fs');
const http = require('http');
const { chromium } = require('playwright');

const DEVICES = { se: [320, 568], s: [360, 640], m: [390, 844], l: [412, 915] };
const which = process.argv[2] || 'all';
const outDir = path.resolve(process.argv[3] || path.join(__dirname, '..', 'dist', 'ux_audit'));
fs.mkdirSync(outDir, { recursive: true });

// 화면 안에서 실행되는 측정 함수
function measure() {
  const W = innerWidth, H = innerHeight;
  const desc = (e) => { const t = (e.innerText || e.value || e.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 24); return `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}${e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).slice(0, 3).join('.') : ''}${e.dataset && e.dataset.act ? `[${e.dataset.act}]` : ''} "${t}"`; };
  const rectOf = (e) => { const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return null; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.05 || cs.pointerEvents === 'none') return null; return r; };
  const inView = (r) => r.bottom > 0 && r.top < H && r.right > 0 && r.left < W;
  const topAt = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? null : document.elementFromPoint(x, y);
  const related = (a, b) => !!a && !!b && (a === b || a.contains(b) || b.contains(a));
  const out = { w: W, h: H, small: [], tiny: [], offX: [], overlap: [], tinyText: [], lowContrast: [], clipped: [], hOverflow: document.documentElement.scrollWidth > W + 1 || document.body.scrollWidth > W + 1, scroll: null, primaryOff: false, taps: 0, texts: 0 };
  // ---- 누를 수 있는 것 ----
  const tapSel = 'button, a[href], input, select, textarea, [data-act], [role="button"], .dlg-choice, summary';
  const taps = [...document.querySelectorAll(tapSel)].filter((e) => !e.disabled && !e.closest('[aria-hidden="true"]'));
  const reach = [];
  for (const e of taps) {
    const r = rectOf(e); if (!r || !inView(r)) continue;
    const cx = Math.min(W - 1, Math.max(0, r.left + r.width / 2)), cy = Math.min(H - 1, Math.max(0, r.top + r.height / 2));
    const top = topAt(cx, cy); if (!related(top, e)) continue; // 다른 층(모달 뒤 등)에 가려진 것은 지금 화면의 조작이 아니다
    if (taps.some((o) => o !== e && e.contains(o) && rectOf(o))) continue; // 안쪽에 더 작은 조작이 있으면 바깥 틀은 세지 않는다
    reach.push([e, r]);
  }
  out.taps = reach.length;
  for (const [e, r] of reach) {
    // 실제로 눌리는 넓이: ::after 등으로 넓힌 영역까지 포함해 가운데에서 바깥으로 훑는다
    let hw = r.width, hh = r.height;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const grow = (dx, dy) => { let n = 0; for (let k = 1; k <= 24; k++) { const t = topAt(cx + dx * (k + (dx ? r.width / 2 : 0) - .5), cy + dy * (k + (dy ? r.height / 2 : 0) - .5)); if (t && (t === e || e.contains(t))) n = k; else break; } return n; };
    hw += grow(-1, 0) + grow(1, 0); hh += grow(0, -1) + grow(0, 1);
    const m = Math.round(Math.min(hw, hh));
    const isText = e.tagName === 'INPUT' && /range|checkbox|radio/.test(e.type);
    if (m < 30 && !isText) out.tiny.push(`${Math.round(hw)}×${Math.round(hh)} ${desc(e)}`);
    else if (m < 40 && !isText) out.small.push(`${Math.round(hw)}×${Math.round(hh)} ${desc(e)}`);
    // 가로로 화면 밖에 걸친 조작 (가로 스크롤 영역 안은 제외)
    if (r.right > W + 1.5 || r.left < -1.5) {
      let p = e.parentElement, scrollX = false; while (p && p !== document.body) { const cs = getComputedStyle(p); if (/auto|scroll/.test(cs.overflowX) && p.scrollWidth > p.clientWidth + 2) { scrollX = true; break; } p = p.parentElement; }
      if (!scrollX) out.offX.push(desc(e));
    }
  }
  // 겹친 조작: 한 조작의 네 귀퉁이 안쪽 점이 다른 조작에 덮임
  for (const [e, r] of reach) {
    const pts = [[.2, .2], [.8, .2], [.2, .8], [.8, .8]]; let cov = null, n = 0;
    for (const [fx, fy] of pts) { const t = topAt(r.left + r.width * fx, r.top + r.height * fy); if (!t || related(t, e)) continue; const o = t.closest(tapSel); if (o && !related(o, e)) { n++; cov = o; } }
    if (n >= 1 && cov) out.overlap.push(`${desc(e)} ← ${desc(cov)}`);
  }
  // ---- 글자 ----
  const parseRgb = (s) => { const m = /rgba?\(([^)]+)\)/.exec(s); if (!m) return null; const p = m[1].split(/[ ,/]+/).map(Number); return [p[0], p[1], p[2], p.length > 3 && !isNaN(p[3]) ? p[3] : 1]; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
  const bgOf = (e) => { // 뒤 배경색: 그림·그라데이션을 만나면 모름(null)
    let acc = null; let p = e;
    while (p && p.nodeType === 1) {
      const cs = getComputedStyle(p);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return null;
      const c = parseRgb(cs.backgroundColor);
      if (c && c[3] > 0) { if (!acc) acc = c; else { const a = acc[3]; acc = [acc[0] * a + c[0] * (1 - a), acc[1] * a + c[1] * (1 - a), acc[2] * a + c[2] * (1 - a), Math.min(1, a + c[3] * (1 - a))]; } if (acc[3] >= .98) return acc; }
      if (p.tagName === 'CANVAS' || p.tagName === 'IMG') return null;
      p = p.parentElement;
    }
    return null;
  };
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seenEl = new Set();
  while (tw.nextNode()) {
    const n = tw.currentNode; const s = n.nodeValue.replace(/\s+/g, ' ').trim(); if (s.length < 1) continue;
    const e = n.parentElement; if (!e || seenEl.has(e) || /SCRIPT|STYLE|NOSCRIPT/.test(e.tagName) || e.closest('svg')) continue;
    const range = document.createRange(); range.selectNodeContents(n); const r = range.getClientRects()[0]; if (!r || r.width < 1 || !inView(r)) continue;
    const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || +cs.opacity < .05) continue;
    const top = topAt(Math.min(W - 1, Math.max(0, r.left + Math.min(r.width / 2, 6))), Math.min(H - 1, Math.max(0, r.top + r.height / 2))); if (!related(top, e)) continue;
    seenEl.add(e); out.texts++;
    const fs = parseFloat(cs.fontSize);
    if (fs < 11) out.tinyText.push(`${fs}px "${s.slice(0, 20)}" ${desc(e).split(' ')[0]}`);
    const fg = parseRgb(cs.color), bg = bgOf(e);
    if (fg && bg) {
      let op = 1; let p = e; while (p && p.nodeType === 1) { op *= +getComputedStyle(p).opacity; p = p.parentElement; }
      const a = fg[3] * op; const mix = [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a)];
      const l1 = lum(mix), l2 = lum(bg); const ratio = (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05);
      const big = fs >= 18 || (fs >= 14 && +cs.fontWeight >= 700);
      const anim = (x) => { for (let q = x, k = 0; q && q.nodeType === 1 && k < 3; q = q.parentElement, k++) if (getComputedStyle(q).animationName !== 'none') return true; return false; };
      if (ratio < (big ? 3 : 4.5) && !e.closest('[disabled], .disabled, .tut-off, .float-num, .dead') && !anim(e)) out.lowContrast.push(`${ratio.toFixed(1)} ${fs}px "${s.slice(0, 16)}" ${desc(e).split(' ')[0]}`);
    }
  }
  // 잘린 글자: 넘치는데 말줄임 표시가 없는 것
  for (const e of document.querySelectorAll('body *')) {
    if (e.children.length > 3 || !e.textContent.trim()) continue;
    const cs = getComputedStyle(e); if (cs.overflowX !== 'hidden' || cs.textOverflow === 'ellipsis') continue;
    if (e.scrollWidth > e.clientWidth + 3) { const r = rectOf(e); if (r && inView(r) && related(topAt(Math.min(W - 1, Math.max(0, r.left + r.width / 2)), Math.min(H - 1, Math.max(0, r.top + r.height / 2))), e)) out.clipped.push(desc(e)); }
  }
  // ---- 세로 스크롤 ----
  let best = null;
  for (const e of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(e); if (!/auto|scroll/.test(cs.overflowY)) continue;
    if (e.scrollHeight <= e.clientHeight + 4 || e.clientHeight < 80) continue;
    const r = rectOf(e); if (!r || !inView(r)) continue;
    if (!related(topAt(r.left + r.width / 2, Math.min(H - 1, r.top + Math.min(r.height, H) / 2)), e)) continue;
    if (!best || e.clientHeight * e.clientWidth > best.clientHeight * best.clientWidth) best = e;
  }
  if (best) out.scroll = { ratio: +(best.scrollHeight / best.clientHeight).toFixed(2), sh: best.scrollHeight, ch: best.clientHeight, el: desc(best).split(' ')[0] };
  // 주 버튼(다음으로 넘어가는 확인·진행 버튼)이 스크롤 없이 보이는가.
  // 맨 위 층(화면 가운데를 덮고 있는 층)에서, 아래쪽 버튼 줄(.row.end 등)에 있거나 화면 폭의 절반 이상인 주 버튼만 본다.
  const layer = (() => { let t = topAt(W / 2, H / 2); while (t && t.parentElement && t.parentElement !== document.body) t = t.parentElement; return t; })();
  if (layer) {
    const cta = [...layer.querySelectorAll('button.primary, .primary[data-act]')].filter((e) => { const r = rectOf(e); return r && (e.closest('.row.end, .st-foot, .settle-foot, footer, .xr-cta, .cn-foot') || r.width >= W * .5); });
    const seen = cta.filter((e) => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= H + 1 && related(topAt(Math.min(W - 1, r.left + r.width / 2), Math.min(H - 1, r.top + r.height / 2)), e); });
    out.primaryOff = cta.length > 0 && !seen.length;
  }
  return out;
}

(async () => {
  const root = path.resolve(__dirname, '..');
  const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.woff2': 'font/woff2' };
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]); const file = path.join(root, rel === '/' ? 'index.html' : rel);
    if (rel === '/favicon.ico') { res.writeHead(204); return res.end(); }
    if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
    fs.readFile(file, (err, buf) => { if (err) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(buf); });
  });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  const url = 'http://127.0.0.1:' + server.address().port + '/index.html';
  const browser = await chromium.launch();
  const report = {};
  for (const [key, [w, h]] of Object.entries(DEVICES)) {
    if (which !== 'all' && which !== key) continue;
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36' });
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(url); await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(500);
    const ev = (fn, arg) => page.evaluate(fn, arg);
    const act = (a, v) => ev(([a, v]) => UI.handle(a, v), [a, v]);
    const closeAll = () => ev(() => { for (let i = 0; i < 10 && UI.modalOpen(); i++) UI.closeModal(); G.queue = []; if (UI.hideSkillHold) UI.hideSkillHold(); });
    const screens = {}; let n = 0;
    const cap = async (name, wait = 350) => {
      await page.waitForTimeout(wait);
      try {
        const m = await ev(measure); n++;
        const id = String(n).padStart(2, '0') + '_' + name;
        screens[id] = m; await page.screenshot({ path: path.join(outDir, `${key}_${id}.png`) });
      } catch (e) { screens[name + '_오류'] = { error: String(e.message).split('\n')[0] }; }
    };
    const safe = async (name, fn) => { try { await fn(); } catch (e) { screens[name + '_진행오류'] = { error: String(e.message).split('\n')[0] }; } };

    await safe('오프닝', async () => {
      await page.waitForSelector('.world-opening'); await cap('오프닝', 1200);
      await page.click('[data-opening="skip"]'); await page.waitForFunction(() => !window.GateBoot || GateBoot.ready);
      await cap('타이틀', 600);
    });
    await safe('시작', async () => {
      await act('new'); await cap('시작방식');
      await act('mode-story'); await cap('각성전야_이름외형');
      await ev(() => { UI.pro.name = '점검'; }); await act('ps-start'); await cap('프롤로그_첫장면', 700);
      for (let i = 0; i < 25; i++) {
        if (await ev(() => !!document.querySelector('.ec-skip'))) { await page.click('.ec-skip').catch(() => {}); await page.waitForTimeout(200); }
        const has = await ev(() => !!document.querySelector('[data-act="pro-choice"]')); if (!has) break;
        if (i === 3) await cap('프롤로그_중간');
        await page.click('[data-act="pro-choice"] >> nth=0'); await page.waitForTimeout(150);
      }
      const begin = await page.$('[data-act="pro-begin"]'); if (begin) { await cap('각성결과'); await begin.click(); await page.waitForTimeout(300); }
    });
    await safe('시험', async () => {
      const seen = new Set();
      for (let i = 0; i < 40; i++) {
        const acts = await ev(() => [...document.querySelectorAll('#modal-box [data-act]')].map((e) => e.dataset.act));
        const kind = await ev(() => document.getElementById('tut-skip') ? '튜토리얼' : document.querySelector('.dlg-choice') ? '대화선택' : UI.dlg ? '대화' : UI.ctx ? '전투' : (document.querySelector('#modal-box h3, #modal-box h2') || {}).textContent || '');
        const k = '시험_' + String(kind).replace(/[^가-힣A-Za-z0-9]+/g, '').slice(0, 14);
        if (kind && !seen.has(k) && seen.size < 22) { seen.add(k); await cap(k); }
        if (acts.includes('st-go')) { await act('st-go'); await page.waitForTimeout(1500); continue; }
        if (acts.includes('exam-skip')) { await act('exam-skip'); continue; }
        if (await ev(() => !!document.getElementById('tut-skip'))) {
          // 튜토리얼: 대화·탐색·팀 상의·안내 말풍선·첫 전투 두 번 행동까지 직접 진행하며 찍고, 그다음 건너뛴다
          const st = () => ev(() => ({ acts: [...new Set([...(document.querySelector('#council-ov') || document.getElementById('modal-box')).querySelectorAll('[data-act]:not([disabled])')].map((e) => e.dataset.act))], dlg: !!UI.dlg, hold: !!UI._hold, kind: UI.ctx && UI.ctx.kind, wait: !!(UI.ctx && UI.ctx.combat && UI.ctx.combat.waiting), sel: !!(UI.ctx && UI.ctx.sel), acted: UI.ctx && UI.ctx.tutorial ? UI.ctx.tutorial.acted : -1, council: !!document.getElementById('council-ov'), xr: !!document.querySelector('#modal-box .xr-card') }));
          const shot = async (tk, wait) => { if (!seen.has('튜토_' + tk)) { seen.add('튜토_' + tk); await cap('튜토리얼_' + tk, wait || 500); } };
          for (let t = 0; t < 70; t++) {
            if (await ev(() => typeof ExploreCinema !== 'undefined' && !!ExploreCinema.active)) { await shot('탐색컷씬', 700); await page.click('.ec-skip').catch(() => {}); continue; }
            const s2 = await st();
            if (s2.hold) { await shot(s2.kind === 'exam' ? '전투_안내말풍선' : '안내말풍선', 450); await page.mouse.click(Math.round(w / 2), Math.round(h * .47)); await page.waitForTimeout(280); continue; }
            if (s2.dlg) { await shot(s2.xr ? '탐색중대화' : s2.kind === 'exam' ? '전투중대화' : '입장대화', 1300); if (await page.$('.dlg-choice')) await page.click('.dlg-choice >> nth=0'); else await page.mouse.click(Math.round(w / 2), Math.round(h * .75)); await page.waitForTimeout(150); continue; }
            if (s2.kind === 'exam') {
              if (s2.acted >= 2) break;
              if (s2.wait) { await shot(s2.sel ? '전투_대상선택' : '전투_내차례', 300); await ev(() => { const c = UI.ctx, cb = c.combat; if (c.playing) return; if (!c.sel) UI.handle('c-skill', cb.player.skills[0]); else { const f = cb.units.find((u) => u.side === 'enemy' && u.alive); UI.handle('c-target', f.id); } }); }
              await page.waitForTimeout(400); continue;
            }
            if (s2.council) await shot('팀상의', 500); else if (s2.xr) await shot('탐색', 500);
            const pick = ['st-go', 'cn-lead', 'cn-vote', 'cn-go', 'cn-tut', 'exam-party', 'exm-watch', 'exm-node', 'ex-go', 'ex-pick', 'xr-go', 'story-choice', 'modal-close'].find((a) => s2.acts.includes(a)) || s2.acts[0];
            if (pick) { const scope = s2.council ? '#council-ov' : '#modal-box'; await page.locator(scope + ' [data-act="' + pick + '"]:not([disabled])').first().click({ timeout: 3000 }).catch(() => {}); }
            await page.waitForTimeout(400);
          }
          await ev(() => UI.tutSkipNow()); await page.waitForTimeout(500); continue;
        }
        if (acts.includes('exam-party')) { await act('exam-party'); continue; }
        if (await ev(() => !!document.querySelector('.dlg-choice'))) { await page.click('.dlg-choice >> nth=0'); await page.waitForTimeout(150); continue; }
        if (await ev(() => !!UI.dlg)) { await ev(() => UI.dlgEnd()); continue; }
        if (acts.includes('story-choice')) { await page.click('#modal-box [data-act="story-choice"] >> nth=0'); continue; }
        if (acts.includes('modal-close')) { await act('modal-close'); continue; }
        if (await ev(() => !!UI.ctx)) { await ev(() => { UI.ctx.combat.toggleAuto(); UI.ctx.speed = 2; }); await page.waitForTimeout(3000); const d = await page.$('#cb-ctrl [data-act]'); if (d) await d.click(); continue; }
        break;
      }
      await closeAll(); await ev(() => UI.renderGame());
    });
    await safe('지도', async () => {
      await cap('월드맵', 700);
      await ev(() => { const p = G.player; const c = WORLD.cityPos[p.region]; p.x = c[0]; p.y = c[1]; p.credits = Math.max(p.credits || 0, 5000); UI.renderGame(); });
      await cap('월드맵_도시위', 500);
    });
    for (const s of ['char', 'gear', 'skills', 'party', 'people', 'quest', 'guild', 'hunter', 'log']) {
      await safe('시트_' + s, async () => { await act('sheet', s); await cap('시트_' + s); await closeAll(); });
    }
    await safe('ID카드', async () => { await act('id-view'); await cap('헌터ID카드'); await closeAll(); });
    await safe('설정', async () => { await act('settings'); await cap('설정'); await closeAll(); });
    await safe('도시', async () => {
      await act('city'); await cap('도시');
      const facs = await ev(() => [...document.querySelectorAll('[data-act="city-fac"]')].map((e) => e.dataset.v).filter(Boolean));
      for (const f of facs.slice(0, 12)) { await act('city-fac', f); await cap('시설_' + f, 250); }
      await closeAll();
    });
    await safe('게이트', async () => {
      await ev(() => { const p = G.player; p.hp = p.maxHp; p.mp = p.maxMp; const g = { id: 999001, kind: 'gate', x: p.x, y: p.y, region: p.region, tier: 0, theme: '점검', elem: 'fire', born: G.monthKey(), variant: 'normal' }; G.mapGates.push(g); UI.startGate(g.id); });
      const seen = new Set(); let fought = false;
      for (let i = 0; i < 150; i++) {
        if (await ev(() => !UI.ctx && !UI.modalOpen())) break;
        const kind = await ev(() => document.getElementById('council-ov') ? '팀상의' : document.querySelector('#modal-box > .settle-pop, .settle-box') ? '결산' : (UI.ctx && UI.ctx.combat && typeof UI.ctx.combat.toggleAuto === 'function' && !UI.ctx.combat.result) ? '전투' : document.querySelector('#modal-box .xr-card') ? '탐색' : UI.dlg ? '대화' : document.getElementById('skill-hold') ? '상세팝업' : ((document.querySelector('#modal-box h3, #modal-box h2') || {}).textContent || '기타'));
        const k = '게이트_' + String(kind).replace(/[^가-힣A-Za-z0-9]+/g, '').slice(0, 14);
        if (!seen.has(k) && seen.size < 12) { seen.add(k); await cap(k, 500); }
        if (await ev(() => !!UI.dlg)) { await ev(() => UI.dlgNext()); await page.waitForTimeout(150); continue; }
        if (await ev(() => !!UI._hold)) { await page.mouse.click(160, 300); await page.waitForTimeout(200); continue; }
        if (await ev(() => !!document.getElementById('skill-hold'))) { await ev(() => UI.hideSkillHold()); continue; }
        if (await ev(() => !!(UI.ctx && UI.ctx.combat && typeof UI.ctx.combat.toggleAuto === 'function' && !UI.ctx.combat.result))) {
          if (!fought) { // 첫 전투: 내 차례의 스킬 메뉴까지 직접 열어 찍는다
            fought = true;
            await page.waitForFunction(() => !!document.querySelector('#cb-ctrl [data-act]:not([disabled])'), null, { timeout: 15000 }).catch(() => {});
            await cap('전투_내차례', 300);
            await ev(() => UI.handle('c-cmd', 'skill')); await cap('전투_스킬메뉴', 400);
            await ev(() => UI.handle('c-cmd', 'item')); await cap('전투_아이템메뉴', 400);
            await ev(() => { UI.handle('c-cmd', 'skill'); const b = document.querySelector('#cb-ctrl [data-act="c-skill"]:not([disabled])'); if (b) UI.handle('c-skill', b.dataset.v); }); await cap('전투_대상선택', 400);
            await ev(() => { if (document.querySelector('[data-act="c-cancel"]')) UI.handle('c-cancel'); });
          }
          await ev(() => { const c = UI.ctx; if (!c.combat.auto) c.combat.toggleAuto(); c.speed = 2; });
          await page.waitForFunction(() => !UI.ctx || !UI.ctx.combat || typeof UI.ctx.combat.toggleAuto !== 'function' || (UI.ctx.combat.result && !UI.ctx.playing), null, { timeout: 90000 }).catch(() => {});
          await cap('전투_끝', 600); continue;
        }
        const acts = await ev(() => { const scope = document.querySelector('#council-ov') || document.querySelector('#modal-box > .settle-pop') || document.getElementById('modal-box'); return [...scope.querySelectorAll('[data-act]:not([disabled])')].filter((e) => e.getClientRects().length).map((e) => e.dataset.act + '|' + (e.dataset.v || '')); });
        const pick = acts.find((a) => /^(settle-close|g-next|g-finish\|clear|c-done)/.test(a)) || acts.find((a) => /^cn-(go|force|vote\|O|lead\|O|tut)/.test(a)) || acts.find((a) => /^xr-go/.test(a)) || acts.find((a) => /^g-node/.test(a)) || acts.find((a) => /^modal-close/.test(a)) || acts.find((a) => !/^(c-|cn-|ec-|zoom|sheet|focus|g-leave|item-info)/.test(a));
        if (!pick) { await page.waitForTimeout(200); continue; }
        const [a, v] = pick.split('|'); await act(a, v || undefined); await page.waitForTimeout(200);
      }
      await closeAll();
    });
    await safe('월드맵_끝', async () => { await ev(() => UI.renderGame()); await cap('월드맵_게이트뒤', 600); });
    report[key] = { size: [w, h], errors, screens };
    await ctx.close();
  }
  await browser.close(); server.close();

  // ---- 채점 ----
  // 다섯 항목 각 20점. 화면마다 문제가 있으면 그 화면 몫을 깎아 평균한다(문제가 한 화면에 몰려 있어도 전체가 0이 되지 않게).
  const all = []; for (const [dev, d] of Object.entries(report)) for (const [name, m] of Object.entries(d.screens)) if (!m.error) all.push({ dev, name, m });
  const errs = []; for (const [dev, d] of Object.entries(report)) { for (const [name, m] of Object.entries(d.screens)) if (m.error) errs.push(`${dev} ${name}: ${m.error}`); for (const e of d.errors) errs.push(`${dev} 스크립트 오류: ${e}`); }
  const avg = (f) => all.length ? all.reduce((a, s) => a + f(s.m), 0) / all.length : 0;
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const score = {
    '배치(가로 넘침·화면 밖·겹침)': 20 * avg((m) => clamp(1 - (m.hOverflow ? .5 : 0) - .25 * m.offX.length - .2 * m.overlap.length)),
    '터치 영역(40px 이상)': 20 * avg((m) => m.taps ? clamp(1 - (m.small.length * .5 + m.tiny.length * 1.5) / Math.max(4, m.taps) * 2) : 1),
    '글자(크기·대비·잘림)': 20 * avg((m) => m.texts ? clamp(1 - (m.tinyText.length * 1 + m.lowContrast.length * .7) / Math.max(8, m.texts) * 2.5 - .15 * m.clipped.length) : 1),
    '흐름(주 버튼 보임·스크롤 길이)': 20 * avg((m) => clamp(1 - (m.primaryOff ? .6 : 0) - (m.scroll ? Math.min(.3, Math.max(0, m.scroll.ratio - 2.5) * .1) : 0))),
    '안정성(오류 없음)': Math.max(0, 20 - errs.length * 4),
  };
  const total = Object.values(score).reduce((a, b) => a + b, 0);
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify({ score, total, errs, report }, null, 1));
  console.log('화면'.padEnd(34) + '작음 아주작음 밖 겹침 작은글자 대비 잘림 스크롤 주버튼');
  for (const s of all) { const m = s.m; console.log(`${s.dev} ${s.name}`.padEnd(34) + [m.small.length, m.tiny.length, m.offX.length + (m.hOverflow ? '!' : ''), m.overlap.length, m.tinyText.length, m.lowContrast.length, m.clipped.length, m.scroll ? m.scroll.ratio : '-', m.primaryOff ? '안 보임' : ''].map((x) => String(x).padStart(5)).join(' ')); }
  for (const e of errs) console.log('오류  ' + e);
  console.log('\n자동 측정 점수 (100점)');
  for (const [k, v] of Object.entries(score)) console.log(`  ${k.padEnd(28)} ${v.toFixed(1)} / 20`);
  console.log(`  합계 ${total.toFixed(1)}`);
})().catch((e) => { console.error(e); process.exitCode = 1; });
