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

  // [평가 1] 타이틀에서 창(게임 안내·새로 시작 확인)을 닫으면 사건 큐 처리가 돌아 오류 띠가 떴다: 게임 밖에서는 큐를 돌리지 않는다
  const baseQueue = UI.processQueue;
  if (baseQueue) UI.processQueue = function (...a) { if (this.screen !== 'game' || !G.player) return; return baseQueue.apply(this, a); };

  // [평가 2] 도시 창 안에서 한 행동(마켓 구매 등)이 인물 정보 시트로 튕겼다: 도시 창이면 도시 화면으로 다시 그리고, 보던 자리(스크롤)도 지킨다
  const keepScroll = (fn) => {
    const box = document.getElementById('modal-box'); const sc = box && (box.querySelector('.city-body') || box.querySelector('.sheet-body'));
    const cls = sc ? sc.className : ''; const top = sc ? sc.scrollTop : 0;
    const r = fn();
    try { if (top) { const n = [...document.querySelectorAll('#modal-box .city-body, #modal-box .sheet-body')].find((e) => e.className === cls); if (n) n.scrollTop = top; } } catch (e) { /* 무시 */ }
    return r;
  };
  const baseAfterCity = UI.afterCity;
  if (baseAfterCity) UI.afterCity = function (msg) { return keepScroll(() => baseAfterCity.call(this, msg)); };
  const baseAfter = UI.after;
  UI.after = function (msg) {
    if (this.sheet === 'city' && this.modalOpen() && this.afterCity && document.querySelector('#modal-box .city-hero')) return this.afterCity(msg);
    return keepScroll(() => baseAfter.call(this, msg));
  };

  // 창 위에 뜨는 작은 확인 창 (전투·게이트 창을 갈아 끼우지 않고 그 위에 띄운다)
  UI.confirmOver = function (title, text, okLabel, onOk) {
    const old = document.getElementById('pl-confirm'); if (old) old.remove();
    const el = document.createElement('div'); el.id = 'pl-confirm'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.innerHTML = `<div class="plc-box"><h3>${title}</h3><p>${text}</p><div class="plc-row"><button class="ghost" data-plc="no">취소</button><button class="danger" data-plc="ok">${okLabel}</button></div></div>`;
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const b = e.target.closest('[data-plc]'); if (!b && e.target !== el) return;
      el.remove(); if (b && b.dataset.plc === 'ok') onOk();
    });
    document.body.appendChild(el);
  };
  // [평가 27] 도주·철수는 한 번 누르면 바로 게이트 밖이었다: 잃는 것을 알리고 한 번 더 묻는다
  const baseHandle3 = UI.handle;
  UI.handle = function (act, v) {
    if ((act === 'c-flee' || act === 'g-leave') && !this._fleeOk) {
      const c = this.ctx; const gate = c && c.kind === 'gate';
      if (act === 'c-flee' && !(c && c.combat && c.combat.waiting && !c.combat.result && c.combat.canFlee)) return baseHandle3.call(this, act, v);
      const text = act === 'g-leave' ? '지금 철수하면 이 게이트는 여기서 끝납니다. 낸 입장료와 쓴 시간은 돌아오지 않습니다.'
        : gate ? '도주에 성공하면 게이트 밖으로 나가며, 이 게이트는 여기서 끝납니다. 낸 입장료와 쓴 시간은 돌아오지 않습니다. 실패하면 차례만 잃습니다.'
          : '도주에 성공하면 전투에서 빠져나옵니다. 실패하면 차례만 잃습니다.';
      return this.confirmOver(act === 'g-leave' ? '철수할까요?' : '도주할까요?', text, act === 'g-leave' ? '철수한다' : '도주한다', () => { this._fleeOk = true; try { this.handle(act, v); } finally { this._fleeOk = false; } });
    }
    return baseHandle3.call(this, act, v);
  };

  // [평가 17] 알림 띠는 누르면 바로 닫힌다
  { const t = document.getElementById('toast'); if (t) t.addEventListener('click', (e) => { e.stopPropagation(); t.classList.add('hidden'); }); }
  // [평가 12] 대사 중 표시 (css 가 지도 아래 패널을 숨긴다)
  setInterval(() => { try { document.body.classList.toggle('dlg-on', !!(UI.dlg && UI.screen === 'game' && !UI.modalOpen())); } catch (e) { /* 무시 */ } }, 150);

  // [평가 29] 다른 파티가 먼저 보스를 잡으면 게이트가 예고 없이 닫혀 이유를 알 수 없었다.
  // 층 지도의 경쟁 줄에 규칙과 "얼마나 급한지"를 덧붙인다(정확한 위치는 탐색 능력의 몫이라 가까움·멂만 알린다).
  const baseGateMap = UI.renderGateMap;
  if (baseGateMap) UI.renderGateMap = function (note) {
    const r = baseGateMap.call(this, note);
    try {
      const c = this.ctx; const line = document.querySelector('#modal .gp-line'); const run = c && c.run; const m = run && run.map;
      if (line && m && G.gatePartiesIn && !line.querySelector('.gp-race')) {
        const last = run.floor >= (run.floors || 1) - 1; const top = m.rows.length - 1;
        const here = G.gatePartiesIn(c.gate).filter((pt) => !pt.gone && !pt.allied && pt.floor === run.floor);
        if (here.length) {
          const left = Math.min(...here.map((pt) => top - (pt.row || 0)));
          const near = left <= 2;
          const txt = last
            ? (near ? '경쟁 파티의 기척이 보스 바로 앞에서 느껴진다. 먼저 잡히면 게이트가 닫히고 보스 보상은 없다.' : '경쟁 파티가 먼저 보스를 잡으면 게이트가 닫히고 보스 보상은 없다. 아직은 거리가 있다.')
            : '경쟁 파티가 먼저 올라가고 있다. 마지막 층 보스를 먼저 잡히면 게이트가 닫힌다.';
          line.insertAdjacentHTML('beforeend', ` <span class="gp-race ${near && last ? 'bad' : 'dim'}">${txt}</span>`);
        }
      }
    } catch (e) { /* 무시 */ }
    return r;
  };
}
