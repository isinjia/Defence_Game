// ===== 게이트 크로니클: 넓어진 한국 지도 연동 (사용자 요청, 영역 F) =====
// js/world.js 가 179×291칸(처음 대비 약 25배 넓이, v2 대비 약 5배)·도시 40곳·국도를 만든다. 여기서는 그에 맞춰
//  - 시야(안개 걷힘) 반경을 넓히고
//  - 지역 넓이에 맞게 게이트·괴수 무리를 더 띄우고
//  - 중도시·읍을 도시처럼 쓰게 하고(이름·시설 등급), 지도에 읍 이름표와 국도를 그리고
//  - 옛 지도(36×58 / 80×130) 저장의 위치를 새 지도 좌표로 옮긴다.
// 이동 비용: 평지 1일, 산 2일, 국도 0.5일(world.js), 이동력 ×K(travel.js), 걷기는 소수 일수를 모아 넘긴다(game.js walkStep).

const TOWN_TIER = { 2: { name: '중도시', facs: ['inn', 'market', 'board', 'tavern', 'workshop', 'transit', 'merc', 'garage'] }, 3: { name: '읍', facs: ['inn', 'market', 'board'] } };

Object.assign(Game.prototype, {
  townHere() { const p = this.player; return p ? WORLD.townAt(p.x, p.y) : null; },
  // 옛 저장(36×58 또는 80×130)의 위치를 현재 지도로
  migrateOldMap() {
    const p = this.player; const T = WORLD.T;
    const snap = (x, y) => {
      for (let d = 0; d < Math.round(12 * WORLD.K / 2.2); d++) for (let dy = -d; dy <= d; dy++) for (let dx = -d; dx <= d; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== d || !WORLD.inb(x + dx, y + dy)) continue;
        const i = WORLD.idx(x + dx, y + dy); if (WORLD.passable(i, true) && WORLD.tiles[i] !== T.BRIDGE) return [x + dx, y + dy];
      }
      return WORLD.cityPos[p.region] || WORLD.cityPos.gangnam;
    };
    const ver = (this.world && this.world.mapVer) || 1;
    const [nx, ny] = ver >= 2 ? WORLD.fromPrev(p.x, p.y) : WORLD.fromOld(p.x, p.y);
    const home = WORLD.cityPos[p.region];
    const wasCity = home && Math.max(Math.abs(nx - home[0]), Math.abs(ny - home[1])) <= Math.ceil(WORLD.K * 1.5);
    [p.x, p.y] = wasCity ? home : snap(nx, ny);
    const reg = WORLD.regionAt(p.x, p.y); if (reg) p.region = reg.id;
    // 게이트·괴수 무리: 같은 지역의 빈 칸으로
    const place = (o) => {
      if (o.raid) { delete o.raid.from; delete o.raid.eta; }
      const pos = WORLD.regionTiles[o.region] ? this.randomFreeTile(o.region) : null;
      if (pos) { o.x = pos[0]; o.y = pos[1]; return true; }
      return false;
    };
    this.mapGates = (this.mapGates || []).filter((g) => !g.north && place(g));
    this.mobs = (this.mobs || []).filter((m) => !m.north && place(m));
    // 탐사 지점은 새 지도에 다시 깐다 (탐사 완료 기록은 남긴다)
    if (this.world.explore && this.genSites) { const done = this.world.explore.done || {}; this.world.explore = { ...this.genSites(), done }; if (this.ensureTrainSpots) this.ensureTrainSpots(); }
    // 재앙이 남긴 폐허 칸은 옛 좌표라 지운다 (위험도 상승은 그대로)
    if (this.world.calamity) { this.world.calamity.scars = []; if (this.calamityInit) this.calamityInit(); }
    if (this.northInit) { this.northInit(); if (this.northOpen && this.northOpen() && this.spawnNorth) this.spawnNorth(true); }
    this.reveal(p.x, p.y, 6);
    this.log('지도가 훨씬 넓어졌다. 숲·들판·오염 지대가 늘고, 위치와 탐사 지점은 새 지도에 맞춰 옮겨졌다.', 'major');
  },
  // 지역 넓이에 맞춘 추가 게이트·괴수 무리 (기본 생성 뒤에 한 번 더)
  spawnScaled() {
    const key = this.monthKey();
    for (const reg of REGIONS) {
      const size = (WORLD.regionTiles[reg.id] || []).length; if (size < 300) continue;
      const [lo, hi] = GATE_RANGES[reg.danger];
      const gCap = size >= 2000 ? 7 : size >= 1000 ? 6 : size >= 450 ? 5 : 4;
      const gCount = this.mapGates.filter((g) => g.region === reg.id && !g.final && !g.mission && !g.calamity && !g.north).length;
      if (gCount >= 2 && gCount < gCap && RNG.chance(0.3 + reg.danger * 0.08)) {
        const pos = this.randomFreeTile(reg.id);
        if (pos) this.mapGates.push({ id: this.nextObjId++, kind: 'gate', x: pos[0], y: pos[1], region: reg.id, tier: RNG.int(lo, hi), theme: RNG.pick(GATE_THEMES), elem: typeof pickElem === 'function' ? pickElem() : RNG.pick(ELEMENT_KEYS), born: key });
      }
      const base = 2 + Math.floor(reg.danger / 2);
      const cap = Math.round(base * Math.min(4, size / 180));
      const mCount = this.mobs.filter((m) => m.region === reg.id && !m.north).length;
      for (let k = Math.max(mCount, base); k < cap; k++) {
        if (!RNG.chance(0.5)) continue;
        const pos = this.randomFreeTile(reg.id); if (!pos) continue;
        const tier = Math.max(0, RNG.int(lo - 1, hi - 1));
        const pool = MONSTERS.filter((m) => Math.abs(m.tier - tier) <= 1); const tpl = RNG.pick(pool.length ? pool : MONSTERS);
        this.mobs.push({ id: this.nextObjId++, kind: 'mob', x: pos[0], y: pos[1], region: reg.id, tier, elem: tpl.elem, name: tpl.name, shape: tpl.shape, count: RNG.int(1, 3), born: key });
      }
    }
  },
});

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  // 시야: 지도 배율(K)에 맞춰 반경을 키운다
  // [A, 사용자 요청] 시야가 너무 넓다 → 1/5, 다시 20% 더 줄임 (0.8 → 0.16 → 0.128)
  wrap('reveal', function (base, x, y, r) { return base.call(this, x, y, Math.max(1, Math.round(r * WORLD.K * 0.128))); });
  wrap('initSandbox', function (base) {
    base.call(this);
    if (this._oldMap) { this._oldMap = false; this.migrateOldMap(); }
    this.world.mapVer = 3;
  });
  wrap('spawnMonthly', function (base) { base.call(this); if (this.player) this.spawnScaled(); });
}

// ---------- 화면: 중도시·읍 ----------
{
  const townName = (t) => `${t.name} ${TOWN_TIER[t.tier].name}`;
  const swapName = (html, reg, t) => html.split(reg.name).join(townName(t));
  const baseCity = UI.cityHtml;
  UI.cityHtml = function () {
    let html = baseCity.call(this); const t = G.townHere(); if (!t) return html;
    const reg = regionById(t.region); const allow = TOWN_TIER[t.tier].facs;
    // 등급에 없는 시설은 뺀다
    html = html.replace(/<button class="fac-tile" data-act="city-fac" data-v="([a-z_0-9]+)">[\s\S]*?<\/button>/g, (all, id) => (allow.includes(id) ? all : ''));
    html = swapName(html, reg, t);
    return html.replace('<div class="fac-grid">', `<p class="small dim town-note">${reg.name} 권역의 ${TOWN_TIER[t.tier].name}. ${t.tier === 3 ? '숙소·잡화점·의뢰 게시판만 있다.' : '경매장과 길드 본부는 광역 거점에만 있다.'}</p><div class="fac-grid">`);
  };
  const baseOpen = UI.openCity;
  UI.openCity = function (fac) {
    const t = G.townHere();
    if (t && fac && !TOWN_TIER[t.tier].facs.includes(fac)) fac = null;
    return baseOpen.call(this, fac);
  };
  const baseActs = UI.hudActions;
  UI.hudActions = function () { const html = baseActs.call(this); const t = G.townHere(); return t ? swapName(html, regionById(t.region), t) : html; };
  const baseTip = UI.showTip;
  UI.showTip = function (x, y) {
    baseTip.call(this, x, y);
    const tip = document.getElementById('hud-tip'); if (!tip || !WORLD.inb(x, y) || !G.revealed(x, y)) return;
    const t = WORLD.townAt(x, y); const b = tip.querySelector('b');
    if (t && b) b.textContent = townName(t);
    else if (WORLD.isRoad(x, y)) tip.insertAdjacentHTML('beforeend', `<div class="small dim">국도 · 한 칸 ${WORLD.DAYS_PER_COST * WORLD.ROAD_COST}일</div>`);
  };

  // 지도: 국도와 읍 이름표
  const MP = MapView.prototype;
  const baseObjs = MP.drawObjects;
  MP.drawObjects = function () {
    const c = this.ctx, s = this.tile; const T = WORLD.T;
    const [x0, y0] = this.toTile(0, 0), [x1, y1] = this.toTile(this.w, this.hgt);
    const on = (x, y) => WORLD.inb(x, y) && (WORLD.road[WORLD.idx(x, y)] || WORLD.tiles[WORLD.idx(x, y)] === T.CITY) && G.revealed(x, y);
    c.lineCap = 'round';
    for (const [col, w] of [['rgba(5,8,13,.55)', Math.max(3, s * 0.16)], ['rgba(214,196,150,.62)', Math.max(1.5, s * 0.07)]]) {
      c.strokeStyle = col; c.lineWidth = w; c.beginPath();
      for (let y = Math.max(0, y0 - 1); y <= Math.min(WORLD.ROWS - 1, y1 + 1); y++) for (let x = Math.max(0, x0 - 1); x <= Math.min(WORLD.COLS - 1, x1 + 1); x++) {
        if (!WORLD.road[WORLD.idx(x, y)] || !G.revealed(x, y)) continue;
        const [px, py] = this.toScreen(x + 0.5, y + 0.5);
        let any = false;
        for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) if (on(x + dx, y + dy)) { any = true; c.moveTo(px, py); c.lineTo(px + dx * s * 0.5, py + dy * s * 0.5); }
        for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) if (on(x + dx, y + dy) && !on(x + dx, y) && !on(x, y + dy)) { any = true; c.moveTo(px, py); c.lineTo(px + dx * s * 0.5, py + dy * s * 0.5); }
        if (!any) { c.moveTo(px - 1, py); c.lineTo(px + 1, py); }
      }
      c.stroke();
    }
    c.lineCap = 'butt';
    baseObjs.call(this);
  };
  const baseCities = MP.drawCities;
  MP.drawCities = function () {
    baseCities.call(this);
    const c = this.ctx, s = this.tile; if (s < 18) return;
    for (const t of WORLD.towns) {
      const [px, py] = this.toScreen(t.x + 0.5, t.y - 0.45);
      if (px < -120 || py < -40 || px > this.w + 120 || py > this.hgt + 40) continue;
      const known = G.revealed(t.x, t.y);
      c.font = `${t.tier === 2 ? 700 : 600} ${t.tier === 2 ? (s > 34 ? 12 : 10.5) : (s > 34 ? 11 : 10)}px "IBM Plex Sans KR", sans-serif`;
      const w = c.measureText(t.name).width + 10;
      c.fillStyle = known ? 'rgba(8,14,22,.85)' : 'rgba(8,14,22,.55)'; c.fillRect(px - w / 2, py - 8, w, 16);
      c.fillStyle = known ? (t.tier === 2 ? '#9fd8d0' : '#8fa3b8') : '#3a4658'; c.fillRect(px - w / 2, py + 7, w, 1.5);
      c.fillStyle = known ? '#d5dce8' : '#6b7790'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t.name, px, py + 0.5);
    }
  };
}
