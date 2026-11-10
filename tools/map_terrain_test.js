// 지도 타일의 실제 그리기·좌표 변환·안개·재사용·북부 해금을 확인한다.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const shots = path.resolve(__dirname, '../docs/지도_타일'); fs.mkdirSync(shots, { recursive: true });
  try {
    for (const [width, height, label] of [[412, 915, '휴대전화'], [1280, 900, '큰_화면']]) {
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
      const errors = []; page.on('pageerror', (e) => errors.push(e.message));
      await page.goto('file://' + path.resolve(__dirname, '../index.html'));
      const result = await page.evaluate(() => {
        window.TUT_AUTO_TAP = true;
        UI.handle('new'); UI.handle('mode-manual'); UI.create.name = '지도검사'; UI.handle('c-start');
        UI.closeModal(); UI.ctx = null; G.queue = [];
        if (UI.stopTitle) UI.stopTitle(); if (UI.map) UI.map.destroy();
        const holder = document.createElement('div'); holder.style.cssText = 'position:fixed;inset:0;z-index:2000;background:#07121b';
        const canvas = document.createElement('canvas'); holder.appendChild(canvas); document.body.appendChild(holder);
        const view = new MapView(canvas, null, { onTap() {}, onHover() {} }); window.__terrainView = view;
        view.tile = innerWidth < 600 ? 44 : 40; view.centerOn(16, 15); G.fog.fill(1); view.reachData = null;
        const worldBefore = Array.from(WORLD.tiles).join(','), fogBefore = Array.from(G.fog).join(','), playerBefore = JSON.stringify(G.player);
        const hasNew = typeof MapTerrain !== 'undefined';
        const c = canvas.getContext('2d');
        const start = performance.now();
        for (let type = 0; type < 8; type++) for (let i = 0; i < 16; i++) view.drawTile(type, 0, 0, 80, i, type);
        const warm = performance.now() - start;
        if (hasNew && MapTerrain.bytes > 6 * 1024 * 1024) throw new Error('지형 그림 메모리 한도 초과');
        const count = hasNew ? MapTerrain.ready.size : 0;
        const hot = performance.now();
        for (let i = 0; i < 15; i++) view.draw();
        const average = (performance.now() - hot) / 15;
        if (hasNew) {
          const stable = MapTerrain.ready.size;
          for (let i = 0; i < 5; i++) view.draw();
          if (MapTerrain.ready.size !== stable) throw new Error('정지 화면에서 지형 그림 계속 생성');
        }
        for (const size of [22, 38, 80]) {
          view.tile = size;
          for (const [x, y] of [[2, 4], [16, 15], [24, 29]]) {
            const [sx, sy] = view.toScreen(x + .5, y + .5), [tx, ty] = view.toTile(sx, sy);
            if (tx !== x || ty !== y) throw new Error('확대 후 지도 선택 좌표 변경');
          }
          view.draw();
        }
        const sample = NORTH.tiles[0];
        if (sample != null) {
          const [x, y] = WORLD.xy(sample), old = WORLD.tiles[sample];
          WORLD.tiles[sample] = WORLD.T.PLAIN; view.drawTile(WORLD.T.PLAIN, 0, 0, 80, x, y); WORLD.tiles[sample] = old;
        }
        if (worldBefore !== Array.from(WORLD.tiles).join(',') || fogBefore !== Array.from(G.fog).join(',') || playerBefore !== JSON.stringify(G.player)) throw new Error('그림 변경으로 게임 상태 변경');
        view.tile = innerWidth < 600 ? 44 : 40; view.centerOn(16, 15); view.draw();
        return { warm: Math.round(warm), average: +average.toFixed(2), count, bytes: hasNew ? MapTerrain.bytes : 0, hasNew };
      });
      await page.waitForTimeout(350);
      await page.screenshot({ path: path.join(shots, label + (result.hasNew ? '_변경후' : '_변경전') + '.png') });
      await page.evaluate(() => {
        const v = window.__terrainView;
        const i = WORLD.idx(16, 15); G.fog[i] = 0; v.centerOn(16, 15); v.draw();
        const [x, y] = v.toScreen(16.5, 15.5);
        const c = v.ctx, s = v.tile;
        const hidden = c.getImageData(Math.max(0, x * v.dpr | 0), Math.max(0, y * v.dpr | 0), 1, 1).data;
        G.fog[i] = 1; v.draw();
        const visible = c.getImageData(Math.max(0, x * v.dpr | 0), Math.max(0, y * v.dpr | 0), 1, 1).data;
        if (hidden[0] === visible[0] && hidden[1] === visible[1] && hidden[2] === visible[2]) throw new Error('안개 표시가 사라짐');
        v.destroy();
      });
      if (errors.length) throw new Error(errors[0]);
      console.log(`통과 ${label} · 좌표·안개·북부 변경·상태 보존 · 첫 준비 ${result.warm}밀리초 · 평균 그리기 ${result.average}밀리초 · 그림 저장 ${Math.round(result.bytes / 1024)}킬로바이트`);
      if (width > 600 && result.hasNew) {
        await page.evaluate(() => {
          const el = document.createElement('canvas'); el.id = '지형모음'; el.width = 1280; el.height = 260;
          el.style.cssText = 'position:fixed;top:0;left:0;z-index:3000'; document.body.appendChild(el);
          const c = el.getContext('2d'); c.fillStyle = '#0c1922'; c.fillRect(0, 0, el.width, el.height);
          c.fillStyle = '#e3ece5'; c.font = '700 22px sans-serif'; c.fillText('새로운 지도 지형', 22, 36);
          for (let type = 0; type < 8; type++) {
            const index = WORLD.tiles.indexOf(type), [x, y] = WORLD.xy(index), px = type * 157 + 22;
            MapTerrain.draw(c, type, px, 65, 132, x, y, 0);
            c.fillStyle = '#bdcfc9'; c.font = '13px sans-serif'; c.fillText(WORLD.T_NAME[type], px, 226);
          }
        });
        await page.locator('#지형모음').screenshot({ path: path.join(shots, '지형별_미리보기.png') });
      }
      await page.close();
    }
  } finally { await browser.close(); }
})().catch((e) => { console.error(e.message); process.exitCode = 1; });
