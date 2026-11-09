// ===== 게이트 크로니클: 전투가 끝나는 순간의 조작 영역 정리 (영역 A, 평가 보고 7번 관련) =====
// 마지막 적이 쓰러진 뒤 마무리 연출이 도는 동안(result 있음 + playing) 조작 영역이 옛 배치
// (스킬 줄 + 배속·자동·회복제 줄)로 다시 그려지고, 명령 메뉴(combat_fit.js)는 result 를 보고 바꾸지 않아
// 옛 버튼이 잠깐 튀어나와 화면이 깨졌다. 연출이 끝날 때까지 명령 메뉴 모양을 그대로 두고 눌리지 않게 한다.
{
  const baseControls = UI.renderControls;
  UI.renderControls = function (...a) {
    const r = baseControls.apply(this, a);
    const c = this.ctx; const cb = c && c.combat;
    if (!cb || !cb.result || !c.playing || !this.commandMenu) return r;
    const box = document.getElementById('cb-ctrl'); if (!box) return r;
    if (!box.querySelector(':scope > .skill-btns, :scope > .ctrl-row')) return r;
    const keep = cb.result; cb.result = null;
    try { this.commandMenu(); } catch (e) { /* 메뉴 변환 실패는 전투를 막지 않는다 */ } finally { cb.result = keep; }
    // 남은 옛 줄은 숨기고, 모든 버튼은 잠근다(결과 화면이 곧 그려진다)
    for (const el of box.querySelectorAll(':scope > .skill-btns, :scope > .ctrl-row')) el.style.display = 'none';
    for (const b of box.querySelectorAll('button')) b.disabled = true;
    const tools = document.querySelector('#modal-box .cb-head .cb-tools'); if (tools) tools.innerHTML = '';
    return r;
  };
}
