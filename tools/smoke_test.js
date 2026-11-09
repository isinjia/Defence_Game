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
      if (await ev(() => !!document.querySelector('.dlg-choice'))) { await page.click('.dlg-choice >> nth=0'); await page.waitForTimeout(150); continue; }
      if (await ev(() => !!UI.dlg)) { await ev(() => UI.dlgEnd()); continue; }
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
  await step('헌터 ID 카드 보기·뒤집기 (화면)', async () => {
    await act('id-view'); const ok = await ev(() => !!document.getElementById('idc')); if (!ok) throw new Error('ID 카드 없음');
    await act('id-flip'); await closeAll();
  });
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
      const pick = acts.find((a) => /^(g-next|g-finish\|clear|c-done)/.test(a)) || acts.find((a) => /^cn-(go|force|vote\|O)/.test(a)) || acts.find((a) => /^g-node/.test(a)) || acts.find((a) => /^modal-close/.test(a)) || acts.find((a) => !/^(c-|cn-|zoom|sheet|focus|g-leave)/.test(a));
      if (!pick) break;
      seen.push(pick.split('|')[0]);
      const [a, v] = pick.split('|'); await act(a, v || undefined); await page.waitForTimeout(200);
    }
    const still = await ev(() => !!UI.ctx);
    await closeAll();
    if (still) throw new Error('150번 눌러도 게이트가 끝나지 않음: ' + [...new Set(seen)].join(','));
    if (!seen.some((x) => /g-finish|c-done|modal-close/.test(x))) throw new Error('게이트 종료 버튼을 못 거침: ' + [...new Set(seen)].join(','));
  });
  await step('게이트 팀 상의 패널 (O/X 의견 → 진행)', async () => {
    const r = await ev(() => {
      const p = G.player; p.hp = p.maxHp; p.mp = p.maxMp; p.councilAsk = true;
      if (!G.party().length) { const n = G.makeNpc(false, 'human'); Object.assign(n, { region: p.region, met: true, relation: 50, links: {}, disciples: [], parents: [], isCompanion: true }); G.npcs.push(n); (p.party ||= []).push(n.id); }
      const g = { id: 999002, kind: 'gate', x: p.x, y: p.y, region: p.region, tier: 0, theme: '상의', elem: 'fire', born: G.monthKey(), variant: 'normal' }; G.mapGates.push(g); UI.startGate(g.id);
      const nd = document.querySelector('#modal-box [data-act="g-node"]'); if (!nd) return '층 지도 칸 없음';
      UI.handle('g-node', nd.dataset.v);
      // '매번 묻기'는 사용자 요청으로 삭제: 전원 찬성이면 패널 없이 바로 진행하는 것도 정상
      const ov = document.getElementById('council-ov');
      if (!ov) { const run = UI.ctx && UI.ctx.run; const moved = !!(run && run.map && run.map.pos) || !!document.getElementById('stage') || !UI.ctx; if (!moved) return '상의 패널도 없고 진행도 안 됨'; p.councilAsk = false; return ''; }
      const go = ov.querySelector('[data-act="cn-go"],[data-act="cn-force"],[data-act="cn-vote"]'); if (!go) return '진행 버튼 없음';
      UI.handle(go.dataset.act, go.dataset.v || 'O');
      if (document.getElementById('council-ov')) return '진행 뒤에도 패널이 남음';
      p.councilAsk = false; return '';
    });
    await closeAll(); await ev(() => { UI.ctx = null; });
    if (r) throw new Error(r);
  });
  await step('전투 A-γ: 유대 합동기·필살 게이지 (메뉴 → 발동)', async () => {
    await closeAll(); await ev(() => { UI.ctx = null; });
    await ev(() => {
      const p = G.player; p.hp = p.maxHp; p.mp = p.maxMp;
      if (!G.party().length) { const n = G.makeNpc(false, 'human'); Object.assign(n, { region: p.region, met: true, relation: 50, links: {}, disciples: [], parents: [], isCompanion: true }); G.npcs.push(n); (p.party ||= []).push(n.id); }
      const n = G.party()[0]; window.__aγ = { id: n.id, rel: n.relation, sworn: (p.sworn || []).slice() };
      n.relation = 90; p.sworn = [n.id];
      const m = { id: 88101, kind: 'mob', x: p.x, y: p.y, region: p.region, tier: 0, elem: 'fire', name: '점검 쥐', shape: 'beast', count: 2, born: G.monthKey() };
      G.mobs.push(m); UI.startMob(m.id);
      // 전투 흐름(원소 반응 등)에 기대지 않게: 적은 쓰러지지 않고, 내 차례가 먼저 온다
      const cb = UI.ctx.combat;
      for (const u of cb.units) { if (u.side === 'enemy') { u.hp = u.maxHp = 99999; } else u.atb = u.isPlayer ? 100 : 0; }
    });
    await page.waitForFunction(() => UI.ctx && UI.ctx.combat && UI.ctx.combat.waiting && !UI.ctx.playing, null, { timeout: 30000 });
    const r = await ev(() => {
      const cb = UI.ctx.combat; const pair = cb.comboPairs()[0]; if (!pair) return '합동기가 열리지 않음';
      cb.units.find((u) => u.id === pair.id).atb = 90; UI.renderControls(); UI.handle('c-cmd', 'skill');
      const b = document.querySelector('.cmd-pop .combo-btn'); if (!b) return '스킬 목록에 합동기 버튼 없음';
      cb.player.ult = 100; UI.renderControls();
      if (!document.querySelector('.cmd-pop .ult-btn')) return '스킬 목록에 필살 버튼 없음';
      if (!document.querySelector('#allies .ult-bar')) return '필살 게이지 줄 없음';
      UI.handle('c-combo', pair.id); if (!(cb.comboUsed || {})[pair.id]) return '합동기가 발동하지 않음';
      if (cb.result) return '';
      cb.waiting = true; cb.player.ult = 100; if (!cb.playerUlt(null)) return '필살기가 발동하지 않음';
      return '';
    });
    await page.waitForFunction(() => !UI.ctx || !UI.ctx.playing, null, { timeout: 30000 });
    await ev(() => { const s = window.__aγ; const n = G.npcById(s.id); if (n) n.relation = s.rel; G.player.sworn = s.sworn; G.mobs = G.mobs.filter((m) => m.id !== 88101); });
    await closeAll(); await ev(() => { UI.ctx = null; });
    if (r) throw new Error(r);
  });
  await step('전투 A-γ: 역할 구성 보너스 (파티 창 · 계산)', async () => {
    const r = await ev(() => {
      UI.handle('sheet', 'party'); const ok = !!document.querySelector('#modal-box .pb-line'); UI.closeModal();
      if (!ok) return '파티 창에 역할 구성 줄 없음';
      const pb = partyBonusOf([{ cls: CLASSES.find((c) => c.role === 'tank').id, row: 'front' }, { cls: CLASSES.find((c) => c.role === 'support').id, row: 'back' }, { cls: CLASSES.find((c) => c.role === 'melee').id, row: 'front' }]);
      if (!pb.full || !pb.form || !(pb.red > 0)) return '균형·정석 진형 판정이 틀림';
      return '';
    });
    await closeAll();
    if (r) throw new Error(r);
  });
  await step('괴수 다양성·도감 (주제별 괴수·유형 행동 → 도감 탭·상세·완성)', async () => {
    const r = await ev(() => {
      const g = { id: 9, tier: 3, theme: '버려진 병원', elem: 'dark', variant: 'normal' };
      const rooms = G.gateRooms(g); const types = new Set(rooms.flat().map((m) => m.mtype));
      for (const room of rooms) { const cb = new Combat(G, { allies: [G.playerUnit()], enemies: room }); cb.runAll(); }
      G.dexKill('가시털 들개');
      UI.handle('sheet', 'dex'); const tab = !!document.querySelector('.sheet-head [data-v="dex"].on');
      UI.handle('dex-mon', '가시털 들개'); const detail = !!document.querySelector('.dex-head');
      UI.handle('dex-tab', 'sets'); UI.handle('dex-tab', 'named'); UI.closeModal();
      return { types: types.size, tab, detail, dex: Object.keys(G.player.dex || {}).length };
    });
    if (!r.types || !r.tab || !r.detail || !r.dex) throw new Error(JSON.stringify(r));
  });
  await step('전투 A-β: 연합 레이드 (소집 → 편성 → 전투 → 분배)', async () => {
    await closeAll(); await ev(() => { UI.ctx = null; });
    const r0 = await ev(() => {
      const p = G.player; window.__aβ = { rank: p.rankIdx, raid: G.world.raid, money: p.money };
      p.rankIdx = Math.max(p.rankIdx, 3); p.hp = p.maxHp; p.mp = p.maxMp;
      G.world.raid = null; const m0 = G.month; while (G.monthKey() % 3 !== 0) G.month = (G.month % 12) + 1;
      G.raidMonthly(); G.month = m0;
      if (!G.world.raid || !G.queue.some((q) => q.type === 'raid')) return '레이드 공고가 나오지 않음';
      G.queue = G.queue.filter((q) => q.type === 'raid'); UI.processQueue();
      if (!document.querySelector('.raid-box [data-act="raid-go"]')) return '소집 공문 창 없음';
      UI.handle('raid-go');
      if (!UI.ctx || UI.ctx.kind !== 'raid') return '레이드 전투가 열리지 않음';
      const c = UI.ctx; if (!c.combat.auto) c.combat.toggleAuto(); c.speed = 4;
      // 시험 시간을 줄이려고 보스 체력을 낮춘다
      for (const u of c.combat.enemies()) { u.hp = Math.min(u.hp, 30); }
      return '';
    });
    if (r0) { await ev(() => { const s = window.__aβ; G.player.rankIdx = s.rank; G.world.raid = s.raid; }); throw new Error(r0); }
    await page.waitForFunction(() => !UI.ctx || (UI.ctx.combat.result && !UI.ctx.playing), null, { timeout: 90000 });
    const r = await ev(() => {
      if (UI.ctx) UI.handle('c-done');
      const ok = !!document.querySelector('.raid-share');
      const st = G.world.raid && G.world.raid.status;
      const s = window.__aβ; G.player.rankIdx = s.rank; G.world.raid = s.raid; G.player.money = s.money;
      return ok ? (['clear', 'fail', 'fled'].includes(st) ? '' : '레이드 상태가 이상함: ' + st) : '분배 결과 창 없음';
    });
    await closeAll(); await ev(() => { UI.ctx = null; });
    if (r) throw new Error(r);
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
  await step('탐색 판정: 사건 선택 → 맡을 사람 → 주사위 → 결과 팝업', async () => {
    const r = await ev(() => {
      UI.closeModal(); G.queue = [];
      const s = G.sites().find((x) => x.kind === 'ruin') || G.sites().find((x) => x.kind === 'tower');
      if (!s) return '판정 지점 없음';
      s.used = 0; UI.showSite(s.id);
      const b = document.querySelector('#modal-box [data-act="ck-site"]'); if (!b) return '판정 버튼 없음';
      UI.handle('ck-site', b.dataset.v);
      const who = document.querySelector('#modal-box [data-act="ck-who"]'); if (who) UI.handle('ck-who', who.dataset.v);
      if (!document.getElementById('ck-die') || !document.getElementById('ck-verdict')) return '결과 팝업 없음';
      UI.handle('ck-next'); UI.closeModal(); G.queue = []; G.mobs = G.mobs.filter((m) => m.x !== s.x || m.y !== s.y);
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
  await step('옛 속성(빙·강·영) 저장 → 새 속성으로 이전', async () => {
    await ev(() => {
      const d = JSON.parse(localStorage.getItem(SAVE_KEY));
      d.player.element = 'ice'; d.player.foeSeen = ['강철 거신']; d.npcs[0].element = 'spirit'; if (d.world) delete d.world.elem6;
      d.mapGates.push({ id: 999777, kind: 'gate', x: d.player.x, y: d.player.y, region: d.player.region, tier: 0, theme: '옛 저장', elem: 'steel', born: 0 });
      localStorage.setItem(SAVE_KEY, JSON.stringify(d));
    });
    await page.reload(); await page.waitForTimeout(600);
    await act('continue'); await page.waitForTimeout(300);
    const r = await ev(() => ({ p: G.player.element, n: G.npcs[0].element, g: (G.mapGates.find((x) => x.id === 999777) || {}).elem, f: G.player.foeSeen[0], m: elemMult('holy', 'dark') + elemMult('water', 'fire') + elemMult('fire', 'water') }));
    if (r.p !== 'water' || r.n !== 'dark' || (r.g && r.g !== 'wood') || r.f !== '고목 거신' || Math.abs(r.m - 3.7) > 1e-9) throw new Error('이전 결과: ' + JSON.stringify(r));
  });
  await step('20년 무작위 진행에서 예외 없음', async () => {
    await ev(() => { for (let i = 0; i < 240 && !G.over; i++) { G.advanceMonth(1, { eventChance: 0.3 }); G.queue = []; } });
  });

  const ver = await ev(() => typeof GAME_VERSION !== 'undefined' ? GAME_VERSION : '?');
  console.log(`\n게이트 크로니클 v${ver} 연기 시험`);
  for (const r of results) console.log(`${r.ok ? '통과' : '실패'}  ${r.name}${r.ok ? '' : '  — ' + r.err}`);
  const fails = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - fails}/${results.length} 통과${pageErrors.length ? `, 페이지 오류 ${pageErrors.length}건` : ''}`);
  // 파일 크기 보고 (늘어나는 추세를 보이게, 4-15)
  try { const fs = require('fs'); const kb = (f) => { try { return Math.round(fs.statSync(path.resolve(__dirname, '..', f)).size / 1024) + 'KB'; } catch (e) { return '-'; } }; console.log(`파일 크기: game.js ${kb('dist/game.js')} · fx3d.js ${kb('dist/fx3d.js')} (늦게 불러옴) · style.css ${kb('dist/style.css')}`); } catch (e) { /* 무시 */ }
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
