// ===== 게이트 크로니클: 월드맵 (타일 생성, 길찾기, 안개) =====

const WORLD = (() => {
  const COLS = 36, ROWS = 58;
  const LON0 = 125.6, LAT0 = 38.8, DLON = 0.12, DLAT = 0.1;
  const T = { SEA: 0, PLAIN: 1, MOUNTAIN: 2, RUIN: 3, ETHER: 4, CITY: 5, BRIDGE: 6, NORTH: 7 };
  const T_NAME = ['바다', '황무지', '산악 지대', '폐허', '에테르 농축 지대', '도시', '해상 연결로', '북부 봉쇄 구역'];
  const T_COST = [0, 1, 2, 1, 1, 1, 1, 0];
  const DAYS_PER_COST = 2;

  const REGION_LL = {
    incheon: [126.62, 37.46], gangnam: [127.05, 37.48], gangbuk: [127.02, 37.68], gangneung: [128.88, 37.75],
    suwon: [127.02, 37.26], daejeon: [127.38, 36.35], daegu: [128.6, 35.87], ulsan: [129.25, 35.54],
    gwangju: [126.85, 35.16], jeonju: [127.15, 35.82], busan: [129.02, 35.18], jeju: [126.53, 33.38],
  };
  const LAND = [[126.1, 37.75], [126.38, 37.62], [126.62, 37.4], [126.85, 37.05], [126.4, 36.95], [126.15, 36.75], [126.55, 36.35], [126.62, 35.98], [126.45, 35.62], [126.38, 35.3], [126.25, 35.05], [126.35, 34.62], [126.65, 34.35], [127.05, 34.55], [127.35, 34.62], [127.62, 34.72], [127.85, 34.78], [128.1, 34.88], [128.42, 34.85], [128.68, 34.95], [129.0, 35.08], [129.2, 35.2], [129.38, 35.45], [129.45, 35.85], [129.55, 36.05], [129.42, 36.45], [129.38, 36.9], [129.22, 37.3], [128.95, 37.72], [128.62, 38.15], [128.38, 38.6], [128.1, 38.33], [127.6, 38.32], [127.1, 38.28], [126.68, 37.95]];
  const NORTH = [[126.1, 37.75], [125.5, 37.9], [125.5, 38.9], [128.2, 38.9], [128.38, 38.6], [128.1, 38.33], [127.6, 38.32], [127.1, 38.28], [126.68, 37.95]];

  const pip = (poly, x, y) => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
  const inJeju = (lon, lat) => ((lon - 126.55) / 0.42) ** 2 + ((lat - 33.38) / 0.17) ** 2 <= 1;
  const toTile = (lon, lat) => [Math.floor((lon - LON0) / DLON), Math.floor((LAT0 - lat) / DLAT)];
  const center = (x, y) => [LON0 + (x + 0.5) * DLON, LAT0 - (y + 0.5) * DLAT];
  const idx = (x, y) => y * COLS + x;
  const inb = (x, y) => x >= 0 && y >= 0 && x < COLS && y < ROWS;

  // 결정론적 값 노이즈
  const h2 = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const noise = (x, y, s) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const sm = (t) => t * t * (3 - 2 * t);
    const a = h2(xi, yi, s), b = h2(xi + 1, yi, s), c = h2(xi, yi + 1, s), d = h2(xi + 1, yi + 1, s);
    const u = sm(xf), v = sm(yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };

  const tiles = new Uint8Array(COLS * ROWS);
  const region = new Int8Array(COLS * ROWS).fill(-1);
  const cityOf = new Int8Array(COLS * ROWS).fill(-1);
  const cityPos = {};
  const regionTiles = {};

  (function generate() {
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const [lon, lat] = center(x, y);
      let t = T.SEA;
      if (inJeju(lon, lat) || pip(LAND, lon, lat)) t = T.PLAIN;
      else if (pip(NORTH, lon, lat)) t = T.NORTH;
      tiles[idx(x, y)] = t;
    }
    // 동쪽 해안선 (태백산맥 배치용)
    const eastX = [];
    for (let y = 0; y < ROWS; y++) { let m = -1; for (let x = 0; x < COLS; x++) if (tiles[idx(x, y)] === T.PLAIN && y < 48) m = x; eastX[y] = m; }
    const segDist = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay; const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy))); return Math.hypot(px - ax - t * dx, py - ay - t * dy); };
    const [hx, hy] = toTile(126.53, 33.36);
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const i = idx(x, y); if (tiles[i] !== T.PLAIN) continue;
      const n1 = noise(x * 0.42, y * 0.42, 1), n2 = noise(x * 0.3, y * 0.3, 2);
      const e = eastX[y] - x;
      let mount = false;
      if (y < 32 && e >= 1 && e <= 6 && n1 > 0.36) mount = true;
      if (segDist(x, y, 23, 21, 13, 33) < 1.7 && n1 > 0.4) mount = true;
      if (Math.hypot(x - 15, y - 33) < 2.2) mount = true;
      if (Math.hypot(x - hx, y - hy) < 1.3) mount = true;
      if (mount) tiles[i] = T.MOUNTAIN;
      else if (n2 > 0.76) tiles[i] = T.ETHER;
      else if (n1 > 0.8) tiles[i] = T.RUIN;
    }
    // 도시 배치
    REGIONS.forEach((r, ri) => {
      let [cx, cy] = toTile(...REGION_LL[r.id]);
      if (tiles[idx(cx, cy)] === T.SEA || tiles[idx(cx, cy)] === T.NORTH) {
        let best = null;
        for (let d = 1; d < 5 && !best; d++) for (let dy = -d; dy <= d; dy++) for (let dx = -d; dx <= d; dx++) {
          const t = tiles[idx(cx + dx, cy + dy)];
          if (!best && inb(cx + dx, cy + dy) && t !== T.SEA && t !== T.NORTH) best = [cx + dx, cy + dy];
        }
        [cx, cy] = best;
      }
      cityPos[r.id] = [cx, cy];
      const big = ['gangnam', 'busan', 'daegu'].includes(r.id);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!big && dx && dy) continue;
        const x = cx + dx, y = cy + dy, i = idx(x, y);
        if (!inb(x, y) || tiles[i] === T.SEA || tiles[i] === T.NORTH || cityOf[i] >= 0) continue;
        tiles[i] = T.CITY; cityOf[i] = ri;
      }
      // 도시 주변 폐허
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx, y = cy + dy, i = idx(x, y), d = Math.hypot(dx, dy);
        if (inb(x, y) && tiles[i] === T.PLAIN && d >= 2 && d <= 4 && noise(x * 0.9, y * 0.9, 3) > 0.55) tiles[i] = T.RUIN;
      }
    });
    // 지역 (가장 가까운 도시)
    const jejuIdx = REGIONS.findIndex((r) => r.id === 'jeju');
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const i = idx(x, y), t = tiles[i];
      if (t === T.SEA || t === T.NORTH) continue;
      const [lon, lat] = center(x, y);
      if (inJeju(lon, lat)) { region[i] = jejuIdx; continue; }
      let best = -1, bd = 1e9;
      REGIONS.forEach((r, ri) => { if (ri === jejuIdx) return; const [cx, cy] = cityPos[r.id]; const d = (cx - x) ** 2 + ((cy - y) * 1.1) ** 2; if (d < bd) { bd = d; best = ri; } });
      region[i] = best;
      if (REGIONS[best].id === 'gangbuk' && t === T.PLAIN && h2(x, y, 9) < 0.6) tiles[i] = T.RUIN;
    }
    // 제주 해상 연결로
    let [ax, ay] = toTile(126.4, 34.62); const [bx, by] = toTile(126.5, 33.52);
    while (tiles[idx(ax, ay)] === T.SEA) ay--;
    const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
    for (let s = 0; s <= steps; s++) {
      const x = Math.round(ax + ((bx - ax) * s) / steps), y = Math.round(ay + ((by - ay) * s) / steps), i = idx(x, y);
      if (tiles[i] === T.SEA) { tiles[i] = T.BRIDGE; region[i] = jejuIdx; }
    }
    // 지역별 출현 가능 타일
    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i];
      if (region[i] < 0 || t === T.CITY || t === T.BRIDGE || t === T.SEA || t === T.NORTH) continue;
      (regionTiles[REGIONS[region[i]].id] ||= []).push(i);
    }
  })();

  const passable = (i, canJeju) => {
    const t = tiles[i];
    if (t === T.SEA || t === T.NORTH) return false;
    if (!canJeju && REGIONS[region[i]] && REGIONS[region[i]].id === 'jeju') return false;
    return true;
  };

  // 이동력 안에서 갈 수 있는 타일 (다익스트라, 8방향)
  function reach(sx, sy, mp, canJeju) {
    const start = idx(sx, sy);
    const dist = new Map([[start, 0]]);
    const prev = new Map();
    const open = [[0, start]];
    while (open.length) {
      open.sort((a, b) => a[0] - b[0]);
      const [d, i] = open.shift();
      if (d > dist.get(i)) continue;
      const x = i % COLS, y = (i / COLS) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy; if (!inb(nx, ny)) continue;
        const j = idx(nx, ny); if (!passable(j, canJeju)) continue;
        if (dx && dy && !passable(idx(x + dx, y), canJeju) && !passable(idx(x, y + dy), canJeju)) continue;
        const nd = d + T_COST[tiles[j]] * (dx && dy ? 1.4 : 1);
        if (nd > mp + 1e-9) continue;
        if (!dist.has(j) || nd < dist.get(j)) { dist.set(j, nd); prev.set(j, i); open.push([nd, j]); }
      }
    }
    return { dist, prev, start };
  }
  function pathTo(r, target) {
    if (!r.dist.has(target)) return null;
    const path = [target];
    let c = target;
    while (c !== r.start) { c = r.prev.get(c); path.unshift(c); }
    return path;
  }

  return {
    COLS, ROWS, T, T_NAME, T_COST, DAYS_PER_COST, tiles, region, cityOf, cityPos, regionTiles,
    idx, inb, h2, noise, passable, reach, pathTo,
    type: (x, y) => tiles[idx(x, y)],
    regionAt: (x, y) => { const r = region[idx(x, y)]; return r >= 0 ? REGIONS[r] : null; },
    cityAt: (x, y) => { const c = cityOf[idx(x, y)]; return c >= 0 ? REGIONS[c] : null; },
    xy: (i) => [i % COLS, (i / COLS) | 0],
    daysFor: (cost) => Math.max(1, Math.round(cost * DAYS_PER_COST)),
  };
})();
