// 화면 밖 기억 게이트를 그린 뒤에도 플레이어 초상이 불투명해야 한다.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const source = fs.readFileSync(path.join(__dirname, '../js/mapview.js'), 'utf8');
    const results = await page.evaluate(async (source) => {
      let gates = [];
      const game = {
        player: { x: 2, y: 2, rankIdx: 0 }, npcs: [], mobs: [],
        seenNow: () => false, companion: () => null, gatesShown: () => gates,
      };
      const View = new Function('G', 'RANKS', source + ';return MapView;')(game, [{ color: '#ffffff', key: 'F' }]);
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 200;
      const ctx = canvas.getContext('2d');
      const sprite = document.createElement('canvas');
      sprite.width = sprite.height = 20;
      const paint = sprite.getContext('2d');
      paint.fillStyle = '#ff0000'; paint.fillRect(0, 0, 20, 20);
      const portrait = new Image(); portrait.src = sprite.toDataURL(); await portrait.decode();
      const view = Object.create(View.prototype);
      Object.assign(view, {
        ctx, tile: 40, t: 0, w: 200, hgt: 200, imgs: { player: portrait },
        toScreen: (x, y) => [x * 40, y * 40],
      });
      const results = [];
      for (const [name, list] of [
        ['게이트 없음', []],
        ['화면 밖 기억 게이트', [{ x: 1000, y: 1000, tier: 0 }]],
        ['화면 안·밖 기억 게이트', [{ x: 0, y: 0, tier: 0 }, { x: 1000, y: 1000, tier: 0 }]],
      ]) {
        gates = list; ctx.clearRect(0, 0, 200, 200); ctx.globalAlpha = 1;
        const gateAlphas = [];
        const arc = ctx.arc;
        ctx.arc = function (...args) { gateAlphas.push(this.globalAlpha); return arc.apply(this, args); };
        view.drawObjects(); ctx.arc = arc;
        const alpha = ctx.globalAlpha;
        ctx.clearRect(0, 0, 200, 200); view.drawPlayer();
        const pixel = [...ctx.getImageData(100, 100, 1, 1).data];
        if (list.some(g => g.x === 0) && !gateAlphas.includes(0.42)) throw Error('기억 게이트 흐림 표시 소실');
        results.push({ name, alpha, pixel });
      }
      return results;
    }, source);
    console.log(JSON.stringify(results));
    if (results.some(r => r.alpha !== 1 || r.pixel.join(',') !== '255,0,0,255')) {
      throw Error('게이트 투명도가 플레이어 초상에 적용됨');
    }
    console.log('통과: 기억 게이트 흐림 유지, 플레이어 초상은 불투명');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
