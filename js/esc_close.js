// ===== 게이트 크로니클: PC ESC로 팝업 닫기 (영역 B, 사용자 요청) =====
// 넓은 화면(PC)에서 Escape 키로 위에 뜬 팝업·정보 카드·모달을 닫는다.
// 닫기 버튼이 있는 창만 닫아, 전투 진행 중처럼 닫을 수 없는 화면은 건드리지 않는다.
{
  const PC = '(min-width: 641px)';
  const isPc = () => window.matchMedia(PC).matches;
  const typing = (el) => {
    if (!el) return false;
    const tag = (el.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
  };

  UI.escClosePop = function () {
    if (!isPc()) return false;
    // 안쪽 오버레이부터
    if (document.getElementById('skill-hold')) {
      if (this.hideSkillHold) this.hideSkillHold();
      else { const el = document.getElementById('skill-hold'); if (el) el.remove(); }
      return true;
    }
    const info = document.getElementById('info-card');
    if (info && info.classList.contains('on')) {
      if (this.infoClose) this.infoClose();
      else info.classList.remove('on');
      return true;
    }
    if (this.tutHeld && this.tutHeld()) { this.tutNext(); return true; }
    const coach = document.getElementById('coach-pop');
    if (coach) {
      if (typeof coach.onclick === 'function') coach.onclick();
      else {
        this._coachShut = coach._key;
        coach.remove();
        for (const el of document.querySelectorAll('.coach-spot')) el.classList.remove('coach-spot');
      }
      return true;
    }
    if (this.modalOpen && this.modalOpen()) {
      if (document.querySelector('#modal-box [data-act="settle-close"]')) {
        this.handle('settle-close');
        return true;
      }
      if (document.querySelector('#modal-box [data-act="modal-close"]')) {
        this.handle('modal-close');
        return true;
      }
    }
    return false;
  };

  // capture: 다른 ESC(오프닝·컷씬)보다 모달 닫기를 먼저 받을 필요는 없고,
  // 시네마틱이 떠 있으면 그쪽 Escape(스킵)에 맡긴다.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' && e.key !== 'Esc') return;
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (typing(e.target) || typing(document.activeElement)) return;
    if (!isPc()) return;
    if (document.querySelector('.world-opening, .explore-cinema, #pro-scene.is-cinema')) return;
    try {
      if (UI.escClosePop()) { e.preventDefault(); e.stopPropagation(); }
    } catch (err) { /* 무시 */ }
  }, true);
}
