// 연기 시험(스모크 테스트): 새 게임부터 주요 화면·전투·저장까지 한 번씩 밟아 보고 오류가 없는지 확인한다.
// 여러 세션이 같은 브랜치에 올리므로, 푸시 전에 한 번씩 돌린다.
// 사용법: bash tools/build.sh && node tools/smoke_test.js   (실패하면 종료 코드 1)
// 빌드된 dist/game.js 를 읽는다. 각 단계는 독립적으로 시도하고, 실패한 단계와 오류를 모두 보고한다.
const path = require('path');
const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['Pixel 7'] });
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') pageErrors.push('console: ' + m.text()); });
  const url = 'file://' + path.resolve(__dirname, '..', 'index.html');
  await page.goto(url); await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(600);

  const results = [];
  // dist/ 는 배포 때 빌드한다. 저장소에서 추적되면 다른 세션 커밋에도 계속 끌려 들어가므로 실패로 친다.
  {
    const tracked = require('child_process').execSync('git ls-files dist', { cwd: path.resolve(__dirname, '..') }).toString().trim();
    results.push({ name: 'dist/ 가 git에서 추적되지 않음', ok: !tracked, err: tracked ? `추적 중: ${tracked.split('\n').join(', ')} → git rm -r --cached dist 후 커밋` : '' });
  }
  const step = async (name, fn) => {
    const before = pageErrors.length;
    let err = null;
    try { await fn(); } catch (e) { err = String(e && e.message || e).split('\n')[0]; }
    const newErr = pageErrors.slice(before);
    results.push({ name, ok: !err && !newErr.length, err: err || newErr[0] || '' });
  };
  const ev = (fn, arg) => page.evaluate(fn, arg);
  const act = (a, v) => ev(([a, v]) => UI.handle(a, v), [a, v]);
  const closeAll = () => ev(() => { for (let i = 0; i < 10 && UI.modalOpen(); i++) UI.closeModal(); G.queue = []; });

  await step('타이틀 화면', async () => { const n = await ev(() => document.querySelectorAll('#app [data-act]').length); if (!n) throw new Error('버튼 없음'); });
  await step('이야기로 시작 → 프롤로그 끝까지', async () => {
    await act('new'); await act('mode-story');
    await ev(() => { UI.pro.name = '점검'; }); await act('ps-start');
    for (let i = 0; i < 25; i++) {
      const has = await ev(() => !!document.querySelector('[data-act="pro-choice"]'));
      if (!has) break;
      await page.click('[data-act="pro-choice"] >> nth=0'); await page.waitForTimeout(120);
    }
    // 판정 화면이 있으면 누르고, 없으면(시험 뒤 공개 방식) 바로 게임으로 넘어간 상태
    const begin = await page.$('[data-act="pro-begin"]'); if (begin) { await begin.click(); await page.waitForTimeout(300); }
    const ok = await ev(() => !!(G.player && G.player.name)); if (!ok) throw new Error('플레이어 생성 안 됨');
  });
  await step('헌터 자격 시험(건너뛰기 또는 자동 전투) → 지도', async () => {
    for (let i = 0; i < 12; i++) {
      const acts = await ev(() => [...document.querySelectorAll('#modal-box [data-act]')].map((e) => e.dataset.act));
      if (acts.includes('exam-skip')) { await act('exam-skip'); continue; }
      if (acts.includes('exam-party')) { await act('exam-party'); continue; }
      if (acts.includes('story-choice')) { await page.click('#modal-box [data-act="story-choice"] >> nth=0'); continue; }
      if (acts.includes('modal-close')) { await act('modal-close'); continue; }
      if (await ev(() => !!UI.ctx)) { await ev(() => { UI.ctx.combat.toggleAuto(); UI.ctx.speed = 2; }); await page.waitForTimeout(3000); const d = await page.$('#cb-ctrl [data-act]'); if (d) await d.click(); continue; }
      break;
    }
    await closeAll(); await ev(() => UI.renderGame());
    const map = await ev(() => !!document.getElementById('map-cv')); if (!map) throw new Error('지도 없음');
  });
  for (const s of ['char', 'gear', 'skills', 'party', 'people', 'quest', 'guild', 'hunter', 'log']) {
    await step(`시트 탭: ${s}`, async () => { await act('sheet', s); const len = await ev(() => document.getElementById('modal-box').innerHTML.length); if (len < 200) throw new Error('내용이 거의 없음'); await closeAll(); });
  }
  await step('설정 창·지도 패널 접기 (화면)', async () => {
    await act('settings'); const ok = await ev(() => !!document.getElementById('set-vol')); if (!ok) throw new Error('설정 창 없음');
    await act('set-sfx'); await act('set-sfx'); await closeAll();
    await act('fold-card'); await act('fold-obj'); await act('fold-card'); await act('fold-obj');
  });
  await step('도시와 시설', async () => {
    await ev(() => { const p = G.player; const c = WORLD.cityPos[p.region]; p.x = c[0]; p.y = c[1]; UI.renderGame(); });
    await act('city');
    const facs = await ev(() => [...document.querySelectorAll('[data-act="city-fac"]')].map((e) => e.dataset.v).filter(Boolean));
    if (!facs.length) throw new Error('시설 없음');
    for (const f of facs) await act('city-fac', f);
    await closeAll();
  });
  await step('지도 걷기 10칸', async () => {
    await ev(() => {
      const p = G.player;
      for (let i = 0; i < 10; i++) {
        const r = WORLD.reach(p.x, p.y, 2, G.canJeju());
        const opts = [...r.dist.keys()].filter((k) => k !== r.start);
        if (!opts.length) break;
        const [x, y] = WORLD.xy(opts[Math.floor(Math.random() * opts.length)]);
        G.walkStep(x, y, x !== p.x && y !== p.y);
        G.queue = [];
      }
    });
  });
  await step('게이트 진입 → 자동 전투로 끝까지', async () => {
    await ev(() => { const p = G.player; p.hp = p.maxHp; p.mp = p.maxMp; const g = { id: 999001, kind: 'gate', x: p.x, y: p.y, region: p.region, tier: 0, theme: '점검', elem: 'fire', born: G.monthKey(), variant: 'normal' }; G.mapGates.push(g); UI.startGate(g.id); });
    const seen = [];
    for (let i = 0; i < 150; i++) {
      if (await ev(() => !UI.ctx && !UI.modalOpen())) break;
      const acts = await ev(() => [...document.querySelectorAll('#modal-box [data-act]')].map((e) => e.dataset.act + '|' + (e.dataset.v || '')));
      // 진짜 전투 중이면 자동 전투로 돌린다(층 지도 단계의 ctx.combat 은 전투 객체가 아니다)
      if (await ev(() => !!(UI.ctx && UI.ctx.combat && typeof UI.ctx.combat.toggleAuto === 'function' && !UI.ctx.combat.result))) { await ev(() => { const c = UI.ctx; if (!c.combat.auto) c.combat.toggleAuto(); c.speed = 2; }); await page.waitForFunction(() => !UI.ctx || !UI.ctx.combat || typeof UI.ctx.combat.toggleAuto !== 'function' || (UI.ctx.combat.result && !UI.ctx.playing), null, { timeout: 90000 }); continue; }
      const pick = acts.find((a) => /^(g-next|g-finish\|clear|c-done)/.test(a)) || acts.find((a) => /^g-node/.test(a)) || acts.find((a) => /^modal-close/.test(a)) || acts.find((a) => !/^(c-|zoom|sheet|focus|g-leave)/.test(a));
      if (!pick) break;
      seen.push(pick.split('|')[0]);
      const [a, v] = pick.split('|'); await act(a, v || undefined); await page.waitForTimeout(200);
    }
    const still = await ev(() => !!UI.ctx);
    await closeAll();
    if (still) throw new Error('150번 눌러도 게이트가 끝나지 않음: ' + [...new Set(seen)].join(','));
    if (!seen.some((x) => /g-finish|c-done|modal-close/.test(x))) throw new Error('게이트 종료 버튼을 못 거침: ' + [...new Set(seen)].join(','));
  });
  await step('지도 탐험: 탐사 지점·탐사 기록·차량 대여소·재앙·북부', async () => {
    const r = await ev(() => {
      if (!G.sites || !G.sites().length) return '탐사 지점 없음';
      const ch = { ruin: 'search', spring: 'absorb', village: 'rest', remains: 'return', altar: 'study', merchant: '2', tower: 'climb', outpost: 'search' };
      for (const s of G.sites().slice(0, 8)) { UI.showSite(s.id); UI.closeModal(); G.siteAct(s.id, ch[s.kind]); }
      G.queue = []; G.mobs = G.mobs.filter((m) => m.x !== G.player.x || m.y !== G.player.y);
      UI.handle('explore-book'); if (document.getElementById('modal-box').innerHTML.length < 200) return '탐사 기록 비어 있음';
      UI.closeModal();
      if (G.calGate && G.calState()) G.calMonthly();
      if (G.northState) { const n = G.northState(); const was = n.open; n.open = true; G.northApply(); n.open = was; if (!was) G.northClose(); }
      G.queue = [];
      return '';
    });
    if (r) throw new Error(r);
    await closeAll();
  });
  await step('시간 진행 3년 (수련·휴식·월간 처리)', async () => {
    await ev(() => { for (let i = 0; i < 36 && !G.over; i++) { if (i % 3) G.train(); else G.rest(); G.queue = []; } });
  });
  await step('저장 → 새로고침 → 이어하기', async () => {
    const before = await ev(() => { G.save(); return { name: G.player.name, ym: G.year * 12 + G.month }; });
    await page.reload(); await page.waitForTimeout(600);
    await act('continue'); await page.waitForTimeout(300);
    const after = await ev(() => G.player ? { name: G.player.name, ym: G.year * 12 + G.month } : null);
    if (!after || after.name !== before.name || after.ym !== before.ym) throw new Error(`불러온 값이 다름: ${JSON.stringify(before)} → ${JSON.stringify(after)}`);
  });
  await step('20년 무작위 진행에서 예외 없음', async () => {
    await ev(() => { for (let i = 0; i < 240 && !G.over; i++) { G.advanceMonth(1, { eventChance: 0.3 }); G.queue = []; } });
  });

  const ver = await ev(() => typeof GAME_VERSION !== 'undefined' ? GAME_VERSION : '?');
  console.log(`\n게이트 크로니클 v${ver} 연기 시험`);
  for (const r of results) console.log(`${r.ok ? '통과' : '실패'}  ${r.name}${r.ok ? '' : '  — ' + r.err}`);
  const fails = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - fails}/${results.length} 통과${pageErrors.length ? `, 페이지 오류 ${pageErrors.length}건` : ''}`);
  if (pageErrors.length) console.log([...new Set(pageErrors)].slice(0, 8).map((e) => '  · ' + e.slice(0, 200)).join('\n'));
  // 전투 한 화면 검사: 파티 5명 + 적 여러 마리로 내 차례 화면이 스크롤 없이 들어가는지 (docs/구현_대기목록.md 4-0)
  // 지금은 경고만 낸다. STRICT_COMBAT_FIT=1 이면 실패로 친다.
  let fitFails = 0;
  console.log('\n전투 한 화면 검사 (내용 높이 / 보이는 높이)');
  for (const D of ['iPhone SE', 'Galaxy S9+', 'Galaxy Z Fold 7 Cover', 'Pixel 7']) {
    const c2 = await browser.newContext({ ...devices[D] }); const pg = await c2.newPage();
    try {
      await pg.goto(url); await pg.evaluate(() => localStorage.clear()); await pg.reload(); await pg.waitForTimeout(400);
      await pg.evaluate(() => {
        UI.handle('new'); UI.handle('mode-manual'); UI.create.name = '화면'; UI.handle('c-start');
        for (let i = 0; i < 12 && UI.modalOpen(); i++) UI.closeModal(); G.queue = []; G.player.examDone = true;
        for (let i = 0; i < 4; i++) { const n = G.makeNpc(true); n.isCompanion = true; n.relation = 60; G.npcs.push(n); G.player.party.push(n.id); }
        UI.renderGame();
        const p = G.player; const m = { id: 88001, kind: 'mob', x: p.x, y: p.y, region: p.region, tier: 0, elem: 'fire', name: '불꽃 쥐', shape: 'beast', count: 3, born: G.monthKey() };
        G.mobs.push(m); UI.startMob(m.id);
      });
      await pg.waitForFunction(() => UI.ctx && UI.ctx.combat && UI.ctx.combat.waiting && !UI.ctx.playing, null, { timeout: 30000 });
      const r = await pg.evaluate(() => { const b = document.getElementById('modal-box'); return { c: b.scrollHeight, v: b.clientHeight, f: document.querySelectorAll('#foes .foe').length }; });
      const ok = r.c <= r.v + 2;
      if (!ok) fitFails++;
      console.log(`${ok ? '통과' : '경고'}  ${D.padEnd(22)} ${r.c} / ${r.v}  (적 ${r.f})`);
    } catch (e) { console.log(`확인 못 함  ${D}: ${String(e.message || e).split('\n')[0]}`); }
    await c2.close();
  }
  const strict = process.env.STRICT_COMBAT_FIT === '1';
  await browser.close();
  process.exit(fails || (strict && fitFails) ? 1 : 0);
})();
