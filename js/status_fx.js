// ===== 게이트 크로니클: 속성 상태 이상 (영역 A-α, docs/전투_제안.md 3) =====
// 속성 공격이 확률로 상태 이상을 건다. 속성 6종(염·뇌·수·목·성·암, 4-9 개편)에 맞춘 표:
//  염 → 화상: 행동할 때마다 피해, 받는 회복 절반
//  수 → 둔화: 게이지가 느리게 참. 두 번 겹치면 빙결(한 번 행동 불가)
//  뇌 → 감전: 행동할 때 확률로 경련해 실패
//  목 → 속박: 방어가 떨어지고 회피 불가
//  성 → 낙인: 받는 피해 증가
//  암 → 공포: 주는 피해 감소
// 지속은 "걸린 사람의 차례" 기준. 기존 중독·기절·방어 감소는 그대로 둔다.
// 표시: 그림 왼쪽 아래 작은 아이콘(높이를 더하지 않음). 원소 반응(js/elem_react.js)이 이 상태들을 읽는다.

const STATUS_FX = {
  burn: { name: '화상', elem: 'fire', color: '#ff7a45', ch: '화', turns: 3 },
  slow: { name: '둔화', elem: 'water', color: '#4fb3ff', ch: '둔', turns: 3 },
  freeze: { name: '빙결', elem: 'water', color: '#bfe8ff', ch: '빙', turns: 1 },
  shock: { name: '감전', elem: 'bolt', color: '#ffd84d', ch: '감', turns: 2 },
  root: { name: '속박', elem: 'wood', color: '#5fcf6a', ch: '속', turns: 3 },
  mark: { name: '낙인', elem: 'holy', color: '#fff0b3', ch: '낙', turns: 3 },
  fear: { name: '공포', elem: 'dark', color: '#a36cff', ch: '공', turns: 2 },
};
const ELEM_STATUS = { fire: 'burn', water: 'slow', bolt: 'shock', wood: 'root', holy: 'mark', dark: 'fear' };

Object.assign(Combat.prototype, {
  stOf(u) { return (u.st ||= {}); },
  hasSt(u, k) { return !!(u.st && u.st[k] && u.st[k].t > 0); },
  // 상태 걸기 (이미 있으면 지속을 새로 고친다)
  applySt(u, k, src) {
    if (!u.alive) return;
    const S = STATUS_FX[k]; const st = this.stOf(u);
    if (k === 'slow' && this.hasSt(u, 'slow')) {
      // 두 번째 둔화는 빙결
      delete st.slow; st.freeze = { t: 1 };
      this.push(`${u.name}이(가) 얼어붙었다!`, u.side === 'enemy' ? 'hit' : 'hurt', { k: 'note', dst: u.id });
      return;
    }
    const prev = st[k];
    st[k] = { t: S.turns, by: src ? src.id : null, dmg: k === 'burn' ? Math.max(1, Math.round((src ? src.atk : u.maxHp * 0.05) * 0.22)) : 0 };
    if (!prev) this.push(`${u.name}: ${S.name}!`, u.side === 'enemy' ? 'hit' : 'hurt', { k: 'note', dst: u.id });
  },
  clearSt(u, k) { if (u.st) delete u.st[k]; },
  // 공격의 속성 (스킬 속성 → 'self'면 시전자 속성 → 괴수 기본 공격은 괴수 속성)
  hitElem(att, skill) {
    if (skill && skill.elem === 'self') return att.elem;
    if (skill && skill.elem) return skill.elem;
    return att.side === 'enemy' ? att.elem : null;
  },
});

{
  const C = Combat.prototype;
  // 맞으면 확률로 상태 이상
  const baseDeal = C.dealDamage;
  C.dealDamage = function (att, def, skill, opt = {}) {
    const dmg = baseDeal.call(this, att, def, skill, opt);
    if (dmg > 0 && def.alive && !def.summon) {
      const e = this.hitElem(att, skill); const k = e && ELEM_STATUS[e];
      if (k) {
        let ch = skill && skill.id !== 'strike' ? 0.32 : 0.1; // 속성 기술은 잘 걸고 기본 공격은 가끔
        if (def.boss) ch *= 0.5;
        if (opt.noStatus) ch = 0;
        if (Math.random() < ch) this.applySt(def, k, att);
      }
    }
    return dmg;
  };
  // 낙인: 받는 피해 증가 / 속박: 방어 감소 / 공포: 주는 피해 감소
  const baseCalc = C.calcDamage;
  C.calcDamage = function (att, def, skill, opt = {}) {
    let restore = null;
    if (this.hasSt(def, 'root')) { restore = def.def; def.def = Math.round(def.def * 0.7); }
    const r = baseCalc.call(this, att, def, skill, opt);
    if (restore != null) def.def = restore;
    let m = 1;
    if (this.hasSt(def, 'mark')) m *= 1.2;
    if (this.hasSt(att, 'fear')) m *= 0.75;
    if (m !== 1) r.dmg = Math.max(1, Math.round(r.dmg * m));
    return r;
  };
  // 둔화: 게이지가 느리게
  const baseFill = C.fillRate;
  C.fillRate = function (u) { const f = baseFill.call(this, u); return this.hasSt(u, 'slow') ? f * 0.65 : f; };
  // 화상: 받는 회복 절반
  const baseHeal = C.healUnit;
  C.healUnit = function (u, v, by) { return baseHeal.call(this, u, this.hasSt(u, 'burn') ? v * 0.5 : v, by); };
  // 차례가 올 때: 화상 피해, 빙결·감전으로 행동 실패, 지속 감소
  const baseTurn = C.takeTurn;
  C.takeTurn = function (u) {
    const st = u.st;
    if (st && u.alive && !this.result) {
      if (st.burn && st.burn.t > 0) {
        const d = st.burn.dmg; u.hp -= d;
        this.push(`${u.name}이(가) 화상으로 ${d} 피해`, u.side === 'enemy' ? 'hit' : 'hurt', { k: 'dmg', dst: u.id, amt: d, elem: 'fire', hp: Math.max(0, u.hp), killed: u.hp <= 0, dot: true });
        if (u.hp <= 0) { this.down(u); this.checkEnd(); u.atb = 0; this.tickSt(u); return 'done'; }
      }
      if (st.freeze && st.freeze.t > 0) {
        this.push(`${u.name}은(는) 얼어붙어 움직이지 못한다.`, '', { k: 'note', dst: u.id });
        delete st.freeze; u.atb = 0; this.actions++; return 'done';
      }
      if (st.shock && st.shock.t > 0 && Math.random() < 0.3) {
        this.push(`${u.name}이(가) 감전으로 경련했다!`, u.side === 'enemy' ? 'hit' : 'hurt', { k: 'note', dst: u.id });
        this.tickSt(u); u.atb = 0; this.actions++; return 'done';
      }
    }
    const r = baseTurn.call(this, u);
    // 플레이어가 입력을 기다리는 동안은 지속을 줄이지 않는다(입력 뒤 줄인다)
    if (r !== 'wait') this.tickSt(u);
    return r;
  };
  C.tickSt = function (u) { if (!u.st) return; for (const k of Object.keys(u.st)) { if (k === 'freeze') continue; if (--u.st[k].t <= 0) delete u.st[k]; } };
  // 플레이어 행동이 끝나면 지속 감소
  const baseEnd = C.endPlayerTurn;
  if (baseEnd) C.endPlayerTurn = function (...a) { const p = this.player; const r = baseEnd.apply(this, a); if (p) this.tickSt(p); return r; };
  // 속박: 회피 불가
  const baseDeal2 = C.dealDamage;
  C.dealDamage = function (att, def, skill, opt = {}) {
    if (this.hasSt(def, 'root') && def.evadeT > 0) { const e = def.evadeT; def.evadeT = 0; const r = baseDeal2.call(this, att, def, skill, opt); if (def.alive) def.evadeT = e; return r; }
    return baseDeal2.call(this, att, def, skill, opt);
  };
}

Object.assign(UI, {
  drawStatusFx() {
    const c = this.ctx; if (!c || !c.combat || !c.combat.units) return;
    for (const u of c.combat.units) {
      const el = document.getElementById('u-' + u.id); if (!el) continue;
      const host = el.querySelector('.fx-host') || el;
      let box = host.querySelector('.stfx');
      const keys = u.alive && u.st ? Object.keys(u.st).filter((k) => u.st[k] && u.st[k].t > 0 && STATUS_FX[k]) : [];
      const key = keys.join(',');
      if (!keys.length) { if (box) box.remove(); continue; }
      if (box && box._key === key) continue;
      if (!box) { host.insertAdjacentHTML('beforeend', '<span class="stfx"></span>'); box = host.querySelector('.stfx'); }
      box._key = key;
      box.innerHTML = keys.map((k) => `<i style="--sc:${STATUS_FX[k].color}" title="${STATUS_FX[k].name}">${STATUS_FX[k].ch}</i>`).join('');
    }
  },
});

{
  const baseGauges = UI.drawGauges;
  UI.drawGauges = function () { const r = baseGauges.call(this); try { this.drawStatusFx(); } catch (e) { /* 표시 실패는 전투를 막지 않는다 */ } return r; };
  const baseRefresh = UI.refreshUnits;
  UI.refreshUnits = function () { const r = baseRefresh.call(this); try { this.drawStatusFx(); } catch (e) { /* 무시 */ } return r; };
}
