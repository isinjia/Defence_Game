// 튜토리얼이 고르라고 한 것만 고를 수 있게 (영역 B, docs/구현_대기목록.md 4-5)
// 원칙: 특정 선택을 지시하는 단계에서는 그 선택만 누를 수 있다. 나머지는 흐리게, 누르면 진행 없이 짧은 안내.
//       "네가 골라라" 같은 자유 단계는 잠그지 않는다.
// 클릭을 문서 단계에서 먼저 가로채므로, 다른 파일의 handle 감싸기 순서와 상관없이 동작한다.
{
  // 지금 단계의 잠금 규칙: { allow(act, v) → bool, msg } 또는 null
  UI.tutRule = function () {
    const c = this.ctx;
    // 자격 시험 첫 전투의 조작 안내
    if (c && c.combat && c.tutorial && !c.tutorial.boss && c.tutorial.acted < 1 && !c.combat.result) {
      const cb = c.combat;
      if (!cb.waiting || c.playing) return null; // 1/3: 기다리는 단계, 누를 것 없음
      const base = ['c-skill', 'c-cmd', 'c-cancel', 'c-speed', 'modal-close'];
      if (!c.sel) return { allow: (a) => [...base, 'c-target', 'c-defend', 'c-item', 'c-bag', 'c-bag-use', 'c-talis'].includes(a), msg: '지금은 아래 메뉴에서 행동을 골라 보자.' };
      const sk = skillById(c.sel); const aim = sk ? (SKILL_AIM[sk.type] || 'none') : 'none';
      if (aim === 'enemy') return { allow: (a) => [...base, 'c-target'].includes(a), msg: '지금은 공격할 적을 눌러 보자.' };
      if (aim === 'ally') return { allow: (a) => [...base, 'c-ally'].includes(a), msg: '지금은 도울 동료를 눌러 보자.' };
      return { allow: (a) => [...base, 'c-use'].includes(a), msg: '지금은 [사용]을 눌러 보자.' };
    }
    return null;
  };
  // 누를 수 없는 버튼·칸을 흐리게
  UI.tutMark = function () {
    const rule = this.tutRule();
    for (const el of document.querySelectorAll('#modal-box [data-act], #coach-pop [data-act]')) {
      el.classList.toggle('tut-off', !!rule && !rule.allow(el.dataset.act, el.dataset.v));
    }
  };
  document.addEventListener('click', (e) => {
    const el = e.target.closest && e.target.closest('[data-act]'); if (!el) return;
    const rule = UI.tutRule && UI.tutRule(); if (!rule || rule.allow(el.dataset.act, el.dataset.v)) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    UI.toast(rule.msg);
    const pop = document.getElementById('coach-pop'); if (pop) FX.pulse(pop, 'nudge', 400);
  }, true);
  const baseControls = UI.renderControls;
  UI.renderControls = function (...a) { const r = baseControls.apply(this, a); try { this.tutMark(); } catch (e) { /* 무시 */ } return r; };
  const baseRefresh = UI.refreshUnits;
  UI.refreshUnits = function (...a) { const r = baseRefresh.apply(this, a); try { this.tutMark(); } catch (e) { /* 무시 */ } return r; };
}
