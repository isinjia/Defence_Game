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
  // 화면은 file:// 이 아니라 여기서 띄운 작은 로컬 서버(http)로 연다: file:// 에서는 이미지를 그린 캔버스의 픽셀을 읽을 수 없어
  // (브라우저 보안, tainted canvas) 초상화 파츠 검사·지도 초상화 변환이 실패한다. 배포 환경(http)과도 같아진다.
  let server = null; let url = process.env.SMOKE_TEST_URL;
  if (!url) {
    const http = require('http'); const fs = require('fs'); const root = path.resolve(__dirname, '..');
    const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.woff2': 'font/woff2' };
    server = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split('?')[0]); const file = path.join(root, rel === '/' ? 'index.html' : rel);
      if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
      fs.readFile(file, (err, buf) => { if (err) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(buf); });
    });
    await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
    url = 'http://127.0.0.1:' + server.address().port + '/index.html';
  }
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

  await step('시네마틱 오프닝: 전체 화면·순차 자막·터치 넘김·스킵·다시 보기', async () => {
    await page.waitForSelector('.world-opening');
    await page.waitForFunction(() => document.querySelector('.opening-art.is-active').naturalWidth > 0);
    if (await page.locator('.opening-controls, .opening-count, .opening-story').count()) throw new Error('설명 패널이 남아 있음');
    await page.waitForFunction(() => document.querySelector('.opening-caption').textContent.includes('2067'));
    await page.click('.world-opening', { position: { x: 50, y: 200 } });
    await page.click('.world-opening', { position: { x: 50, y: 200 } });
    await page.waitForFunction(() => /하늘|아무도/.test(document.querySelector('.opening-caption-space').textContent));
    await page.click('[data-opening="skip"]');
    if (await page.locator('.world-opening').count()) throw new Error('스킵 실패');
    await page.click('[data-act="world-opening"]');
    await page.keyboard.press('Escape');
    if (await page.locator('.world-opening').count()) throw new Error('다시 보기 종료 실패');
  });
  await step('오프닝 12컷: 모든 이미지 파일과 브라우저 디코딩', async () => {
    const fs = require('fs');
    const src = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'world_opening.js'), 'utf8');
    const images = [...src.matchAll(/["']?image["']?\s*:\s*["']([^"']+)/g)].map(m => m[1]);
    if (images.length < 12 || new Set(images).size < 12) throw new Error('서로 다른 이미지가 12장 미만');
    for (const file of images) if (!fs.existsSync(path.resolve(__dirname, '..', file))) throw new Error('이미지 파일 없음: ' + file);
    await page.evaluate(async (sources) => {
      await Promise.all(sources.map(async (src) => {
        const img = new Image(); img.src = src; await img.decode();
        if (!img.naturalWidth) throw new Error('이미지 디코딩 실패: ' + src);
      }));
    }, images);
  });
  await step('타이틀 화면', async () => { const n = await ev(() => document.querySelectorAll('#app [data-act]').length); if (!n) throw new Error('버튼 없음'); });
  await step('타이틀 배경 이미지 로드', async () => {
    await page.waitForFunction(() => { const img = document.querySelector('.title-art'); return img && img.complete && img.naturalWidth > 0; });
  });
  await step('이미지 파츠 초상화: 인물 고정·나이·종족·의상·지도 마커', async () => {
    const result = await page.evaluate(async () => {
      const a = PortraitParts.select('고정인물', 'M', { age: 25, race: 'human' });
      const b = PortraitParts.select('고정인물', 'M', { age: 25, race: 'human' });
      if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error('같은 인물 파츠 변경');
      if (!PortraitParts.select('고정인물', 'F').layers[0].file.startsWith('face-f')) throw new Error('여성 파츠 아님');
      // 초상 나이는 10~42로 맞춘다. 76세도 성인 풀, 10세는 유스 풀.
      const aged = Number(PortraitParts.select('고정인물', 'M', { age: 76 }).layers[0].file.match(/face-m-(\d+)/)[1]);
      if (aged >= 15) throw new Error('고령도 성인 얼굴 풀이어야 함');
      const kid = Number(PortraitParts.select('고정인물', 'F', { age: 10 }).layers[0].file.match(/face-f-(\d+)/)[1]);
      if (kid < 15) throw new Error('아이 얼굴 없음');
      for (const race of ['elf', 'orc', 'dwarf', 'beastkin', 'dragonkin']) if (!PortraitParts.select('확인', 'M', { race }).layers.some(p => p.file.startsWith('traits'))) throw new Error('종족 특징 없음: ' + race);
      if (PortraitParts.select('고정인물', 'M', { outfit: 'coat' }).key === PortraitParts.select('고정인물', 'M', { outfit: 'tactical' }).key) throw new Error('의상 변경 안 됨');
      const faceSet = new Set(), hairSet = new Set(), clothSet = new Set();
      for (let n = 0; n < 240; n++) {
        const s = PortraitParts.select('다양' + n, n % 2 ? 'F' : 'M', { age: 16 + (n % 26) });
        faceSet.add(s.layers[0].file); hairSet.add(s.layers[2].file); clothSet.add(s.layers[1].file);
      }
      if (faceSet.size < 12 || hairSet.size < 12 || clothSet.size < 18) throw new Error('파츠 다양성 부족');
      // 정면 묶음머리는 두 눈을 가리지 않고, 목 피부는 깃 바깥으로 나오지 않아야 한다.
      for (const index of [0, 2, 3, 5]) {
        const part = new Image(); part.src = 'assets/portraits/parts/hair-f-' + index + '.webp?v=4'; await part.decode();
        const cv = document.createElement('canvas'); cv.width = 400; cv.height = 600;
        cv.getContext('2d').drawImage(part, 0, 0, 400, 600);
        for (const x of [168, 232]) if (cv.getContext('2d').getImageData(x, 163, 1, 1).data[3] > 8) throw new Error('묶음머리가 눈을 가림');
        if ([0, 2].includes(index)) {
          const bottom = cv.getContext('2d').getImageData(0, 470, 400, 130).data;
          if ([...bottom].some((v, i) => i % 4 === 3 && v > 50)) throw new Error('긴 머리 하단이 늘어남');
        }
      }
      const neckSrc = await PortraitParts.rasterize(PORTRAIT.card('목선확인', 'M', null, 0, 400, { outfit: 'mandarin' }));
      const neckImg = new Image(); neckImg.src = neckSrc; await neckImg.decode();
      const neckCanvas = document.createElement('canvas'); neckCanvas.width = 400; neckCanvas.height = 480;
      const neckCtx = neckCanvas.getContext('2d'); neckCtx.drawImage(neckImg, 0, 0);
      const outsideCollar = [...neckCtx.getImageData(153, 264, 10, 20).data, ...neckCtx.getImageData(155, 238, 8, 30).data];
      for (let i = 0; i < outsideCollar.length; i += 4) if (outsideCollar[i] > 140 && outsideCollar[i + 1] > 100 && outsideCollar[i] > outsideCollar[i + 1] + 15) throw new Error('목 피부가 옷깃 밖으로 나옴');
      // 턱이 하이칼라 앞에 오고, 턱·옷깃 사이에 목 깊이가 있어야 한다.
      const chinSrc = await PortraitParts.rasterize(PORTRAIT.card('턱뎁스', 'F', null, 0, 400, { outfit: 'hanbok' }));
      const chinImg = new Image(); chinImg.src = chinSrc; await chinImg.decode();
      const chinCanvas = document.createElement('canvas'); chinCanvas.width = 400; chinCanvas.height = 480;
      const chinCtx = chinCanvas.getContext('2d'); chinCtx.drawImage(chinImg, 0, 0);
      const chinTip = chinCtx.getImageData(200, 248, 1, 1).data;
      if (chinTip[0] < 140 || chinTip[1] < 90) throw new Error('턱이 옷깃에 묻힘');
      const neckGap = chinCtx.getImageData(200, 258, 1, 8).data;
      let skinRows = 0;
      for (let i = 0; i < neckGap.length; i += 4) if (neckGap[i] > 130 && neckGap[i + 1] > 85 && neckGap[i] > neckGap[i + 2]) skinRows++;
      if (skinRows < 2) throw new Error('턱과 옷깃 사이 목 뎁스 없음');
      for (const gender of ['M', 'F']) {
        let glassesSeed;
        for (let n = 0; n < 100; n++) if (PortraitParts.select('안경' + n, gender).layers.some(part => part.file === 'traits-5.webp')) { glassesSeed = '안경' + n; break; }
        if (!glassesSeed) throw new Error('안경 착용 인물 없음');
        const frame = PortraitParts.select(glassesSeed, gender).layers.find(part => part.file === 'traits-5.webp').rect;
        if (frame[2] > 104 || frame[3] > 21 || Math.abs(frame[2] / frame[3] - 5) > .01) throw new Error('안경 비율 불일치');
        const doc = new DOMParser().parseFromString(PORTRAIT.card(glassesSeed, gender, null, 0), 'image/svg+xml');
        const order = [...doc.querySelectorAll('image')].map(image => image.getAttribute('href'));
        if (order.findIndex(url => url.includes('traits-5.webp')) > order.findIndex(url => url.includes('hair-'))) throw new Error('안경이 앞머리 위에 표시됨');
      }
      // 뒤깃 → 목 → 앞깃 → 턱: 실제 픽셀로 검증해 목구멍과 턱 잘림의 재발을 막는다.
      for (const outfit of ['tactical', 'coat', 'mandarin']) {
        let seed;
        for (let n = 0; n < 100; n++) if (PortraitParts.select('깃깊이' + n, 'F', { outfit }).layers[0].file === 'face-f-0.webp') { seed = '깃깊이' + n; break; }
        if (!seed) throw new Error('옷깃 검사 인물 없음');
        const src = await PortraitParts.rasterize(PORTRAIT.card(seed, 'F', null, 0, 400, { outfit }));
        const im = new Image(); im.src = src; await im.decode();
        const cv = document.createElement('canvas'); cv.width = 400; cv.height = 480;
        const ctx = cv.getContext('2d'); ctx.drawImage(im, 0, 0);
        const pixel = y => ctx.getImageData(200, y, 1, 1).data;
        if (pixel(258)[0] < 130 || pixel(258)[1] < 85) throw new Error('옷이 턱을 가림: ' + outfit);
        if (outfit === 'tactical') {
          if (pixel(266)[0] < 100 || pixel(266)[1] < 65) throw new Error('뒤깃이 목을 가림');
          if (pixel(282)[0] > 100) throw new Error('목이 앞깃 위로 나옴');
        }
      }
      for (const gender of ['M', 'F']) {
        const doc = new DOMParser().parseFromString(PORTRAIT.card('머리정렬', gender, null, 0), 'image/svg+xml');
        const offset = gender === 'M' ? 8 : 0;
        const attached = [...doc.querySelectorAll('image')].filter(im => /(?:face|hair|traits)-/.test(im.getAttribute('href')));
        if (attached.some(im => im.getAttribute('transform') !== 'translate(0 ' + offset + ')')) throw new Error('얼굴과 머리·장신구 위치가 다름');
      }
      const robeSrc = await PortraitParts.rasterize(PORTRAIT.card('도포목선', 'M', null, 0, 400, { outfit: 'hanbok' }));
      const robeImg = new Image(); robeImg.src = robeSrc; await robeImg.decode();
      const robeCanvas = document.createElement('canvas'); robeCanvas.width = 400; robeCanvas.height = 480;
      robeCanvas.getContext('2d').drawImage(robeImg, 0, 0);
      const robeSkin = robeCanvas.getContext('2d').getImageData(200, 312, 1, 1).data;
      if (robeSkin[0] < 130 || robeSkin[1] < 85) throw new Error('도포 V 목선에 빈 공간');
      const svg = PORTRAIT.avatar('고정인물', 'M', 'fire', 3, 96, { age: 25, race: 'elf' });
      const data = await PortraitParts.rasterize(svg);
      const img = new Image(); img.src = data; await img.decode();
      if (!img.naturalWidth || !data.startsWith('data:image/svg+xml')) throw new Error('지도 초상화 변환 실패');
      return true;
    });
    if (!result) throw new Error('초상화 검사 실패');
  });
  await step('프롤로그 본문: 마침표마다 문장 줄바꿈', async () => {
    const ok = await ev(() => {
      if (typeof UI.proTextHtml !== 'function') throw new Error('proTextHtml 없음');
      UI.pro = UI.pro || { name: '점검', friend: { name: '친구', job: '학생' }, flags: {} };
      const html = UI.proTextHtml('옆방 피험자 13번. 벽을 두드렸다. "같이 먹자." 그는 사라졌다.');
      if ((html.match(/<br>/g) || []).length < 3) throw new Error('줄바꿈 수 부족: ' + html);
      if (!/13번\.<br>벽을/.test(html)) throw new Error('마침표 뒤 줄바꿈 없음: ' + html);
      if (/13번\.\s+벽을/.test(html)) throw new Error('같은 줄에 이어짐: ' + html);
      return true;
    });
    if (!ok) throw new Error('검사 실패');
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
  await step('아이템 칩·상세 팝업 (얻은 물건 탭)', async () => {
    const ok = await ev(() => {
      if (typeof UI.itemInfoHtml !== 'function' || typeof UI.showItemInfo !== 'function') throw new Error('item_pop 없음');
      const core = UI.itemInfoHtml('core:0'); if (!/F급 코어|괴수 코어/.test(core)) throw new Error('코어 상세 실패');
      const cons = UI.itemInfoHtml('cons:potion'); if (!/응급 회복제|체력/.test(cons)) throw new Error('소모품 상세 실패');
      G.player.mats.c0 = (G.player.mats.c0 || 0) + 2;
      const lines = ['토벌 보상: 60 크레딧, 에테르 4', '괴수 코어: E급 코어 1개', '부산물: E급 산성 점액 1개'];
      UI.modal(`<h3>전투 승리</h3>${lines.map((l) => `<p>${l}</p>`).join('')}<div class="row end"><button class="primary" data-act="modal-close">확인</button></div>`);
      UI.settleSheet();
      const chip = document.querySelector('#modal-box .ss-item[data-act="item-info"]');
      if (!chip) throw new Error('얻은 물건 칩에 data-act 없음');
      UI.handle('item-info', chip.dataset.v);
      const pop = document.getElementById('skill-hold');
      if (!pop || !/코어|부산물|시세|용도/.test(pop.textContent)) throw new Error('상세 팝업 내용 없음');
      UI.hideSkillHold();
      return true;
    });
    if (!ok) throw new Error('팝업 검사 실패');
    await closeAll();
  });
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
      if (MONSTERS.length < 230) return { err: '괴수 종류 부족 ' + MONSTERS.length };
      const g = { id: 9, tier: 3, theme: '버려진 병원', elem: 'dark', variant: 'normal', x: G.player.x, y: G.player.y, region: G.player.region };
      const rooms = G.gateRooms(g); const types = new Set(rooms.flat().map((m) => m.mtype));
      const names = rooms.flat().map((m) => (m._tpl || m.name.replace(/^(\[[^\]]*\]\s*)+/, '').replace(/^변종\s+/, '')));
      const themed = names.filter((n) => (THEME_MONSTERS['버려진 병원'] || []).includes(n)).length;
      G._monWorldGate = { theme: '해저 터널', region: 'busan', elem: 'water', x: G.player.x, y: G.player.y };
      const coast = (typeof monPool === 'function' ? monPool(3, { theme: '해저 터널', elem: 'water' }) : []).slice(0, 8).map((m) => m.name);
      G._monWorldGate = null;
      for (const room of rooms) { const cb = new Combat(G, { allies: [G.playerUnit()], enemies: room }); cb.runAll(); }
      G.dexKill('가시털 들개');
      UI.handle('sheet', 'dex'); const tab = !!document.querySelector('.sheet-head [data-v="dex"].on');
      UI.handle('dex-mon', '가시털 들개'); const detail = !!document.querySelector('.dex-head');
      UI.handle('dex-tab', 'sets'); UI.handle('dex-tab', 'named'); UI.closeModal();
      return { types: types.size, tab, detail, dex: Object.keys(G.player.dex || {}).length, themed, coast: coast.length, n: MONSTERS.length };
    });
    if (r.err || !r.types || !r.tab || !r.detail || !r.dex || r.n < 230 || !r.coast) throw new Error(JSON.stringify(r));
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
        else if (UI.ctx) { if (!UI.ctx.crewRaid && UI.ctx.kind !== 'story') return '팀 일인데 팀 진입이 아니다 (' + UI.ctx.kind + ')'; /* 호위 의뢰는 이야기 전투 */ UI.ctx = null; UI.closeModal(); UI.crewJobDone(); }
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
  await step('메인 시나리오: 1장 열림 → 퀘스트 맨 위 → 장면 끝까지 → 2장 · 4장 갈래별 5장 첫 줄 · 세계 시계 만료', async () => {
    const r = await ev(() => {
      if (typeof MAIN === 'undefined' || !MAIN.chapters[1]) return '메인 시나리오 틀이 없다';
      const M = G.mainState(); const keep = JSON.stringify(M); const q = G.queue.slice(); const p = G.player; const pos0 = [p.x, p.y, p.region];
      try {
        M.ch = 1; M.open = {}; M.done = {}; M.started = {}; M.flags = {}; M.scene = null; M.pending = null; M.startMk = G.monthKey() - 5;
        G.mainCheck(); if (!M.open[1]) return '1장이 열리지 않았다';
        const city = WORLD.cityPos[p.region]; p.x = city[0]; p.y = city[1];
        if (!UI.hudQuests().includes('main-go')) return '퀘스트 목록에 메인 줄이 없다';
        UI.mainPlay(null);
        for (let i = 0; i < 600 && (UI.dlg || (M.pending && !M.done[1])); i++) { if (!UI.dlg) { M.pendingDay = null; UI.mainPlay(M.pending); continue; } const d = UI.dlg; const line = d.lines[d.i]; if (line && line.choices) UI.handle('dlg-choice', '0'); else UI.dlgNext(); }
        if (UI.dlg) return '장면이 끝나지 않는다';
        if (!M.done[1]) return '1장이 완료되지 않았다';
        if (M.ch !== 2) return '다음 장으로 넘어가지 않았다';
        // pause 일수: 2장 연희 대화 뒤는 7일(목요일), 4장 보름 전은 10일
        const c2t = MAIN.chapters[2].scenes.find((x) => x.id === 'c2_talk'), c4w = MAIN.chapters[4].scenes.find((x) => x.id === 'c4_wait');
        if (G.mainPauseOf(c2t).days !== 7 || G.mainPauseOf(c4w).days !== 10) return 'pause 일수가 문구와 다르다';
        M.pendingDay = G.mainToday() + 7; M.pendingLabel = '목요일'; if (!/7일 뒤 · 목요일/.test(G.mainWaitText())) return '퀘스트 대기 표시가 남은 일수와 다르다: ' + G.mainWaitText(); M.pendingDay = null; M.pendingLabel = null;
        // 4장 갈래마다 5장 첫 줄이 다르다
        const firsts = new Set();
        for (const b of ['stop', 'raid', 'join', 'save', 'missed']) {
          if (UI.dlg) UI.dlgEnd(() => {});
          M.ch = 5; M.flags = { c4: b, c1_kid: 'bread' }; M.done[4] = { mk: G.monthKey() - 1 }; M.open[5] = G.monthKey(); M.started[5] = false; M.scene = null; M.pending = null;
          UI.mainPlay(null); const l = UI.dlg && UI.dlg.lines[0]; firsts.add(l ? (l.narr || l.text || '') : ''); UI.dlgEnd(() => {});
        }
        if (firsts.size !== 5) return '4장 갈래별 5장 첫 줄이 다르지 않다 (' + firsts.size + '/5)';
        // 세계 시계: 2장을 미루면 급식소·연희 상태가 남는다
        M.ch = 2; M.flags = {}; M.done = { 1: { mk: G.monthKey() - 20 } }; M.started = {}; M.open = { 2: G.monthKey() - 9 };
        G.mainCheck(); if (!M.done[2] || M.done[2].how !== 'missed' || M.flags.yeonhee !== 'missing' || M.flags.foodHall !== 'burned') return '세계 시계 만료가 상태를 남기지 않았다';
        return '';
      } finally { G.flags.main = JSON.parse(keep); G.queue = q; [p.x, p.y, p.region] = pos0; if (UI.dlg) UI.dlgEnd(); }
    });
    if (r) throw new Error(r);
  });
  await step('메인 2부: D급 9장 열림 · 9장 갈래→10장 첫 줄 · 10장 갈래→13장 친구 · 12장 만료 · 14장 뒤 진서해 · 대기일 존중', async () => {
    const r = await ev(() => {
      if (!MAIN.chapters[9] || !MAIN.chapters[14]) return '2부 장이 없다';
      const M = G.mainState(); const keep = JSON.stringify(M); const q = G.queue.slice(); const p = G.player; const rk = p.rankIdx; const chains = JSON.stringify(G.flags.chains || {}); const cal0 = JSON.stringify((G.world && G.world.calamity) || null); const gates0 = G.mapGates.slice(); const dang0 = REGIONS.map((x) => x.danger);
      let f = G.npcs.find((n) => n.friendhood && n.alive !== false); const madeF = !f;
      if (!f) { f = G.makeNpc(false); f.friendhood = true; f.rankIdx = 0; f.relation = 20; G.npcs.push(f); }
      const said = [];
      const setCh = (n, flags) => { if (UI.dlg) UI.dlgEnd(() => {}); M.ch = n; M.done = {}; for (let i = 1; i < n; i++) M.done[i] = { mk: G.monthKey() - 2 }; M.open = { [n]: G.monthKey() }; M.started = {}; M.scene = null; M.pending = null; M.pendingDay = null; M.flags = { ...flags }; };
      const play = (n, pick) => {
        for (let i = 0; i < 900 && !M.done[n]; i++) {
          if (UI.ctx && UI.ctx.kind === 'story') { UI.ctx.combat.result = 'win'; UI.finishStoryFight(); continue; }
          if (UI.modalOpen()) { UI.closeModal(); continue; }
          if (UI.dlg) { const l = UI.dlg.lines[UI.dlg.i]; if (l) said.push(l.narr || l.text || l.sys || ''); if (l && l.choices) UI.handle('dlg-choice', String(Math.min(pick, l.choices.length - 1))); else UI.dlgNext(); continue; }
          if (M.pending) { M.pendingDay = null; if (!UI.mainResume()) UI.mainPlay(M.pending); continue; }
          if (!M.started[n]) { UI.mainPlay(null); continue; }
          break;
        }
        G.queue = []; return !!M.done[n];
      };
      const firstOf = (n, flags, k) => { setCh(n, flags); UI.mainPlay(null); const ls = UI.dlg ? UI.dlg.lines : []; const t = ls[k] ? (ls[k].narr || ls[k].text || '') : ''; UI.dlgEnd(() => {}); return t; };
      try {
        p.rankIdx = 2; G.flags.chains ??= {};
        // 9장: D급이면 열리고 퀘스트 맨 위
        setCh(9, { c4: 'join', dream: 'record' }); M.open = {}; M.done[8].mk = G.monthKey() - 2; G.mainCheck();
        if (!M.open[9]) return 'D급에서 9장이 열리지 않았다';
        if (!/9장/.test(UI.hudQuests())) return '9장 메인 줄이 퀘스트에 없다';
        // 9장 갈래 → 서윤 상태와 10장 첫 줄
        const sy = new Set(), c10 = new Set();
        for (const k of [0, 1, 2]) { setCh(9, { c4: 'join', dream: 'record' }); if (!play(9, k)) return '9장이 끝나지 않는다 (' + k + ')'; sy.add(M.flags.seoyun); c10.add(firstOf(10, { seoyun: M.flags.seoyun }, 0)); }
        if (sy.size !== 3 || c10.size < 2) return '9장 갈래가 10장에 닿지 않는다 ' + [...sy].join(',');
        // 10장 갈래 → 13장 친구 첫 대사
        const f2 = new Set(), c13 = new Set();
        for (const k of [0, 1, 2]) { setCh(10, { seoyun: 'ally' }); if (!play(10, k)) return '10장이 끝나지 않는다 (' + k + ')'; f2.add(M.flags.friend2); c13.add(firstOf(13, { friend2: M.flags.friend2, c12: 'cut' }, 1)); }
        if (f2.size < 2 || c13.size < 2) return '10장 갈래가 13장 친구 상태를 바꾸지 않는다';
        // 대기일: 날이 안 됐으면 이어지지 않고, 되면 이어진다
        setCh(10, {}); M.started[10] = true; M.pending = 'c10_meet'; M.pendingDay = G.mainToday() + 3;
        if (UI.mainResume() || UI.dlg) return '대기일 전에 장면이 이어졌다';
        M.pendingDay = G.mainToday(); const fr = f.region; f.region = p.region; const city = WORLD.cityPos[p.region]; const xy = [p.x, p.y]; p.x = city[0]; p.y = city[1];
        const ok = UI.mainResume(); [p.x, p.y] = xy; f.region = fr; if (!ok || !UI.dlg) return '대기일이 지나도 이어지지 않는다'; UI.dlgEnd(() => {});
        // 12장 만료 → 얼굴 있는 상태
        setCh(12, { doyun: 'leaflet' }); M.open = { 12: G.monthKey() - 5 }; G.mainCheck();
        if (!M.done[12] || M.done[12].how !== 'missed' || M.flags.c12 !== 'missed' || M.flags.doyun !== 'front') return '12장 만료가 상태를 남기지 않았다';
        // 13장 늦음은 결과 고정, 14장 뒤 15장 · 진서해
        setCh(13, { friend2: 'deep', c12: 'missed' }); if (!play(13, 0) || M.flags.friend3 !== 'late') return '13장 늦음 결과가 고정되지 않았다';
        setCh(14, { jinSeohaeKnown: 'copy', friend3: 'saved' }); if (!play(14, 1)) return '14장이 끝나지 않는다';
        if (M.ch !== 15 || !M.flags.jinFace || G.mainWho('mumyeong').name !== '진서해' || !M.part2) return '14장 뒤 진서해 공개가 남지 않았다';
        const han = said.find((t) => /[一-鿿]/.test(t)); if (han) return '2부 대사에 한자: ' + han.slice(0, 30);
        return '';
      } finally { if (G.world) { G.world.calamity = JSON.parse(cal0); G.mapGates = gates0; REGIONS.forEach((x, i) => { x.danger = dang0[i]; }); if (G.world.calamity && G.calamityInit) G.calamityInit(); } G.flags.main = JSON.parse(keep); G.flags.chains = JSON.parse(chains); G.queue = q; p.rankIdx = rk; if (madeF) G.npcs.splice(G.npcs.indexOf(f), 1); if (UI.dlg) UI.dlgEnd(); }
    });
    if (r) throw new Error(r);
  });
  await step('메인 3·4부: C급 15장 열림 · 17장 갈래→18장 첫 줄 · 20장 뒤 아린 · 25장 리더 생사 · 27장 뒤 28장', async () => {
    const r = await ev(() => {
      if (!MAIN.chapters[15] || !MAIN.chapters[27]) return '3·4부 장이 없다';
      const M = G.mainState(); const keep = JSON.stringify(M); const q = G.queue.slice(); const p = G.player; const rk = p.rankIdx; const chains = JSON.stringify(G.flags.chains || {});
      const cal0 = JSON.stringify((G.world && G.world.calamity) || null); const gates0 = G.mapGates.slice(); const dang0 = REGIONS.map((x) => x.danger); const L0 = G.mainWho('leader'); const L0s = L0 ? { alive: L0.alive, death: L0.death, comp: L0.isCompanion, hurt: L0.hurt, party: (p.party || []).slice() } : null;
      const said = [];
      const setCh = (n, flags) => { if (UI.dlg) UI.dlgEnd(() => {}); M.ch = n; M.done = {}; for (let i = 1; i < n; i++) M.done[i] = { mk: G.monthKey() - 2 }; M.open = { [n]: G.monthKey() }; M.started = {}; M.scene = null; M.pending = null; M.pendingDay = null; M.flags = { ...flags }; };
      const play = (n, pick, lose) => {
        for (let i = 0; i < 900 && !M.done[n]; i++) {
          if (UI.ctx && UI.ctx.kind === 'story') { UI.ctx.combat.result = lose ? 'lose' : 'win'; UI.finishStoryFight(); continue; }
          if (UI.modalOpen()) { UI.closeModal(); continue; }
          if (UI.dlg) { const l = UI.dlg.lines[UI.dlg.i]; if (l) said.push(l.narr || l.text || l.sys || ''); if (l && l.choices) UI.handle('dlg-choice', String(Math.min(pick, l.choices.length - 1))); else UI.dlgNext(); continue; }
          if (M.pending) { M.pendingDay = null; if (!UI.mainResume()) UI.mainPlay(M.pending); continue; }
          if (!M.started[n]) { UI.mainPlay(null); continue; }
          break;
        }
        G.queue = []; return !!M.done[n];
      };
      try {
        G.flags.chains ??= {};
        p.rankIdx = 2; setCh(15, {}); M.open = {}; G.mainCheck(); if (M.open[15]) return 'D급에서 15장이 열렸다';
        p.rankIdx = 3; G.mainCheck(); if (!M.open[15] || !/15장/.test(UI.hudQuests())) return 'C급에서 15장이 열리지 않았다';
        const c18 = new Set();
        for (const k of [0, 1, 2]) { setCh(17, { seoyunShake: true }); if (!play(17, k)) return '17장이 끝나지 않는다'; const v = M.flags.c17; setCh(18, { c17: v }); UI.mainPlay(null); c18.add(UI.dlg ? UI.dlg.lines[0].narr : ''); UI.dlgEnd(() => {}); }
        if (c18.size !== 3) return '17장 갈래가 18장 첫 줄을 바꾸지 않는다';
        setCh(20, { goJae: 'alive', halfRing: true }); if (!play(20, 1) || G.mainWho('arin').name !== '아린' || !M.part3) return '20장 뒤 아린 이름이 남지 않았다';
        p.rankIdx = 4;
        setCh(25, {}); M.flags.c24_lead_with = true; if (!play(25, 0, true) || !['dead', 'gone'].includes(M.flags.leaderFate)) return '25장 패배가 리더 생사에 닿지 않았다: ' + M.flags.leaderFate;
        setCh(24, {}); M.open = { 24: G.monthKey() - 5 }; G.mainCheck(); if (M.flags.c24 !== 'missed' || !M.flags.domeBlood) return '24장 만료가 상태를 남기지 않았다';
        setCh(27, { jinBond: 'foe', halfRing: true }); if (!play(27, 0) || M.ch !== 28 || !M.part4 || !M.flags.straitRitual) return '27장 뒤 4부 요약이 없다';
        // 15장 듣기 잔향, 대기일 존중, 아린 부탁, 리더 말투 객체, 재앙 키 공유
        p.rankIdx = 3; setCh(15, { tone3: 'heard' }); UI.mainPlay('c15_arrive'); if (!UI.dlg || !/진서해/.test(UI.dlg.lines[0].narr || '')) return '15장 듣기 잔향이 첫 줄에 없다'; UI.dlgEnd(() => {});
        setCh(17, {}); M.started[17] = true; M.pending = 'c17_night'; M.pendingDay = G.mainToday() + 3; if (UI.mainResume() || UI.dlg) return '17장 대기일 전에 이어졌다';
        p.rankIdx = 4; setCh(21, { c20: 'world', arinName: true }); if (!play(21, 0) || M.flags.arinAsk !== 'bridge' || M.flags.arinPromise !== true) return '21장 아린 부탁이 남지 않았다';
        if (!LEAD_T.c12 || !LEAD_T.c12.with.haeyo || !LEAD_T.c24.stop.short) return '리더 반응 말투 대사가 없다';
        if (G.world && G.world.calamity) { const cs = G.world.calamity; cs.active = null; delete cs.done.basin; p.rankIdx = 3; setCh(15, {}); M.open = {}; G.mainCheck(); if (!['active', 'watch'].includes(M.flags.basin)) return '15장이 재앙 상태를 세우지 않았다'; G.mainCalClear('basin'); if (cs.done.basin !== 'player' || M.flags.basin !== 'player' || (cs.active && cs.active.id === 'basin')) return '메인 해소가 재앙에 닿지 않았다'; }
        // 시작 뒤 방치해도 만료, 만료까지 표시
        setCh(16, {}); M.open = { 16: G.monthKey() - 2 }; M.started[16] = true; M.pending = 'c16_yard'; if (!/만료까지 4개월/.test(UI.hudQuests())) return '만료까지 N개월 표시가 없다'; M.open[16] = G.monthKey() - 7; G.mainCheck(); if (!M.done[16] || M.done[16].how !== 'missed') return '시작 뒤 방치한 장이 만료되지 않았다';
        const han = said.find((t) => /[一-鿿]/.test(t)); if (han) return '3·4부 대사에 한자: ' + han.slice(0, 30);
        return '';
      } finally { if (G.world) { G.world.calamity = JSON.parse(cal0); G.mapGates = gates0; REGIONS.forEach((x, i) => { x.danger = dang0[i]; }); if (G.world.calamity && G.calamityInit) G.calamityInit(); } G.flags.main = JSON.parse(keep); G.flags.chains = JSON.parse(chains); G.queue = q; p.rankIdx = rk; if (L0) { L0.alive = L0s.alive; L0.death = L0s.death; L0.isCompanion = L0s.comp; L0.hurt = L0s.hurt; p.party = L0s.party; } if (UI.dlg) UI.dlgEnd(); }
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
    await page.click('[data-opening="skip"]');
    await page.click('[data-act="continue"]'); await page.waitForTimeout(300);
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
    await page.click('[data-opening="skip"]');
    await page.click('[data-act="continue"]'); await page.waitForTimeout(300);
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
      await pg.goto(url); await pg.evaluate(() => localStorage.clear()); await pg.reload(); await pg.waitForTimeout(300); await pg.click('[data-opening="skip"]');
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
      await pg.goto(url); await pg.evaluate(() => localStorage.clear()); await pg.reload(); await pg.waitForTimeout(400); await pg.click('[data-opening="skip"]');
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
  if (server) server.close();
  process.exit(fails || (strict && fitFails) ? 1 : 0);
})();
