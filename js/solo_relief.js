// ===== 게이트 크로니클: 솔로 편차 완화 (영역 C) =====
// 평가 보고 '솔로 게이트형은 판마다 편차가 크다' 대응.
// 1. 혼자 싸울 때 역할 보정: 지원·탱커·초능력형은 혼자서 화력이 모자라 솔로 승률이 낮다.
// 2. 연패 고리 끊기: 치료비·부상 감면은 E affil_risk.js로 넘겼다. 여기서는 혼자일 때 '벼랑 끝 집중'(공·방 +10~30%)을 걸고, 낮은 게이트·용병을 안내한다.

const SOLO_ROLE = {
  support: { atk: 1.85, def: 1.25 }, caster: { atk: 1.4, def: 1.2 }, esper: { atk: 1.35, def: 1.15 }, tank: { atk: 1.35 },
  melee: { atk: 1.15, def: 1.05 }, summoner: { atk: 1.05 },
};

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };

  wrap('initSandbox', function (base) {
    base.call(this);
    this.player.loseStreak ??= 0;
  });

  wrap('playerUnit', function (base) {
    const u = base.call(this);
    if (this.party().length) return u;
    const c = CLASSES.find((x) => x.id === this.player.cls);
    const m = c && SOLO_ROLE[c.role];
    if (m) { if (m.atk) u.atk = Math.round(u.atk * m.atk); if (m.def) u.def = Math.round(u.def * m.def); }
    // 벼랑 끝 집중: 연패 중인 솔로는 다음 공략까지 공격·방어 +10%씩 (최대 +30%)
    const k = Math.min(3, Math.max(0, (this.player.loseStreak || 0) - 1));
    if (k) { u.atk = Math.round(u.atk * (1 + 0.1 * k)); u.def = Math.round(u.def * (1 + 0.1 * k)); }
    return u;
  });

  wrap('finishGate', function (base, gate, result, loot, hpLeft, mpLeft) {
    const p = this.player;
    const lines = base.call(this, gate, result, loot, hpLeft, mpLeft);
    if (result !== 'lose') { if (result === 'clear') p.loseStreak = 0; return lines; }
    p.loseStreak = (p.loseStreak || 0) + 1;
    // 치료비·부상은 E의 js/affil_risk.js(소속별 의료 지원·무소속 청구서·헌터 보험)가 맡는다. 여기서는 안내와 벼랑 끝 집중만.
    if (p.loseStreak >= 2) {
      const tip = '연패 중이다. 벼랑 끝 집중: 다음 공략 성공까지 공격·방어가 오른다. 한 단계 낮은 게이트나 용병·임시 파티를 고려하자.';
      if (Array.isArray(lines)) lines.push(tip);
      this.log(tip, 'major');
    }
    return lines;
  });
}
