// ===== 게이트 크로니클: 내 이동 수단 (구매·소유) =====
// 구현_대기목록 4-24 ③. 처음은 뚜벅이. 자전거 → 중고 오토바이 → 승용차 → 헌터용 SUV → 개인 헬기.
// travel.js 대여(한 달·1회)는 그대로 두고 "사기 전에 빌려 보기" 역할. 대여와 소유가 겹치면 이동력은 큰 쪽만.
// 저장: G.player.ownVehicle = { id, cond(0~100), broken, since }, G.player.driveLicense (p.license 는 헌터 등록번호라 따로)
// 가격·유지비는 OWN_VEHICLES (영역 E가 조정). 월 유지비는 G.ownVehicleUpkeep() — E의 월 정산이
// 직접 떼어 가려면 OWN_VEHICLE_UPKEEP_EXTERNAL = true 로 두면 여기서는 떼지 않는다.

const OWN_VEHICLES = [
  { id: 'bicycle', name: '자전거', price: 120, upkeep: 0, range: 2, desc: '이동력 +2. 유지비 없음.' },
  { id: 'moto', name: '중고 오토바이', price: 900, upkeep: 40, range: 5, desc: '이동력 +5. 기름값이 든다.' },
  { id: 'car', name: '승용차', price: 3500, upkeep: 150, range: 3, road: 0.5, license: true, desc: '이동력 +3, 국도 위 이동 날 절반. 운전면허 필요.' },
  { id: 'suv', name: '헌터용 SUV', price: 12000, upkeep: 400, range: 4, road: 0.5, mountain: 0.67, noAmbush: true, license: true, rank: 3, desc: '이동력 +4, 국도 날 절반, 산길 비용 감소, 괴수 기습 무시. 면허·C급 이상 장비 허가.' },
  { id: 'heli', name: '개인 헬기', price: 80000, upkeep: 3000, range: 14, fly: true, noAmbush: true, rank: 5, desc: '이동력 +14, 산도 평지처럼 넘고 괴수 기습을 받지 않는다. A급 이상 비행 허가.' },
];
var OWN_VEHICLE_UPKEEP_EXTERNAL = false;
const ownVehById = (id) => OWN_VEHICLES.find((v) => v.id === id);

Object.assign(Game.prototype, {
  // 지금 쓰는 내 탈것 (고장 나면 없음). 내 차가 없으면 소속이 내주는 차.
  ownVehicle() {
    const p = this.player; const o = p && p.ownVehicle;
    if (o && !o.broken) return ownVehById(o.id);
    if (!p) return null;
    if (this.isCivil && this.isCivil()) return { ...ownVehById('car'), name: '관리국 공용차', upkeep: 0, provided: true };
    if (p.guild && p.guild !== 'kama' && typeof GUILDS !== 'undefined' && GUILDS[p.guild] && (p.guildRank || 0) >= 2) return { ...ownVehById('car'), name: `${GUILDS[p.guild].name} 차량`, upkeep: 0, provided: true };
    return null;
  },
  ownVehicleUpkeep() { const o = this.player.ownVehicle; const V = o && ownVehById(o.id); return V ? V.upkeep : 0; },
  ownVehicleReq(V) {
    const p = this.player;
    if (V.license && !p.driveLicense) return '운전면허 필요';
    if (V.rank && p.rankIdx < V.rank) return `${RANKS[V.rank].key}급 이상`;
    return '';
  },
  ownVehiclePrice(V) { return Math.round(V.price * (this.priceMul ? this.priceMul() : 1) / 10) * 10; },
  ownVehicleValue() { const o = this.player.ownVehicle; const V = o && ownVehById(o.id); return V ? Math.round(V.price * 0.5 * (o.cond / 100) / 10) * 10 : 0; },
  ownVehicleRepairCost() { const o = this.player.ownVehicle; const V = o && ownVehById(o.id); return V ? Math.max(10, Math.round(V.price * 0.002 * (100 - o.cond) / 10) * 10 + (o.broken ? Math.round(V.price * 0.05) : 0)) : 0; },
  buyOwnVehicle(id) {
    const p = this.player; const V = ownVehById(id); if (!V) return '';
    const req = this.ownVehicleReq(V); if (req) return `${V.name}: ${req}.`;
    const trade = this.ownVehicleValue(); const cost = this.ownVehiclePrice(V) - trade; // 싼 차로 바꾸면 차액을 돌려받는다
    if (p.money < cost) return '크레딧이 모자란다.';
    const old = p.ownVehicle && ownVehById(p.ownVehicle.id);
    p.money -= cost; p.ownVehicle = { id, cond: 100, broken: false, since: this.monthKey() };
    this.applyTerrain(); this.save();
    this.log(`${V.name}을(를) 샀다.${old ? ` 타던 ${old.name}은(는) ${fmt(trade)} 크레딧에 넘겼다.` : ''}`, 'good');
    return `${V.name}을(를) 샀다.`;
  },
  sellOwnVehicle() {
    const p = this.player; const o = p.ownVehicle; const V = o && ownVehById(o.id); if (!V) return '';
    const v = this.ownVehicleValue(); p.money += v; p.ownVehicle = null; this.applyTerrain(); this.save();
    return `${V.name}을(를) ${fmt(v)} 크레딧에 팔았다.`;
  },
  repairOwnVehicle() {
    const p = this.player; const o = p.ownVehicle; if (!o) return '';
    const c = this.ownVehicleRepairCost(); if (p.money < c) return '크레딧이 모자란다.';
    p.money -= c; o.cond = 100; o.broken = false; this.applyTerrain(); this.save();
    return `정비를 마쳤다. ${fmt(c)} 크레딧.`;
  },
  licenseTest() {
    const p = this.player; if (p.driveLicense) return '';
    const fee = 150; if (p.money < fee) return '크레딧이 모자란다.';
    p.money -= fee;
    const me = this.checkMembers ? this.checkMembers().find((m) => !m.npc) : null;
    const ch = me && this.checkChance ? this.checkChance(me, 'agi', 0.6, 0).chance / 100 : 0.7;
    this.advanceDays(2, { eventChance: 0 });
    if (RNG.chance(ch)) { p.driveLicense = true; this.log('운전면허 시험에 붙었다.', 'good'); return `운전면허를 땄다. (민첩 판정 ${Math.round(ch * 100)}%)`; }
    return `주행 시험에서 떨어졌다. 이틀과 응시료 ${fee} 크레딧을 날렸다. (민첩 판정 ${Math.round(ch * 100)}%)`;
  },
  // 월마다: 유지비, 도난
  ownVehicleMonthly() {
    const p = this.player; const o = p.ownVehicle; const V = o && ownVehById(o.id); if (!V) return;
    if (!OWN_VEHICLE_UPKEEP_EXTERNAL && V.upkeep) {
      const u = Math.min(p.money, V.upkeep); p.money -= u;
      if (u < V.upkeep) { o.cond = Math.max(0, o.cond - 20); this.log(`${V.name} 유지비를 다 못 냈다. 정비를 미뤄 상태가 나빠졌다.`, 'bad'); }
      else this.log(`${V.name} 유지비(기름·보험·주차) ${fmt(u)} 크레딧.`);
    }
    const theft = V.id === 'heli' ? 0 : V.id === 'suv' ? 0.008 : 0.02 + ((p.wanted || 0) > 0 ? 0.02 : 0);
    if (RNG.chance(theft)) { p.ownVehicle = null; this.applyTerrain(); this.log(`세워 둔 ${V.name}을(를) 도둑맞았다.`, 'bad'); }
  },
});

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  wrap('initSandbox', function (base) { base.call(this); this.player.ownVehicle ??= null; this.player.driveLicense ??= false; this.applyTerrain(); });
  wrap('applyTerrain', function (base) {
    base.call(this);
    const V = this.player && this.ownVehicle(); if (!V) return;
    const T = WORLD.T;
    if (V.fly) for (let i = 0; i < WORLD.T_COST.length; i++) if (WORLD.T_COST[i] > 1 && Number.isFinite(WORLD.T_COST[i])) WORLD.T_COST[i] = 1;
    if (V.mountain) WORLD.T_COST[T.MOUNTAIN] = Math.max(1, WORLD.T_COST[T.MOUNTAIN] * V.mountain);
  });
  // 이동력: 대여와 소유 중 큰 쪽
  wrap('moveRange', function (base) {
    const r = base.call(this); const V = this.ownVehicle(); if (!V) return r;
    const rv = this.player.vehicle && typeof vehicleById === 'function' && vehicleById(this.player.vehicle.id);
    return r + Math.max(0, V.range - (rv ? rv.range : 0));
  });
  wrap('walkStep', function (base, x, y, diag) {
    const p = this.player; const V = this.ownVehicle();
    if (V && V.road && WORLD.isRoad(x, y)) p.dayFrac = (p.dayFrac || 0) - WORLD.stepCostAt(x, y) * (diag ? 1.4 : 1) * WORLD.DAYS_PER_COST * (1 - V.road);
    const res = base.call(this, x, y, diag);
    if (!V) return res;
    if (V.noAmbush) {
      const before = this.queue.length;
      this.queue = this.queue.filter((q) => q.type !== 'mobAmbush');
      if (this.queue.length !== before) res.stop = !!res.city || !!this.objAt(x, y) || this.queue.some((q) => q.type !== 'toast');
    }
    // 닳고, 가끔 고장
    const o = p.ownVehicle;
    if (o && !V.provided && !o.broken) {
      o.cond = Math.max(0, o.cond - (V.id === 'bicycle' ? 0.1 : 0.2));
      if (!res.city && RNG.chance(o.cond < 40 ? 0.02 : 0.002)) {
        o.broken = true; this.applyTerrain();
        this.queue.push({ type: 'toast', text: `${V.name}이(가) 퍼졌다. 차고에서 정비하기 전까지는 걸어야 한다.` }); res.stop = true;
      }
    }
    return res;
  });
  wrap('spawnMonthly', function (base) {
    base.call(this);
    const w = this.world; if (!w) return; const key = this.monthKey();
    if (w.ownVehKey === key) return; w.ownVehKey = key;
    this.ownVehicleMonthly();
  });
  // 게이트 앞 주차: 위험한 게이트(브레이크 지역·붉은 게이트·내 등급 위)에서 나오면 차가 부서져 있을 수 있다
  wrap('finishGate', function (base, gate, ...rest) {
    const r = base.call(this, gate, ...rest);
    const p = this.player; const o = p && p.ownVehicle; const V = o && ownVehById(o.id);
    if (V && !V.fly && V.id !== 'bicycle' && gate) {
      const risky = (this.cityBreak && this.cityBreak(gate.region)) || gate.variant === 'red' || gate.tier > p.rankIdx;
      if (risky && RNG.chance(0.2)) {
        const d = RNG.int(20, 45); o.cond = Math.max(0, o.cond - d); if (o.cond <= 10) o.broken = true; this.applyTerrain();
        this.log(`게이트 앞에 세워 둔 ${V.name}이(가) 괴수 발톱에 긁혔다. 상태 -${d}${o.broken ? ', 움직이지 않는다' : ''}.`, 'bad');
      }
    }
    return r;
  });
}

// ---------- 화면: 차량 대여소 위에 "내 차" ----------
Object.assign(UI, {
  ownVehicleHtml() {
    const p = G.player; const o = p.ownVehicle; const V = o && ownVehById(o.id); const prov = !V && G.ownVehicle();
    const mine = V ? `<div class="item-row hl"><div class="grow"><b>내 차: ${V.name}</b> <span class="small ${o.broken ? 'bad' : o.cond < 40 ? 'amber' : 'dim'}">${o.broken ? '고장' : `상태 ${Math.round(o.cond)}%`}</span>
        <div class="small dim">${V.desc} · 월 유지비 ${fmt(V.upkeep)}</div></div>
        <div class="ov-btns"><button class="sm" data-act="ov-repair" ${o.cond >= 100 && !o.broken ? 'disabled' : ''}>정비 ${fmt(G.ownVehicleRepairCost())}</button><button class="sm ghost" data-act="ov-sell">팔기 ${fmt(G.ownVehicleValue())}</button></div></div>`
      : prov ? `<div class="item-row hl"><div class="grow"><b>${prov.name}</b><div class="small dim">소속이 내준 차. 내 차가 없을 때 이것을 탄다. ${prov.desc}</div></div></div>`
        : '<p class="small dim">아직 뚜벅이다. 탈것을 사면 도시 밖 이동이 빨라지지만 유지비가 들고, 고장·도난·주차 중 파손이 생긴다.</p>';
    const trade = G.ownVehicleValue();
    const rows = OWN_VEHICLES.filter((x) => !V || x.id !== V.id).map((x) => { const req = G.ownVehicleReq(x); const cost = G.ownVehiclePrice(x) - trade;
      return `<div class="item-row"><div class="grow"><b>${x.name}</b>${req ? ` <span class="small bad">${req}</span>` : ''}<div class="small dim">${x.desc}${x.upkeep ? ` · 월 유지비 ${fmt(x.upkeep)}` : ''}</div></div>
        <button class="sm" data-act="ov-buy" data-v="${x.id}" ${req || p.money < cost ? 'disabled' : ''}>${cost < 0 ? `+${fmt(-cost)}` : `${FX.icon('coin', 13)} ${fmt(cost)}`}${trade ? '*' : ''}</button></div>`; }).join('');
    return `<div class="sec-title sec">내 이동 수단</div>${mine}
      ${p.driveLicense ? '' : `<div class="item-row"><div class="grow"><b>운전면허 시험</b><div class="small dim">이틀 · 민첩 판정. 승용차부터 필요하다.</div></div><button class="sm" data-act="ov-license" ${p.money < 150 ? 'disabled' : ''}>${FX.icon('coin', 13)} 150</button></div>`}
      <div class="cards">${rows}</div>${trade ? '<div class="small dim">* 지금 차를 넘긴 값을 뺀 가격 (+는 돌려받는 돈)</div>' : ''}
      <div class="sec-title sec">빌려 보기</div>`;
  },
});
{
  const baseG = UI.garageHtml;
  UI.garageHtml = function () { return this.ownVehicleHtml() + baseG.call(this); };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'ov-buy': return this.afterCity(fixJosa(G.buyOwnVehicle(v)));
      case 'ov-sell': return this.afterCity(fixJosa(G.sellOwnVehicle()));
      case 'ov-repair': return this.afterCity(fixJosa(G.repairOwnVehicle()));
      case 'ov-license': return this.afterCity(fixJosa(G.licenseTest()));
      default: return baseHandle.call(this, act, v);
    }
  };
}
