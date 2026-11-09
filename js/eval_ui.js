// ---------- 평가 보정: 작은 화면 지도 ----------
// 높이 720px 이하(iPhone SE 등)는 인물 카드가 지도 가운데를 덮으므로, 접힘을 고른 적이 없으면 처음부터 접어 둔다(체력·정신 막대는 남는다).
if (typeof UI !== 'undefined' && UI.fold && !('card' in UI.fold) && typeof window !== 'undefined' && window.innerHeight <= 720) UI.fold.card = true;

// 전투 안내 말풍선이 아군 줄(내 캐릭터·동료 카드)을 통째로 가리던 문제(평가 8순위):
// 말풍선이 대상 위쪽에 서고 아군 줄과 겹치면, 자리가 있을 때 아군 줄 위로 올린다(화살표는 그대로 대상 쪽).
if (typeof UI !== 'undefined' && UI.coachPop) {
  const baseCoach = UI.coachPop;
  UI.coachPop = function (node, target, key) {
    const r = baseCoach.call(this, node, target, key);
    try {
      const pop = document.getElementById('coach-pop');
      const rows = [...document.querySelectorAll('.modal-box .allies, .modal-box .allies-front, .modal-box .allies-back')].map((e) => e.getBoundingClientRect()).filter((b) => b.height > 0);
      if (pop && target && rows.length && pop.classList.contains('arrow-down')) {
        const pr = pop.getBoundingClientRect(); const ar = { top: Math.min(...rows.map((b) => b.top)), bottom: Math.max(...rows.map((b) => b.bottom)) };
        const overlap = pr.bottom > ar.top + 4 && pr.top < ar.bottom - 4;
        const top = ar.top - pr.height - 10;
        if (overlap && top >= 56) pop.style.top = top + 'px';
      }
    } catch (e) { /* 무시 */ }
    return r;
  };
}
