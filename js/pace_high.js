// ---------- 높은 등급 성장 속도 (평가 보고 2순위, docs/성장_밸런스_분석.md 4절 목표) ----------
// 게이트·파티형이 S 23~34세, SS 31~42세에 닿아 그 뒤 50년이 비던 문제.
// 목표: "열심히 하면 S급은 40세 전후, SS는 한 생에 될까 말까". B~S 단계 요구 에테르만 올린다(F~C 초반 속도는 그대로).
if (typeof stageReq === 'function') {
  const baseStageReq = stageReq;
  const HIGH_PACE = [1, 1, 1, 1, 1.3, 2.6, 6.0, 1]; // 4차 평가: 게이트·파티형 대부분 SS·랭킹 1위 → A·S 단계 요구량 상향
  // eslint-disable-next-line no-global-assign
  stageReq = function (r, s) { return Math.floor(baseStageReq(r, s) * (HIGH_PACE[r] || 1)); };
}

// 5차 평가: 돌파해도 체력이 +3~4%뿐(후기 ×1.3 → 다음 등급 초기 ×1.0으로 상쇄). 단계 보너스를 15% → 10%로 줄여
// 등급이 오를 때 확실히 강해지게 한다(F 후기 1.2 → E 초기 1.35, +12%).
if (typeof statMult === 'function' && typeof RANKS !== 'undefined') {
  // eslint-disable-next-line no-global-assign
  statMult = function (r, s) { return RANKS[r].mult * (1 + 0.10 * s); };
}
