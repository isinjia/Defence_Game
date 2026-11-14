// ===== 게이트 크로니클: 길 위의 세계 =====
// 지역별 코어 시세와 교역, 계절·날씨가 바꾸는 지도, 탈것.
// 저장: G.world.regionCore, G.world.coreStock, G.world.storm, G.player.vehicle

// 지역 성격에 따른 코어 시세 (공업·연구 도시는 비싸게 사고, 최전선은 코어가 넘친다)
const REGION_CORE = { ulsan: 1.25, suwon: 1.15, incheon: 1.1, daejeon: 1.1, gangnam: 1.05, busan: 1.0, gwangju: 0.95, daegu: 0.95, jeonju: 0.9, gangbuk: 0.85, gangneung: 0.8, jeju: 0.75 };
const CORE_SPREAD = 1.15; // 코어를 살 때 붙는 웃돈
const BASE_T_COST = WORLD.T_COST.slice();
const BASE_DAYS_PER_COST = WORLD.DAYS_PER_COST;
WORLD.daysFor = (cost) => Math.max(1, Math.round(cost * WORLD.DAYS_PER_COST));

const VEHICLES = [
  { id: 'bike', name: '오토바이', price: 250, desc: '한 달 동안 기본 도보(SPD 10) 대비 3배 속도.' },
  { id: 'truck', name: '장갑차', price: 1200, desc: '한 달 동안 기본 도보(SPD 10) 대비 이동 시간이 절반, 괴수 기습을 받지 않는다.' },
  { id: 'heli', name: '헬기 대절', price: 4000, desc: '다음 한 번의 이동만 기본 도보(SPD 10) 대비 10배 속도로. 산도 평지처럼 건넌다. 길 위의 일도 피한다.', once: true },
];
const vehicleById = (id) => VEHICLES.find((v) => v.id === id);

Object.assign(Game.prototype, {
  travelInit() {
    const w = this.world;
    w.regionCore ??= {}; w.coreStock ??= {}; w.storm ??= null;
    for (const r of REGIONS) w.regionCore[r.id] ??= RNG.range(-0.06, 0.06);
    this.player.vehicle ??= null;
    this.applyTerrain();
  },

  // ---------- 지역 시세 ----------
  coreRegionMul(regionId) {
    const rid = regionId || (this.player && this.player.region);
    const d = (this.world.regionCore && this.world.regionCore[rid]) || 0;
    let m = (REGION_CORE[rid] || 1) * (1 + d);
    if (this.cityBreak && this.cityBreak(rid)) m *= 0.85; // 브레이크 중인 도시엔 코어가 쏟아진다
    return m;
  },
  regionCoreMonthly() {
    const w = this.world;
    for (const r of REGIONS) { const v = w.regionCore[r.id] || 0; w.regionCore[r.id] = Math.max(-0.15, Math.min(0.15, v * 0.7 + RNG.range(-0.07, 0.07))); }
    w.coreStock = {};
  },
  coreStock(regionId) {
    const key = this.monthKey(); const w = this.world;
    let s = w.coreStock[regionId];
    if (!s || s.key !== key) {
      const pr = this.player.rankIdx; const n = {};
      const cheap = (REGION_CORE[regionId] || 1) < 1;
      for (let t = Math.max(0, pr - 1); t <= Math.min(7, pr + 1); t++) n[t] = RNG.int(cheap ? 3 : 1, cheap ? 7 : 3);
      s = w.coreStock[regionId] = { key, n };
    }
    return s.n;
  },
  coreBuyPrice(t) { return Math.max(2, Math.round(this.corePrice(t) * CORE_SPREAD)); },
  buyCores(t, all) {
    const p = this.player; const stock = this.coreStock(p.region);
    const left = stock[t] || 0; if (!left) return '매물이 없다.';
    const each = this.coreBuyPrice(t);
    const n = Math.min(all ? left : 1, Math.floor(p.money / each));
    if (n <= 0) return '크레딧이 모자란다.';
    p.money -= each * n; stock[t] -= n; this.addCore(t, n);
    p.coreBought = (p.coreBought || 0) + each * n;
    this.save();
    return `${coreName(t)} ${n}개를 ${fmt(each * n)} 크레딧에 샀다.`;
  },

  // ---------- 계절과 날씨 ----------
  season() { const m = this.month; return m === 7 ? 'rain' : m === 12 || m <= 2 ? 'winter' : null; },
  stormAt(regionId) { const s = this.world && this.world.storm; return !!(s && s.region === regionId && this.monthKey() <= s.until); },
  weatherMonthly() {
    const w = this.world; const key = this.monthKey();
    if (w.storm && key > w.storm.until) { this.log(`${regionById(w.storm.region).name}의 에테르 폭풍이 잦아들었다.`); w.storm = null; }
    if (!w.storm && RNG.chance(0.14)) {
      const reg = RNG.pick(REGIONS.filter((r) => r.id !== 'gangnam'));
      w.storm = { region: reg.id, until: key + RNG.int(1, 2) };
      this.log(`[기상 속보] ${reg.name} 일대에 에테르 폭풍. 수련 효율이 치솟지만 괴수가 들끓는다.`, 'major');
      this.rumor(`${reg.name}에 에테르 폭풍이 몰아친다. 간 큰 수련자들이 몰려든다고.`);
    }
    if (this.month === 7) this.log('장마가 시작됐다. 황무지와 폐허가 진창이 되어 걷기 힘들다.');
    if (this.month === 12) this.log('겨울이 왔다. 산길이 얼어붙고, 얼음 낀 수 속성 괴수가 늘어난다.');
  },
  // 계절·탈것에 따라 지형 이동 비용을 다시 계산한다 (WORLD.T_COST 를 그 자리에서 바꾼다)
  applyTerrain() {
    const T = WORLD.T; const c = BASE_T_COST.slice();
    const s = this.month ? this.season() : null;
    if (s === 'rain') { c[T.PLAIN] = 1.5; c[T.RUIN] = 1.5; if (T.FIELD != null) c[T.FIELD] = 1.5; if (T.WASTE != null) c[T.WASTE] = 1.6; }
    if (s === 'winter') { c[T.MOUNTAIN] = 3; if (T.FOREST != null) c[T.FOREST] = 1.8; }
    const v = this.player && this.player.vehicle;
    if (v && v.id === 'heli') for (let i = 0; i < c.length; i++) if (c[i] > 1) c[i] = 1;
    for (let i = 0; i < c.length; i++) WORLD.T_COST[i] = c[i];
    WORLD.DAYS_PER_COST = v && v.id === 'truck' ? BASE_DAYS_PER_COST / 2 : BASE_DAYS_PER_COST;
  },
  weatherNote() {
    const p = this.player; const s = this.season(); const out = [];
    if (s === 'rain') out.push('장마 · 황무지 진창');
    if (s === 'winter') out.push('겨울 · 산길 결빙');
    if (this.stormAt(p.region)) out.push('에테르 폭풍');
    const v = p.vehicle && vehicleById(p.vehicle.id);
    if (v) out.push(v.once ? `${v.name} 대기 중` : `${v.name} ${Math.max(0, p.vehicle.until - this.monthKey())}개월`);
    return out;
  },

  // ---------- 탈것 ----------
  vehiclePrice(v) { return Math.round(v.price * (1 + this.player.rankIdx * 0.6) * (this.priceMul ? this.priceMul() : 1) / 10) * 10; },
  rentVehicle(id) {
    const p = this.player; const v = vehicleById(id); if (!v) return '';
    const cost = this.vehiclePrice(v);
    if (p.money < cost) return '크레딧이 모자란다.';
    p.money -= cost;
    p.vehicle = { id: v.id, until: this.monthKey() + 1 };
    this.applyTerrain(); this.save();
    return v.once ? `헬기를 대절했다. 다음 이동 한 번은 하늘로 간다.` : `${v.name}를 한 달 빌렸다.`;
  },
  vehicleMonthly() {
    const p = this.player; const v = p.vehicle;
    if (v && this.monthKey() > v.until) { const V = vehicleById(v.id); p.vehicle = null; if (V) this.log(`${V.name} 대여 기간이 끝나 반납했다.`); }
  },
});

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  wrap('initSandbox', function (base) { base.call(this); this.travelInit(); });
  wrap('corePrice', function (base, t) { return Math.max(1, Math.round(base.call(this, t) * this.coreRegionMul())); });
  wrap('spawnMonthly', function (base) {
    const key = this.monthKey(); const before = new Set(this.mobs.map((m) => m.id)); const beforeG = new Set(this.mapGates.map((g) => g.id));
    base.call(this);
    if (!this.world || !this.world.regionCore || this.world.travelKey === key) return;
    this.world.travelKey = key;
    this.regionCoreMonthly(); this.weatherMonthly(); this.vehicleMonthly(); this.applyTerrain();
    const s = this.season();
    // 겨울엔 수 속성 괴수가 늘고, 장마엔 물에 잠긴 게이트가 생긴다
    if (s === 'winter') for (const m of this.mobs) {
      if (before.has(m.id) || m.elem === 'water' || !RNG.chance(0.4)) continue;
      const pool = MONSTERS.filter((x) => x.elem === 'water' && Math.abs(x.tier - m.tier) <= 1);
      if (pool.length) { const t = RNG.pick(pool); m.elem = 'water'; m.name = t.name; m.shape = t.shape; }
    }
    if (s === 'rain') for (const g of this.mapGates) if (!beforeG.has(g.id) && !g.final && !g.mission && RNG.chance(0.5)) g.theme = RNG.pick(['침수된 쇼핑몰', '해저 터널', '물에 잠긴 지하철역']);
    // 폭풍 지역엔 괴수 무리가 더 생긴다
    const st = this.world.storm;
    if (st && this.stormAt(st.region)) for (let k = 0; k < 2; k++) {
      const pos = this.randomFreeTile(st.region); if (!pos) continue;
      const reg = regionById(st.region); const [lo, hi] = GATE_RANGES[reg.danger];
      const tier = Math.max(0, Math.min(7, RNG.int(lo, hi)));
      const pool = MONSTERS.filter((x) => Math.abs(x.tier - tier) <= 1); const tpl = RNG.pick(pool.length ? pool : MONSTERS);
      this.mobs.push({ id: this.nextObjId++, kind: 'mob', x: pos[0], y: pos[1], region: st.region, tier, elem: tpl.elem, name: tpl.name, shape: tpl.shape, count: RNG.int(2, 3), born: key });
    }
  });
  wrap('trainGain', function (base, mult = 1) { return base.call(this, this.player && this.stormAt(this.player.region) && !this.onCity() ? mult * 1.6 : mult); });
  wrap('walkStep', function (base, x, y, diag) {
    const res = base.call(this, x, y, diag);
    const v = this.player.vehicle;
    if (v && (v.id === 'truck' || v.id === 'heli')) {
      const before = this.queue.length;
      this.queue = this.queue.filter((q) => q.type !== 'mobAmbush' && !(v.id === 'heli' && (q.type === 'ruinScav' || (q.type === 'story' && (this.storyById(q.id) || {}).trigger === 'road'))));
      if (this.queue.length !== before) res.stop = !!res.city || !!this.objAt(x, y) || this.queue.some((q) => q.type !== 'toast');
    }
    if (v && v.id === 'heli') v.flying = true;
    // 폭풍 속 걸음: 가끔 에테르 낙뢰
    if (this.stormAt(this.player.region) && !res.city && RNG.chance(0.05)) {
      const p = this.player; const d = Math.max(1, Math.round(p.maxHp * 0.08)); p.hp = Math.max(1, p.hp - d);
      const g = this.etherGift(6);
      this.queue.push({ type: 'toast', text: `에테르 낙뢰가 스쳤다. 체력 -${fmt(d)}, 에테르 +${fmt(g)}.` });
    }
    return res;
  });
  if (typeof FACILITIES !== 'undefined' && !FACILITIES.some((f) => f.id === 'garage')) {
    const at = FACILITIES.findIndex((f) => f.id === 'transit');
    FACILITIES.splice(at + 1, 0, { id: 'garage', name: '차량 대여소', desc: '오토바이·장갑차를 빌리거나 헬기를 대절한다. 도시 밖 이동용.' });
  }
  if (typeof FAC_ICON !== 'undefined') FAC_ICON.garage = '<path d="M3 13l2-5h14l2 5v5H3z"/><circle cx="7.5" cy="18" r="1.8"/><circle cx="16.5" cy="18" r="1.8"/><path d="M5 13h14"/>';
}

// ---------- 화면 ----------
Object.assign(UI, {
  garageHtml() {
    const p = G.player; const cur = p.vehicle && vehicleById(p.vehicle.id);
    return `<div class="panel"><p class="dim small">도시 밖 황무지를 달릴 탈것. 고속 이동망과 달리 어디든 갈 수 있지만, 바다와 봉쇄 구역은 못 건넌다.</p>
      ${cur ? `<div class="item-row hl"><div class="grow"><b>사용 중: ${cur.name}</b><div class="small dim">${cur.desc}</div></div></div>` : ''}
      <div class="cards">${VEHICLES.map((v) => `<div class="item-row"><div class="grow"><b>${v.name}</b><div class="small dim">${v.desc}</div></div>
        <button class="sm" data-act="rent-vehicle" data-v="${v.id}" ${cur ? 'disabled' : ''}>${FX.icon('coin', 13)} ${fmt(G.vehiclePrice(v))}</button></div>`).join('')}</div></div>`;
  },
  coreTradeHtml(reg) {
    const p = G.player; const stock = G.coreStock(reg.id);
    const mul = Math.round(G.coreRegionMul(reg.id) * 100);
    const others = REGIONS.filter((r) => r.id !== reg.id && p.visited.includes(r.id)).map((r) => ({ r, m: Math.round(G.coreRegionMul(r.id) * 100) })).sort((a, b) => b.m - a.m);
    const rows = Object.keys(stock).map(Number).map((t) => `<div class="item-row"><div class="grow"><b>${coreName(t)}</b> <span class="small dim">매물 ${stock[t]} · 보유 ${G.coreCount(t)}</span><div class="small dim">개당 ${fmt(G.coreBuyPrice(t))}</div></div>
      <button class="sm" data-act="buy-cores" data-v="${t}" ${stock[t] ? '' : 'disabled'}>1개</button><button class="sm ghost" data-act="buy-cores" data-v="${t}|all" ${stock[t] ? '' : 'disabled'}>전부</button></div>`).join('');
    return `<div class="sec-title sec">코어 거래 · 이 도시 시세 ${mul}%</div>
      <div class="small dim">공업·연구 도시는 코어를 비싸게 사 가고, 최전선은 코어가 넘쳐 싸다. 싸게 사서 옮겨 팔면 남는다. 살 때는 웃돈 ${Math.round((CORE_SPREAD - 1) * 100)}%가 붙는다.</div>
      <div class="cards">${rows}</div>
      ${others.length ? `<div class="small dim">가 본 도시 시세: ${others.map((o) => `${o.r.name.split(' ')[0]} <b class="${o.m > mul ? 'good' : o.m < mul ? 'bad' : ''}">${o.m}%</b>`).join(' · ')}</div>` : ''}`;
  },
});
{
  const baseFac = UI.facilityHtml;
  UI.facilityHtml = function (id, reg) {
    if (id === 'garage') return this.garageHtml();
    const html = baseFac.call(this, id, reg);
    if (id === 'market') return html + this.coreTradeHtml(reg);
    return html;
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'rent-vehicle': return this.afterCity(G.rentVehicle(v));
      case 'buy-cores': { const [t, all] = String(v).split('|'); return this.afterCity(G.buyCores(+t, !!all)); }
      default: return baseHandle.call(this, act, v);
    }
  };
  const baseEnd = UI.endWalk;
  UI.endWalk = function () {
    const v = G.player && G.player.vehicle;
    if (v && v.flying) { G.player.vehicle = null; G.applyTerrain(); G.log('헬기에서 내렸다.'); }
    return baseEnd.call(this);
  };
  const baseActions = UI.hudActions;
  UI.hudActions = function () {
    const html = baseActions.call(this);
    const notes = G.weatherNote ? G.weatherNote() : [];
    if (!notes.length) return html;
    return html.replace(/(<div class="act-where">[\s\S]*?)(<\/div>)/, `$1 <span class="weather-tag small">${notes.join(' · ')}</span>$2`);
  };
}

// ---------- 지도: 에테르 폭풍 ----------
{
  const MP = MapView.prototype;
  const baseObjs = MP.drawObjects;
  MP.drawObjects = function () {
    const st = G.world && G.world.storm;
    if (st && G.stormAt(st.region)) {
      const c = this.ctx, s = this.tile, t = this.t;
      const tiles = EXPLORE.regionLand[st.region] || [];
      for (const i of tiles) {
        const [x, y] = WORLD.xy(i); if (!G.revealed(x, y)) continue;
        const [px, py] = this.toScreen(x, y);
        if (px < -s || py < -s || px > this.w || py > this.hgt) continue;
        const a = 0.16 + Math.sin(t / 25 + x * 0.7 + y * 0.5) * 0.07;
        c.fillStyle = `rgba(170,90,255,${a})`; c.fillRect(px, py, s, s);
        if (WORLD.h2(x, y, (t / 40) | 0) < 0.02) { c.strokeStyle = 'rgba(230,200,255,.8)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(px + s * 0.6, py); c.lineTo(px + s * 0.4, py + s * 0.5); c.lineTo(px + s * 0.55, py + s * 0.5); c.lineTo(px + s * 0.35, py + s); c.stroke(); }
      }
    }
    // 장마·겨울: 화면 전체에 옅은 비·눈
    const sea = G.season && G.season();
    if (sea && !FX.reduced) {
      const c = this.ctx; const t = this.t;
      c.strokeStyle = sea === 'rain' ? 'rgba(140,180,220,.18)' : 'rgba(230,240,255,.35)'; c.fillStyle = 'rgba(230,240,255,.4)'; c.lineWidth = 1;
      c.beginPath();
      for (let k = 0; k < 60; k++) {
        const x = ((k * 97 + t * (sea === 'rain' ? 3 : 0.6)) % (this.w + 40)) - 20;
        const y = ((k * 53 + t * (sea === 'rain' ? 9 : 1.2)) % (this.hgt + 40)) - 20;
        if (sea === 'rain') { c.moveTo(x, y); c.lineTo(x - 3, y + 10); } else c.rect(x, y, 2, 2);
      }
      if (sea === 'rain') c.stroke(); else c.fill();
    }
    baseObjs.call(this);
  };
}
