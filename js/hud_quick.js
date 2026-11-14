// ===== 체력 막대 오른쪽 위 빠른 단추: 인벤·스킬·파티·의뢰 + 메뉴 (사용자 요청, 아이콘만) =====
// 메뉴 단추를 이 줄 끝으로 옮겨 왼쪽 위 메뉴 단추는 숨긴다.
if (typeof UI !== 'undefined' && UI.hudCard) {
  const ic = (d) => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const QUICK = [
    ['gear', '인벤토리', ic('<path d="M6 8h12l-1 13H7z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>')],
    ['skills', '스킬', ic('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>')],
    ['party', '파티', ic('<circle cx="7" cy="9" r="3"/><circle cx="17" cy="9" r="3"/><circle cx="12" cy="6" r="3"/><path d="M2 20c.8-3 2.6-4.5 5-4.5M22 20c-.8-3-2.6-4.5-5-4.5M7 20c.8-3.5 2.6-5 5-5s4.2 1.5 5 5"/>')],
    ['quest', '의뢰', ic('<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 8h8M8 12h8M8 16h5"/>')],
  ];
  if (typeof document !== 'undefined' && !document.getElementById('hud-quick-css')) {
    const st = document.createElement('style'); st.id = 'hud-quick-css';
    st.textContent = `#hud-card{position:relative}
.hud-quick{position:absolute;right:0;bottom:100%;margin-bottom:6px;display:flex;gap:6px;z-index:3}
.hud-quick button{width:40px;height:40px;padding:0;display:flex;align-items:center;justify-content:center;border-radius:8px;border:1px solid var(--line,#2a3546);background:rgba(10,16,26,.88);color:var(--ink,#dfe6f0)}
.hud-quick button:active{transform:translateY(1px)}
#hud-tl .menu-one{display:none}`;
    document.head.appendChild(st);
  }
  const base = UI.hudCard;
  UI.hudCard = function (...a) {
    const html = base.apply(this, a);
    return html + `<div class="hud-quick">${QUICK.map(([k, n, svg]) => `<button type="button" data-act="sheet" data-v="${k}" aria-label="${n}" title="${n}">${svg}</button>`).join('')}<button type="button" data-act="hud-menu" aria-label="메뉴" title="메뉴">${ic('<path d="M4 6h16M4 12h16M4 18h16"/>')}</button></div>`;
  };
}
