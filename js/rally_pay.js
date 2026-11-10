// ===== 집결 지각·불참 기록 → 분배·급여 불이익 (영역 E, payroll.js RALLY_PAY) =====
// leader_rule.js(D)의 rallyGo·rallyMiss 뒤에 실려야 해서 따로 둔다. 수치는 payroll.js RALLY_PAY, docs/E_수치.md
if (typeof UI !== 'undefined') {
  const baseRallyGo = UI.rallyGo;
  if (baseRallyGo) UI.rallyGo = function (late) { const pay = G.player.pay; if (pay && late > 0) { pay.lateNow = late; pay.lateDays = (pay.lateDays || 0) + late; } const r = baseRallyGo.call(this, late); if (this.ctx && this.ctx.kind === 'mob') this.ctx.crewRaid = true; return r; };
  const baseRallyMiss = UI.rallyMiss;
  if (baseRallyMiss) UI.rallyMiss = function () { const pay = G.player.pay; const r = G.rally && G.rally(); if (pay && r && !r.mixed) pay.missMonth = (pay.missMonth || 0) + 1; return baseRallyMiss.call(this); };
}
