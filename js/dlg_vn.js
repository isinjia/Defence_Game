// ===== 대화창: 비주얼 노벨식 (사용자 요청) — 모양은 css/dlg_vn.css =====
// 메인 고정 인물은 작은 상반신 카드 대신 전신 그림(assets/portraits/main/full/)을 세운다. 그 밖의 인물은 초상을 크게 키워 쓴다.
if (typeof UI !== 'undefined') {
  const base = UI.dlgSpeaker;
  UI.dlgSpeaker = function (who) {
    const sp = base.call(this, who);
    try {
      const m = sp && sp.art && /assets\/portraits\/main\/bust\/([a-z0-9-]+)\.webp/.exec(sp.art);
      if (m) sp.art = `<div class="vn-full"><img src="assets/portraits/main/full/${m[1]}.webp" alt="${sp.name || ''}" onerror="this.src='assets/portraits/main/bust/${m[1]}.webp'"></div>`;
    } catch (e) { /* 실패하면 기본 초상 */ }
    return sp;
  };
}
