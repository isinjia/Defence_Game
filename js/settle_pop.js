// 전투 결과·탐색 사건 결과를 화면 가운데 정산 팝업으로 (영역 B, 사용자 요청)
// - 전투: 결과(획득·상황·다음 행동 버튼)를 아래 조작 영역 대신 전장 위 가운데 팝업에. 조작 영역은 높이 그대로 잠긴다.
// - 게이트 층 지도: 칸에서 일어난 일(사건·휴식·층 이동)의 결과 줄을 지도 아래가 아니라 가운데 팝업으로, [확인]으로 닫는다.
{
  const pop = (host, html, cls) => {
    const old = host.querySelector(':scope > .settle-pop'); if (old) old.remove();
    const el = document.createElement('div'); el.className = 'settle-pop ' + (cls || '');
    el.innerHTML = `<div class="settle-box">${html}</div>`;
    host.appendChild(el);
    if (typeof SFX !== 'undefined') SFX.play('heal');
    return el;
  };

  // ---------- 전투 결과 ----------
  const baseControls = UI.renderControls;
  UI.renderControls = function (...a) {
    const r = baseControls.apply(this, a);
    try {
      const c = this.ctx; const cb = c && c.combat; const box = document.getElementById('cb-ctrl'); const mb = document.getElementById('modal-box');
      if (!cb || !box || !mb || !cb.result || c.playing || !box.children.length) return r;
      const head = cb.result === 'win' ? '전투 승리' : cb.result === 'flee' ? '전장 이탈' : cb.result === 'lose' ? '패배' : '전투 종료';
      const frag = document.createElement('div'); while (box.firstChild) frag.appendChild(box.firstChild);
      const el = pop(mb, `<div class="settle-head ${cb.result}">${head}</div>`, 'combat ' + cb.result);
      el.querySelector('.settle-box').appendChild(frag);
      // 조작 영역은 비운 채 높이 유지
      box.classList.remove('cb-done'); box.classList.add('settled');
    } catch (e) { /* 실패하면 원래대로 아래에 */ }
    return r;
  };

  // ---------- 게이트 층 지도의 결과 줄 ----------
  const baseMap = UI.renderGateMap;
  if (baseMap) UI.renderGateMap = function (note, ...a) {
    const r = baseMap.call(this, null, ...a);
    if (note) {
      try {
        const mb = document.getElementById('modal-box');
        if (mb) pop(mb, `<div class="settle-text">${fixJosa(note)}</div><div class="row end"><button class="primary" data-act="settle-close">확인</button></div>`, 'note');
      } catch (e) { /* 무시 */ }
    }
    return r;
  };

  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'settle-close') { const el = document.querySelector('#modal-box > .settle-pop'); if (el) el.remove(); return; }
    return baseHandle.call(this, act, v);
  };
}
