// 새 방문은 가벼운 오프닝만, 첫 조작은 본편을 한 번만 불러오는지 확인한다.
const assert = require('assert/strict');
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  try {
    for (const reducedMotion of ['reduce', 'no-preference']) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion });
      const errors = [], requests = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('request', r => requests.push(r.url()));
      await page.goto('file://' + path.resolve(__dirname, '../index.html'));
      await page.locator('.opening-art.is-active').evaluate(img => img.decode());
      assert.equal(requests.filter(url => /\/game\.js\?/.test(url)).length, 0);
      assert.equal(requests.filter(url => url.includes('/assets/map/')).length, 0);
      await page.click('[data-opening="skip"]');
      await page.waitForFunction(() => GateBoot.ready);
      assert.equal(requests.filter(url => /\/game\.js\?/.test(url)).length, 1);
      await page.click('[data-act="world-opening"]');
      await page.keyboard.press('Escape');
      await page.waitForSelector('.world-opening', { state: 'detached' });
      assert.equal(await page.locator('[data-act="new"]').count(), 1);
      assert.deepEqual(errors, []);
      console.log(`통과 ${reducedMotion}: 오프닝 우선 · 본편 단일 로드 · 스킵 · 다시 보기`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
