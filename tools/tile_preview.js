const path = require('path');
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');

(async () => {
  const root = path.resolve(__dirname, '..');
  const out = '/opt/cursor/artifacts';
  fs.mkdirSync(out, { recursive: true });
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]);
    const file = path.join(root, rel === '/' ? 'index.html' : rel);
    fs.readFile(file, (err, buf) => { if (err) { res.writeHead(404); return res.end(); } res.writeHead(200); res.end(buf); });
  });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 980 }, reducedMotion: 'reduce' });
  await page.addInitScript(() => { window.TUT_AUTO_TAP = true; });
  await page.goto('http://127.0.0.1:' + server.address().port + '/index.html');
  await page.waitForSelector('.world-opening');
  await page.click('[data-opening="skip"]');
  await page.evaluate(() => {
    UI.handle('new'); UI.handle('mode-manual'); UI.create.name = '미리보기'; UI.handle('c-start');
    UI.closeModal(); G.queue = []; if (UI.stopTitle) UI.stopTitle();
  });

  await page.evaluate(() => {
    const types = MapTerrain.TYPE_COUNT;
    const cell = 168, pad = 28, cols = 4;
    const rows = Math.ceil(types / cols);
    const el = document.createElement('canvas');
    el.id = 'gallery';
    el.width = cols * (cell + pad) + pad + 48;
    el.height = rows * (cell + 52) + 100;
    el.style.cssText = 'position:fixed;inset:0;z-index:9000;background:#0a1218';
    document.body.innerHTML = '';
    document.body.appendChild(el);
    const c = el.getContext('2d');
    c.fillStyle = '#0a1218'; c.fillRect(0, 0, el.width, el.height);
    c.fillStyle = '#e8f0ea'; c.font = '700 28px "IBM Plex Sans KR", sans-serif';
    c.fillText('지형 타일 미리보기', 32, 44);
    c.fillStyle = '#8aa098'; c.font = '15px "IBM Plex Sans KR", sans-serif';
    c.fillText('게임에 붙인 현재 버전 · 수정 원하시면 번호로 말씀해 주세요', 32, 70);
    for (let t = 0; t < types; t++) {
      const col = t % cols, row = Math.floor(t / cols);
      const px = pad + 24 + col * (cell + pad);
      const py = 100 + row * (cell + 52);
      c.fillStyle = '#121c24'; c.fillRect(px - 8, py - 8, cell + 16, cell + 40);
      const idx = WORLD.tiles.indexOf(t);
      const [x, y] = idx >= 0 ? WORLD.xy(idx) : [t * 3, t * 5];
      MapTerrain.draw(c, t, px, py, cell, x, y, 0);
      c.strokeStyle = '#2a3a44'; c.strokeRect(px + 0.5, py + 0.5, cell - 1, cell - 1);
      c.fillStyle = '#d5e0d8'; c.font = '600 16px "IBM Plex Sans KR", sans-serif';
      c.fillText((t + 1) + '. ' + WORLD.T_NAME[t], px, py + cell + 26);
    }
  });
  await page.locator('#gallery').screenshot({ path: path.join(out, 'tile-preview-gallery.png') });

  const names = ['sea', 'plain', 'mountain', 'ruin', 'ether', 'city', 'bridge', 'north', 'forest', 'field', 'waste'];
  for (let t = 0; t < names.length; t++) {
    await page.evaluate((type) => {
      let el = document.getElementById('one');
      if (!el) {
        el = document.createElement('canvas');
        el.id = 'one'; el.width = 360; el.height = 400;
        el.style.cssText = 'position:fixed;inset:0;z-index:9001;background:#0a1218';
        document.body.appendChild(el);
      }
      const c = el.getContext('2d');
      c.fillStyle = '#0a1218'; c.fillRect(0, 0, 360, 400);
      const idx = WORLD.tiles.indexOf(type);
      const [x, y] = idx >= 0 ? WORLD.xy(idx) : [type * 3, type * 5];
      MapTerrain.draw(c, type, 50, 36, 260, x, y, 0);
      c.strokeStyle = '#31424c'; c.strokeRect(50.5, 36.5, 259, 259);
      c.fillStyle = '#e8f0ea'; c.font = '700 22px "IBM Plex Sans KR", sans-serif';
      c.textAlign = 'center'; c.fillText((type + 1) + '. ' + WORLD.T_NAME[type], 180, 340);
      c.fillStyle = '#8aa098'; c.font = '14px "IBM Plex Sans KR", sans-serif';
      c.fillText('웹툰 톤 지형 타일', 180, 368);
      c.textAlign = 'start';
    }, t);
    await page.locator('#one').screenshot({ path: path.join(out, `tile-${String(t).padStart(2, '0')}-${names[t]}.png`) });
  }
  console.log('wrote gallery +', names.length, 'tiles');
  await browser.close(); server.close();
})().catch((e) => { console.error(e); process.exit(1); });
