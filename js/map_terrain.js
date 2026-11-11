// 지형 그림만 교체한다. 이동 비용·칸 좌표·안개·탐사 표식은 기존 지도에서 그린다.
// 한국 웹툰/헌터물 일러스트 톤: 셀 셰이딩, 잉크 외곽선, 또렷한 실루엣. 게임 초상·컷신과 맞춘 팔레트.
// 80화소 × 16변형 × (지형 11 + 해안 2)행. 화면을 옮기거나 확대해도 다시 만들지 않는다.
const MapTerrain = (() => {
  const SIZE = 80, VARIANTS = 16, TYPE_COUNT = 11, COAST_LAND = 11, COAST_SEA = 12, ROWS = 13;
  let atlas = null;
  const ready = new Set();
  // 초상·컷신과 맞춘 기본 바탕 (어두운 청회 + 따뜻한 대지)
  const colors = ['#0a1622', '#2a3a32', '#3a4548', '#2f3838', '#2a3148', '#243440', '#0a1622', '#1a1e28', '#24382e', '#3a4530', '#2a2830'];
  const ink = '#0c1218';
  const water = (t) => t === WORLD.T.SEA || t === WORLD.T.BRIDGE;
  const polygon = (c, points, color) => {
    c.fillStyle = color; c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill();
  };
  const strokePoly = (c, points, color, w = 1) => {
    c.strokeStyle = color; c.lineWidth = w; c.lineJoin = 'round'; c.beginPath();
    points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.stroke();
  };
  const ellipse = (c, x, y, rx, ry, color) => { c.fillStyle = color; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); };
  // 웹툰식 나무: 뚜렷한 줄기 + 덩어리진 수관 + 하이라이트 면
  const tree = (c, x, y, scale, crown, crownHi) => {
    c.save(); c.translate(x, y); c.scale(scale, scale);
    ellipse(c, 3, 4, 8, 3.2, '#050a1066');
    c.fillStyle = '#3a2e22'; c.fillRect(-1.2, -4, 2.4, 8);
    c.fillStyle = '#5a4a36'; c.fillRect(-0.4, -3, 1.1, 6);
    polygon(c, [[-9, 1], [-6, -5], [-7, -6], [0, -20], [7, -6], [6, -5], [9, 1]], crown);
    polygon(c, [[-9, 1], [-6, -5], [-7, -6], [0, -20], [-2, -6], [1, 1]], crownHi);
    c.strokeStyle = '#c8d6a844'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(-5, -4); c.lineTo(0, -16); c.stroke();
    strokePoly(c, [[-9, 1], [-6, -5], [0, -20], [6, -5], [9, 1]], ink + '55', 0.55);
    c.restore();
  };
  const rock = (c, x, y, scale, cold) => {
    ellipse(c, x + scale * 2, y + scale, scale * 6, scale * 2.4, '#050a1066');
    const base = cold ? '#5a6570' : '#6a7870', hi = cold ? '#8a96a0' : '#8fa090';
    polygon(c, [[x - scale * 5, y], [x - scale * 3, y - scale * 4], [x + scale, y - scale * 5.2], [x + scale * 5, y - scale], [x + scale * 3, y + scale]], base);
    polygon(c, [[x - scale * 5, y], [x - scale * 3, y - scale * 4], [x + scale, y - scale * 5.2], [x, y - scale]], hi);
    strokePoly(c, [[x - scale * 5, y], [x - scale * 3, y - scale * 4], [x + scale, y - scale * 5.2], [x + scale * 5, y - scale], [x + scale * 3, y + scale]], '#d0d8c855', 0.6);
  };
  // 웹툰식 건물: 면 분할 + 창 점광 + 지붕 실루엣
  const building = (c, x, y, w, h, elevation, ruined, r) => {
    polygon(c, [[x + w, y], [x + w + elevation * 0.85, y + elevation * 0.55], [x + w + elevation * 0.85, y + h + elevation * 0.55], [x, y + h]], '#050a1088');
    c.fillStyle = ruined ? '#2e383c' : '#1c2c36'; c.fillRect(x, y, w, h);
    c.fillStyle = ruined ? '#4a5858' : '#3a5560'; c.fillRect(x, y - elevation, w, h);
    c.fillStyle = ruined ? '#3a4848' : '#2e4450'; c.fillRect(x + w - 3, y - elevation + h, 3, elevation);
    c.strokeStyle = '#a8b8a866'; c.lineWidth = 0.7; c.strokeRect(x + 0.5, y - elevation + 0.5, w - 1, h - 1);
    // 지붕
    polygon(c, [[x - 1, y - elevation], [x + w * 0.5, y - elevation - 4 - r() * 3], [x + w + 1, y - elevation]], ruined ? '#3a4448' : '#1a2830');
    c.fillStyle = '#152028'; c.fillRect(x + 3, y - elevation + 3, Math.max(2, w - 7), Math.max(2, h - 7));
    c.fillStyle = ruined ? '#e0a86a88' : '#7ee8d0cc';
    for (let k = 3; k < w - 2; k += 5) if (r() > 0.28) c.fillRect(x + k, y + h - 3, 2.2, 1.8);
    if (ruined) {
      polygon(c, [[x + w * 0.4, y - elevation], [x + w * 0.55, y - elevation + h * 0.65], [x + w * 0.78, y - elevation + h * 0.35], [x + w, y - elevation]], '#0e1a20');
      c.strokeStyle = '#152028'; c.beginPath(); c.moveTo(x + 2, y - elevation); c.lineTo(x + w * 0.28, y - elevation + h * 0.55); c.stroke();
    } else {
      c.fillStyle = '#b8e8dcaa'; c.fillRect(x + 3, y - elevation + 3, 3.2, 3.2);
      c.fillStyle = '#ffb54788'; if (r() > 0.5) c.fillRect(x + w - 8, y - elevation + h * 0.35, 2.5, 2.5);
    }
  };
  const grass = (c, x, y, tall) => {
    c.strokeStyle = tall ? '#8ab06a55' : '#a0b87844'; c.lineWidth = 0.7;
    c.beginPath(); c.moveTo(x - 2, y); c.lineTo(x, y - (tall ? 5 : 3.5)); c.lineTo(x + 1.5, y - 1); c.stroke();
  };
  const washBase = (c, type) => {
    c.fillStyle = colors[type] || colors[1]; c.fillRect(0, 0, 100, 100);
    const wash = c.createLinearGradient(0, 0, 100, 100);
    wash.addColorStop(0, '#d8c8a014'); wash.addColorStop(0.45, '#6a908818'); wash.addColorStop(1, '#040c1418');
    c.fillStyle = wash; c.fillRect(0, 0, 100, 100);
  };
  const grain = (c, r, n = 160) => {
    for (let i = 0; i < n; i++) {
      const x = r() * 100, y = r() * 100;
      c.fillStyle = i % 3 ? '#e8e0c00c' : '#050c1420'; c.fillRect(x, y, 0.5 + r() * 2, 0.5 + r() * 1.1);
    }
  };
  const make = (type, variant) => {
    if (!atlas) { atlas = document.createElement('canvas'); atlas.width = SIZE * VARIANTS; atlas.height = SIZE * ROWS; }
    const key = type * VARIANTS + variant;
    if (ready.has(key)) return;
    const c = atlas.getContext('2d');
    c.save(); c.translate(variant * SIZE, type * SIZE); c.beginPath(); c.rect(0, 0, SIZE, SIZE); c.clip(); c.scale(SIZE / 100, SIZE / 100);
    let seed = (variant + 1) * 997 + type * 7919;
    const r = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    // 해안 마스크 행
    if (type === COAST_LAND || type === COAST_SEA) {
      for (let side = 0; side < 4; side++) if (variant & (1 << side)) {
        c.save(); c.translate(50, 50); c.rotate(side * Math.PI / 2); c.translate(-50, -50);
        if (type === COAST_LAND) {
          const g = c.createLinearGradient(0, 0, 0, 18);
          g.addColorStop(0, '#1a4050'); g.addColorStop(0.25, '#3a6a70'); g.addColorStop(0.55, '#8a9870'); g.addColorStop(1, '#6a7d5600');
          c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.lineTo(100, 0); c.lineTo(100, 14); c.bezierCurveTo(72, 8, 28, 22, 0, 14); c.closePath(); c.fill();
          c.fillStyle = '#0e2a38'; c.beginPath(); c.moveTo(0, 0); c.lineTo(100, 0); c.lineTo(100, 4.5); c.bezierCurveTo(72, 0, 28, 12, 0, 4.5); c.closePath(); c.fill();
          c.strokeStyle = '#c8e8d088'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, 5.5); c.bezierCurveTo(28, 14, 72, 1, 100, 5.5); c.stroke();
          c.strokeStyle = '#d0ecd044'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, 11); c.bezierCurveTo(28, 19, 72, 6, 100, 11); c.stroke();
        } else {
          const g = c.createLinearGradient(0, 0, 0, 40); g.addColorStop(0, '#3a8a8088'); g.addColorStop(0.4, '#2a707466'); g.addColorStop(1, '#1a406000');
          c.fillStyle = g; c.fillRect(0, 0, 100, 40);
          c.strokeStyle = '#70c0b044'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(0, 10); c.bezierCurveTo(32, 15, 63, 4, 100, 10); c.stroke();
        }
        c.restore();
      }
      c.restore(); ready.add(key); return;
    }
    washBase(c, type);
    grain(c, r, water(type) ? 90 : 170);
    if (water(type)) {
      for (let k = 0; k < 14; k++) {
        const x = r() * 95, y = r() * 100, len = 6 + r() * 16;
        c.strokeStyle = k % 3 ? '#5ab0c028' : '#a0d0c838'; c.lineWidth = 0.55 + r() * 0.7;
        c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + len * 0.3, y - 2.5, x + len * 0.65, y + 2.5, x + len, y); c.stroke();
      }
      // 깊은 바다 톤
      const deep = c.createRadialGradient(50, 55, 8, 50, 55, 70);
      deep.addColorStop(0, '#0e304022'); deep.addColorStop(1, '#040c1800'); c.fillStyle = deep; c.fillRect(0, 0, 100, 100);
    } else {
      for (let k = 0; k < 7; k++) ellipse(c, r() * 100, r() * 100, 6 + r() * 16, 2.5 + r() * 7, k % 2 ? '#7a885a14' : '#0c1c2020');
    }
    if (type === WORLD.T.PLAIN) {
      for (let k = 0; k < 34; k++) grass(c, r() * 100, r() * 100, r() > 0.55);
      for (let k = 0; k < 4; k++) rock(c, 8 + r() * 84, 12 + r() * 78, 0.28 + r() * 0.45);
      const n = 2 + variant % 4;
      for (let k = 0; k < n; k++) tree(c, 8 + r() * 84, 28 + r() * 60, 0.32 + r() * 0.32, '#1e4034', '#3a6a4e');
    }
    if (type === WORLD.T.FIELD) {
      // 들판: 따뜻한 황록 + 밭고랑
      c.fillStyle = '#4a5a3822'; c.fillRect(0, 0, 100, 100);
      c.strokeStyle = '#c8b87833'; c.lineWidth = 1.1;
      for (let k = 0; k < 7; k++) {
        const y = 12 + k * 12 + (r() - 0.5) * 3;
        c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(30, y + 2, 70, y - 2, 100, y); c.stroke();
      }
      for (let k = 0; k < 18; k++) grass(c, r() * 100, r() * 100, true);
      if (variant % 3 === 0) for (let k = 0; k < 2; k++) tree(c, 10 + r() * 80, 40 + r() * 45, 0.28 + r() * 0.2, '#2a5038', '#4a7850');
      // 낮은 울타리
      c.strokeStyle = '#6a5a4088'; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(8, 70); c.lineTo(92, 72); c.stroke();
      for (let x = 12; x < 90; x += 14) { c.beginPath(); c.moveTo(x, 66); c.lineTo(x, 76); c.stroke(); }
    }
    if (type === WORLD.T.FOREST) {
      c.fillStyle = '#0e241c33'; c.fillRect(0, 0, 100, 100);
      const n = 7 + variant % 5;
      for (let k = 0; k < n; k++) {
        const shade = k % 2 ? '#1a3a30' : '#243c34', hi = k % 2 ? '#3a6850' : '#4a7860';
        tree(c, 6 + r() * 88, 22 + r() * 70, 0.4 + r() * 0.45, shade, hi);
      }
      for (let k = 0; k < 5; k++) rock(c, 10 + r() * 80, 70 + r() * 25, 0.25 + r() * 0.3);
      // 숲 안개
      const mist = c.createLinearGradient(0, 40, 0, 100);
      mist.addColorStop(0, '#6a908800'); mist.addColorStop(1, '#6a908818'); c.fillStyle = mist; c.fillRect(0, 0, 100, 100);
    }
    if (type === WORLD.T.WASTE) {
      // 오염 지대: 보라-회빛 얼룩 + 갈라진 땅
      const g = c.createRadialGradient(48, 55, 4, 48, 55, 55);
      g.addColorStop(0, '#6a4a8855'); g.addColorStop(0.5, '#3a305522'); g.addColorStop(1, '#0000');
      c.fillStyle = g; c.fillRect(0, 0, 100, 100);
      c.strokeStyle = '#2a2038aa'; c.lineWidth = 1;
      for (let k = 0; k < 8; k++) {
        const x = r() * 100, y = r() * 100;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + 4 + r() * 10, y + 2 + r() * 8); c.lineTo(x + r() * 6, y + 8 + r() * 6); c.stroke();
      }
      for (let k = 0; k < 6; k++) {
        const x = 10 + r() * 80, y = 20 + r() * 65;
        ellipse(c, x, y, 3 + r() * 5, 2 + r() * 3, '#a070d044');
        c.strokeStyle = '#d8b0ff55'; c.lineWidth = 0.7; c.beginPath(); c.arc(x, y, 4 + r() * 4, 0, Math.PI * 2); c.stroke();
      }
      for (let k = 0; k < 3; k++) rock(c, 12 + r() * 76, 30 + r() * 55, 0.35 + r() * 0.4, true);
      if (variant % 4 === 0) tree(c, 20 + r() * 60, 50 + r() * 35, 0.3 + r() * 0.2, '#2a3030', '#4a5050');
    }
    if (type === WORLD.T.MOUNTAIN || type === WORLD.T.NORTH) {
      const frozen = type === WORLD.T.NORTH;
      for (let k = 0; k < 2; k++) {
        const x = 20 + k * 36 + r() * 14, y = 58 + r() * 30, height = 34 + r() * 30, w = 26 + r() * 14;
        ellipse(c, x + 8, y + 6, w * 0.85, 7, '#050a1066');
        polygon(c, [[x - w, y], [x - w * 0.4, y - height * 0.45], [x - 2, y - height], [x + 6, y - height * 0.85], [x + w, y]], frozen ? '#4a5560' : '#5a6e66');
        polygon(c, [[x - 2, y - height], [x + 6, y - height * 0.85], [x + w, y], [x + 4, y - height * 0.15], [x - 5, y - height * 0.5]], frozen ? '#2a3848' : '#3a5048');
        polygon(c, [[x - 2, y - height], [x - 12, y - height * 0.68], [x - 5, y - height * 0.72], [x, y - height * 0.58], [x + 3, y - height * 0.73], [x + 10, y - height * 0.58], [x + 6, y - height * 0.85]], frozen ? '#c8d4d8' : variant % 3 === 0 ? '#c8d4b8' : '#8a9a88');
        c.strokeStyle = '#e8ecd088'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x - 2, y - height); c.lineTo(x - 8, y - height * 0.48); c.lineTo(x - 18, y - 5); c.stroke();
        for (let j = 0; j < 6; j++) {
          const ridge = 0.22 + j * 0.09;
          c.strokeStyle = j % 2 ? '#d0d8b044' : '#1a303055'; c.lineWidth = 0.65;
          c.beginPath(); c.moveTo(x - w * ridge, y - height * (1 - ridge));
          c.lineTo(x - w * ridge * 0.5, y - height * (1 - ridge) + 3);
          c.lineTo(x + 3, y - height * (1 - ridge) + 1); c.stroke();
        }
        for (let j = 0; j < 3; j++) rock(c, x - w + r() * w * 2, y + r() * 5, 0.28, frozen);
      }
      if (!frozen) for (let k = 0; k < 5; k++) tree(c, 8 + r() * 84, 74 + r() * 18, 0.35 + r() * 0.22, '#1e4034', '#3a6450');
      else {
        c.fillStyle = '#30182833'; c.fillRect(0, 0, 100, 100);
        c.strokeStyle = '#c0707844'; c.lineWidth = 1.1; c.setLineDash([2.5, 4]); c.beginPath(); c.moveTo(0, 84); c.lineTo(100, 84); c.stroke(); c.setLineDash([]);
        c.strokeStyle = '#d0706822'; c.lineWidth = 1; c.beginPath();
        for (let k = -100; k < 100; k += 14) { c.moveTo(k, 100); c.lineTo(k + 100, 0); } c.stroke();
      }
    }
    if (type === WORLD.T.RUIN || type === WORLD.T.CITY) {
      const ruined = type === WORLD.T.RUIN;
      c.strokeStyle = '#0e1a20'; c.lineWidth = 9; c.beginPath(); c.moveTo(0, 50); c.lineTo(100, 50); c.moveTo(52, 0); c.lineTo(52, 100); c.stroke();
      c.strokeStyle = '#8a9a8244'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(0, 44); c.lineTo(100, 44); c.moveTo(46, 0); c.lineTo(46, 100); c.stroke();
      c.strokeStyle = '#c8b86a44'; c.setLineDash([2, 5]); c.beginPath(); c.moveTo(0, 50); c.lineTo(100, 50); c.stroke(); c.setLineDash([]);
      [[10, 22], [60, 24], [12, 72], [62, 76]].forEach(([x, y]) => building(c, x, y, 16 + r() * 14, 12 + r() * 16, 3 + r() * (ruined ? 6 : 14), ruined, r));
      if (ruined) for (let k = 0; k < 12; k++) rock(c, 6 + r() * 88, 8 + r() * 86, 0.2 + r() * 0.4);
      for (let k = 0; k < (ruined ? 5 : 2); k++) tree(c, 6 + r() * 88, 18 + r() * 70, 0.28 + r() * 0.22, ruined ? '#4a6050' : '#2a5040', ruined ? '#6a8068' : '#4a7860');
    }
    if (type === WORLD.T.ETHER) {
      const g = c.createRadialGradient(48, 52, 2, 48, 52, 50);
      g.addColorStop(0, '#c8a0ff66'); g.addColorStop(0.45, '#6a60a844'); g.addColorStop(1, '#1a243800');
      c.fillStyle = g; c.fillRect(0, 0, 100, 100);
      c.strokeStyle = '#d0b0ff66'; c.lineWidth = 0.85;
      for (let k = 0; k < 6; k++) { const x = 14 + r() * 70, y = 22 + r() * 58; c.beginPath(); c.moveTo(x - 10, y + 7); c.lineTo(x, y); c.lineTo(x + 4, y - 14); c.stroke(); }
      for (let k = 0; k < 7; k++) {
        const x = 12 + r() * 72, y = 32 + r() * 52, h = 10 + r() * 26, w = 3 + r() * 5.5;
        ellipse(c, x + 3, y + 3, w * 1.8, w * 0.55, '#0a122855');
        polygon(c, [[x - w, y - h * 0.45], [x, y - h], [x + w, y - h * 0.4], [x + w * 0.7, y], [x - w * 0.5, y + 2]], '#a8a0e8');
        polygon(c, [[x, y - h], [x + w, y - h * 0.4], [x + w * 0.7, y], [x, y - 2]], '#5a68c0');
        c.strokeStyle = '#f0e8ffcc'; c.lineWidth = 0.85; c.beginPath(); c.moveTo(x - w, y - h * 0.45); c.lineTo(x, y - h); c.lineTo(x, y - 2); c.stroke();
      }
    }
    if (type === WORLD.T.BRIDGE) {
      c.fillStyle = '#1a3a4444'; c.fillRect(38, 0, 24, 100);
      c.strokeStyle = '#7ee8d0aa'; c.lineWidth = 1.4; c.setLineDash([6, 5]);
      c.beginPath(); c.moveTo(50, 0); c.lineTo(50, 100); c.stroke(); c.setLineDash([]);
      for (let y = 10; y < 95; y += 18) {
        c.fillStyle = '#2a4850'; c.fillRect(42, y, 16, 4);
        c.fillStyle = '#8ad8c866'; c.fillRect(44, y + 1, 12, 1.5);
      }
    }
    c.restore(); ready.add(key);
  };
  const sprite = (c, type, variant, px, py, s) => { make(type, variant); c.drawImage(atlas, variant * SIZE, type * SIZE, SIZE, SIZE, px, py, s + 0.3, s + 0.3); };
  const maskAt = (x, y, isWater) => [[0, -1], [1, 0], [0, 1], [-1, 0]].reduce((mask, [dx, dy], k) => {
    if (!WORLD.inb(x + dx, y + dy)) return mask;
    return water(WORLD.type(x + dx, y + dy)) !== isWater ? mask | (1 << k) : mask;
  }, 0);
  return {
    colors, ready, TYPE_COUNT,
    draw(c, type, px, py, s, x, y, frame) {
      if (type < 0 || type >= TYPE_COUNT) return false;
      const variant = Math.floor(WORLD.h2(x, y, 73) * VARIANTS), wet = water(type);
      sprite(c, type, variant, px, py, s);
      const coast = maskAt(x, y, wet);
      if (coast) sprite(c, wet ? COAST_SEA : COAST_LAND, coast, px, py, s);
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
