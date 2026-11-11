// 승인된 웹툰풍 타일 11종 + 가장자리·코너 연결 이미지 50종.
// 이동 비용·칸 좌표·안개·탐사 표식은 기존 지도에서 그린다.
const MapTerrain = (() => {
  const SIZE = 80, VARIANTS = 16, TYPE_COUNT = 11;
  const NAMES = ['sea', 'plain', 'mountain', 'ruin', 'ether', 'city', 'bridge', 'north', 'forest', 'field', 'waste'];
  const BLUE = new Set([0, 2, 4, 6, 7]); // sea mountain ether bridge north
  const GREEN = new Set([1, 8, 9]); // plain forest field
  const colors = ['#0a1622', '#2a3a32', '#3a4548', '#2f3838', '#2a3148', '#243440', '#0a1622', '#1a1e28', '#24382e', '#3a4530', '#2a2830'];
  const water = (t) => t === WORLD.T.SEA || t === WORLD.T.BRIDGE;

  let atlas = null;
  const ready = new Set();
  const tileImg = new Array(TYPE_COUNT).fill(null);
  const sideImg = Object.create(null); // name → Image (N-edge)
  const cornerImg = Object.create(null); // name → [NE,SE,SW,NW]
  let assetsReady = false;
  let resolveReady = null;
  const whenReady = new Promise((r) => { resolveReady = r; });

  const loadImg = (src) => new Promise((resolve) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => resolve(null);
    im.src = src + '?v=webtoon-1';
  });

  (async () => {
    const base = 'assets/map/';
    const jobs = [];
    for (let t = 0; t < TYPE_COUNT; t++) {
      jobs.push(loadImg(base + 'tiles/' + NAMES[t] + '.png').then((im) => { tileImg[t] = im; }));
    }
    for (const name of NAMES) {
      if (name === 'plain') continue;
      jobs.push(loadImg(base + 'overlays/' + name + '_N.png').then((im) => { sideImg[name] = im; }));
      cornerImg[name] = [null, null, null, null];
      for (let c = 0; c < 4; c++) {
        jobs.push(loadImg(base + 'overlays/' + name + '_C' + c + '.png').then((im) => { cornerImg[name][c] = im; }));
      }
    }
    await Promise.all(jobs);
    assetsReady = tileImg.every(Boolean);
    ready.clear();
    atlas = null;
    resolveReady(assetsReady);
  })();

  const ensureAtlas = () => {
    if (!atlas) {
      atlas = document.createElement('canvas');
      atlas.width = SIZE * VARIANTS;
      atlas.height = SIZE * TYPE_COUNT;
    }
  };

  // 심리스 텍스처를 변형 오프셋으로 아틀라스 칸에 찍는다.
  const stamp = (type, variant) => {
    ensureAtlas();
    const key = type * VARIANTS + variant;
    if (ready.has(key)) return;
    const c = atlas.getContext('2d');
    const dx = variant * SIZE, dy = type * SIZE;
    c.clearRect(dx, dy, SIZE, SIZE);
    const im = tileImg[type];
    if (im && im.complete && im.naturalWidth) {
      const tw = im.naturalWidth, th = im.naturalHeight;
      const ox = Math.floor((variant % 4) * (tw / 4)) % tw;
      const oy = Math.floor((Math.floor(variant / 4) % 4) * (th / 4)) % th;
      // 래핑 소스: 임시 패턴
      const tmp = document.createElement('canvas');
      tmp.width = SIZE; tmp.height = SIZE;
      const tc = tmp.getContext('2d');
      tc.imageSmoothingEnabled = true;
      // 스케일: 텍스처 한 변이 타일 한 칸
      const scale = SIZE / tw;
      tc.save();
      tc.scale(scale, scale);
      // 4장 타일해 래핑
      for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) {
        tc.drawImage(im, xx * tw - ox, yy * th - oy);
      }
      tc.restore();
      c.drawImage(tmp, dx, dy);
    } else {
      c.fillStyle = colors[type] || colors[1];
      c.fillRect(dx, dy, SIZE, SIZE);
    }
    ready.add(key);
  };

  const sprite = (c, type, variant, px, py, s) => {
    stamp(type, variant);
    c.drawImage(atlas, variant * SIZE, type * SIZE, SIZE, SIZE, px, py, s + 0.3, s + 0.3);
  };

  const contactScale = (selfType, neighName) => {
    const neighType = NAMES.indexOf(neighName);
    if (BLUE.has(neighType) && GREEN.has(selfType)) return 1.45;
    if (GREEN.has(neighType) && BLUE.has(selfType)) return 0.55;
    if (BLUE.has(neighType)) return 1.15;
    return 1.0;
  };

  const drawSideOverlay = (c, name, side, px, py, s, alphaScale) => {
    const im = sideImg[name];
    if (!im || !im.complete || !im.naturalWidth) return;
    c.save();
    c.translate(px + s / 2, py + s / 2);
    c.rotate(side * Math.PI / 2);
    c.translate(-s / 2, -s / 2);
    c.globalAlpha = Math.max(0.05, Math.min(1, alphaScale));
    c.drawImage(im, 0, 0, s + 0.3, s + 0.3);
    c.restore();
  };

  const drawCornerOverlay = (c, name, corner, px, py, s, alphaScale) => {
    const list = cornerImg[name];
    const im = list && list[corner];
    if (!im || !im.complete || !im.naturalWidth) return;
    c.save();
    c.globalAlpha = Math.max(0.05, Math.min(1, alphaScale));
    c.drawImage(im, px, py, s + 0.3, s + 0.3);
    c.restore();
  };

  // 지형 바뀌는 변만 아주 약한 차가운 다크닝 (밝은 외곽선 없음)
  const softSeam = (c, px, py, s, sides /* bitmask N E S W */) => {
    if (!sides) return;
    c.save();
    const band = Math.max(1.5, s * 0.06);
    for (let side = 0; side < 4; side++) if (sides & (1 << side)) {
      let grad;
      if (side === 0) grad = c.createLinearGradient(px, py, px, py + band);
      else if (side === 1) grad = c.createLinearGradient(px + s, py, px + s - band, py);
      else if (side === 2) grad = c.createLinearGradient(px, py + s, px, py + s - band);
      else grad = c.createLinearGradient(px, py, px + band, py);
      grad.addColorStop(0, 'rgba(20,30,42,0.28)');
      grad.addColorStop(1, 'rgba(20,30,42,0)');
      c.fillStyle = grad;
      if (side === 0) c.fillRect(px, py, s, band);
      else if (side === 1) c.fillRect(px + s - band, py, band, s);
      else if (side === 2) c.fillRect(px, py + s - band, s, band);
      else c.fillRect(px, py, band, s);
    }
    c.restore();
  };

  const drawTransitions = (c, type, px, py, s, x, y) => {
    if (!assetsReady) return;
    const sides = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    let seamMask = 0;
    for (let side = 0; side < 4; side++) {
      const [dx, dy] = sides[side];
      const nx = x + dx, ny = y + dy;
      if (!WORLD.inb(nx, ny)) continue;
      const nj = WORLD.type(nx, ny);
      if (nj === type) continue;
      seamMask |= (1 << side);
      const key = NAMES[nj];
      if (!key || key === 'plain') continue;
      drawSideOverlay(c, key, side, px, py, s, contactScale(type, key));
    }
    // 대각: 4방향이 못 메운 코너 구멍만
    const diags = [[-1, 1, 0], [1, 1, 1], [1, -1, 2], [-1, -1, 3]];
    for (let i = 0; i < 4; i++) {
      const [dx, dy, ci] = diags[i];
      const nx = x + dx, ny = y + dy;
      if (!WORLD.inb(nx, ny)) continue;
      const nj = WORLD.type(nx, ny);
      if (nj === type) continue;
      const key = NAMES[nj];
      if (!key || key === 'plain') continue;
      const o1 = WORLD.inb(x + dx, y) ? WORLD.type(x + dx, y) : type;
      const o2 = WORLD.inb(x, y + dy) ? WORLD.type(x, y + dy) : type;
      if (o1 === nj || o2 === nj) continue;
      drawCornerOverlay(c, key, ci, px, py, s, contactScale(type, key));
    }
    softSeam(c, px, py, s, seamMask);
  };

  return {
    colors, ready, TYPE_COUNT, whenReady,
    get readyAssets() { return assetsReady; },
    draw(c, type, px, py, s, x, y, frame) {
      if (type < 0 || type >= TYPE_COUNT) return false;
      const variant = Math.floor(WORLD.h2(x, y, 73) * VARIANTS);
      sprite(c, type, variant, px, py, s);
      drawTransitions(c, type, px, py, s, x, y);
      if ((type === WORLD.T.SEA || type === WORLD.T.ETHER || type === WORLD.T.WASTE) && s >= 30) {
        const phase = FX.reduced ? 0.5 : (Math.sin(frame / 42 + variant) + 1) / 2;
        const col = type === WORLD.T.SEA ? `rgba(151,207,207,${0.07 + phase * 0.1})`
          : type === WORLD.T.WASTE ? `rgba(200,160,255,${0.1 + phase * 0.2})`
          : `rgba(221,195,255,${0.15 + phase * 0.3})`;
        c.fillStyle = col;
        const sx = px + s * (0.2 + variant / 27), sy = py + s * (0.3 + variant % 5 / 10);
        c.fillRect(sx, sy, type === WORLD.T.SEA ? s * 0.12 : 1.4, 0.8);
      }
      if (type === WORLD.T.BRIDGE) {
        c.save(); c.strokeStyle = '#82c8c688'; c.lineWidth = Math.max(1, s * 0.026); c.setLineDash([s * 0.1, s * 0.12]);
        c.lineDashOffset = FX.reduced ? 0 : -frame / 5;
        c.beginPath(); c.moveTo(px + s * 0.5, py); c.lineTo(px + s * 0.5, py + s); c.stroke(); c.restore();
      }
      return true;
    },
    get bytes() { return atlas ? atlas.width * atlas.height * 4 : 0; },
  };
})();

{
  const baseTile = MapView.prototype.drawTile;
  MapView.prototype.drawTile = function (type, px, py, s, x, y) {
    if (!MapTerrain.draw(this.ctx, type, px, py, s, x, y, this.t)) return baseTile.apply(this, arguments);
  };
}
