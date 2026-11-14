// 월드맵 이동 속도: 하루에 가는 칸 수로 정한다 (사용자 결정)
//  - 걸어서는 가장 느린 사람이 하루 4칸(평지 한 칸 6시간, 국도 3시간, 산 12시간). SPD가 높으면 조금 빠르다(최대 약 8.6칸).
//  - 파티가 걸어서 가면 가장 느린 사람에게 맞춘다(나 + 함께 다니는 파티원).
//  - 탈것이 있으면 탈것 속도(하루 칸 수, 평지 기준): 자전거 10 · 중고 오토바이 16 · 오토바이 20 · 차·SUV·트럭·파티 장갑차 24 · 헬기 120.
//    개인 차량의 국도 보정(own_vehicle.js)은 그대로 곱한다.
//  - NPC 게이트 공략팀도 같은 규칙: 걸어서는 가장 느린 팀원 기준, 팀 차량이 있으면 하루 24칸.
//    팀 차량: 길드·협회 팀은 있고, 프리랜서 팀은 리더가 C급 이상일 때만.
// 시간 계산의 뼈대(js/world_travel_time.js — 칸마다 소수 일수 누적, formatTravelTime)는 그대로 쓰고 속도만 바꾼다.
const TRAVEL_PACE = { walkMin: 4, vehicle: { bicycle: 10, usedbike: 16, bike: 20, car: 24, suv: 24, truck: 24, heli: 120 }, teamCar: 24 };
{
  const GP = Game.prototype;
  // 한 사람의 도보 속도(하루 칸 수). SPD 곡선은 앞선 도보 규칙(SPD가 두 배가 될 때마다 조금씩 빨라짐)을 그대로 쓴다
  const walkPace = (spd) => {
    const s = Number.isFinite(+spd) ? +spd : 10;
    const minutes = Math.max(7, 15 - 2 * Math.log2(Math.max(1, s) / 10));
    return Math.max(TRAVEL_PACE.walkMin, TRAVEL_PACE.walkMin * Math.min(15 / minutes, 15 / 7));
  };
  TRAVEL_PACE.walk = walkPace;
  const unitSpd = (g, n) => { try { return g.npcUnit(n, 'ally').spd; } catch (e) { return n.spd ?? 10; } };

  // 지금 함께 걸어가는 사람 중 가장 느린 사람의 속도 (계산이 잦아 잠깐 기억해 둔다)
  let memo = { t: 0, key: '', v: TRAVEL_PACE.walkMin };
  GP.travelWalkPace = function () {
    const p = this.player; if (!p) return TRAVEL_PACE.walkMin;
    const party = this.party ? this.party() : [];
    const key = `${p.spd}|${party.map((n) => n.id).join(',')}`;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (memo.key === key && now - memo.t < 1000) return memo.v;
    let v = walkPace(p.spd);
    for (const n of party) v = Math.min(v, walkPace(unitSpd(this, n)));
    memo = { t: now, key, v };
    return v;
  };
  // 탈것 속도(없으면 0)
  GP.travelRidePace = function () {
    const p = this.player; if (!p) return 0;
    const ids = [p.vehicle && p.vehicle.id, this.ownVehicle && this.ownVehicle() && this.ownVehicle().id];
    if (typeof UI !== 'undefined' && UI.crewMarch && UI.crewMarch.ride === 'truck') ids.push('truck');
    return Math.max(0, ...ids.map((id) => TRAVEL_PACE.vehicle[id] || 0));
  };

  // 한 칸(비용 1)에 걸리는 날: 탈것이면 탈것 속도, 걸어서는 하루 4칸을 바탕으로 하고 실제 속도는 travelFootFactor 가 맞춘다
  const baseTerrain = GP.applyTerrain;
  GP.applyTerrain = function (...a) {
    const r = baseTerrain.apply(this, a);
    const ride = this.travelRidePace();
    WORLD.DAYS_PER_COST = 1 / (ride || TRAVEL_PACE.walkMin);
    return r;
  };
  // 걸어서: 바탕(하루 4칸)에 비해 얼마나 빠른가 (가장 느린 사람 기준). 1보다 작으면 빠르다
  GP.travelFootFactor = function () {
    if (this.travelIsOnFoot && !this.travelIsOnFoot()) return 1;
    return TRAVEL_PACE.walkMin / this.travelWalkPace();
  };
  // 파티 장갑차의 "두 배" 보정(crew_time.js·world_travel_time.js)은 탈것 속도에 이미 들어 있으므로 다시 곱하지 않는다
  GP.travelCostDays = function (cost, road = false, diag = false) {
    const own = this.ownVehicle && this.ownVehicle();
    const roadFactor = road && own && own.road ? own.road : 1;
    return Math.max(0, this.travelBaseDays(cost, diag) * roadFactor);
  };
  const baseWalk = GP.walkStep;
  GP.walkStep = function (x, y, diag) {
    if (typeof UI === 'undefined' || !UI.crewMarch || UI.crewMarch.ride !== 'truck') return baseWalk.call(this, x, y, diag);
    // crew_time.js 가 장갑차일 때 DAYS_PER_COST 를 반으로 줄이는 것을 되돌린다(속도는 위의 탈것 표가 정한다)
    const save = WORLD.DAYS_PER_COST; WORLD.DAYS_PER_COST = save * 2;
    try { return baseWalk.call(this, x, y, diag); } finally { WORLD.DAYS_PER_COST = save; }
  };

  // NPC 게이트 공략팀: 출발 도시에서 게이트까지 걸리는 날
  GP.raidPace = function (g) {
    const r = g.raid; const mem = (r.ids || []).map((id) => this.npcById(id)).filter((n) => n && n.alive);
    const a = r.actor || {}; const lead = mem.slice().sort((x, y) => y.rankIdx - x.rankIdx)[0];
    const car = a.kind === 'guild' || a.kind === 'assoc' || !!a.guild || (lead && lead.rankIdx >= 3);
    if (car) return TRAVEL_PACE.teamCar;
    return mem.length ? Math.min(...mem.map((n) => walkPace(unitSpd(this, n)))) : TRAVEL_PACE.walkMin;
  };
  if (GP.raidRoute) {
    const baseRoute = GP.raidRoute;
    GP.raidRoute = function (g) {
      const r = g && g.raid; if (r && r.eta == null && !r.etaPace) {
        const out = baseRoute.call(this, g); if (!out) return out;
        r.etaPace = 1; r.eta = Math.max(1, Math.min(30, Math.ceil(out.dist / this.raidPace(g))));
        return { ...out, eta: r.eta };
      }
      return baseRoute.call(this, g);
    };
  }
  // 옛 저장: 탈것·도보 속도를 새 규칙으로 다시 맞춘다
  const baseInit = GP.initSandbox;
  GP.initSandbox = function (...a) { const r = baseInit.apply(this, a); try { this.applyTerrain(); } catch (e) { /* 무시 */ } return r; };
}
