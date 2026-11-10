// ===== 게이트 크로니클: 값을 치르는 창에는 내 크레딧을 함께 (영역 A, 사용자 제보: 떠돌이 상인 창에서 내 돈이 안 보임) =====
// 창 안에 "○○ 크레딧" 값이 붙은 버튼이 있으면 창 위쪽에 보유 크레딧을 띄우고, 살 돈이 모자란 버튼에는 "부족"을 붙인다.
// 도시·시설·상점 화면은 위쪽 크레딧 표시(hud_money.js)가 이미 창 위에 떠 있으므로 넣지 않는다.
{
  const PRICE = /([0-9][0-9,]*)\s*크레딧/;
  const NOT_PAY = /판다|팔기|매각|매도|받는다|받기|보상|수당|번다|벌기|배당|월급|성과급/;
  UI.walletChip = function () {
    const box = document.getElementById('modal-box'); if (!box || !G.player) return;
    box.querySelectorAll('.wallet-chip').forEach((x) => x.remove()); box.classList.remove('has-wallet');
    if (box.querySelector('.settle-sheet')) return;
    const shop = !!box.querySelector('.city-hero, .fac-grid, .shop-list');
    // 도시 머리말의 작은 크레딧 글자는 빼고 이 표시 하나만 남긴다
    const sm = box.querySelector('.city-title .small');
    if (sm) { const segs = sm.innerHTML.split(' · '); if (segs.length > 1 && /<svg/.test(segs[segs.length - 1])) { segs.pop(); sm.innerHTML = segs.join(' · '); } }
    // 값: "○○ 크레딧" 글자, 또는 동전 아이콘 + 숫자만 있는 버튼(시장·공방의 가격 버튼)
    const priceOf = (b) => { const m = PRICE.exec(b.textContent); if (m) return m[1]; const t = b.textContent.trim(); return b.querySelector('svg') && /^[0-9][0-9,]*$/.test(t) ? t : null; };
    const btns = [...box.querySelectorAll('button, .choice-btn, [data-act]')].filter((b) => priceOf(b) && !b.closest('.wallet-chip'));
    if (!btns.length && !shop) return;
    const money = G.player.money || 0;
    for (const b of btns) {
      b.classList.remove('cant-afford'); const t = b.querySelector('.afford-tag'); if (t) t.remove();
      if (NOT_PAY.test(b.textContent)) continue;
      const price = +priceOf(b).replace(/,/g, '');
      if (price > money) { b.classList.add('cant-afford'); b.insertAdjacentHTML('beforeend', '<span class="afford-tag">부족</span>'); }
    }
    box.classList.add('has-wallet'); box.classList.toggle('wallet-shop', !!box.querySelector('.city-close, :scope > .sheet-close, :scope > .icon-btn')); box.insertAdjacentHTML('afterbegin', `<div class="wallet-chip"><span>보유</span><b>${fmt(money)}</b><span>크레딧</span></div>`);
  };
  const baseModal = UI.modal;
  UI.modal = function (...a) { const r = baseModal.apply(this, a); try { this.walletChip(); } catch (e) { /* 무시 */ } return r; };
  // 창 내용을 직접 갈아 끼우는 화면(도시 시설 등)과 돈이 바뀐 뒤에도 맞춘다
  const hook = () => {
    const box = document.getElementById('modal-box'); if (!box || typeof MutationObserver === 'undefined') return;
    let busy = false, raf = 0;
    new MutationObserver(() => {
      if (busy || raf) return;
      raf = requestAnimationFrame(() => { raf = 0; busy = true; try { UI.walletChip(); } catch (e) { /* 무시 */ } Promise.resolve().then(() => { busy = false; }); });
    }).observe(box, { childList: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook); else hook();
}
