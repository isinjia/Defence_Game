// ===== 게이트 크로니클: 탐색 화면을 화면 전체로 =====
// 게이트 층 지도(실제 게이트·헌터 자격 시험)와 그 안에서 열리는 휴식·사건 장면을 팝업 상자가 아니라
// 전투처럼 화면 전체에 띄운다. 사건 장면은 게이트 속성 색의 배경 위에 글과 선택지를 아래쪽에 모아 둔다.
{
  const inGate = () => { const c = UI.ctx; return !!(c && (c.run || c.kind === 'exam-explore' || (UI.exam && UI.exam.map && c.kind !== 'exam'))); };
  const baseModal = UI.modal;
  UI.modal = function (html, cls = '', ...a) {
    const k = String(cls);
    const isMap = k.includes('gmap-box');
    const isScene = !isMap && k.includes('event-box') && inGate();
    const r = baseModal.call(this, html, cls, ...a);
    const m = document.getElementById('modal'); const box = document.getElementById('modal-box');
    if (m && (isMap || isScene)) m.classList.add('full');
    if (box) {
      box.classList.toggle('gfull', isMap);
      box.classList.toggle('gscene', isScene);
      const c = this.ctx; const e = c && c.gate && c.gate.elem;
      if (isMap || isScene) box.style.setProperty('--gc', e && ELEMENTS[e] ? ELEMENTS[e].color : '#5f8fd3');
    }
    return r;
  };
}
