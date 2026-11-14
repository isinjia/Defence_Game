// ===== 게이트 크로니클: 하루 이동 칸 수 (사용자 확정: "걸어서는 가장 느린 게 하루 4칸, 파티는 가장 느린 사람 기준, NPC 게이트 팀도 4칸·차량 있으면 다름") =====
// world_travel_time.js(이동 시간을 dayFrac에 누적) 위에 얹는다. 그 파일의 '한 칸 15분' 기준을 '한 칸 = 하루의 1/4'로 바꾼다.
//  - 도보: 가장 느린 사람 하루 평지 4칸. 속도(spd)가 높으면 5~6칸. 파티가 함께 걸으면 가장 느린 사람 기준.
//  - 탈것: world_travel_time.js 의 탈것 배율 그대로(자전거 6칸, 승용차 8칸, 오토바이 12칸, 헬기 40칸 정도).
//  - NPC 게이트 공략팀: 도보 하루 4칸, 차량이 있는 팀(길드·관리국)은 하루 8칸 (map_parties.js raidRoute).
const WALK_PACE = { slowest: 4, fastest: 6, spdBase: 10, spdStep: 15, npcWalk: 4, npcCar: 8 };
if (typeof Game !== 'undefined') {
  const GP = Game.prototype;
  const rateOf = (n) => Math.min(WALK_PACE.fastest, WALK_PACE.slowest + Math.floor(Math.max(0, (Number(n && n.spd) || 0) - WALK_PACE.spdBase) / WALK_PACE.spdStep));
  GP.walkRate = function () {
    let r = rateOf(this.player);
    try { for (const n of (this.party ? this.party() : [])) r = Math.min(r, rateOf(n)); } catch (e) { /* 파티 정보 없으면 나 혼자 */ }
    return r;
  };
  // 도보 배율: 가장 느린 사람(4칸)을 1로, 빠를수록 작게
  GP.travelFootFactor = function () { return this.travelIsOnFoot && !this.travelIsOnFoot() ? 1 : WALK_PACE.slowest / this.walkRate(); };
  GP.travelBaseDays = function (cost, diag = false) {
    let days = cost * WORLD.DAYS_PER_COST;
    if (!this.travelIsOnFoot || this.travelIsOnFoot()) days *= this.travelFootFactor();
    return days * (diag ? 1.4 : 1);
  };
  // 기준: 평지 한 칸 = 하루의 1/4 (탈것 배율은 world_travel_time.js 가 곱해 둔 값을 그대로 비례 유지)
  const baseAT = GP.applyTerrain;
  GP.applyTerrain = function (...a) { const r = baseAT.apply(this, a); WORLD.DAYS_PER_COST = WORLD.DAYS_PER_COST / (15 / 1440) / WALK_PACE.slowest; return r; };
  // NPC 공략팀 도착 일수
  const baseRR = GP.raidRoute;
  if (baseRR) GP.raidRoute = function (g) {
    const r = g && g.raid;
    if (r && r.eta == null && r.from) {
      const dist = Math.max(Math.abs(r.from[0] - g.x), Math.abs(r.from[1] - g.y));
      const lead = (r.ids || []).map((id) => this.npcById(id)).find((n) => n);
      const car = !!(lead && (lead.guild || lead.civil));
      r.eta = Math.max(1, Math.ceil(dist / (car ? WALK_PACE.npcCar : WALK_PACE.npcWalk)));
    }
    return baseRR.call(this, g);
  };
}
