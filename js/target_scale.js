// ===== 대상 수에 따른 효과 배율 (사용자 결정 2026-11-15) =====
// "본인에게 쓰면 효과가 좋고, 단일로 다른 사람에게 주면 낮아지고, 다수면 더 낮아져야 한다. 공격도 단일이면 높고 다수면 낮다."
//   본인 ×1.0 · 다른 사람 1명 ×0.8 · 2명 ×0.75 · 3명 ×0.65 · 4명 이상 ×0.55
// - 광역 공격(aoe): 실제로 맞는 적 수로 배율. 적이 하나면 줄지 않는다. 단일·연타 공격은 그대로.
// - 파티 강화·방어·가속(buff_all·shield_all), 적 전체 약화·위축(debuff), 전체 치유(heal_all): 받는 수로 배율.
//   전체 치유를 혼자 쓸 때 붙던 0.55배 벌칙은 없앤다(본인 ×1.0).
// - 동료 치유(heal_ally): 본인에게 쓰면 ×1.0(전의 0.55배 벌칙 없앰), 다른 사람에게 ×0.8.
// - 자기 강화·방어·회피·자기 치유는 그대로. 동료·적 모두 같은 규칙.
const TARGET_SCALE = (n) => (n <= 1 ? 1 : n === 2 ? 0.75 : n === 3 ? 0.65 : 0.55);
{
  const MULTI = ['aoe', 'buff_all', 'shield_all', 'debuff', 'heal_all'];
  if (typeof Combat !== 'undefined') {
    const C = Combat.prototype;
    const baseUse = C.useSkill;
    C.useSkill = function (u, skill, target) {
      if (!skill || !u) return baseUse.call(this, u, skill, target);
      const t = skill.type;
      if (MULTI.includes(t)) {
        const n = (t === 'aoe' || t === 'debuff') ? this.foesOf(u).length : this.friendsOf(u).length;
        let k = TARGET_SCALE(n);
        if (t === 'heal_all' && n === 1) k = 1 / 0.55; // 원래 혼자일 때 0.55배 → 본인 ×1.0
        if (k === 1) return baseUse.call(this, u, skill, target);
        return baseUse.call(this, u, { ...skill, power: Math.round(skill.power * k * 1000) / 1000, _tscale: k }, target);
      }
      if (t === 'heal_ally') {
        const friends = this.friendsOf(u);
        const tg = target && target.side === u.side && target.alive && !target.summon ? target : friends.filter((f) => !f.summon).reduce((a, b) => (b.hp / b.maxHp < a.hp / a.maxHp ? b : a), u);
        const k = tg === u ? 1 / 0.55 : 0.8; // 본인: healUnit 의 0.55배 벌칙을 상쇄해 ×1.0
        return baseUse.call(this, u, { ...skill, power: Math.round(skill.power * k * 1000) / 1000, _tscale: k }, target);
      }
      return baseUse.call(this, u, skill, target);
    };
  }
  // 스킬 정보창에 규칙 한 줄
  if (typeof UI !== 'undefined' && UI.skillHoldHtml) {
    const baseHold = UI.skillHoldHtml;
    UI.skillHoldHtml = function (sk, u) {
      const h = baseHold.call(this, sk, u);
      const note = sk && MULTI.includes(sk.type) ? '대상이 많을수록 약해짐 (1명 ×1 · 2명 ×0.75 · 3명 ×0.65 · 4명+ ×0.55)'
        : sk && sk.type === 'heal_ally' ? '본인 ×1 · 다른 사람 ×0.8' : '';
      return note ? h.replace('<th>대상</th>', '<th>대상</th>').replace(/(<tr><th>대상<\/th><td>[^<]*)(<\/td><\/tr>)/, `$1<br><span class="dim small">${note}</span>$2`) : h;
    };
  }
}
