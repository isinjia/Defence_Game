// ===== 게이트 크로니클: 북부 봉쇄 구역 해금 =====
// 공식 S급 + 관리국 특별 허가, 또는 밀입으로 북부 봉쇄 구역에 들어간다.
// 열리면 봉쇄 구역 칸이 걸을 수 있는 땅(대붕괴 이전 도시 잔해·산악·에테르 지대)으로 바뀌고,
// 안개가 짙으며(시야 1칸), 지도에 없던 고등급 게이트와 잔해 지점, 원초의 게이트에 얽힌 진실이 있다.
// 저장: G.world.north = { open, how, first, truth }

const NORTH_THEMES = ['대붕괴 이전 평양 지하', '얼어붙은 개마고원', '무너진 비무장지대 벙커', '백두 에테르 분화구', '잠든 옛 수도의 지하철'];
const NORTH = (() => {
  const T = WORLD.T; const tiles = [];
  for (let i = 0; i < WORLD.tiles.length; i++) if (WORLD.tiles[i] === T.NORTH) tiles.push(i);
  // 열렸을 때의 지형 (결정론적)
  const terrain = tiles.map((i) => {
    const [x, y] = WORLD.xy(i); const n = WORLD.noise(x * 0.4, y * 0.4, 21), r = WORLD.h2(x, y, 22);
    return n > 0.62 ? T.MOUNTAIN : r < 0.12 ? T.ETHER : n < 0.45 ? T.RUIN : T.PLAIN;
  });
  // 가장 가까운 지역 (게임 규칙상 소속)
  const region = tiles.map((i) => {
    const [x, y] = WORLD.xy(i); let best = -1, bd = 1e9;
    REGIONS.forEach((r, ri) => { if (r.id === 'jeju') return; const [cx, cy] = WORLD.cityPos[r.id]; const d = (cx - x) ** 2 + (cy - y) ** 2; if (d < bd) { bd = d; best = ri; } });
    return best;
  });
  const set = new Set(tiles);
  return { tiles, terrain, region, has: (i) => set.has(i) };
})();
SITE_KINDS.oldcity = { name: '대붕괴 이전 도시 잔해', icon: '▦', color: '#ffd84d', desc: '20년 전 그날 멈춘 도시. 간판도, 신호등도, 사람만 빼고 그대로다.' };
SITE_KINDS.truth = { name: '봉쇄선 관측소', icon: '◉', color: '#ff4f6a', desc: '봉쇄 직후 관리국이 세운 비밀 관측소. 원초의 게이트를 향한 장비가 아직 돌아간다.' };

Object.assign(Game.prototype, {
  northState() { return this.world && this.world.north; },
  northOpen() { const s = this.northState(); return !!(s && s.open); },
  isNorthTile(x, y) { return NORTH.has(WORLD.idx(x, y)); },
  northApply() {
    if (!this.northOpen()) return;
    NORTH.tiles.forEach((i, k) => { WORLD.tiles[i] = NORTH.terrain[k]; WORLD.region[i] = NORTH.region[k]; });
  },
  northClose() { NORTH.tiles.forEach((i) => { WORLD.tiles[i] = WORLD.T.NORTH; WORLD.region[i] = -1; }); },
  northInit() {
    this.world.north ??= { open: false, how: null, first: false, truth: false };
    this.northClose(); this.northApply();
  },
  northPermitCost() { return { merit: 60, money: 30000 }; },
  smuggleCost() { return Math.round(60000 * (this.priceMul ? this.priceMul() : 1) / 100) * 100; },
  canPermit() { return (this.player.official ?? this.player.rankIdx) >= 6; },
  openNorth(how) {
    const p = this.player; const s = this.northState(); if (s.open) return '';
    if (how === 'permit') {
      const c = this.northPermitCost();
      if (!this.canPermit()) return '관리국 공식 S급만 특별 허가를 신청할 수 있다.';
      if (p.merit < c.merit || p.money < c.money) return `협회 공적 ${c.merit}와 보증금 ${fmt(c.money)} 크레딧이 필요하다.`;
      p.merit -= c.merit; p.money -= c.money;
    } else {
      const cost = this.smuggleCost();
      if (p.rankIdx < 5) return '"A급도 안 되는 놈을 넘겼다가 시체로 돌아오면 내 장사도 끝이야." 브로커가 고개를 젓는다.';
      if (p.money < cost) return `브로커가 부르는 값은 ${fmt(cost)} 크레딧이다.`;
      p.money -= cost; p.outlaw = (p.outlaw || 0) + 15;
      this.rumor('누군가 봉쇄선 브로커를 통해 북쪽으로 넘어갔다는 말이 돈다.');
    }
    s.open = true; s.how = how;
    this.northApply();
    this.spawnNorth(true);
    this.lifeEvent(how === 'permit' ? '관리국 특별 허가를 받아 북부 봉쇄선을 넘었다.' : '브로커를 통해 북부 봉쇄선을 몰래 넘었다.');
    this.save();
    return how === 'permit' ? '특별 허가증이 발급됐다. 봉쇄선 초소의 차단기가 올라간다.' : '새벽 세 시, 브로커가 철조망의 끊어진 틈을 가리킨다. "여기서부턴 혼자요."';
  },
  // 북부의 게이트·괴수·지점
  spawnNorth(first) {
    if (!this.northOpen()) return;
    const key = this.monthKey(); const free = NORTH.tiles.filter((i) => { const [x, y] = WORLD.xy(i); return !this.objAt(x, y) && !(this.siteAt && this.siteAt(x, y)); });
    const pickPos = () => { if (!free.length) return null; const k = RNG.int(0, free.length - 1); const i = free.splice(k, 1)[0]; return WORLD.xy(i); };
    const regOf = (x, y) => REGIONS[WORLD.region[WORLD.idx(x, y)]].id;
    const gates = this.mapGates.filter((g) => g.north).length;
    for (let k = gates; k < 3; k++) {
      const pos = pickPos(); if (!pos) break;
      this.mapGates.push({ id: this.nextObjId++, kind: 'gate', x: pos[0], y: pos[1], region: regOf(...pos), tier: RNG.weighted([5, 6, 7], [50, 35, 15]), theme: RNG.pick(NORTH_THEMES), elem: pickElem(), born: key, north: true, deadline: 1e9, variant: RNG.chance(0.25) ? 'red' : 'normal' });
    }
    const mobs = this.mobs.filter((m) => m.north).length;
    for (let k = mobs; k < 4; k++) {
      const pos = pickPos(); if (!pos) break;
      const tier = RNG.int(4, 6); const pool = MONSTERS.filter((m) => Math.abs(m.tier - tier) <= 1); const tpl = RNG.pick(pool.length ? pool : MONSTERS);
      this.mobs.push({ id: this.nextObjId++, kind: 'mob', x: pos[0], y: pos[1], region: regOf(...pos), tier, elem: tpl.elem, name: tpl.name, shape: tpl.shape, count: RNG.int(2, 3), born: key, north: true });
    }
    const e = this.exploreState && this.exploreState();
    if (first && e && !e.sites.some((s) => s.north)) {
      const plan = ['oldcity', 'oldcity', 'oldcity', 'truth', 'spring', 'tower'];
      for (const kind of plan) {
        const pos = pickPos(); if (!pos) break;
        e.sites.push({ id: e.nextId++, kind, x: pos[0], y: pos[1], region: regOf(...pos), known: false, visited: false, used: 0, north: true });
      }
    }
  },
  northSiteAct(s, choice) {
    const p = this.player; const key = this.monthKey(); const ns = this.northState();
    s.used = key; s.visited = true; s.known = true;
    if (s.kind === 'oldcity') {
      this.advanceDays(3, { noSave: true });
      const ok = this._ck == null ? true : this._ck; const who = this._ckNpc || null;
      const out = [];
      const t = Math.min(7, Math.max(5, p.rankIdx)); const n = ok ? RNG.int(3, 4) : RNG.int(1, 2); this.addCore(t, n); out.push(`${coreName(t)} ${n}개`);
      out.push(this.addRelic(null, ok ? RNG.weighted([2, 3], [55, 45]) : 1));
      if (ok && RNG.chance(0.6)) { const it = this.makeEquipment(RNG.pick(['weapon', 'armor', 'acc']), Math.min(7, p.rankIdx + 1), RNG.weighted([2, 3], [65, 35])); p.inventory.push(it); out.push(it.name); }
      if (this._ckOut) { this._ckOut.gains.push(...out); this._ckOut.losses.push('3일 소요'); }
      if (!ok) { if (who) { if (this._ckOut) this._ckOut.losses.push(`${who.name} 부상 (체력 -20%)`); } else { const d = Math.round(p.maxHp * 0.2); p.hp = Math.max(1, p.hp - d); if (this._ckOut) this._ckOut.losses.push(`체력 -${fmt(d)}`); } }
      const lore = RNG.pick([
        '멈춘 시계탑은 20년 전 그날 오전 9시 14분을 가리킨다.',
        '학교 칠판에 아이들 글씨가 남아 있다. "내일은 소풍".',
        '은행 금고는 열려 있고 돈은 그대로다. 아무도 가지러 오지 않았다.',
      ]);
      this.lifeEvent('대붕괴 이전 도시의 잔해를 뒤졌다.');
      return `${lore} 잔해 속에서 ${out.join(', ')}을(를) 찾았다.`;
    }
    if (s.kind === 'truth') {
      this.advanceDays(2, { noSave: true });
      ns.truth = true;
      this.lifeEvent('봉쇄선 관측소에서 원초의 게이트에 관한 기록을 찾았다.');
      this.rumor('누군가 북부 관측소의 봉인된 기록을 꺼냈다는 소문이 돈다. 관리국이 술렁인다.');
      return '관측 일지 마지막 장: "원초의 게이트는 열린 것이 아니다. 무언가가 반대편에서 두드리고 있다. 제주의 목소리는 경고였다. 군주는 북쪽에서 흘러든 에테르로 버틴다. 이 선을 끊으면 군주는 약해진다." 관측 장비의 송신 회로를 끊었다. (원초의 게이트 최종 보스 약화)';
    }
    return '';
  },
});

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  wrap('initSandbox', function (base) { base.call(this); this.northInit(); });
  // 같은 화면에서 새 게임을 시작하면 이전 판의 세계 상태(탐사 지점·재앙·북부 등)를 버린다
  wrap('newGame', function (base, opts) { this.world = undefined; return base.call(this, opts); });
  wrap('spawnMonthly', function (base) { base.call(this); if (this.northOpen()) this.spawnNorth(false); });
  if (GP.ecoEligible) wrap('ecoEligible', function (base, g) { return !g.north && base.call(this, g); });
  wrap('siteActive', function (base, s) { if (s.kind === 'oldcity' || s.kind === 'truth') return !s.used; return base.call(this, s); });
  wrap('siteAct', function (base, id, choice) {
    const s = this.siteById(id);
    if (s && (s.kind === 'oldcity' || s.kind === 'truth')) { const out = this.northSiteAct(s, choice); this.checkExplore(); this.save(); return out; }
    return base.call(this, id, choice);
  });
  // 짙은 안개: 북부에선 시야 1칸
  wrap('walkStep', function (base, x, y, diag) {
    const north = this.northOpen() && this.isNorthTile(x, y);
    let snap = null;
    if (north) {
      snap = [];
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) <= 1 || !WORLD.inb(x + dx, y + dy)) continue;
        const i = WORLD.idx(x + dx, y + dy); if (NORTH.has(i)) snap.push([i, this.fog[i]]);
      }
    }
    const res = base.call(this, x, y, diag);
    if (snap) for (const [i, v] of snap) this.fog[i] = v;
    const s = this.northState();
    if (north && !s.first) {
      s.first = true; const p = this.player; p.fame += 30;
      this.lifeEvent('봉쇄 이후 처음으로 북부 땅을 밟고 걸었다.');
      this.rumor(`${p.name}이(가) 봉쇄 이후 처음으로 북부 봉쇄 구역을 탐사했다. 헌터 커뮤니티가 뒤집혔다.`);
      this.log('[최초] 북부 봉쇄 구역 탐사. 명성 +30', 'major');
      this.queue.push({ type: 'toast', text: '세계 최초: 북부 봉쇄 구역 탐사 · 명성 +30' });
    }
    return res;
  });
  wrap('gateRooms', function (base, gate) {
    const rooms = base.call(this, gate);
    if (gate.final && this.northState() && this.northState().truth && rooms.length) {
      const last = rooms[rooms.length - 1];
      for (const m of last) if (m.boss) { m.hp = m.maxHp = Math.round(m.maxHp * 0.8); m.name += ' (약화)'; }
    }
    return rooms;
  });
  if (typeof TITLES !== 'undefined') TITLES.push({ id: 'northbound', name: '봉쇄선 너머', how: '북부 봉쇄 구역 최초 탐사', mods: { luck: 0.1, spd: 0.03 }, cond: (g) => !!(g.northState() && g.northState().first) });
  if (typeof FACILITIES !== 'undefined' && !FACILITIES.some((f) => f.id === 'northgate')) {
    FACILITIES.push({ id: 'northgate', name: '봉쇄선 검문소', desc: '북부 봉쇄 구역으로 가는 유일한 관문. 허가증 또는 브로커.', only: ['gangbuk'] });
  }
  if (typeof FAC_ICON !== 'undefined') FAC_ICON.northgate = '<path d="M3 21V9l9-6 9 6v12"/><path d="M3 13h18"/><path d="M8 21v-5h8v5"/>';
}

// ---------- 화면 ----------
{
  const baseFac = UI.facilityHtml;
  UI.facilityHtml = function (id, reg) {
    if (id !== 'northgate') return baseFac.call(this, id, reg);
    const p = G.player; const s = G.northState(); const c = G.northPermitCost();
    if (s.open) return `<div class="panel"><p>차단기는 올라가 있다. 초소 병사가 ${s.how === 'permit' ? '허가증을 확인하고 경례한다' : '당신을 못 본 척한다'}.</p><p class="small dim">북부는 안개가 짙어 한 칸 앞밖에 보이지 않는다. 지도에 없는 고등급 게이트와 대붕괴 이전 도시의 잔해가 있다.</p></div>`;
    return `<div class="panel"><p>철조망과 지뢰 표지판 너머로 20년째 아무도 돌아오지 않은 땅이 펼쳐져 있다. 관리국은 이 선을 넘는 것을 허가하지 않는다. 거의.</p>
      <div class="cards">
        <div class="item-row"><div class="grow"><b>관리국 특별 허가</b><div class="small dim">공식 S급 등록 필요 · 협회 공적 ${c.merit} · 보증금 ${fmt(c.money)} 크레딧${G.canPermit() ? '' : ' · <span class="bad">공식 등급 부족</span>'}</div></div><button class="sm primary" data-act="north-open" data-v="permit">신청</button></div>
        <div class="item-row"><div class="grow"><b>봉쇄선 브로커</b><div class="small dim">실력 A급 이상 · ${fmt(G.smuggleCost())} 크레딧 · 무법 성향이 오른다</div></div><button class="sm danger" data-act="north-open" data-v="smuggle">밀입</button></div>
      </div></div>`;
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'north-open') { const msg = G.openNorth(v); if (G.northOpen() && this.map) { this.map.refresh(); this.map.drawMini(); } return this.afterCity(msg); }
    return baseHandle.call(this, act, v);
  };
  const baseShow = UI.showSite;
  UI.showSite = function (id) {
    const s = G.siteById(id);
    if (!s || (s.kind !== 'oldcity' && s.kind !== 'truth')) return baseShow.call(this, id);
    const K = SITE_KINDS[s.kind]; s.visited = true; s.known = true;
    const label = s.kind === 'oldcity' ? '잔해를 뒤진다 <span class="dim-in">3일 · 고등급 코어·유물·장비</span>' : '관측 기록을 읽는다 <span class="dim-in">2일</span>';
    this.modal(`<div class="eyebrow">북부 봉쇄 구역 · ${G.fullDate()}</div><h3>${this.siteIcon(s, 18)} ${K.name}</h3><p class="event-text">${K.desc}</p>
      <div class="cards"><button class="choice-btn" data-act="site" data-v="${s.id}|go">${label}</button></div>
      <div class="row end"><button class="ghost" data-act="modal-close">떠난다</button></div>`, 'event-box');
  };
  const baseTip = UI.showTip;
  UI.showTip = function (x, y) {
    baseTip.call(this, x, y);
    const tip = document.getElementById('hud-tip'); if (!tip || !WORLD.inb(x, y) || !G.isNorthTile(x, y)) return;
    const b = tip.querySelector('b'); if (b && G.revealed(x, y)) b.textContent = `북부 봉쇄 구역 · ${WORLD.T_NAME[WORLD.type(x, y)]}`;
    if (!G.northOpen()) tip.insertAdjacentHTML('beforeend', '<div class="small dim">진입 불가. 강북 폐구의 봉쇄선 검문소에서 허가를 받거나 브로커를 찾아야 한다.</div>');
  };
  // 열린 북부는 붉은 기운을 띤 어두운 땅으로 그린다
  const MP = MapView.prototype;
  const baseObjs = MP.drawObjects;
  MP.drawObjects = function () {
    if (G.northOpen && G.northOpen()) {
      const c = this.ctx, s = this.tile;
      const [x0, y0] = this.toTile(0, 0), [x1, y1] = this.toTile(this.w, this.hgt);
      c.fillStyle = 'rgba(40,0,10,.28)';
      for (const i of NORTH.tiles) {
        const [x, y] = WORLD.xy(i); if (x < x0 - 1 || x > x1 + 1 || y < y0 - 1 || y > y1 + 1) continue;
        const [px, py] = this.toScreen(x, y); c.fillRect(px, py, s, s);
      }
    }
    baseObjs.call(this);
  };
}
