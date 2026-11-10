// ===== 게이트 크로니클: 날짜는 상단 HUD에 (영역 A, 사용자 요청) =====
// 인물 카드 안의 날짜 줄 대신, 화면 위쪽 메뉴 버튼 옆에 날짜·나이를 고정해 둔다. 카드를 접든 펴든 늘 보인다.
{
  const baseRender = UI.renderGame;
  UI.renderGame = function (...a) {
    const r = baseRender.apply(this, a);
    try {
      const tl = document.getElementById('hud-tl'); const p = G.player;
      if (tl && p && !G.over) {
        const left = G.maxLife() - G.ageYears();
        let el = tl.querySelector('.hud-date');
        if (!el) { el = document.createElement('div'); el.className = 'hud-date'; tl.appendChild(el); }
        el.innerHTML = `<b class="num">${G.year}.${String(G.month).padStart(2, '0')}.${String(G.day || 1).padStart(2, '0')}</b><span class="${left <= 5 ? 'bad' : ''}">${G.ageYears()}세</span>`;
        el.title = G.fullDate();
      }
    } catch (e) { /* 무시 */ }
    return r;
  };
}
