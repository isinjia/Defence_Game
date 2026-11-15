// ===== 게이트 크로니클: 플레이 점검에서 찾은 흐름 보정 =====
// 1. 첫 공략(신입의 첫 게이트) 동안에는 경쟁 파티가 게이트 보스를 먼저 잡아 닫지 않는다.
//    자동 플레이 점검에서 첫 공략이 '선점당했다 · 받은 크레딧 0'으로 끝나 첫 게이트를 다시 신청해야 했다.
//    첫 경험은 끝까지 해 보게 하고, 경쟁은 그다음 게이트부터.
{
  const GP = Game.prototype;
  const firstGate = (g, gate) => {
    const s = g.player && g.player.firstSortie;
    return !!(s && s.status === 'active' && gate && (s.gate == null || s.gate === gate.id));
  };
  const baseStep = GP.gatePartiesStep;
  if (baseStep) GP.gatePartiesStep = function (gate, run) {
    const ev = baseStep.call(this, gate, run);
    if (!firstGate(this, gate)) return ev;
    return ev.filter((e) => e.type !== 'closed');
  };
  const baseBoss = GP.gatePartyBoss;
  if (baseBoss) GP.gatePartyBoss = function (gate, pt) {
    if (firstGate(this, gate)) return null; // 첫 공략 중엔 보스전에 끼어들지 않는다(다음 층으로도 서두르지 않음)
    return baseBoss.call(this, gate, pt);
  };
}
