// 동료의 전투 자원을 전투 사이와 저장 파일에 유지한다.
{
  const proto = Game.prototype;
  const init = proto.initSandbox;
  proto.initSandbox = function (...args) {
    const out = init.apply(this, args);
    for (const n of this.npcs || []) n.combatVitals ??= null;
    return out;
  };
  const npcUnit = proto.npcUnit;
  proto.npcUnit = function (n, side) {
    const u = npcUnit.call(this, n, side);
    const v = n.combatVitals;
    if (side === 'ally' && v) {
      // 시험용 능력 제한이나 성장으로 최대치가 바뀌어도 남은 비율을 유지한다.
      u.hp = Math.max(0, Math.min(u.maxHp, Math.round(v.hp * u.maxHp / (v.maxHp || u.maxHp))));
      u.mp = Math.max(0, Math.min(u.maxMp, Math.round(v.mp * u.maxMp / (v.maxMp || u.maxMp))));
      if (v.hp > 0) u.hp = Math.max(1, u.hp);
    }
    return u;
  };
  const sync = () => {
    const cb = UI.ctx && UI.ctx.combat;
    // 지도의 전투 요약 객체에는 지난 전투 유닛이 남아 있으므로 동기화하지 않는다.
    if (!(cb instanceof Combat)) return;
    for (const u of cb.units) {
      if (u.side !== 'ally' || u.summon || u.npcId == null) continue;
      const n = G.npcById(u.npcId);
      if (n) n.combatVitals = { hp: Math.max(0, u.hp), mp: Math.max(0, u.mp), maxHp: u.maxHp, maxMp: u.maxMp };
    }
  };
  for (const name of ['afterPlay', 'gateSync', 'finishGate', 'finishPersonalCombat', 'finishStoryFight', 'finishTourney']) {
    const base = UI[name];
    if (typeof base !== 'function') continue;
    UI[name] = function (...args) { sync(); return base.apply(this, args); };
  }
  const save = proto.save;
  proto.save = function (...args) { if (this === G) sync(); return save.apply(this, args); };
}
