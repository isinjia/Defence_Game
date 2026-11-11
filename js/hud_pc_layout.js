// ===== 게이트 크로니클: PC HUD 배치 (영역 B, 사용자 요청) =====
// PC(넓은 화면)에서만:
//  1) 메뉴 아래 날짜·나이를 위쪽 크레딧(#hud-money) 왼쪽으로 옮긴다.
//  2) 현재 퀘스트 칸(.hud-tr)은 그 한 줄 아래로 내린다(CSS).
// 좁은 화면은 기존(메뉴 아래 날짜, 왼쪽 퀘스트) 그대로.
{
  const PC = '(min-width: 641px)';
  const isPc = () => window.matchMedia(PC).matches;

  UI.placeHudPc = function () {
    const dates = [...document.querySelectorAll('.hud-date')];
    const date = dates[0] || null;
    // 예전에 생긴 중복 날짜 칸은 하나만 남긴다
    for (let i = 1; i < dates.length; i++) dates[i].remove();
    const money = document.getElementById('hud-money');
    const tl = document.getElementById('hud-tl');
    let wrap = document.getElementById('hud-top-res');

    if (!isPc()) {
      if (date) {
        date.classList.remove('pc-tr');
        if (tl && date.parentElement !== tl) tl.appendChild(date);
      }
      if (wrap && money && money.parentElement === wrap) {
        document.body.appendChild(money);
      }
      if (wrap && wrap.childElementCount === 0) wrap.remove();
      return;
    }

    if (!date && !money) return;
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'hud-top-res';
      document.body.appendChild(wrap);
    }
    if (date) {
      date.classList.add('pc-tr');
      if (date.parentElement !== wrap) wrap.appendChild(date);
    }
    if (money && money.parentElement !== wrap) wrap.appendChild(money);
    // 날짜가 크레딧 왼쪽이 되도록 순서 고정
    if (date && money && date.nextElementSibling !== money) wrap.insertBefore(date, money);
  };

  const baseRender = UI.renderGame;
  UI.renderGame = function (...a) {
    const r = baseRender.apply(this, a);
    try { this.placeHudPc(); } catch (e) { /* 무시 */ }
    return r;
  };

  if (UI.moneySync) {
    const baseMoney = UI.moneySync;
    UI.moneySync = function (...a) {
      const r = baseMoney.apply(this, a);
      try { this.placeHudPc(); } catch (e) { /* 무시 */ }
      return r;
    };
  }

  let t = 0;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => { try { UI.placeHudPc(); } catch (e) { /* 무시 */ } }, 80);
  });
}
