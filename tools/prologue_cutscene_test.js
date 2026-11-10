// 프롤로그 전체 장면과 분기별 배경, 이름 치환, 컷씬 종료 뒤의 선택 흐름을 확인한다.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const shots = path.resolve(__dirname, '../docs/프롤로그_컷씬'); fs.mkdirSync(shots, { recursive: true });
  try {
    for (const [width, height, label] of [[320, 568, '작은_휴대전화'], [412, 915, '휴대전화'], [844, 390, '가로_화면'], [1440, 900, '큰_화면']]) {
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
      const errors = []; page.on('pageerror', (e) => errors.push(e.message));
      await page.goto('file://' + path.resolve(__dirname, '../index.html'));
      const result = await page.evaluate(() => {
        window.TUT_AUTO_TAP = true; UI.handle('new'); UI.handle('mode-story'); UI.pro.name = '한별'; UI.handle('ps-start');
        const state = UI.pro;
        const all = Object.keys(PROLOGUE);
        const missing = all.filter((id) => !PrologueCinema.config(id, state));
        if (missing.length) throw new Error('컷씬 없는 프롤로그 장면 ' + missing.join(', '));
        let total = 0;
        const snapshot = () => JSON.stringify({ id: state.id, sc: state.sc, flags: state.flags, step: state.step, log: state.log, friendBonus: state.friendBonus });
        for (const id of all) {
          ExploreCinema.finish(); state.id = id; state.flags = { gb_subway: true }; UI.renderPrologue();
          if (!document.querySelector('.pro-cinema svg') || !document.querySelector('[data-act="pro-cinema"]')) throw new Error('장면 삽화 또는 다시 보기 없음');
          const buttons = [...document.querySelectorAll('#pro-scene [data-act="pro-choice"]')].map((e) => e.dataset.v).join(',');
          const before = snapshot(); UI.handle('pro-cinema', id);
          if (!document.querySelector('.pc-screen')) throw new Error('프롤로그 컷씬 연결 실패');
          const full = document.querySelector('.ec-caption p').textContent;
          if (/\{\??|undefined/.test(full)) throw new Error('치환되지 않은 서술');
          const activeScene = ExploreCinema.scenes[ExploreCinema.active.id];
          if (!activeScene.lines.length || activeScene.lines.length > 3) throw new Error('잘못된 장면 수');
          const seen = new Set();
          while (ExploreCinema.active) {
            const stage = ExploreCinema.active.step;
            if (seen.has(stage)) throw new Error('컷씬 진행 멈춤'); seen.add(stage);
            const screen = document.querySelector('.ec-screen');
            if (screen.scrollWidth > innerWidth + 1 || screen.scrollHeight > innerHeight + 1) throw new Error('화면 넘침');
            const boxes = ['.ec-header', '.ec-caption', '.ec-footer', '.ec-next'].map((s) => screen.querySelector(s).getBoundingClientRect());
            if (boxes.some((b) => b.left < 0 || b.right > innerWidth + 1 || b.top < 0 || b.bottom > innerHeight + 1)) throw new Error('서술 또는 버튼 잘림: ' + PROLOGUE[id].title);
            if (boxes[1].top < boxes[0].bottom || boxes[1].bottom > boxes[2].top) throw new Error('서술과 조작 영역 겹침: ' + PROLOGUE[id].title);
            document.querySelector('.ec-next').click();
          }
          if (snapshot() !== before) throw new Error('컷씬 감상으로 점수·친구·기록 변경');
          if (buttons !== [...document.querySelectorAll('#pro-scene [data-act="pro-choice"]')].map((e) => e.dataset.v).join(',')) throw new Error('컷씬 뒤 선택지 변경');
          if (document.getElementById('app').hasAttribute('inert')) throw new Error('선택지 잠금 잔류');
          total++;
        }
        state.id = 'gear'; state.flags = { gb_subway: true };
        if (PrologueCinema.config('gear', state).place !== 'subway') throw new Error('앞선 장소 선택 미반영');
        state.flags = { gb_hospital: true };
        if (PrologueCinema.config('gear', state).place !== 'hospital') throw new Error('병원 갈래 장소 미반영');
        state.id = 'eve_dinner'; state.flags = {}; UI.renderPrologue(); UI.handle('pro-cinema', state.id);
        if (!ExploreCinema.scenes[ExploreCinema.active.id].lines.join(' ').includes(state.friend.name)) throw new Error('친구 이름 치환 누락');
        return total;
      });
      await page.screenshot({ path: path.join(shots, label + '.png') });
      await page.keyboard.press('Tab');
      if (!await page.locator('.ec-skip').evaluate((e) => e === document.activeElement)) throw new Error('초점 순환 실패');
      await page.keyboard.press('Escape');
      if (await page.locator('.ec-screen').count()) throw new Error('탈출 키 종료 실패');
      await page.locator('[data-act="pro-cinema"]').click();
      await page.locator('.ec-skip').click();
      await page.evaluate(() => {
        UI.pro.id = 'student_2'; window.TUT_AUTO_TAP = false; UI.renderPrologue();
      });
      // 처음 감상한 장면을 다시 그리는 것은 자동 재생하지 않는다.
      if (await page.locator('.ec-screen').count()) throw new Error('읽은 장면 자동 반복');
      await page.evaluate(() => { UI.pro.id = 'gate_break'; UI.renderPrologue(); });
      await page.locator('[data-act="pro-cinema"]').click();
      if (await page.locator('.pc-screen .pc-object').evaluate((e) => getComputedStyle(e).animationName !== 'none')) throw new Error('동작 줄이기 미적용');
      await page.evaluate(() => { UI.screen = 'title'; UI.render(); });
      if (await page.locator('.ec-screen').count()) throw new Error('화면 전환 뒤 컷씬 잔류');
      if (errors.length) throw new Error(errors[0]);
      console.log(`통과 ${label} · ${result}개 장면 · 서술·배치·분기 장소·선택 보존·건너뛰기·다시 보기`);
      await page.close();
    }
    const flow = await browser.newPage({ viewport: { width: 412, height: 915 }, reducedMotion: 'reduce' });
    await flow.goto('file://' + path.resolve(__dirname, '../index.html'));
    const traversed = await flow.evaluate(() => {
      UI.handle('new'); UI.handle('mode-story'); UI.pro.name = '새별'; UI.handle('ps-start');
      let count = 0;
      while (UI.screen === 'prologue' && count < 30) {
        if (!ExploreCinema.active) throw new Error('새 장면 컷씬 자동 재생 누락');
        const id = UI.pro.id, before = UI.pro.step;
        document.querySelector('.ec-skip').click();
        const button = document.querySelector('#pro-scene [data-act="pro-choice"]');
        if (!button) throw new Error('컷씬 종료 뒤 선택지 없음');
        button.click(); count++;
        if (UI.screen === 'prologue' && id === UI.pro.id && before === UI.pro.step) throw new Error('선택 뒤 장면 진행 멈춤');
      }
      if (UI.screen === 'prologue' || !G.player) throw new Error('프롤로그를 마치지 못함');
      if (ExploreCinema.active) throw new Error('각성 뒤 컷씬 잔류');
        UI.screen = 'prologue'; UI.handle('pro-restart');
        if (!ExploreCinema.active) throw new Error('처음부터 다시 시작할 때 컷씬 재생 누락');
        ExploreCinema.finish();
      return count;
    });
    console.log(`통과 실제 이야기 진행 · ${traversed}번 선택 뒤 시험으로 연결`);
    await flow.close();
    const gallery = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    await gallery.goto('file://' + path.resolve(__dirname, '../index.html'));
    await gallery.evaluate(() => {
      window.TUT_AUTO_TAP = true; UI.handle('new'); UI.handle('mode-story'); UI.pro.name = '한별'; UI.handle('ps-start');
      const el = document.createElement('div'); el.id = '프롤로그모음'; el.style.cssText = 'position:relative;z-index:2000;background:#0b192a;padding:28px;color:#e3ebe5;font:14px sans-serif';
      const ids = ['chaebol_1', 'orphan_2', 'soldier_2', 'subject_1', 'student_1', 'gb_subway', 'voice', 'awaken', 'ill_3', 'relic_1', 'dream_3', 'storm_3', 'crime_3', 'tour_3', 'nest_3', 'game_1', 'eve_dinner', 'eve_memorial', 'idle_13', 'verdict'];
      el.innerHTML = '<h1 style="font-size:26px;margin:0 0 24px">각성 전야 · 프롤로그 컷씬</h1><div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px">' + ids.map((id) => `<article style="border:1px solid #3c5364;border-radius:6px;overflow:hidden;background:#13293a"><div style="height:180px">${PrologueCinema.art(id, UI.pro)}</div><p style="padding:0 13px">${PROLOGUE[id].title}</p></article>`).join('') + '</div>';
      document.body.appendChild(el);
    });
    await gallery.locator('#프롤로그모음').screenshot({ path: path.join(shots, '전체_장면_예시.png') });
    await gallery.close();
  } finally { await browser.close(); }
})().catch((e) => { console.error(e.message); process.exitCode = 1; });
