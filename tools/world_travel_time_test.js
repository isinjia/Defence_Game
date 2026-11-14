// 실제 걷기와 경로 예측의 시간 일치·차량·날짜 누적·저장 호환을 검사한다.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
(async () => {
  const browser = await chromium.launch();
  let server;
  try {
    let url = process.env.TRAVEL_TEST_URL;
    if (!url) {
      const root = path.resolve(__dirname, '..');
      server = http.createServer((req, res) => {
        const rel = decodeURIComponent(req.url.split('?')[0]);
        const file = path.resolve(root, '.' + (rel === '/' ? '/index.html' : rel));
        if (!file.startsWith(root + '/')) { res.writeHead(403); return res.end(); }
        fs.readFile(file, (error, data) => {
          res.writeHead(error ? 404 : 200, { 'Content-Type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' }[path.extname(file)] || 'application/octet-stream' });
          res.end(error ? 'missing' : data);
        });
      });
      await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
      url = 'http://127.0.0.1:' + server.address().port;
    }
    const page = await browser.newPage();
    await page.route('https://fonts.googleapis.com/**', r => r.abort());
    await page.goto(url);
    await page.click('[data-opening="skip"]');
    await page.waitForFunction(() => GateBoot.ready);
    const result = await page.evaluate(() => {
      UI.handle('new'); UI.handle('mode-manual'); UI.create.name = '이동 시간'; UI.handle('c-start'); UI.closeModal(); UI._stPending = false;
      G.player.statusSeen = true; G.player.examDone = true; G.queue = []; UI.ctx = null; UI.crewMarch = null;
      const p = G.player; p.guild = null; p.ownVehicle = null; p.vehicle = null; G.month = 5; G.day = 15; p.dayFrac = 0;
      G.isCivil = () => false; G.onCity = () => null; G.objAt = () => null; G.syncParty = () => {}; G.reveal = () => {}; G.mobs = []; RNG.chance = () => false;
      const [x, y] = WORLD.cityPos.gangnam;
      const a = WORLD.idx(x, y), b = WORLD.idx(x + 1, y), diagonal = WORLD.idx(x + 1, y + 1);
      for (const i of [a, b, diagonal]) { WORLD.tiles[i] = WORLD.T.PLAIN; WORLD.road[i] = 0; }
      const approx = (a, b, message) => { if (Math.abs(a - b) > 1e-7) throw Error(`${message}: ${a} / ${b}`); };
      const reset = () => { p.x = x; p.y = y; p.dayFrac = 0; p.spd = 10; G.day = 15; p.vehicle = null; p.ownVehicle = null; UI.crewMarch = null; WORLD.road[b] = 0; WORLD.tiles[b] = WORLD.T.PLAIN; G.applyTerrain(); };
      const move = (steps, expectedMinutes) => {
        const predicted = G.travelPathDays(steps), start = p.dayFrac, date = G.day;
        let oldX = p.x, oldY = p.y;
        for (const i of steps) { const [nx, ny] = WORLD.xy(i); G.walkStep(nx, ny, oldX !== nx && oldY !== ny); oldX = nx; oldY = ny; }
        const actual = G.day - date + p.dayFrac - start;
        approx(actual, predicted, '예상·실제 시간 불일치');
        if (expectedMinutes != null) approx(actual * 1440, expectedMinutes, '이동 시간');
        return actual * 1440;
      };
      const minutes = {};
      reset(); minutes.plain = move([b], 15);
      reset(); p.spd = 20; minutes.spd20 = move([b], 13);
      reset(); p.spd = 40; minutes.spd40 = move([b], 11);
      reset(); p.spd = 5; minutes.spd5 = move([b], 17);
      reset(); p.spd = 80; minutes.spd80 = move([b], 9);
      reset(); p.spd = 160; minutes.spd160 = move([b], 7);
      reset(); p.spd = 320; minutes.spd320 = move([b], 7);
      reset(); p.spd = 40; WORLD.road[b] = 1; minutes.fastRoad = move([b], 7);
      reset(); p.spd = 320; minutes.fastDiagonal = move([diagonal], 9.8);
      reset(); WORLD.road[b] = 1; minutes.road = move([b], 7.5);
      reset(); WORLD.tiles[b] = WORLD.T.MOUNTAIN; minutes.mountain = move([b], 30);
      reset(); minutes.diagonal = move([diagonal], 21);
      reset(); p.vehicle = { id: 'bike', until: G.monthKey() + 1 }; G.applyTerrain(); minutes.motorbike = move([b], 5);
      reset(); p.ownVehicle = { id: 'bicycle' }; G.applyTerrain(); minutes.bicycle = move([b], 10);
      reset(); p.spd = 40; p.ownVehicle = { id: 'car' }; WORLD.road[b] = 1; G.applyTerrain(); minutes.carRoad = move([b], 1.875);
      reset(); p.ownVehicle = { id: 'car' }; WORLD.road[b] = 1; UI.crewMarch = { ride: 'truck' }; G.applyTerrain(); minutes.carAndPartyRoad = move([b], .9375); UI.crewMarch = null;
      reset(); p.ownVehicle = { id: 'car', broken: true }; G.applyTerrain(); move([b], 15);
      reset(); UI.crewMarch = { ride: 'truck' }; minutes.partyTruck = move([b], 7.5); UI.crewMarch = null;
      reset(); const route = Array.from({ length: 96 }, (_, i) => i % 2 ? a : b);
      move(route.slice(0, 48), 720); G.save(); if (!G.load()) throw Error('저장 불러오기 실패');
      approx(G.player.dayFrac, .5, '중간 이동 시간 저장');
      G.player.spd = 10;
      // load는 player 객체를 교체하므로 이후 검사는 새 참조로 수행한다.
      const remaining = G.travelPathDays(route.slice(48));
      const beforeDay = G.day; G.advanceTravel(remaining);
      if (G.day !== beforeDay + 1) throw Error('누적 24시간이 하루로 반영되지 않음');
      approx(G.player.dayFrac, 0, '누적 시간 나머지');
      G.player.dayFrac = .99; G.day = 30;
      const eta = G.etaInfo(15 / 1440);
      if (!eta.months || !eta.text.includes('15분') || !eta.warn) throw Error('월 경계 예상 도착 오류');
      G.advanceTravel(15 / 1440); if (G.day !== 1) throw Error('월 경계 실제 도착 오류');
      const q = G.player; q.x = x; q.y = y; q.dayFrac = 0; q.vehicle = null; q.ownVehicle = null; q.spd = 10; G.applyTerrain(); G.queue = [];
      UI.renderGame();
      const far = WORLD.cityPos.busan, farIndex = WORLD.idx(...far);
      const start = performance.now(); UI.map.refresh(); const reachMs = performance.now() - start;
      if (!UI.map.reachData.dist.has(farIndex)) throw Error('먼 목적지 선택 제한');
      const slowReach = UI.map.reachData.dist.size, farCost = UI.map.reachData.dist.get(farIndex);
      q.spd = 100; UI.map.refresh();
      if (UI.map.reachData.dist.size !== slowReach || UI.map.reachData.dist.get(farIndex) !== farCost) throw Error('SPD에 따라 선택 범위가 바뀜');
      const blocked = WORLD.tiles.findIndex(t => t === WORLD.T.SEA);
      if (UI.map.reachData.dist.has(blocked)) throw Error('바다 통행 제한 무시');
      UI.onTap(...far);
      if (!UI._walkPlan?.length || UI._walkPlan.at(-1) !== farIndex || !document.querySelector('[data-act="walk-go"]')) throw Error('먼 목적지 출발 확인 불가');
      UI.clearMoveSel(); UI.hideTip(); q.spd = 10;
      const plan = UI.travelPlan(x + 1, y);
      if (plan.err || !(plan.days > 0 && plan.days < 1)) throw Error('짧은 경로가 최소 하루로 반올림됨');
      UI.travelConfirm(x + 1, y, '이동 검사');
      if (!document.getElementById('modal-box').textContent.includes('분')) throw Error('이동 확인 창의 분 표시 없음');
      return { minutes, splitAndSave: true, midnight: true, monthBoundary: true, routePreview: true, forecastMatchesActual: true, unlimitedDestination: true, statIndependentSelection: true, blockedTerrain: true, reachMs };
    });
    await page.locator('[data-act="travel-go"]').click();
    await page.waitForFunction(() => !UI.walking && G.player.x === WORLD.cityPos.gangnam[0] + 1, null, { timeout: 15000 });
    await page.evaluate(() => {
      if (!document.getElementById('toast').textContent.includes('분 이동했다')) throw Error('실제 이동 도착 알림에 분 표시 없음');
      if (G.player.dayFrac <= 0 || G.player.dayFrac >= 1) throw Error('실제 UI 이동 시간 미반영');
    });
    console.log(JSON.stringify({ ...result, actualWalk: true }));
  } finally { await browser.close(); if (server) await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exit(1); });
