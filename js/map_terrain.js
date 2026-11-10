// 지형 그림만 교체한다. 이동 비용·칸 좌표·안개·탐사 표식은 기존 지도에서 그린다.
// 80화소 그림 160장을 한 장에 보관한다. 화면을 옮기거나 확대해도 다시 만들지 않는다.
const MapTerrain = (() => {
  const SIZE = 80, VARIANTS = 16, ROWS = 10;
  let atlas = null;
  const ready = new Set();
  const colors = ['#102c40', '#30483a', '#374a45', '#364342', '#383d50', '#304445', '#102c40', '#2c343b'];
  const water = (t) => t === WORLD.T.SEA || t === WORLD.T.BRIDGE;
  const polygon = (c, points, color) => {
    c.fillStyle = color; c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill();
  };
  const ellipse = (c, x, y, rx, ry, color) => { c.fillStyle = color; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); };
  const tree = (c, x, y, scale, light) => {
    c.save(); c.translate(x, y); c.scale(scale, scale);
    ellipse(c, 4, 3, 7, 3, '#101f2266');
    c.fillStyle = '#655d40'; c.fillRect(-.8, -2, 1.6, 5);
    polygon(c, [[-7, 0], [-4, -6], [-5, -6], [0, -18], [5, -6], [4, -6], [7, 0]], '#1c3830');
    polygon(c, [[-7, 0], [-4, -6], [-5, -6], [0, -18], [-1, -4], [2, 0]], light);
    c.strokeStyle = '#9aad7233'; c.lineWidth = .6; c.beginPath(); c.moveTo(-4, -5); c.lineTo(0, -15); c.stroke(); c.restore();
  };
  const rock = (c, x, y, scale) => {
    ellipse(c, x + scale * 2, y + scale, scale * 6, scale * 2.5, '#10242c66');
    polygon(c, [[x - scale * 5, y], [x - scale * 3, y - scale * 4], [x + scale, y - scale * 5], [x + scale * 5, y - scale], [x + scale * 3, y + scale]], '#617368');
    polygon(c, [[x - scale * 5, y], [x - scale * 3, y - scale * 4], [x + scale, y - scale * 5], [x, y - scale]], '#839383');
  };
  const building = (c, x, y, w, h, elevation, ruined, r) => {
    polygon(c, [[x + w, y], [x + w + elevation * .8, y + elevation * .6], [x + w + elevation * .8, y + h + elevation * .6], [x, y + h]], '#0c1e2588');
    c.fillStyle = ruined ? '#354347' : '#293e49'; c.fillRect(x, y, w, h);
    c.fillStyle = ruined ? '#556564' : '#4b6870'; c.fillRect(x, y - elevation, w, h);
    c.fillStyle = ruined ? '#445556' : '#39545e'; c.fillRect(x + w - 3, y - elevation + h, 3, elevation);
    c.strokeStyle = '#a7b9a655'; c.lineWidth = .65; c.strokeRect(x + .5, y - elevation + .5, w - 1, h - 1);
    c.fillStyle = '#263b42'; c.fillRect(x + 3, y - elevation + 3, Math.max(2, w - 7), Math.max(2, h - 7));
    c.fillStyle = ruined ? '#d8ac6a77' : '#9ddbccaa';
    for (let k = 3; k < w - 2; k += 5) if (r() > .3) c.fillRect(x + k, y + h - 2, 2, 1.5);
    if (ruined) {
      polygon(c, [[x + w * .45, y - elevation], [x + w * .6, y - elevation + h * .7], [x + w * .8, y - elevation + h * .4], [x + w, y - elevation]], '#172b31');
      c.strokeStyle = '#1b2e35'; c.beginPath(); c.moveTo(x + 2, y - elevation); c.lineTo(x + w * .3, y - elevation + h * .6); c.stroke();
    } else { c.fillStyle = '#b2cec3aa'; c.fillRect(x + 3, y - elevation + 3, 3, 3); }
  };
  const make = (type, variant) => {
    if (!atlas) { atlas = document.createElement('canvas'); atlas.width = SIZE * VARIANTS; atlas.height = SIZE * ROWS; }
    const key = type * VARIANTS + variant;
    if (ready.has(key)) return;
    const c = atlas.getContext('2d');
    c.save(); c.translate(variant * SIZE, type * SIZE); c.beginPath(); c.rect(0, 0, SIZE, SIZE); c.clip(); c.scale(SIZE / 100, SIZE / 100);
    let seed = (variant + 1) * 997 + type * 7919;
    const r = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    if (type >= 8) {
      // 8행: 해안의 모래·포말. 9행: 바다 쪽 얕은 물. 각 변의 끝이 이어진다.
      for (let side = 0; side < 4; side++) if (variant & (1 << side)) {
        c.save(); c.translate(50, 50); c.rotate(side * Math.PI / 2); c.translate(-50, -50);
        if (type === 8) {
          const g = c.createLinearGradient(0, 0, 0, 17); g.addColorStop(0, '#2a6470'); g.addColorStop(.3, '#5d827a'); g.addColorStop(.6, '#8b9874'); g.addColorStop(1, '#697d5600');
          c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.lineTo(100, 0); c.lineTo(100, 13); c.bezierCurveTo(70, 7, 28, 22, 0, 13); c.closePath(); c.fill();
          c.fillStyle = '#153e50'; c.beginPath(); c.moveTo(0, 0); c.lineTo(100, 0); c.lineTo(100, 4); c.bezierCurveTo(70, -1, 28, 13, 0, 4); c.closePath(); c.fill();
          c.strokeStyle = '#b3d6bb88'; c.lineWidth = .9; c.beginPath(); c.moveTo(0, 5); c.bezierCurveTo(28, 14, 70, 0, 100, 5); c.stroke();
          c.strokeStyle = '#bfdcc23b'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(0, 10); c.bezierCurveTo(28, 19, 70, 5, 100, 10); c.stroke();
        } else {
          const g = c.createLinearGradient(0, 0, 0, 38); g.addColorStop(0, '#43837a88'); g.addColorStop(.4, '#2e727466'); g.addColorStop(1, '#25536a00'); c.fillStyle = g; c.fillRect(0, 0, 100, 38);
          c.strokeStyle = '#70afa633'; c.lineWidth = .8; c.beginPath(); c.moveTo(0, 9); c.bezierCurveTo(32, 14, 63, 3, 100, 9); c.stroke();
        }
        c.restore();
      }
      c.restore(); ready.add(key); return;
    }
    c.fillStyle = colors[type]; c.fillRect(0, 0, 100, 100);
    const wash = c.createLinearGradient(0, 0, 100, 100); wash.addColorStop(0, '#b0ba8c12'); wash.addColorStop(.5, '#6d8d8510'); wash.addColorStop(1, '#00152416'); c.fillStyle = wash; c.fillRect(0, 0, 100, 100);
    for (let i = 0; i < 190; i++) {
      const x = r() * 100, y = r() * 100;
      c.fillStyle = i % 3 ? '#c4ca9d0d' : '#071b2522'; c.fillRect(x, y, .6 + r() * 2.2, .6 + r() * 1.2);
    }
    if (water(type)) {
      for (let k = 0; k < 11; k++) {
        const x = r() * 95, y = r() * 100, len = 5 + r() * 14;
        c.strokeStyle = k % 3 ? '#659eac20' : '#a3c3be30'; c.lineWidth = .5 + r() * .6; c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + len * .3, y - 2, x + len * .65, y + 2, x + len, y); c.stroke();
      }
    } else {
      for (let k = 0; k < 8; k++) {
        const x = r() * 100, y = r() * 100;
        ellipse(c, x, y, 5 + r() * 18, 2 + r() * 8, k % 2 ? '#7d885a10' : '#122d3020');
      }
    }
    if (type === WORLD.T.PLAIN) {
      c.strokeStyle = '#a0ad742c'; c.lineWidth = .65;
      for (let k = 0; k < 28; k++) { const x = r() * 100, y = r() * 100; c.beginPath(); c.moveTo(x - 2, y - 2); c.lineTo(x, y); c.lineTo(x + 1, y - 4); c.stroke(); }
      for (let k = 0; k < 5; k++) rock(c, 8 + r() * 84, 10 + r() * 80, .3 + r() * .5);
      const n = 3 + variant % 5;
      for (let k = 0; k < n; k++) tree(c, 8 + r() * 84, 25 + r() * 64, .35 + r() * .35, '#456249');
    }
    if (type === WORLD.T.MOUNTAIN || type === WORLD.T.NORTH) {
      const frozen = type === WORLD.T.NORTH;
      for (let k = 0; k < 2; k++) {
        const x = 23 + k * 35 + r() * 16, y = 58 + r() * 32, height = 32 + r() * 31, w = 27 + r() * 13;
        ellipse(c, x + 10, y + 6, w * .9, 8, '#0c222b66');
        polygon(c, [[x - w, y], [x - w * .4, y - height * .45], [x - 2, y - height], [x + 6, y - height * .85], [x + w, y]], frozen ? '#4c5661' : '#687c70');
        polygon(c, [[x - 2, y - height], [x + 6, y - height * .85], [x + w, y], [x + 4, y - height * .15], [x - 5, y - height * .5]], frozen ? '#303e4b' : '#3e5550');
        polygon(c, [[x - 2, y - height], [x - 12, y - height * .68], [x - 5, y - height * .72], [x, y - height * .58], [x + 3, y - height * .73], [x + 10, y - height * .58], [x + 6, y - height * .85]], frozen ? '#8b9b9d' : variant % 3 === 0 ? '#b2c0a3' : '#829281');
        c.strokeStyle = '#ccceac55'; c.lineWidth = .7; c.beginPath(); c.moveTo(x - 2, y - height); c.lineTo(x - 8, y - height * .48); c.lineTo(x - 18, y - 5); c.stroke();
        for (let j = 0; j < 7; j++) {
          const ridge = .25 + j * .085;
          c.strokeStyle = j % 2 ? '#b1b79a33' : '#213a3b55'; c.lineWidth = .6;
          c.beginPath(); c.moveTo(x - w * ridge, y - height * (1 - ridge));
          c.lineTo(x - w * ridge * .52, y - height * (1 - ridge) + 3);
          c.lineTo(x + 3, y - height * (1 - ridge) + 1); c.stroke();
        }
        for (let j = 0; j < 4; j++) rock(c, x - w + r() * w * 2, y + r() * 5, .3);
      }
      if (!frozen) for (let k = 0; k < 6; k++) tree(c, 9 + r() * 84, 72 + r() * 20, .4 + r() * .2, '#44654e');
      else {
        c.fillStyle = '#301f2b33'; c.fillRect(0, 0, 100, 100);
        c.strokeStyle = '#b7727744'; c.lineWidth = 1; c.setLineDash([2, 4]); c.beginPath(); c.moveTo(0, 83); c.lineTo(100, 83); c.stroke(); c.setLineDash([]);
        c.strokeStyle = '#c7787022'; c.lineWidth = 1; c.beginPath();
        for (let k = -100; k < 100; k += 14) { c.moveTo(k, 100); c.lineTo(k + 100, 0); } c.stroke();
      }
    }
    if (type === WORLD.T.RUIN || type === WORLD.T.CITY) {
      const ruined = type === WORLD.T.RUIN;
      c.strokeStyle = '#1c3036'; c.lineWidth = 10; c.beginPath(); c.moveTo(0, 48); c.lineTo(100, 48); c.moveTo(51, 0); c.lineTo(51, 100); c.stroke();
      c.strokeStyle = '#8a9b8244'; c.lineWidth = .8; c.beginPath(); c.moveTo(0, 42); c.lineTo(100, 42); c.moveTo(45, 0); c.lineTo(45, 100); c.stroke();
      c.strokeStyle = '#b4af6c44'; c.setLineDash([2, 5]); c.beginPath(); c.moveTo(0, 48); c.lineTo(100, 48); c.stroke(); c.setLineDash([]);
      [[12, 24], [63, 27], [12, 75], [66, 79]].forEach(([x, y]) => building(c, x, y, 15 + r() * 12, 12 + r() * 14, 3 + r() * (ruined ? 6 : 14), ruined, r));
      if (ruined) for (let k = 0; k < 13; k++) rock(c, 7 + r() * 85, 8 + r() * 86, .22 + r() * .45);
      for (let k = 0; k < (ruined ? 6 : 2); k++) tree(c, 7 + r() * 87, 16 + r() * 75, .3 + r() * .25, ruined ? '#5b7052' : '#496d57');
    }
    if (type === WORLD.T.ETHER) {
      const g = c.createRadialGradient(48, 53, 2, 48, 53, 48); g.addColorStop(0, '#ac8add77'); g.addColorStop(.5, '#6f65a33b'); g.addColorStop(1, '#24353c00'); c.fillStyle = g; c.fillRect(0, 0, 100, 100);
      c.strokeStyle = '#b899d955'; c.lineWidth = .8;
      for (let k = 0; k < 5; k++) { const x = 15 + r() * 70, y = 25 + r() * 58; c.beginPath(); c.moveTo(x - 10, y + 7); c.lineTo(x, y); c.lineTo(x + 4, y - 13); c.stroke(); }
      for (let k = 0; k < 6; k++) {
        const x = 14 + r() * 70, y = 34 + r() * 50, h = 9 + r() * 24, w = 3 + r() * 5;
        ellipse(c, x + 3, y + 3, w * 1.8, w * .55, '#101e3355');
        polygon(c, [[x - w, y - h * .45], [x, y - h], [x + w, y - h * .4], [x + w * .7, y], [x - w * .5, y + 2]], '#9b9bd2');
        polygon(c, [[x, y - h], [x + w, y - h * .4], [x + w * .7, y], [x, y - 2]], '#5f6caf');
        c.strokeStyle = '#ddd2edaa'; c.lineWidth = .8; c.beginPath(); c.moveTo(x - w, y - h * .45); c.lineTo(x, y - h); c.lineTo(x, y - 2); c.stroke();
      }
    }
    c.restore(); ready.add(key);
  };
  const sprite = (c, type, variant, px, py, s) => { make(type, variant); c.drawImage(atlas, variant * SIZE, type * SIZE, SIZE, SIZE, px, py, s + .3, s + .3); };
  const maskAt = (x, y, isWater) => [[0, -1], [1, 0], [0, 1], [-1, 0]].reduce((mask, [dx, dy], k) => {
    if (!WORLD.inb(x + dx, y + dy)) return mask;
    return water(WORLD.type(x + dx, y + dy)) !== isWater ? mask | (1 << k) : mask;
  }, 0);
  return {
    colors, ready,
    draw(c, type, px, py, s, x, y, frame) {
      if (type < 0 || type > 7) return false;
      const variant = Math.floor(WORLD.h2(x, y, 73) * VARIANTS), wet = water(type);
      sprite(c, type, variant, px, py, s);
      const coast = maskAt(x, y, wet);
      if (coast) sprite(c, wet ? 9 : 8, coast, px, py, s);
      if ((type === WORLD.T.SEA || type === WORLD.T.ETHER) && s >= 30) {
        const phase = FX.reduced ? .5 : (Math.sin(frame / 42 + variant) + 1) / 2;
        c.fillStyle = type === WORLD.T.SEA ? `rgba(151,207,207,${.07 + phase * .1})` : `rgba(221,195,255,${.15 + phase * .3})`;
        const sx = px + s * (.2 + variant / 27), sy = py + s * (.3 + variant % 5 / 10);
        c.fillRect(sx, sy, type === WORLD.T.SEA ? s * .12 : 1.4, .8);
      }
      if (type === WORLD.T.BRIDGE) {
        c.save(); c.strokeStyle = '#82c8c688'; c.lineWidth = Math.max(1, s * .026); c.setLineDash([s * .1, s * .12]);
        c.lineDashOffset = FX.reduced ? 0 : -frame / 5;
        c.beginPath(); c.moveTo(px + s * .5, py); c.lineTo(px + s * .5, py + s); c.stroke(); c.restore();
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
