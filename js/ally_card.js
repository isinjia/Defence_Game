// 전투 아군 카드 정리 (영역 B, 사용자 요청 — 조사 세션 경유, 필살 표시는 A와 합의)
//  ① 초상화와 이름 사이의 줄을 체력 게이지로, 바로 밑에 정신력 게이지. 이름 아래에 있던 체력·정신력 막대를 그 자리로 옮긴다(높이는 그대로).
//  ② 필살 게이지는 막대가 아니라 초상화 뒤 오라: 찰수록 커지고 밝아지며, 테두리 고리가 시계 방향으로 차오른다.
//     0~49% 희미한 고리만 · 50%↑ 은은한 빛 · 100% 속성 색 불꽃 오라 + 맥동. 아군만.
//  값은 u.ult / ULT_MAX 그대로(충전·발동 판정은 js/limit_gauge.js). 여기서는 그리는 부분(UI.drawUlt)만 바꾼다.
{
  const baseRefresh = UI.refreshUnits;
  UI.refreshUnits = function (...a) {
    const r = baseRefresh.apply(this, a);
    try {
      for (const el of document.querySelectorAll('#allies .ally.fig:not(.ac-top)')) {
        const host = el.querySelector('.fx-host'); if (!host) continue;
        let at = host;
        for (const row of el.querySelectorAll(':scope > .bar-row')) { at.after(row); at = row; } // 체력 → 정신력 순서로 초상 바로 밑에
        el.classList.add('ac-top');
      }
    } catch (e) { /* 무시 */ }
    return r;
  };

  UI.drawUlt = function () {
    const c = this.ctx; const cb = c && c.combat; if (!cb || !cb.units || !cb.ultOk) return;
    const max = typeof ULT_MAX !== 'undefined' ? ULT_MAX : 100;
    for (const u of cb.units) {
      if (u.side !== 'ally' || u.summon) continue;
      const el = document.getElementById('u-' + u.id); if (!el) continue;
      const host = el.querySelector('.fx-host'); if (!host) continue;
      const old = host.querySelector('.ult-bar'); if (old) old.remove();
      let au = host.querySelector('.ult-aura');
      if (!au) {
        host.insertAdjacentHTML('afterbegin', '<i class="ult-aura" aria-hidden="true"><b></b></i>'); au = host.querySelector('.ult-aura');
        au.style.setProperty('--uc', u.elem && ELEMENTS[u.elem] ? elemColor(u.elem) : '#ffd36b');
      }
      const v = Math.max(0, Math.min(1, (u.ult || 0) / max));
      const full = v >= 1 && u.alive;
      const key = Math.round(v * 100) + (full ? 'f' : '') + (u.alive ? '' : 'd');
      if (au._k === key) continue; au._k = key;
      au.style.setProperty('--ult', v.toFixed(3));
      au.classList.toggle('half', v >= 0.5 && !full);
      au.classList.toggle('full', full);
      el.classList.toggle('ult-full', full); // A·다른 파일이 쓰는 표시는 그대로
    }
  };
}
