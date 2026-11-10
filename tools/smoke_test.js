// 연기 시험(스모크 테스트): 새 게임부터 주요 화면·전투·저장까지 한 번씩 밟아 보고 오류가 없는지 확인한다.
// 여러 세션이 같은 브랜치에 올리므로, 푸시 전에 한 번씩 돌린다.
// 사용법: bash tools/build.sh && node tools/smoke_test.js   (실패하면 종료 코드 1)
// 빌드된 dist/game.js 를 읽는다. 각 단계는 독립적으로 시도하고, 실패한 단계와 오류를 모두 보고한다.
const path = require('path');
const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['Pixel 7'] });
  await ctx.addInitScript(() => { window.TUT_AUTO_TAP = true; }); // 튜토리얼 대사 멈춤(tut_pause.js)은 자동 시험에서 건너뛴다
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') pageErrors.push('console: ' + m.text()); });
  const url = process.env.SMOKE_TEST_URL || 'file://' + path.resolve(__dirname, '..', 'index.html');
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
  await step('타이틀 배경 이미지 로드', async () => {
    await page.waitForFunction(() => { const img = document.querySelector('.title-art'); return img && img.complete && img.naturalWidth > 0; });
  });
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
  await step('화면 글자에 한자 없음 (공통 규칙 9: 한국어판은 한글로)', async () => {
    const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'dist', 'game.js'), 'utf8');
    const m = src.match(/[\u3400-\u9fff\uf900-\ufaff]+/g);
    if (m) throw new Error('한자가 남아 있음: ' + [...new Set(m)].slice(0, 8).join(' '));
  });
  await step('헌터 자격 시험(건너뛰기 또는 자동 전투) → 지도', async () => {
    for (let i = 0; i < 14; i++) {
      const acts = await ev(() => [...document.querySelectorAll('#modal-box [data-act]')].map((e) => e.dataset.act));
      if (acts.includes('st-go')) { await act('st-go'); continue; }
      if (acts.includes('exam-skip')) { await act('exam-skip'); continue; }
      if (await ev(() => !!document.getElementById('tut-skip'))) { await page.click('#tut-skip', { timeout: 3000 }).catch(() => {}); await page.waitForTimeout(250); continue; }
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
      const pick = acts.find((a) => /^(g-next|g-finish\|clear|c-done)/.test(a)) || acts.find((a) => /^cn-(go|force|vote\|O)/.test(a)) || acts.find((a) => /^g-node/.test(a)) || acts.find((a) => /^modal-close/.test(a)) || acts.find((a) => !/^(c-|cn-|ec-|zoom|sheet|focus|g-leave)/.test(a));
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
      const go = ov.querySelector('[data-act="cn-go"],[data-act="cn-force"],[data-act="cn-vote"],[data-act="cn-tut"],[data-act="blk"]'); if (!go) return '진행 버튼 없음 ' + ov.innerText.replace(/\s+/g, ' ').slice(0, 200);
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
      UI.ctx.played = cb.log.length; // 차례 시작 때 밀린 연출(리더 대사 등)이 재생되면 그동안 입력이 잠기므로, 시험에서는 이미 본 것으로 친다
      for (const u of cb.units) if (u.side === 'ally') { u.stun = 0; u.mp = u.maxMp; } // 기습당해 동료가 기절한 채 시작하면 합동기가 막힌다(정상). 시험은 그 경우를 뺀다
      cb.units.find((u) => u.id === pair.id).atb = 90; UI.renderControls(); UI.handle('c-cmd', 'skill');
      const b = document.querySelector('.cmd-pop .combo-btn'); if (!b) return '스킬 목록에 합동기 버튼 없음';
      cb.player.ult = 100; UI.renderControls();
      if (!document.querySelector('.cmd-pop .ult-btn')) return '스킬 목록에 필살 버튼 없음';
      if (!document.querySelector('#allies .ult-aura')) return '필살 오라 없음'; // 막대 → 초상 뒤 오라 (js/ally_card.js)
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
  await step('전투 A: 본체 처치 뒤 소환물만 남으면 종료 · 분열 괴수 전투 (계산)', async () => {
    await closeAll(); await ev(() => { UI.ctx = null; });
    const r = await ev(() => {
      const mk = (nm) => { for (let i = 0; i < 800; i++) { const m = G.makeMonster(0); if (m.name.includes(nm) && !m.variant) return m; } return null; };
      const allies = () => [G.playerUnit()];
      // 1) 본체 하나 + 소환물 둘: 본체가 쓰러지면 소환물은 흩어지고 승리, 처치 수에는 본체만
      // 본체는 분열형·소환형이 아닌 괴수로 (분열형이면 조각이 남아 끝나지 않는 것이 맞다)
      let m0 = null; for (let i = 0; i < 400 && !m0; i++) { const m = G.makeMonster(0); if (!['splitter', 'summoner'].includes(m.mtype) && !['splitter', 'summoner'].includes(m.mtype2)) m0 = m; }
      const cb = new Combat(G, { allies: allies(), enemies: [m0 || G.makeMonster(0)], canFlee: true, title: '점검' });
      const boss = cb.enemies()[0]; if (!cb.monSpawn) return 'monSpawn 없음';
      cb.monSpawn(boss, '졸개', 'slime', 0.5, 0.3, {}); cb.monSpawn(boss, '졸개', 'slime', 0.5, 0.3, {});
      boss.hp = 0; cb.down(boss); cb.checkEnd();
      if (cb.result !== 'win') return '본체가 쓰러졌는데 전투가 끝나지 않음 (' + cb.result + ')';
      if (cb.enemies().length) return '승리했는데 적이 남아 있음';
      if (cb.kills.length !== 1) return '흩어진 소환물이 처치 수에 들어감 (' + cb.kills.length + ')';
      // 2) 분열 괴수: 조각이 남아 있는 동안은 끝나지 않고, 조각까지 잡으면 끝난다
      const sl = mk('슬라임'); if (!sl) return '';
      const c2 = new Combat(G, { allies: allies(), enemies: [sl], canFlee: true, title: '점검' });
      const s0 = c2.enemies()[0]; s0.hp = 0; c2.down(s0); c2.checkEnd();
      const kids = c2.enemies();
      if (s0.mtype === 'splitter' || s0.mtype2 === 'splitter') {
        if (!kids.length) return '분열형이 갈라지지 않음';
        if (c2.result) return '분열 조각이 남았는데 전투가 끝남';
        for (const k of kids) { k.hp = 0; c2.down(k); } c2.checkEnd();
        if (c2.result !== 'win') return '분열 조각을 다 잡았는데 끝나지 않음';
      }
      return '';
    });
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
  await step('탐색 컷씬: 모든 사건 연결·세 장면·다시 보기·판정 복귀', async () => {
    const r = await ev(() => {
      const oldCtx = UI.ctx; const auto = window.TUT_AUTO_TAP;
      try {
        UI.closeModal(); window.TUT_AUTO_TAP = false;
        const missing = [...GATE_EVENTS, ...EXPLORE_NODES, EXPLORE_BOSS].filter((n) => !ExploreCinema.scenes[n.id]);
        if (missing.length) return '연결되지 않은 탐색 장면 있음';
        const before = JSON.stringify({ p: G.player, queue: G.queue });
        for (const id of Object.keys(ExploreCinema.scenes).filter((id) => !ExploreCinema.scenes[id].prologue)) {
          ExploreCinema.show(id, true);
          if (!document.querySelector('.ec-screen svg') || ExploreCinema.active.step !== 0) return '첫 장면 없음';
          document.querySelector('.ec-next').click(); document.querySelector('.ec-next').click();
          if (ExploreCinema.active.step !== 2) return '세 번째 장면 없음';
          document.querySelector('.ec-next').click();
          if (ExploreCinema.active || document.querySelector('.ec-screen')) return '닫힘 실패';
        }
        if (before !== JSON.stringify({ p: G.player, queue: G.queue })) return '감상 중 게임 상태 변경';
        UI.ctx = { gate: { tier: 0, elem: 'water' }, run: { floor: 0, seen: [], ev: null } };
        UI.gateEvent();
        const chosen = UI.ctx.run.ev;
        // 한 화면 배치(js/explore_onescreen.js): 컷씬을 자동으로 띄우지 않고 그림·본문·선택지가 함께 보인다
        if (document.querySelector('.ec-screen')) return '사건에서 컷씬이 자동으로 뜸';
        if (!document.querySelector('.ex-one .ex-art svg') || !document.querySelector('.ex-one .ex-body') || !document.querySelector('.ex-one .ex-foot [data-act="ck-ev"]')) return '한 화면 배치(그림·본문·선택지) 없음';
        UI.handle('ec-replay', chosen.id);
        document.querySelector('.ec-skip').click();
        if (document.getElementById('modal').hasAttribute('inert')) return '사건 화면 잠금 잔류';
        if (UI.ctx.run.ev !== chosen) return '다시 보기로 사건 변경';
        ExploreCinema.show(chosen.id);
        if (ExploreCinema.active) return '읽은 컷씬 자동 반복';
        const site = G.sites().find((s) => s.kind === 'tower');
        UI.ctx = null;
        if (site) {
          UI.showSite(site.id); ExploreCinema.finish();
          if (!document.querySelector('[data-act="ck-site"]')) return '지도 판정 연결 끊김';
        }
        ExploreCinema.show('fork', true); UI.closeModal();
        if (ExploreCinema.active || document.body.classList.contains('ec-playing')) return '외부 종료 뒤 컷씬 잔류';
        return '';
      } finally { ExploreCinema.finish(); UI.ctx = oldCtx; window.TUT_AUTO_TAP = auto; UI.closeModal(); }
    });
    if (r) throw new Error(r);
  });
  await step('팀 거점: 합류 연락 → 거점에서 말 걸기 → 팀 전원 모임·리더가 바로 출발 → 기한 넘기면 불이익 · 게이트 제안 한 번', async () => {
    const r = await ev(() => {
      const p = G.player; if (p.crew || !G.firstTeamBuild) return '';
      const keep = { party: p.party.slice(), queue: G.queue.slice(), x: p.x, y: p.y, region: p.region, fame: p.fame };
      try {
        G.queue = [];
        G.firstTeamJoin(G.firstTeamBuild('free:mid')); const c = G.crew(); const L = G.crewLeader();
        if (!c || !L) return '팀 만들기 실패';
        if (!c.base || !c.due) return '거점·합류 기한이 없다';
        if (!G.queue.some((q) => q.type === 'crewCall')) return '들어가자마자 리더 연락이 오지 않았다';
        G.queue = [];
        if (G.party().length) return '개인 시간인데 팀원이 따라온다';
        if (!UI.hudQuests().includes('crew-talk')) return '퀘스트 목록에 합류 줄이 없다';
        // 게이트 제안은 한 번
        const g = G.mapGates.find((x) => !x.final && !x.mission);
        if (g) { G.crewProposeGate(g); if (!G.crewProposeGate(g).again) return '같은 게이트를 다시 제안할 수 있다'; c.asked = {}; }
        // 거점에서 말 걸기 → 일하러 간다
        const pos = WORLD.cityPos[c.base]; p.x = pos[0]; p.y = pos[1]; p.region = c.base;
        if (!G.crewAtBase()) return '거점에 있는데 거점으로 인식하지 않는다';
        UI.crewTalk(); if (!document.querySelector('[data-act="crew-work"]')) return '리더와의 대화에 [일하러 간다]가 없다';
        UI.handle('crew-work');
        if (!c.on) return '일하러 가는데 팀이 모이지 않았다';
        if (G.party().length < G.crewMembers().length) return '팀원 일부가 모이지 않았다';
        for (let i = 0; i < 6 && UI.dlg; i++) UI.dlgEnd();
        // 출발 뒤: 게이트·토벌이면 리더가 이끄는 화면, 호위·훈련이면 끝나고 거점으로
        if (UI.crewMarch) { if (!UI.walking && !UI.travel) return '리더가 팀을 이끌고 출발하지 않았다'; UI.walking = null; UI.crewMarch = null; UI.travel = null; UI.crewJobDone(); }
        else if (UI.ctx) { if (!UI.ctx.crewRaid) return '팀 일인데 팀 진입이 아니다'; UI.ctx = null; UI.closeModal(); UI.crewJobDone(); }
        if (c.on) return '일이 끝났는데 개인 시간으로 돌아가지 않았다';
        // 기한 넘기기
        G.queue = []; c.dueMixed = false; const trust = c.trust; c.due = G.monthKey() * 30 + G.day - 1; G.crewDayTick();
        if (!G.queue.some((q) => q.type === 'crewLate')) return '기한을 넘겼는데 알림이 없다';
        G.crewMissDue(); if (!(c.trust < trust) && G.crew()) return '기한을 넘겼는데 불이익이 없다';
        return '';
      } finally {
        if (UI.ctx) { UI.ctx = null; } UI.walking = null; UI.crewMarch = null; UI.travel = null; UI.closeModal(); if (UI.dlg) UI.dlgEnd();
        if (p.crew) G.withCrew(() => { for (const n of G.npcs) if (n.crewOf === p.crew.id) { n.crewOf = null; n.isCompanion = false; } });
        p.crew = null; p.party = keep.party; G.queue = keep.queue; p.x = keep.x; p.y = keep.y; p.region = keep.region; p.fame = keep.fame;
        if (G.flags.story) delete G.flags.story.firstTeam;
        UI.renderGame();
      }
    });
    if (r) throw new Error(r);
  });
  await step('대칭: 내가 리더일 때 해산 → 팀 호출 → 모여 함께 → 일이 끝나면 해산 · 늦은 팀원 불이익', async () => {
    const r = await ev(() => {
      const p = G.player; if (p.crew) return '';
      const keep = { party: p.party.slice(), x: p.x, y: p.y, region: p.region, lead: p.lead, queue: G.queue.slice() };
      const made = [];
      try {
        while (G.leadMembers().length < 2) { const n = G.makeNpc(true); n.isCompanion = true; n.relation = 5; n.persona = 'lazy'; G.npcs.push(n); p.party.push(n.id); made.push(n); }
        const pos = WORLD.cityPos[p.region]; p.x = pos[0]; p.y = pos[1];
        p.lead = { state: 'on', base: p.region };
        if (!G.party().length) return '함께일 때 팀원이 없다';
        G.leadDisband(); if (G.party().length) return '해산했는데 팀원이 따라온다';
        if (!UI.hudQuests().includes('lead-call')) return '퀘스트 목록에 팀 호출 줄이 없다';
        const old = RNG.chance; RNG.chance = () => true; try { if (!G.leadCall()) return '호출할 수 없다'; } finally { RNG.chance = old; }
        if (p.lead.state !== 'called') return '호출 상태가 아니다';
        G.queue = []; G.advanceDays(Math.max(1, p.lead.due - (G.monthKey() * 30 + G.day)), { noSave: true });
        if (p.lead.state !== 'on') return '기한이 됐는데 팀이 모이지 않았다';
        G.advanceDays(3, { noSave: true });
        if (!G.queue.some((q) => q.type === 'toast' && /늦게 합류|내보냈다/.test(q.text))) return '늦은 팀원 불이익 안내가 없다';
        if (!G.party().length) return '모였는데 팀원이 없다';
        const t = G.leadDisband('x'); if (!t || p.lead.state !== 'free') return '일이 끝나 해산하지 않았다';
        return '';
      } finally {
        p.lead = keep.lead; p.party = keep.party; p.x = keep.x; p.y = keep.y; p.region = keep.region; G.queue = keep.queue;
        for (const n of made) n.isCompanion = false;
      }
    });
    if (r) throw new Error(r);
  });
  await step('메인 시나리오: 1장이 조건에 맞춰 열리고 → 퀘스트 맨 위에 뜨고 → 장면이 끝까지 재생되고 → 2장으로 넘어간다', async () => {
    const r = await ev(() => {
      if (typeof MAIN === 'undefined' || !MAIN.chapters[1]) return '메인 시나리오 틀이 없다';
      const M = G.mainState(); const keep = JSON.stringify(M); const q = G.queue.slice(); const p = G.player; const pos0 = [p.x, p.y, p.region];
      try {
        M.ch = 1; M.open = {}; M.done = {}; M.started = {}; M.flags = {}; M.scene = null; M.pending = null; M.startMk = G.monthKey() - 5;
        G.mainCheck(); if (!M.open[1]) return '1장이 열리지 않았다';
        const city = WORLD.cityPos[p.region]; p.x = city[0]; p.y = city[1];
        if (!UI.hudQuests().includes('main-go')) return '퀘스트 목록에 메인 줄이 없다';
        UI.mainPlay(null);
        for (let i = 0; i < 400 && UI.dlg; i++) { const d = UI.dlg; const line = d.lines[d.i]; if (line && line.choices) UI.handle('dlg-choice', '0'); else UI.dlgNext(); }
        if (UI.dlg) return '장면이 끝나지 않는다';
        if (!M.done[1]) return '1장이 완료되지 않았다';
        if (M.ch !== 2) return '다음 장으로 넘어가지 않았다';
        return '';
      } finally { G.flags.main = JSON.parse(keep); G.queue = q; [p.x, p.y, p.region] = pos0; if (UI.dlg) UI.dlgEnd(); }
    });
    if (r) throw new Error(r);
  });
  await step('프롤로그 그림: 모든 장면에 정지 그림, 컷씬식 연출(화면 가림·다시 보기)은 없음', async () => {
    const r = await ev(() => {
      const missing = Object.keys(PROLOGUE).filter((id) => !PrologueCinema.config(id, UI.pro));
      if (missing.length) return '그림 없는 프롤로그 장면 있음: ' + missing.slice(0, 5).join(', ');
      if (document.querySelector('[data-act="pro-cinema"]')) return '컷씬 다시 보기 버튼이 남아 있음';
      if (Object.keys(ExploreCinema.scenes).some((k) => k.startsWith('prologue_'))) return '프롤로그 컷씬 장면이 등록됨';
      return '';
    });
    if (r) throw new Error(r);
  });
  await step('괴수 원화: 전 종 이미지·전용 보스·도감 확대와 복귀', async () => {
    const r = await ev(async () => {
      const missing = [...MONSTERS, MON_TREASURE].filter((m) => !MonsterArt.data[m.name]);
      if (missing.length) return '종별 원화 연결 누락';
      if (MonsterArt.resolve({ name: '[최종] 심연의 군주', shape: 'lord', _tpl: '서리 늑대' }) !== '심연의 군주') return '최종 보스 원화 불일치';
      await Promise.all(Object.keys(MonsterArt.data).map(async (name) => { const img = new Image(); img.src = MonsterArt.url(name, 'thumb'); await img.decode(); if (!img.naturalWidth) throw new Error('원화 로드 실패'); }));
      const name = '가시털 들개'; const entry = G.player.dex[name]; G.player.dex[name] = { seen: 1, kills: 1 };
      try {
        UI.handle('monster-art', name);
        const art = document.querySelector('.monster-art-full img'); if (!art) return '원화 확대 화면 없음';
        await art.decode(); UI.handle('dex-mon', name);
        if (!document.querySelector('.monster-art-action')) return '원화 확대 뒤 도감 복귀 실패';
        UI.closeModal(); return '';
      } finally { if (entry) G.player.dex[name] = entry; else delete G.player.dex[name]; }
    });
    if (r) throw new Error(r);
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
  // 튜토리얼(시험 탐색·첫 전투)을 건너뛰지 않고 진행하며 말풍선을 센다 (js/speech.js): 동시에 2개 이상이거나 같은 말풍선이 튀면 실패
  await step('튜토리얼 탐색·전투 중 말풍선은 동시에 하나, 자리 튐 없음', async () => {
    const c3 = await browser.newContext({ ...devices['iPhone SE'] }); const pg = await c3.newPage();
    const errs = []; pg.on('pageerror', (e) => errs.push(e.message));
    try {
      await pg.goto(url); await pg.evaluate(() => localStorage.clear()); await pg.reload(); await pg.waitForTimeout(300);
      await pg.evaluate(() => { UI.handle('new'); UI.handle('mode-manual'); UI.create.name = '말풍선'; UI.handle('c-start'); });
      await pg.evaluate(() => {
        window.__sp = { max: 0, jumps: 0, note: '' }; let last = null, lastKey = null;
        setInterval(() => {
          const n = UI.speech ? UI.speech.count() : 0; if (n > window.__sp.max) { window.__sp.max = n; window.__sp.note = '말풍선 ' + n + '개'; }
          const pop = document.getElementById('coach-pop');
          if (pop && pop.style.visibility !== 'hidden') { const t = Math.round(pop.getBoundingClientRect().top); const k = pop.textContent.slice(0, 30); if (lastKey === k && last !== null && Math.abs(t - last) > 3) { window.__sp.jumps++; window.__sp.note = '자리 튐 ' + last + '→' + t; } last = t; lastKey = k; } else { last = null; lastKey = null; }
        }, 40);
      });
      const st = () => pg.evaluate(() => ({ acts: [...new Set([...document.querySelectorAll('#modal-box [data-act]')].map((e) => e.dataset.act))], dlg: !!UI.dlg, hold: !!UI._hold, kind: UI.ctx && UI.ctx.kind, wait: !!(UI.ctx && UI.ctx.combat && UI.ctx.combat.waiting), acted: UI.ctx && UI.ctx.tutorial ? UI.ctx.tutorial.acted : -1 }));
      let fought = false;
      for (let i = 0; i < 70; i++) {
        if (await pg.evaluate(() => !!ExploreCinema.active)) { await pg.click('.ec-skip'); continue; }
        const s = await st();
        if (s.hold) { await pg.waitForTimeout(320); await pg.mouse.click(160, 300); await pg.waitForTimeout(280); continue; }
        if (s.dlg) { if (await pg.$('.dlg-choice')) await pg.click('.dlg-choice >> nth=0'); else await pg.mouse.click(160, 480); await pg.waitForTimeout(150); continue; }
        if (s.kind === 'exam') {
          if (s.acted >= 2) { fought = true; break; }
          if (s.wait) await pg.evaluate(() => { const c = UI.ctx, cb = c.combat; if (c.playing) return; if (!c.sel) UI.handle('c-skill', cb.player.skills[0]); else { const f = cb.units.find((u) => u.side === 'enemy' && u.alive); UI.handle('c-target', f.id); } });
          await pg.waitForTimeout(400); continue;
        }
        const pick = ['st-go', 'cn-tut', 'exam-party', 'exm-watch', 'exm-node', 'ex-go', 'ex-pick', 'story-choice', 'modal-close'].find((a) => s.acts.includes(a)) || s.acts[0];
        if (pick) await pg.click('#modal-box [data-act="' + pick + '"]:not([disabled]) >> nth=0', { timeout: 3000 }).catch(() => {});
        await pg.waitForTimeout(400);
      }
      const r = await pg.evaluate(() => window.__sp);
      if (errs.length) throw new Error('화면 오류: ' + errs[0]);
      if (!fought) throw new Error('시험 첫 전투까지 가지 못함');
      if (r.max > 1 || r.jumps > 0) throw new Error(r.note + ' (최대 ' + r.max + '개, 튐 ' + r.jumps + '회)');
    } finally { await c3.close(); }
  });
  for (const D of ['iPhone SE', 'Galaxy S9+', 'Galaxy Z Fold 7 Cover', 'Pixel 7']) {
    const c2 = await browser.newContext({ ...devices[D] }); await c2.addInitScript(() => { window.TUT_AUTO_TAP = true; }); const pg = await c2.newPage();
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
