// ---------- 높은 등급 성장 속도 (평가 보고 2순위, docs/성장_밸런스_분석.md 4절 목표) ----------
// 게이트·파티형이 S 23~34세, SS 31~42세에 닿아 그 뒤 50년이 비던 문제.
// 목표: "열심히 하면 S급은 40세 전후, SS는 한 생에 될까 말까". B~S 단계 요구 에테르만 올린다(F~C 초반 속도는 그대로).
if (typeof stageReq === 'function') {
  const baseStageReq = stageReq;
  const HIGH_PACE = [1, 1, 1, 1, 1.3, 1.8, 2.6, 1];
  // eslint-disable-next-line no-global-assign
  stageReq = function (r, s) { return Math.floor(baseStageReq(r, s) * (HIGH_PACE[r] || 1)); };
}
