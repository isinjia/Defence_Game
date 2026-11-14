// 팝업마다 전체 내용으로 최초 높이를 정한다. 표시 도중에는 그 높이를 유지한다.
// 사건/정보 팝업만 대상이며, 전투·시트·탐색의 전용 화면 크기는 유지한다.
{
  const st = document.createElement('style'); st.id = 'popup-size-css';
  st.textContent = `.modal-box.event-box:not(.gscene):not(.gfull){height:auto;max-height:100%;overflow:auto}
.skill-hold{height:auto;max-height:calc(100vh - 32px);max-height:calc(100dvh - 32px);display:flex;flex-direction:column;overflow:auto}
.skill-hold > .sh-tip, .skill-hold > .row.end{margin-top:auto}
html body #dlg .dlg-box.dlg-group{min-height:0}`;
  document.head.appendChild(st);

  const eligible = (node) => node && (node.matches('.skill-hold') ||
    (node.matches('.event-box') && !node.matches('.gscene,.gfull,.combat-box,.sheet,.st-modal')));
  const fit = (node) => {
    if (!eligible(node) || !node.isConnected) return;
    // 버튼과 펼칠 수 있는 설명까지 포함한 내용의 높이를 첫 화면이 그려지기 전에 잰다.
    const closed = [...node.querySelectorAll('details:not([open])')];
    closed.forEach((d) => { d.open = true; });
    const saved = { minHeight: node.style.minHeight, maxHeight: node.style.maxHeight, flex: node.style.flex };
    node.style.height = 'auto'; node.style.minHeight = '0'; node.style.maxHeight = 'none'; node.style.flex = 'none';
    const css = getComputedStyle(node);
    const border = parseFloat(css.borderTopWidth) + parseFloat(css.borderBottomWidth);
    const natural = Math.ceil(Math.max(node.offsetHeight, node.scrollHeight + border));
    const parent = node.parentElement; const pc = getComputedStyle(parent);
    const viewport = window.visualViewport?.height || window.innerHeight;
    const available = Math.max(1, Math.min(parent.clientHeight || viewport, viewport) -
      (parseFloat(pc.paddingTop) || 0) - (parseFloat(pc.paddingBottom) || 0));
    closed.forEach((d) => { d.open = false; });
    Object.assign(node.style, saved);
    node.style.height = Math.min(natural, available) + 'px';
    node.dataset.popupMeasured = '1';
  };
  const baseModal = UI.modal;
  UI.modal = function (...a) {
    const box = document.getElementById('modal-box');
    // 다음에 여는 다른 팝업에 이전 높이를 물려주지 않는다.
    if (box?.dataset.popupMeasured) { box.style.height = ''; delete box.dataset.popupMeasured; }
    const r = baseModal.apply(this, a);
    fit(document.getElementById('modal-box'));
    return r;
  };
  for (const name of ['showSkillHold', 'showUnitHold', 'showItemInfo']) {
    const base = UI[name]; if (!base) continue;
    UI[name] = function (...a) { const r = base.apply(this, a); fit(document.querySelector('#skill-hold .skill-hold')); return r; };
  }
  // 타이핑 중인 글자 수가 아닌 해당 대사의 전체 문장으로 높이를 미리 확보한다.
  const reserveText = () => {
    const d = UI.dlg; const line = d?.lines[d.i];
    if (!line || line.choices || line.group) return;
    const text = document.querySelector('#dlg .dlg-text'); if (!text) return;
    const shown = text.textContent;
    text.style.minHeight = '0';
    text.textContent = fixJosa(line.narr || line.sys || line.text || '');
    const height = text.offsetHeight;
    text.textContent = shown;
    text.style.minHeight = height + 'px';
  };
  const baseDialogue = UI.dlgShow;
  UI.dlgShow = function (...a) { const r = baseDialogue.apply(this, a); reserveText(); return r; };
  // 화면 회전이나 브라우저 표시 영역이 바뀔 때만 현재 내용으로 다시 잰다.
  let raf = 0;
  const resize = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      if (UI.modalOpen()) fit(document.getElementById('modal-box'));
      fit(document.querySelector('#skill-hold .skill-hold'));
      reserveText();
    });
  };
  window.addEventListener('resize', resize);
  window.visualViewport?.addEventListener('resize', resize);
}
