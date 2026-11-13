// 실제 화면에서 컷씬 조작·접근성·화면 크기·동작 줄이기를 확인한다.
// 사용법: 빌드한 뒤 node tools/cutscene_test.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const shots = path.resolve(__dirname, '../docs/탐색_컷씬');
  fs.mkdirSync(shots, { recursive: true });
  let failures = 0;
  try {
    for (const [width, height, label] of [[320, 568, '작은_휴대전화'], [412, 915, '휴대전화'], [844, 390, '가로_화면'], [1440, 900, '큰_화면']]) {
      const page = await browser.newPage({ viewport: { width, height } });
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      try {
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
      if (await page.locator('[data-opening="skip"]').count()) await page.locator('[data-opening="skip"]').click();
      await page.waitForFunction(() => !window.GateBoot || GateBoot.ready);
        await page.evaluate(() => ExploreCinema.show('pack', true));
        await page.locator('.ec-next').click();
        if (await page.evaluate(() => ExploreCinema.active.step) !== 1) throw new Error('다음 장면 이동 실패');
        await page.keyboard.press('Tab');
        if (!await page.locator('.ec-skip').evaluate((e) => e === document.activeElement)) throw new Error('키보드 초점 순환 실패');
        await page.keyboard.press('Escape');
        if (await page.locator('.ec-screen').count()) throw new Error('탈출 키 종료 실패');
        await page.evaluate(() => {
          UI._hold = { id: '컷씬 검사', lines: ['안내'], i: 0, at: Date.now(), cb: null };
          const pop = document.createElement('div'); pop.id = 'coach-pop'; document.body.appendChild(pop);
          ExploreCinema.show('altar', true);
        });
        await page.locator('.ec-next').click();
        if (await page.evaluate(() => ExploreCinema.active.step) !== 1) throw new Error('훈련 안내가 컷씬 조작을 막음');
        await page.locator('.ec-skip').click();
        if (!await page.evaluate(() => !!UI._hold)) throw new Error('컷씬이 훈련 안내를 소모함');
        await page.evaluate(() => { UI._hold = null; document.getElementById('coach-pop').remove(); });
        for (const id of await page.evaluate(() => Object.keys(ExploreCinema.scenes))) {
          await page.evaluate((id) => ExploreCinema.show(id, true), id);
          const bad = await page.evaluate(() => {
            const screen = document.querySelector('.ec-screen');
            if (screen.scrollWidth > innerWidth || screen.scrollHeight > innerHeight + 2) return '화면 넘침';
            const boxes = ['.ec-header', '.ec-caption', '.ec-footer', '.ec-next', '.ec-skip'].map((s) => screen.querySelector(s).getBoundingClientRect());
            if (boxes.some((r) => r.left < 0 || r.right > innerWidth + 1 || r.top < 0 || r.bottom > innerHeight + 1)) return '글 또는 버튼 잘림';
            if (boxes[1].top < boxes[0].bottom || boxes[1].bottom > boxes[2].top) return '서술과 조작 영역 겹침';
            return '';
          });
          if (bad) throw new Error(bad);
        }
        await page.evaluate(() => ExploreCinema.show('crystal', true));
        await page.waitForTimeout(700); // 서술이 나타나는 연출을 마친 뒤 검토용 화면을 남긴다.
        await page.screenshot({ path: path.join(shots, label + '.png') });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        const moving = await page.locator('.ec-screen .ec-dust').evaluate((e) => getComputedStyle(e).animationName !== 'none');
        if (moving) throw new Error('동작 줄이기 미적용');
        if (errors.length) throw new Error(errors[0]);
        console.log(`통과 ${label} · 모든 장면 배치·키보드·훈련 안내·동작 줄이기`);
      } catch (e) { failures++; console.error(`실패 ${label} · ${e.message}`); }
      await page.close();
    }
    const gallery = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    await gallery.goto('file://' + path.resolve(__dirname, '../index.html'));
    await gallery.evaluate(() => {
      const el = document.createElement('div');
      el.id = '컷씬모음';
      el.style.cssText = 'position:relative;z-index:2000;background:#080f19;padding:28px;color:#e8eef4;font:14px sans-serif;';
      el.innerHTML = '<h1 style="font-size:26px;margin:0 0 10px">탐색 컷씬 · 전체 장면</h1><p style="color:#9cafbf;margin:0 0 24px">발견 · 단서 · 결정의 순간으로 이어지는 탐색 기록</p><div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px">' + Object.entries(ExploreCinema.scenes).map(([id, s]) => `<article style="border:1px solid #253342;border-radius:6px;overflow:hidden;background:#101a27"><div style="height:175px">${ExploreCinema.art(id)}</div><div style="padding:13px"><b>${s.title}</b><p style="color:#a7b8c9;line-height:1.6;font-size:12px;margin:8px 0 0">${s.lines[0]}</p></div></article>`).join('') + '</div>';
      document.body.appendChild(el);
    });
    await gallery.locator('#컷씬모음').screenshot({ path: path.join(shots, '전체_장면.png') });
    await gallery.close();
  } finally { await browser.close(); }
  process.exitCode = failures ? 1 : 0;
})();
