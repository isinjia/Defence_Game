// ===== 게이트 크로니클: 값을 치르는 창에는 내 크레딧을 함께 (영역 A, 사용자 제보: 떠돌이 상인 창에서 내 돈이 안 보임) =====
// 창 안에 "○○ 크레딧" 값이 붙은 버튼이 있으면 창 위쪽에 보유 크레딧을 띄우고, 살 돈이 모자란 버튼에는 "부족"을 붙인다.
// 도시·시설·상점 화면은 위쪽 크레딧 표시(hud_money.js)가 이미 창 위에 떠 있으므로 넣지 않는다.
{
  const PRICE = /([0-9][0-9,]*)\s*크레딧/;
  const NOT_PAY = /판다|팔기|매각|매도|받는다|받기|보상|수당|번다|벌기|배당|월급|성과급/;
  UI.walletChip = function () {
    const box = document.getElementById('modal-box'); if (!box || !G.player) return;
    box.querySelectorAll('.wallet-chip').forEach((x) => x.remove()); box.classList.remove('has-wallet');
    if (box.querySelector('.city-hero, .fac-grid, .shop-list, .settle-sheet')) return;
    const btns = [...box.querySelectorAll('button, .choice-btn, [data-act]')].filter((b) => PRICE.test(b.textContent) && !b.closest('.wallet-chip'));
    if (!btns.length) return;
    const money = G.player.money || 0;
    for (const b of btns) {
      b.classList.remove('cant-afford'); const t = b.querySelector('.afford-tag'); if (t) t.remove();
      if (NOT_PAY.test(b.textContent)) continue;
      const price = +PRICE.exec(b.textContent)[1].replace(/,/g, '');
      if (price > money) { b.classList.add('cant-afford'); b.insertAdjacentHTML('beforeend', '<span class="afford-tag">부족</span>'); }
    }
    box.classList.add('has-wallet'); box.insertAdjacentHTML('afterbegin', `<div class="wallet-chip"><span>보유</span><b>${fmt(money)}</b><span>크레딧</span></div>`);
  };
  const baseModal = UI.modal;
  UI.modal = function (...a) { const r = baseModal.apply(this, a); try { this.walletChip(); } catch (e) { /* 무시 */ } return r; };
}
