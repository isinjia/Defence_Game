// ===== 게이트 크로니클: 탐색계는 월드맵 시야가 넓다 (영역 A, 사용자 요청) =====
// 시야(안개 걷힘)를 크게 줄인 대신, 나나 파티원 중 탐색계가 있으면 넓어진다. 가장 잘 보는 한 사람 기준(G.partyScout).
//  - 등급: F~D급 +1칸, C~B급 +2칸, A급 이상 +3칸
//  - 전직(엘리트·마스터 등) 1단계마다 +1칸
//  - 레인저: 산·숲에 서면 +2칸 (높은 곳·우거진 곳에서 멀리 본다)
//  - 패스파인더: 늘 +1칸 (길잡이)
// 북부의 짙은 안개(north.js)는 그대로 시야 1칸이다.
const RECON_VISION = { rank: [1, 1, 1, 2, 2, 3, 3, 3], adv: 1, rangerHigh: 2, wayfinder: 1 };
{
  const GP = Game.prototype;
  GP.reconVisionBonus = function (x, y) {
    const sc = this.partyScout ? this.partyScout() : null; if (!sc) return 0;
    let b = RECON_VISION.rank[Math.max(0, Math.min(7, sc.rankIdx || 0))] + (sc.adv || 0) * RECON_VISION.adv;
    if (sc.cls === 'pathfinder' && x != null) { const t = WORLD.type(x, y); if (t === WORLD.T.MOUNTAIN || t === WORLD.T.FOREST) b += RECON_VISION.rangerHigh; }
    if (sc.cls === 'wayfinder') b += RECON_VISION.wayfinder;
    return b;
  };
  // 시야 반경 계산(world_scale.js)과 같은 식으로 기본 반경을 구해 그 위에 더 밝힌다
  const fill = (g, x, y, r) => {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r + r || !WORLD.inb(x + dx, y + dy)) continue;
      g.fog[WORLD.idx(x + dx, y + dy)] = 1;
    }
  };
  const baseReveal = GP.reveal;
  GP.reveal = function (x, y, r, ...a) {
    const out = baseReveal.call(this, x, y, r, ...a);
    try {
      if (r <= 6 && this.fog && this.player) {
        const bonus = this.reconVisionBonus(x, y);
        if (bonus > 0) fill(this, x, y, Math.max(1, Math.round(r * WORLD.K * 0.128)) + bonus);
      }
    } catch (e) { /* 무시 */ }
    return out;
  };
}
