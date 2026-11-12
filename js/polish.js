// 완성도 다듬기 (영역 B): 화면 겹침·가림 같은 작은 문제를 감싸기로 고친다. 스타일은 css/polish.css.
{
  // 알림 띠: 창이 열려 있으면 창 머리(제목·닫기 단추)를 덮지 않게 아래쪽에 띄운다
  const baseToast = UI.toast;
  UI.toast = function (msg) {
    const r = baseToast.call(this, msg);
    try { const t = document.getElementById('toast'); if (t) t.classList.toggle('low', !!(this.modalOpen && this.modalOpen())); } catch (e) { /* 무시 */ }
    return r;
  };

  // 전투 말풍선: 말하는 인물을 잠깐 맨 위로 올려, 옆 사람 초상에 글자가 가리지 않게 한다
  const baseApply = UI.applyEvent;
  UI.applyEvent = function (l) {
    const r = baseApply.call(this, l);
    try {
      const ev = l && l.ev;
      if (ev && ev.k === 'say') {
        const el = document.getElementById('u-' + ev.src);
        if (el) { el.classList.add('saying'); clearTimeout(el._sayT); el._sayT = setTimeout(() => el.classList.remove('saying'), 1800); }
      }
    } catch (e) { /* 무시 */ }
    return r;
  };

  // 메뉴: 설정을 같은 격자 칸으로 넣고, 메뉴 정리 때 빠졌던 '게임 안내'와 '저장하고 타이틀로'를 아래 줄에 되살린다
  const GEAR = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';
  if (UI.menuPopup) {
    UI.menuPopup = function () {
      this.modal(`<div class="row between"><h3>메뉴</h3><button class="icon-btn" data-act="modal-close" aria-label="닫기">×</button></div>
        <div class="menu-grid">${this.hudMenu()}<button class="menu-btn" data-act="settings">${GEAR}<span>설정</span></button></div>
        <div class="menu-sub menu-sub2"><button data-act="help">게임 안내</button><button data-act="to-title-confirm">타이틀로</button></div>`, 'menu-pop');
    };
  }
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'to-title-confirm') {
      return this.modal('<h3>타이틀로 돌아갈까요?</h3><p class="dim">지금까지의 진행을 저장하고 타이틀로 돌아갑니다. 타이틀의 "이어하기"로 다시 시작할 수 있습니다.</p><div class="row end"><button class="ghost" data-act="modal-close">취소</button><button class="primary" data-act="to-title">타이틀로</button></div>');
    }
    if (act === 'to-title') { try { if (G.player && !G.over && this.screen === 'game' && !this.ctx) G.save(); } catch (e) { /* 저장 실패는 무시 */ } }
    return baseHandle.call(this, act, v);
  };

  // 타이틀: 저장이 있으면 '이어하기'를 맨 위 주 버튼으로 올리고 누구의 몇 년째인지 보여 준다.
  // 저장이 있는데 '새로운 각성'을 누르면 덮어쓴다는 것을 먼저 묻는다.
  const saveInfo = () => {
    try {
      const d = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (!d || !d.player) return null;
      const p = d.player; const rk = (typeof RANKS !== 'undefined' && RANKS[p.rankIdx]) ? RANKS[p.rankIdx].key + '급' : '';
      return `${p.name || '이름 없음'}${rk ? ' · ' + rk : ''} · ${d.year}년 ${d.month}월`;
    } catch (e) { return null; }
  };
  const baseTitle = UI.renderTitle;
  UI.renderTitle = function (...a) {
    const r = baseTitle.apply(this, a);
    try {
      const box = document.querySelector('.title-screen .btns'); const cont = box && box.querySelector('[data-act="continue"]'); const neu = box && box.querySelector('[data-act="new"]');
      if (cont && neu) {
        const info = saveInfo();
        cont.classList.add('primary'); neu.classList.remove('primary');
        if (info) cont.innerHTML = `<span class="tc-main">이어하기</span><span class="tc-sub">${info}</span>`;
        box.insertBefore(cont, neu);
      }
    } catch (e) { /* 무시 */ }
    return r;
  };
  const baseHandle2 = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'new' && this.screen === 'title' && Game.hasSave() && !this._newOk) {
      const info = saveInfo();
      return this.modal(`<h3>새로 시작할까요?</h3><p class="dim">저장된 진행${info ? ` (${info})` : ''}이 있습니다. 새 헌터로 시작하면 이 저장은 덮어쓰여 사라집니다.</p><div class="row end"><button class="ghost" data-act="modal-close">취소</button><button class="primary" data-act="new-ok">새로 시작</button></div>`);
    }
    if (act === 'new-ok') { this.closeModal(); this._newOk = true; try { return baseHandle2.call(this, 'new', v); } finally { this._newOk = false; } }
    return baseHandle2.call(this, act, v);
  };
}
