// ===== 게이트 크로니클: 역할 구성 보너스 (영역 A-γ, docs/전투_제안.md 10) =====
// "탱 하나, 힐 하나, 딜 셋" 공대 모집 공식. 파티(소환수 제외)에 방어형·지원형·공격형이 모두 있으면 작은 보너스.
// - 균형 잡힌 파티: 아군이 받는 피해 −6%, 차례마다 정신력 +2% 더 회복.
// - 정석 진형(진형 js/formation.js와 맞물림): 방어형이 전열, 지원형이 후열에 서 있으면 받는 피해 −3% 더.
// 방어형=탱커, 지원형=서포터, 공격형=그 밖의 역할.
// 화면: 전투 머리말 제목 옆 작은 표시(높이 추가 없음), 파티 창 진형 아래 한 줄.

const PB_ROLE = { tank: 'guard', support: 'heal' };
const PB_NAME = { guard: '방어형', heal: '지원형', dps: '공격형' };
const PB_DMG = 0.06, PB_FORM_DMG = 0.03, PB_MP = 0.02;

function pbRoleOf(cls) { const r = (classById(cls) || {}).role; return PB_ROLE[r] || 'dps'; }
// units: [{ cls, row }] → { has: {guard,heal,dps}, full, form, red, mp }
function partyBonusOf(units) {
  const has = { guard: 0, heal: 0, dps: 0 };
  for (const u of units) has[pbRoleOf(u.cls)]++;
  const full = units.length >= 3 && has.guard > 0 && has.heal > 0 && has.dps > 0;
  const form = full && units.some((u) => pbRoleOf(u.cls) === 'guard' && u.row === 'front') && units.some((u) => pbRoleOf(u.cls) === 'heal' && u.row === 'back');
  return { has, full, form, red: full ? PB_DMG + (form ? PB_FORM_DMG : 0) : 0, mp: full ? PB_MP : 0 };
}

Object.assign(Combat.prototype, {
  partyBonus() {
    if (this._pb) return this._pb;
    if (!this.formed && this.assignFormation) { this.formed = true; this.assignFormation(); }
    const core = this.units.filter((u) => u.side === 'ally' && !u.summon);
    return (this._pb = this.spar ? partyBonusOf([]) : partyBonusOf(core));
  },
});

{
  const CP = Combat.prototype;
  const baseCalc = CP.calcDamage;
  CP.calcDamage = function (att, def, skill, opt = {}) {
    const r = baseCalc.call(this, att, def, skill, opt);
    if (def && def.side === 'ally' && att && att.side === 'enemy') {
      const pb = this.partyBonus();
      if (pb.red) r.dmg = Math.max(1, Math.round(r.dmg * (1 - pb.red)));
    }
    return r;
  };
  const baseTurn = CP.takeTurn;
  CP.takeTurn = function (u) {
    if (u && u.side === 'ally' && !u.summon && u.alive) { const pb = this.partyBonus(); if (pb.mp) u.mp = Math.min(u.maxMp, u.mp + Math.round(u.maxMp * pb.mp)); }
    return baseTurn.call(this, u);
  };
}

Object.assign(UI, {
  partyBonusTitle(pb) {
    if (!pb.full) return `역할 구성: ${['guard', 'heal', 'dps'].filter((k) => !pb.has[k]).map((k) => PB_NAME[k]).join('·')} 없음`;
    return `균형 잡힌 파티: 받는 피해 −${Math.round(pb.red * 100)}%, 정신력 회복 +${Math.round(pb.mp * 100)}%${pb.form ? ' (정석 진형 포함)' : ''}`;
  },
  // 전투 머리말 제목 옆 표시
  drawPartyBonus() {
    const c = this.ctx; const cb = c && c.combat; if (!cb || !cb.partyBonus) return;
    const head = document.querySelector('#modal-box .cb-head'); if (!head) return;
    const pb = cb.partyBonus();
    let tag = head.querySelector('.pb-tag');
    if (!pb.full || cb.result) { if (tag) tag.remove(); return; }
    if (!tag) {
      const h = head.querySelector('h3'); if (!h) return;
      h.insertAdjacentHTML('beforeend', ` <span class="pb-tag ${pb.form ? 'form' : ''}" title="${this.partyBonusTitle(pb)}" aria-label="${this.partyBonusTitle(pb)}">${pb.form ? '정석' : '균형'}</span>`);
    }
  },
  // 파티 창: 진형 아래 한 줄
  partyBonusHtml() {
    const units = G.formUnits(); const rows = G.formation();
    const pb = partyBonusOf(units.map((u) => ({ cls: u.cls, row: rows[u.id] })));
    const chip = (k) => `<span class="tag tiny ${pb.has[k] ? 'good' : 'dim'}">${pb.has[k] ? '✓' : '·'} ${PB_NAME[k]}</span>`;
    const note = pb.full
      ? `<b class="good">균형 잡힌 파티</b> 받는 피해 −${Math.round(pb.red * 100)}% · 정신력 회복 +${Math.round(pb.mp * 100)}%${pb.form ? ' · <b class="amber">정석 진형</b>' : ' · 방어형 전열 + 지원형 후열이면 피해 −3% 더'}`
      : `방어형·지원형·공격형이 모두 있으면 받는 피해 −${Math.round(PB_DMG * 100)}%, 정신력 회복 +${Math.round(PB_MP * 100)}%`;
    return `<div class="pb-line small">${chip('guard')}${chip('heal')}${chip('dps')} <span class="dim">${note}</span></div>`;
  },
});

{
  const baseForm = UI.formationHtml;
  if (baseForm) UI.formationHtml = function (...a) {
    const html = baseForm.apply(this, a);
    let line = ''; try { line = this.partyBonusHtml(); } catch (e) { line = ''; }
    const at = html.lastIndexOf('<div class="row end">');
    return at < 0 ? html + line : html.slice(0, at) + line + html.slice(at);
  };
  const baseOpen = UI.openCombat;
  UI.openCombat = function (...a) { const r = baseOpen.apply(this, a); try { this.drawPartyBonus(); } catch (e) { /* 무시 */ } return r; };
  const baseControls = UI.renderControls;
  UI.renderControls = function (...a) { const r = baseControls.apply(this, a); try { this.drawPartyBonus(); } catch (e) { /* 무시 */ } return r; };
}
