// 파티 의사결정은 시간 제한·시간 경과에 따른 자동 응답 없이 직접 선택을 기다린다.
// 자동 시험 플래그는 기본값이 없으며 테스트에서만 주입한다. 시험 지원에도 카운트다운을 표시하지 않는다.
if (typeof UI !== 'undefined') {
  UI.autoFollow = function (btn) {
    if (!window.TUT_AUTO_TAP || !btn || btn._auto) return;
    btn._auto = true;
    const clickWhenReady = () => {
      if (!btn.isConnected || btn.disabled) return;
      if (UI.dlg || document.getElementById('skill-hold')) return setTimeout(clickWhenReady, 100);
      btn.click();
    };
    setTimeout(clickWhenReady, 100);
  };
}
