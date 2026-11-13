// ===== 게이트 크로니클: 내 이동 수단 (구매·소유) — 효과와 화면 =====
// 구현_대기목록 4-24 ③. 처음은 뚜벅이. 자전거 → 중고 오토바이 → 승용차 → 헌터용 SUV → 개인 헬기.
// 가격·유지비·수리비·구매·판매·고장 처리는 영역 E의 js/transport_econ.js(OWN_VEHICLES, buyOwnVehicle …)가 맡는다.
// 여기서는 탈것이 지도 이동에 주는 효과, 닳음·고장·도난·주차 파손 사건, 운전면허 시험, 차고 화면만 맡는다.
// travel.js 대여(한 달·1회)는 그대로 두고 "사기 전에 빌려 보기" 역할. 대여와 겹치면 이동력은 큰 쪽만.
// 저장: G.player.ownVehicle(E와 같은 필드), G.player.driveLicense (p.license 는 헌터 등록번호라 따로)

const OWN_VEH_FX = {
  bicycle: { range: 2, desc: '도보보다 1.5배 빠른 이동. 이동력 +2.' },
  usedbike: { range: 5, desc: '도보보다 3배 빠른 이동. 이동력 +5.' },
  car: { range: 3, road: 0.5, desc: '이동력 +3, 이동 시간 절반, 국도 위에서는 추가 절반. 운전면허 필요.' },
  suv: { range: 4, road: 0.5, mountain: 0.67, noAmbush: true, desc: '이동력 +4, 이동 시간 절반, 국도 위에서는 추가 절반, 산길 비용 감소, 괴수 기습 무시. C급 이상 장비 허가.' },
  heli: { range: 14, fly: true, noAmbush: true, desc: '이동력 +14, 도보보다 10배 빠르게 이동, 산도 평지처럼 넘고 괴수 기습을 받지 않는다. A급 이상 비행 허가.' },
};
const ownVehFx = (id) => {
  const V = typeof ownVehicleById === 'function' ? ownVehicleById(id) : null;
  const fx = OWN_VEH_FX[id];
  return V && fx ? { ...V, ...fx } : null;
};

Object.assign(Game.prototype, {
  // 지금 쓰는 내 탈것 (고장·유지비 밀림이면 없음). 내 차가 없으면 소속이 내주는 차.
  ownVehicle() {
    const p = this.player; if (!p) return null;
    const o = p.ownVehicle;
    if (o && !o.broken && !o.unpaid) return ownVehFx(o.id);
    const car = ownVehFx('car'); if (!car) return null;
    if (this.isCivil && this.isCivil()) return { ...car, name: '관리국 공용차', provided: true };
    if (p.guild && p.guild !== 'kama' && typeof GUILDS !== 'undefined' && GUILDS[p.guild] && (p.guildRank || 0) >= 2) return { ...car, name: `${GUILDS[p.guild].name} 차량`, provided: true };
    return null;
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
  // 월마다 도난 (유지비는 E의 transportMonthly)
  ownVehicleTheft() {
    const p = this.player; const o = p.ownVehicle; const V = o && ownVehFx(o.id); if (!V) return;
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
    // 안쪽 crew_time도 시간을 절반으로 줄인다. 같은 시간 기준에서 국도 보정을 빼야 0분이 되지 않는다.
    const partyTime = typeof UI !== 'undefined' && UI.crewMarch?.ride === 'truck' ? .5 : 1;
    if (V && V.road && WORLD.isRoad(x, y)) p.dayFrac = (p.dayFrac || 0) - WORLD.stepCostAt(x, y) * (diag ? 1.4 : 1) * WORLD.DAYS_PER_COST * partyTime * (1 - V.road);
    const res = base.call(this, x, y, diag);
    if (!V) return res;
    if (V.noAmbush) {
      const before = this.queue.length;
      this.queue = this.queue.filter((q) => q.type !== 'mobAmbush');
      if (this.queue.length !== before) res.stop = !!res.city || !!this.objAt(x, y) || this.queue.some((q) => q.type !== 'toast');
    }
    // 가끔 고장 (수리비는 E의 repairOwnVehicle)
    const o = p.ownVehicle;
    if (o && !V.provided && !res.city && RNG.chance(V.id === 'bicycle' ? 0.001 : 0.003)) {
      const msg = this.breakOwnVehicle('길 위에서 퍼졌다'); this.applyTerrain();
      this.queue.push({ type: 'toast', text: `${msg} 차고에서 고치기 전까지는 걸어야 한다.` }); res.stop = true;
    }
    return res;
  });
  wrap('spawnMonthly', function (base) {
    base.call(this);
    const w = this.world; if (!w) return; const key = this.monthKey();
    if (w.ownVehKey === key) return; w.ownVehKey = key;
    this.ownVehicleTheft();
  });
  // 게이트 앞 주차: 위험한 게이트(브레이크 지역·붉은 게이트·내 등급 위)에서 나오면 차가 부서져 있을 수 있다
  wrap('finishGate', function (base, gate, ...rest) {
    const r = base.call(this, gate, ...rest);
    const p = this.player; const o = p && p.ownVehicle; const V = o && !o.broken && ownVehFx(o.id);
    if (V && !V.fly && V.id !== 'bicycle' && gate) {
      const risky = (this.cityBreak && this.cityBreak(gate.region)) || gate.variant === 'red' || gate.tier > p.rankIdx;
      if (risky && RNG.chance(0.2)) { this.log(this.breakOwnVehicle('게이트 앞에 세워 둔 사이 괴수 발톱에 긁혔다'), 'bad'); this.applyTerrain(); }
    }
    return r;
  });
}

// ---------- 화면: 차량 대여소 위에 "내 차" ----------
Object.assign(UI, {
  ownVehicleHtml() {
    if (typeof OWN_VEHICLES === 'undefined') return '';
    const p = G.player; const o = p.ownVehicle; const V = o && ownVehFx(o.id); const prov = !V && G.ownVehicle();
    const state = o ? (o.broken ? '<span class="small bad">고장</span>' : o.unpaid ? `<span class="small bad">유지비 밀림 ${o.unpaid}개월 · 세워 둠</span>` : '<span class="small good">운행 중</span>') : '';
    const mine = V ? `<div class="item-row hl"><div class="grow"><b>내 차: ${V.name}</b> ${state}
        <div class="small dim">${V.desc} · 월 유지비 ${fmt(V.upkeep)}</div></div>
        <div class="ov-btns">${o.broken ? `<button class="sm" data-act="ov-repair" ${p.money < G.ownRepairCost(o.id) ? 'disabled' : ''}>수리 ${fmt(G.ownRepairCost(o.id))}</button>` : ''}<button class="sm ghost" data-act="ov-sell">팔기 ${fmt(Math.round(G.ownVehicleResale(o.id) * (o.broken ? 0.5 : 1)))}</button></div></div>`
      : prov ? `<div class="item-row hl"><div class="grow"><b>${prov.name}</b><div class="small dim">소속이 내준 차. 내 차가 없을 때 이것을 탄다. ${prov.desc}</div></div></div>`
        : '<p class="small dim">아직 뚜벅이다. 탈것을 사면 도시 밖 이동이 빨라지지만 유지비가 들고, 고장·도난·주차 중 파손이 생긴다.</p>';
    const trade = o ? G.ownVehicleResale(o.id) : 0;
    const rows = OWN_VEHICLES.filter((x) => (!o || x.id !== o.id) && OWN_VEH_FX[x.id]).map((x) => { const why = G.ownVehicleBlock(x.id); const cost = G.ownVehiclePrice(x.id) - trade;
      return `<div class="item-row"><div class="grow"><b>${x.name}</b>${why ? ` <span class="small bad">${x.needLicense && !p.driveLicense ? '면허 필요' : x.minRank ? `${RANKS[x.minRank].key}급 이상` : why}</span>` : ''}<div class="small dim">${OWN_VEH_FX[x.id].desc}${x.upkeep ? ` · 월 유지비 ${fmt(x.upkeep)}` : ''}</div></div>
        <button class="sm" data-act="ov-buy" data-v="${x.id}" ${why || p.money < cost ? 'disabled' : ''}>${cost < 0 ? `+${fmt(-cost)}` : `${FX.icon('coin', 13)} ${fmt(cost)}`}${trade ? '*' : ''}</button></div>`; }).join('');
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
      case 'ov-buy': { const r = G.buyOwnVehicle(v); G.applyTerrain(); G.save(); return this.afterCity(fixJosa(r)); }
      case 'ov-sell': { const r = G.sellOwnVehicle(); G.applyTerrain(); G.save(); return this.afterCity(fixJosa(r)); }
      case 'ov-repair': { const r = G.repairOwnVehicle(); G.applyTerrain(); G.save(); return this.afterCity(fixJosa(r)); }
      case 'ov-license': return this.afterCity(fixJosa(G.licenseTest()));
      default: return baseHandle.call(this, act, v);
    }
  };
}
