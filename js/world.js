// ===== 게이트 크로니클: 월드맵 (타일 생성, 길찾기, 안개) =====

const WORLD = (() => {
  // 지도 크기: 처음(36×58) → v2(80×130, 약 5배) → v3(179×291, 다시 약 5배 넓이). K = 처음 대비 한 변 배율
  const OLD_COLS = 36, OLD_ROWS = 58;
  const PREV_COLS = 80, PREV_ROWS = 130;
  const COLS = 179, ROWS = 291;
  const K = COLS / OLD_COLS;
  const LON0 = 125.6, LAT0 = 38.8, DLON = 0.12 / K, DLAT = 0.1 * OLD_ROWS / ROWS;
  // FOREST·FIELD·WASTE 는 지형 다양용. 이동·통과 규칙은 황무지와 같거나 살짝만 다르다.
  const T = { SEA: 0, PLAIN: 1, MOUNTAIN: 2, RUIN: 3, ETHER: 4, CITY: 5, BRIDGE: 6, NORTH: 7, FOREST: 8, FIELD: 9, WASTE: 10 };
  const T_NAME = ['바다', '황무지', '산악 지대', '폐허', '에테르 농축 지대', '도시', '해상 연결로', '북부 봉쇄 구역', '잔존 숲', '들판', '오염 지대'];
  const T_COST = [0, 1, 2, 1, 1, 1, 1, 0, 1.2, 1, 1.1];
  const DAYS_PER_COST = 1; // 평지 1일, 산 2일, 국도 0.5일 (넓어진 거리는 이동력·시야로 맞춤)
  const ROAD_COST = 0.5;

  const REGION_LL = {
    incheon: [126.62, 37.46], gangnam: [127.05, 37.48], gangbuk: [127.02, 37.68], gangneung: [128.88, 37.75],
    suwon: [127.02, 37.26], daejeon: [127.38, 36.35], daegu: [128.6, 35.87], ulsan: [129.25, 35.54],
    gwangju: [126.85, 35.16], jeonju: [127.15, 35.82], busan: [129.02, 35.18], jeju: [126.53, 33.38],
  };
  // 광역 거점(REGIONS 12곳) 말고도 중도시·읍이 있다. tier 2 = 중도시, 3 = 읍·마을. 가장 가까운 지역에 속한다.
  const TOWN_LL = [
    ['chuncheon', '춘천', 2, 127.73, 37.88], ['wonju', '원주', 2, 127.95, 37.34], ['cheongju', '청주', 2, 127.49, 36.64], ['cheonan', '천안', 2, 127.15, 36.81],
    ['chungju', '충주', 2, 127.93, 36.99], ['pohang', '포항', 2, 129.34, 36.02], ['gyeongju', '경주', 2, 129.21, 35.84], ['andong', '안동', 2, 128.73, 36.57],
    ['changwon', '창원', 2, 128.68, 35.23], ['jinju', '진주', 2, 128.08, 35.18], ['mokpo', '목포', 2, 126.42, 34.81], ['suncheon', '순천', 2, 127.49, 34.95],
    ['yeosu', '여수', 2, 127.66, 34.78], ['gunsan', '군산', 2, 126.74, 35.97],
    ['cheorwon', '철원', 3, 127.31, 38.15], ['hongcheon', '홍천', 3, 127.89, 37.69], ['sokcho', '속초', 3, 128.55, 38.2], ['yeongwol', '영월', 3, 128.46, 37.18],
    ['taebaek', '태백', 3, 128.99, 37.16], ['uljin', '울진', 3, 129.36, 36.99], ['yeongju', '영주', 3, 128.62, 36.81], ['sangju', '상주', 3, 128.16, 36.41],
    ['geochang', '거창', 3, 127.91, 35.69], ['namwon', '남원', 3, 127.39, 35.41], ['haenam', '해남', 3, 126.6, 34.6], ['boryeong', '보령', 3, 126.61, 36.33],
    ['tongyeong', '통영', 3, 128.43, 34.88], ['seogwipo', '서귀포', 3, 126.56, 33.27],
  ];
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
  const townOf = new Int8Array(COLS * ROWS).fill(-1);
  const road = new Uint8Array(COLS * ROWS);
  const towns = [];
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
    const KY = ROWS / OLD_ROWS;
    const eastX = [];
    for (let y = 0; y < ROWS; y++) { let m = -1; for (let x = 0; x < COLS; x++) if (tiles[idx(x, y)] === T.PLAIN && y < 48 * KY) m = x; eastX[y] = m; }
    const segDist = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay; const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy))); return Math.hypot(px - ax - t * dx, py - ay - t * dy); };
    const [hx, hy] = toTile(126.53, 33.36);
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const i = idx(x, y); if (tiles[i] !== T.PLAIN) continue;
      const n1 = noise(x * 0.42 / K * 1.35, y * 0.42 / KY * 1.35, 1), n2 = noise(x * 0.3 / K * 1.35, y * 0.3 / KY * 1.35, 2);
      const n3 = noise(x * 0.55 / K, y * 0.55 / KY, 5), n4 = noise(x * 0.38 / K, y * 0.38 / KY, 6);
      const e = eastX[y] - x;
      let mount = false;
      if (y < 32 * KY && e >= 1 * K && e <= 6 * K && n1 > 0.36) mount = true;                 // 태백산맥
      if (segDist(x, y, 23 * K, 21 * KY, 13 * K, 33 * KY) < 1.7 * K && n1 > 0.4) mount = true; // 소백산맥
      if (Math.hypot(x - 15 * K, y - 33 * KY) < 2.2 * K && n1 > 0.3) mount = true;             // 지리산
      if (Math.hypot(x - hx, y - hy) < 1.3 * K && n1 > 0.25) mount = true;                     // 한라산
      if (!mount && n1 > 0.72 && noise(x * 0.5, y * 0.5, 4) > 0.55) mount = true;              // 곳곳의 낮은 산
      if (mount) tiles[i] = T.MOUNTAIN;
      else if (n2 > 0.76) tiles[i] = T.ETHER;
      else if (n1 > 0.8) tiles[i] = T.RUIN;
      else if (n3 > 0.55 && n1 < 0.62) tiles[i] = T.FOREST;                                   // 잔존 숲
      else if (n4 > 0.62 && n2 < 0.6) tiles[i] = T.FIELD;                                     // 들판·교외
      else if (n2 > 0.64 && n3 < 0.48) tiles[i] = T.WASTE;                                    // 오염 지대
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
      // 광역 거점: 지도 배율에 맞춰 도시 칸을 키운다 (큰 도시·일반)
      const big = ['gangnam', 'busan', 'daegu'].includes(r.id);
      const R = big ? Math.max(2, Math.round(K * 0.9)) : Math.max(1, Math.round(K * 0.45));
      for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
        if (Math.hypot(dx, dy) > R + 0.2) continue;
        const x = cx + dx, y = cy + dy, i = idx(x, y);
        if (!inb(x, y) || tiles[i] === T.SEA || tiles[i] === T.NORTH || cityOf[i] >= 0) continue;
        tiles[i] = T.CITY; cityOf[i] = ri;
      }
      // 도시 주변 폐허 (근교)
      const RR = Math.round(4 * K);
      for (let dy = -RR; dy <= RR; dy++) for (let dx = -RR; dx <= RR; dx++) {
        const x = cx + dx, y = cy + dy, i = idx(x, y), d = Math.hypot(dx, dy);
        if (inb(x, y) && (tiles[i] === T.PLAIN || tiles[i] === T.FIELD || tiles[i] === T.FOREST) && d >= R + 1.5 && d <= RR && noise(x * 0.9, y * 0.9, 3) > 0.62) tiles[i] = T.RUIN;
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
      if (REGIONS[best].id === 'gangbuk' && (t === T.PLAIN || t === T.FIELD) && h2(x, y, 9) < 0.6) tiles[i] = T.RUIN;
    }
    // 제주 해상 연결로
    let [ax, ay] = toTile(126.4, 34.62); const [bx, by] = toTile(126.5, 33.52);
    while (tiles[idx(ax, ay)] === T.SEA) ay--;
    const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
    for (let s = 0; s <= steps; s++) {
      const x = Math.round(ax + ((bx - ax) * s) / steps), y = Math.round(ay + ((by - ay) * s) / steps), i = idx(x, y);
      if (tiles[i] === T.SEA) { tiles[i] = T.BRIDGE; region[i] = jejuIdx; }
      // 대각선으로 꺾이는 곳은 옆 칸도 이어 준다 (대각선 이동은 옆 칸이 열려 있어야 한다)
      if (s > 0) { const px = Math.round(ax + ((bx - ax) * (s - 1)) / steps); if (px !== x && tiles[idx(px, y)] === T.SEA) { tiles[idx(px, y)] = T.BRIDGE; region[idx(px, y)] = jejuIdx; } }
    }
    // 섬에 닿을 때까지 잇는다
    for (let y = by + 1, n = 0; n < Math.round(4 * K) && inb(bx, y) && tiles[idx(bx, y)] === T.SEA; y++, n++) { tiles[idx(bx, y)] = T.BRIDGE; region[idx(bx, y)] = jejuIdx; }
    // 중도시·읍 배치 (지역이 정해진 뒤: 가장 가까운 광역 거점의 지역에 속한다)
    for (const [id, name, tier, lon, lat] of TOWN_LL) {
      let [cx, cy] = toTile(lon, lat);
      const okTile = (x, y) => inb(x, y) && region[idx(x, y)] >= 0 && tiles[idx(x, y)] !== T.SEA && tiles[idx(x, y)] !== T.NORTH && tiles[idx(x, y)] !== T.BRIDGE && cityOf[idx(x, y)] < 0;
      if (!okTile(cx, cy)) {
        let best = null;
        for (let d = 1; d < Math.round(7 * K / 2.2) && !best; d++) for (let dy = -d; dy <= d && !best; dy++) for (let dx = -d; dx <= d && !best; dx++) if (okTile(cx + dx, cy + dy)) best = [cx + dx, cy + dy];
        if (!best) continue;
        [cx, cy] = best;
      }
      const ti = towns.length; const ri = region[idx(cx, cy)];
      const tR = tier === 2 ? Math.max(1, Math.round(K * 0.4)) : Math.max(1, Math.round(K * 0.22));
      const cells = [[0, 0]];
      for (let dy = -tR; dy <= tR; dy++) for (let dx = -tR; dx <= tR; dx++) {
        if (!dx && !dy) continue;
        if (tier === 2 ? Math.abs(dx) + Math.abs(dy) > tR + 1 : Math.abs(dx) + Math.abs(dy) > tR) continue;
        cells.push([dx, dy]);
      }
      for (const [dx, dy] of cells) {
        const x = cx + dx, y = cy + dy; if (!okTile(x, y)) continue;
        const i = idx(x, y); tiles[i] = T.CITY; cityOf[i] = ri; townOf[i] = ti; region[i] = ri;
      }
      towns.push({ id, name, tier, x: cx, y: cy, region: REGIONS[ri].id });
    }
    // 국도: 도시·읍을 가까운 것끼리 잇는다 (산은 돌아가고, 다리·바다는 건너지 않는다)
    (function buildRoads() {
      const nodes = [...REGIONS.map((r) => ({ id: r.id, x: cityPos[r.id][0], y: cityPos[r.id][1], jeju: r.id === 'jeju' })), ...towns.map((t) => ({ id: t.id, x: t.x, y: t.y, jeju: t.region === 'jeju' }))];
      const stepCost = (i) => { const t = tiles[i]; return t === T.SEA || t === T.NORTH || t === T.BRIDGE ? Infinity : road[i] ? 0.6 : t === T.MOUNTAIN ? 4 : t === T.ETHER ? 1.6 : t === T.FOREST ? 1.3 : t === T.WASTE ? 1.2 : 1; };
      const link = (a, b) => {
        // A* (맨해튼 대신 체비쇼프 거리)
        const start = idx(a.x, a.y), goal = idx(b.x, b.y);
        const g = new Map([[start, 0]]), prev = new Map(); const open = [[0, start]];
        const h = (i) => Math.max(Math.abs((i % COLS) - b.x), Math.abs(((i / COLS) | 0) - b.y));
        let found = false;
        while (open.length) {
          let bi = 0; for (let k = 1; k < open.length; k++) if (open[k][0] < open[bi][0]) bi = k;
          const [, cur] = open.splice(bi, 1)[0];
          if (cur === goal) { found = true; break; }
          const x = cur % COLS, y = (cur / COLS) | 0;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (!inb(nx, ny)) continue;
            const j = idx(nx, ny); const c = stepCost(j); if (c === Infinity) continue;
            const nd = g.get(cur) + c * (dx && dy ? 1.4 : 1);
            if (!g.has(j) || nd < g.get(j)) { g.set(j, nd); prev.set(j, cur); open.push([nd + h(j), j]); }
          }
        }
        if (!found) return;
        let c = goal; while (c !== start) { road[c] = 1; c = prev.get(c); } road[start] = 1;
      };
      const d2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
      const done = new Set();
      for (const a of nodes) {
        const near = nodes.filter((b) => b !== a && b.jeju === a.jeju).sort((p, q) => d2(a, p) - d2(a, q)).slice(0, 2);
        for (const b of near) { const key = [a.id, b.id].sort().join('>'); if (done.has(key)) continue; done.add(key); link(a, b); }
      }
      // 끊긴 권역이 없게: 광역 거점을 남북·동서 축으로 한 번 더 잇는다
      const chain = ['gangbuk', 'gangnam', 'suwon', 'daejeon', 'jeonju', 'gwangju'].concat(['daejeon', 'daegu', 'busan', 'ulsan'], ['gangnam', 'gangneung'], ['incheon', 'gangnam'], ['daegu', 'ulsan'], ['gwangju', 'busan']);
      const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
      for (const pair of [['gangbuk', 'gangnam'], ['gangnam', 'suwon'], ['suwon', 'daejeon'], ['daejeon', 'jeonju'], ['jeonju', 'gwangju'], ['daejeon', 'daegu'], ['daegu', 'busan'], ['busan', 'ulsan'], ['gangnam', 'gangneung'], ['incheon', 'gangnam'], ['gwangju', 'busan']]) {
        const key = pair.slice().sort().join('>'); if (done.has(key) || !chain.length) continue; done.add(key); link(byId[pair[0]], byId[pair[1]]);
      }
      for (let i = 0; i < road.length; i++) if (tiles[i] === T.CITY) road[i] = 0; // 도시 칸은 그냥 도시
    })();
    // 지역별 출현 가능 타일
    for (let i = 0; i < tiles.length; i++) {
      if (road[i]) continue; // 길 위에는 게이트·괴수가 생기지 않는다
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

  // 칸 하나를 지나는 비용 (국도 위는 싸다. 계절·탈것은 T_COST 를 바꾼다)
  const stepCost = (i) => { const c = T_COST[tiles[i]]; return road[i] && c > 0 ? Math.min(c, ROAD_COST) : c; };
  // 이동력 안에서 갈 수 있는 타일 (다익스트라, 8방향, 이진 힙)
  function reach(sx, sy, mp, canJeju) {
    const start = idx(sx, sy);
    const dist = new Map([[start, 0]]);
    const prev = new Map();
    const hd = [0], hi = [start]; // 힙: 거리, 칸
    const push = (d, i) => { let k = hd.length; hd.push(d); hi.push(i); while (k > 0) { const p = (k - 1) >> 1; if (hd[p] <= d) break; hd[k] = hd[p]; hi[k] = hi[p]; k = p; } hd[k] = d; hi[k] = i; };
    const pop = () => {
      const d0 = hd[0], i0 = hi[0]; const d = hd.pop(), i = hi.pop(); const n = hd.length;
      if (n) { let k = 0; for (;;) { let c = 2 * k + 1; if (c >= n) break; if (c + 1 < n && hd[c + 1] < hd[c]) c++; if (hd[c] >= d) break; hd[k] = hd[c]; hi[k] = hi[c]; k = c; } hd[k] = d; hi[k] = i; }
      return [d0, i0];
    };
    while (hd.length) {
      const [d, i] = pop();
      if (d > dist.get(i)) continue;
      const x = i % COLS, y = (i / COLS) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy; if (!inb(nx, ny)) continue;
        const j = idx(nx, ny); if (!passable(j, canJeju)) continue;
        if (dx && dy && !passable(idx(x + dx, y), canJeju) && !passable(idx(x, y + dy), canJeju)) continue;
        const nd = d + stepCost(j) * (dx && dy ? 1.4 : 1);
        if (nd > mp + 1e-9) continue;
        if (!dist.has(j) || nd < dist.get(j)) { dist.set(j, nd); prev.set(j, i); push(nd, j); }
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
    COLS, ROWS, OLD_COLS, OLD_ROWS, PREV_COLS, PREV_ROWS, K, T, T_NAME, T_COST, DAYS_PER_COST, ROAD_COST, tiles, region, cityOf, townOf, towns, road, cityPos, regionTiles,
    idx, inb, h2, noise, passable, reach, pathTo, stepCost,
    stepCostAt: (x, y) => stepCost(idx(x, y)),
    townAt: (x, y) => { const t = townOf[idx(x, y)]; return t >= 0 ? towns[t] : null; },
    isRoad: (x, y) => road[idx(x, y)] === 1,
    // 옛 지도(36×58) · 직전 지도(80×130) 좌표 → 현재 지도 좌표 (저장 호환)
    fromOld: (x, y) => [Math.min(COLS - 1, Math.round((x + 0.5) * K - 0.5)), Math.min(ROWS - 1, Math.round((y + 0.5) * ROWS / OLD_ROWS - 0.5))],
    fromPrev: (x, y) => [Math.min(COLS - 1, Math.round((x + 0.5) * COLS / PREV_COLS - 0.5)), Math.min(ROWS - 1, Math.round((y + 0.5) * ROWS / PREV_ROWS - 0.5))],
    type: (x, y) => tiles[idx(x, y)],
    regionAt: (x, y) => { const r = region[idx(x, y)]; return r >= 0 ? REGIONS[r] : null; },
    cityAt: (x, y) => { const c = cityOf[idx(x, y)]; return c >= 0 ? REGIONS[c] : null; },
    xy: (i) => [i % COLS, (i / COLS) | 0],
    daysFor: (cost) => Math.max(1, Math.round(cost * DAYS_PER_COST)),
  };
})();
