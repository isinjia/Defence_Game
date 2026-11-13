// ===== 모바일 UI·UX 보정 (측정 도구: tools/ux_audit.js, 스타일: css/mobile_ux.css) =====
// '튜토리얼 건너뛰기' 버튼은 화면 오른쪽 위 한 자리에 떠 있어서 전투의 적 그림, 탐색의 정신력 수치,
// 월드맵의 축소 버튼을 덮었다. 지금 어떤 화면인지 표시해 두고 화면마다 빈 자리에 놓는다.
if (typeof UI !== 'undefined' && UI.tutSkipBtn) {
  const active = () => !!(UI.exam && !UI.exam.skipped && !UI.exam.reveal);
  // 탐색·전투 창에서는 버튼을 창 머리줄의 버튼 줄 안으로 옮긴다(팀 상의 창이 아래쪽에 옮겨 두는 것과 같은 방식).
  const dock = () => {
    const modal = document.getElementById('modal'); if (!modal || modal.classList.contains('hidden')) return null;
    if (document.getElementById('council-ov')) return null; // 팀 상의 창이 직접 관리한다
    return document.querySelector('#modal-box .xr-header-actions') || document.querySelector('#modal-box .cb-head .cb-tools');
  };
  const place = () => {
    const b = document.getElementById('tut-skip'); if (!b) return;
    if (b.closest('#council-ov')) return;
    const home = dock();
    if (home) { if (b.parentNode !== home) home.appendChild(b); b.dataset.where = home.classList.contains('cb-tools') ? 'combat' : 'explore'; }
    else { if (b.parentNode !== document.body && !b.closest('#modal-box')) return; if (b.parentNode !== document.body) document.body.appendChild(b); b.dataset.where = 'map'; }
  };
  const base = UI.tutSkipBtn;
  UI.tutSkipBtn = function (...a) { const r = base.apply(this, a); try { place(); } catch (e) { /* 무시 */ } return r; };
  // 창 내용이 다시 그려져 버튼이 같이 지워지면 다시 만들고, 옮길 자리가 새로 생기면 옮긴다
  let queued = false;
  const check = () => {
    queued = false;
    try { if (!active()) return; if (!document.getElementById('tut-skip')) UI.tutSkipBtn(false); else place(); } catch (e) { /* 무시 */ }
  };
  const watch = () => {
    const modal = document.getElementById('modal'); if (!modal || typeof MutationObserver === 'undefined') return;
    new MutationObserver(() => { if (!queued && UI.exam) { queued = true; setTimeout(check, 0); } }).observe(modal, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  };
  if (document.getElementById('modal')) watch(); else window.addEventListener('DOMContentLoaded', watch);
}

// 정보 시트 탭: 한 줄에 들어가는 만큼 넣되, 두 줄이 되면 줄마다 개수를 비슷하게 나눈다(6+1 대신 4+3).
// 토스트: 도시·정보 시트처럼 위쪽에 제목과 닫기(×)가 있고 아래쪽에 확인 버튼이 없는 창에서는 아래에 띄운다.
if (typeof UI !== 'undefined') {
  const fitTabs = () => {
    const tabs = document.querySelector('#modal-box .sheet-head .tabs'); if (!tabs || window.innerWidth > 640) return;
    const n = tabs.children.length, w = tabs.clientWidth; if (!n || !w) return;
    const fit = Math.max(3, Math.floor((w + 4) / 44)), rows = Math.ceil(n / fit), cols = Math.ceil(n / rows);
    const v = `repeat(${cols}, minmax(0, 1fr))`; if (tabs.style.gridTemplateColumns !== v) tabs.style.gridTemplateColumns = v;
  };
  let pending = false;
  const later = () => { if (pending) return; pending = true; setTimeout(() => { pending = false; try { fitTabs(); } catch (e) { /* 무시 */ } }, 0); };
  const hook = () => {
    const modal = document.getElementById('modal'); if (!modal || typeof MutationObserver === 'undefined') return;
    new MutationObserver(later).observe(modal, { childList: true, subtree: true });
    window.addEventListener('resize', later);
  };
  if (document.getElementById('modal')) hook(); else window.addEventListener('DOMContentLoaded', hook);
  if (UI.toast) {
    const baseToast = UI.toast;
    UI.toast = function (...a) {
      const r = baseToast.apply(this, a);
      try {
        const t = document.getElementById('toast'); const modal = document.getElementById('modal');
        const open = modal && !modal.classList.contains('hidden');
        if (t) t.classList.toggle('toast-low', !!(open && document.querySelector('#modal-box .city-hero, #modal-box .sheet-head')));
      } catch (e) { /* 무시 */ }
      return r;
    };
  }
}
