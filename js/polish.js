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
  const fixTitle = () => {
    try {
      const box = document.querySelector('.title-screen .btns'); const cont = box && box.querySelector('[data-act="continue"]'); const neu = box && box.querySelector('[data-act="new"]');
      if (cont && neu) {
        const info = saveInfo();
        cont.classList.add('primary'); neu.classList.remove('primary');
        if (info) cont.innerHTML = `<span class="tc-main">이어하기</span><span class="tc-sub">${info}</span>`;
        if (cont.nextElementSibling !== neu || box.firstElementChild !== cont) box.insertBefore(cont, box.firstElementChild);
      }
    } catch (e) { /* 무시 */ }
  };
  UI.renderTitle = function (...a) { const r = baseTitle.apply(this, a); fixTitle(); return r; };
  fixTitle(); // 첫 타이틀은 이 파일보다 먼저 그려진다
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fixTitle);
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
  UI.confirmOver = function (title, text, okLabel, onOk, okCls = 'danger') {
    const old = document.getElementById('pl-confirm'); if (old) old.remove();
    let fresh = false; const el = document.createElement('div'); el.id = 'pl-confirm'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.innerHTML = `<div class="plc-box"><h3>${title}</h3><p>${text}</p><div class="plc-row"><button class="ghost" data-plc="no">취소</button><button class="${okCls}" data-plc="ok">${okLabel}</button></div></div>`;
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const b = e.target.closest('[data-plc]'); if (!b && e.target !== el) return;
      if (!fresh) return; // 창을 띄운 누름을 뗄 때 바로 닫히지 않게: 창이 뜬 뒤 새로 누른 것만 받는다
      el.remove(); if (b && b.dataset.plc === 'ok') onOk();
    });
    el.addEventListener('pointerdown', () => { fresh = true; });
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
  setInterval(() => {
    try {
      const b = document.body; const open = UI.modalOpen && UI.modalOpen(); const box = document.getElementById('modal-box');
      b.classList.toggle('dlg-on', !!(UI.dlg && UI.screen === 'game' && !open));
      // [재평가 N1] 건너뛰기 손잡이가 전투의 작전·배속 단추와 층 지도 제목을 덮었다: 화면 종류에 따라 빈 자리로 옮긴다(css)
      b.classList.toggle('ctx-combat', !!(open && box && box.classList.contains('combat-box')));
      b.classList.toggle('ctx-gmap', !!(open && box && !box.classList.contains('combat-box') && box.querySelector('.gmap')));
    } catch (e) { /* 무시 */ }
  }, 150);

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

  // [평가 33] 설정에 저장 항목: 언제 저장되는지 알리고, 지도 화면에서는 바로 저장할 수 있다
  const baseSet = UI.settingsHtml;
  if (baseSet) UI.settingsHtml = function () {
    const h = baseSet.call(this);
    const can = this.screen === 'game' && G.player && !G.over && !this.ctx;
    const row = `<div class="set-row"><div><b>저장</b><div class="small dim">매달, 그리고 큰일이 끝날 때마다 이 기기에 자동 저장됩니다.</div></div><button data-act="save-now" ${can ? '' : 'disabled'}>지금 저장</button></div>`;
    const at = h.lastIndexOf('<div class="row end">');
    return at < 0 ? h + row : h.slice(0, at) + row + h.slice(at);
  };
  const baseHandle4 = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'save-now') { try { G.save(); this.toast('저장했다.'); } catch (e) { this.toast('저장하지 못했다.'); } return; }
    return baseHandle4.call(this, act, v);
  };

  // [평가 32] 소속(길드·관리국) 가입은 한 번 누르면 확정이었다: 조건을 요약해 보여 주고 한 번 더 묻는다
  const baseHandle5 = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'dlg-choice' && !this._dlgOk && !window.TUT_AUTO_TAP) { // 자동 시험(TUT_AUTO_TAP)은 확인 없이 지나간다
      const d = this.dlg; const line = d && d.lines[d.i]; const c = line && line.choices && line.choices[+v];
      if (c && c.info && c.info.type === 'guild' && /들어간다/.test(c.text || '') && typeof GUILDS !== 'undefined') {
        const id = c.info.id; const name = id === 'kama' ? '관리국 보호국' : (GUILDS[id] ? GUILDS[id].name : '이 소속');
        let terms = ''; try { terms = G.payTermsText ? G.payTermsText(id) : ''; } catch (e) { terms = ''; }
        return this.confirmOver(`${name}에 들어갈까요?`, `${terms ? terms + '<br><br>' : ''}소속은 나중에 쉽게 바꾸기 어렵습니다. 조건을 확인하고 정하세요.`, '들어간다', () => { this._dlgOk = true; try { this.handle(act, v); } finally { this._dlgOk = false; } }, 'primary');
      }
    }
    return baseHandle5.call(this, act, v);
  };

  // [평가 10] 프롤로그 끝에서 세계를 만드는 2~3초 동안 화면이 멈춘 듯 보였다: 먼저 '각성 중' 화면을 한 번 그린 뒤 만든다.
  // 뒤따르는 감싸기들이 세계가 만들어진 직후를 전제로 하므로, 만드는 함수가 아니라 'pro-begin' 처리 전체를 한 박자 늦춘다.
  // 자동 시험(TUT_AUTO_TAP)은 바로 이어서 상태를 읽으므로 늦추지 않는다.
  const baseHandle6 = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'pro-begin' && !this._beginGo && !window.TUT_AUTO_TAP) {
      if (document.getElementById('pl-busy')) return;
      const el = document.createElement('div'); el.id = 'pl-busy'; el.innerHTML = '<div class="plb-ring"></div><b>각성 중…</b><span>세계가 깨어나고 있습니다</span>';
      document.body.appendChild(el);
      let done = false;
      const go = () => { if (done) return; done = true; this._beginGo = true; try { baseHandle6.call(this, act, v); } finally { this._beginGo = false; el.remove(); } };
      requestAnimationFrame(() => requestAnimationFrame(go)); setTimeout(go, 150);
      return;
    }
    return baseHandle6.call(this, act, v);
  };

  // [재평가 G] 시험 결과 창은 새 등급(예: E급)을 말하는데 뒤의 인물 카드는 아직 F였다: 결과 창을 띄우기 전에 지도 화면을 한 번 다시 그린다
  const baseExamEnd = UI.renderExamEnd;
  if (baseExamEnd) UI.renderExamEnd = function (...a) {
    try { if (this.screen === 'game' && document.getElementById('world')) this.renderGame(); } catch (e) { /* 무시 */ }
    return baseExamEnd.apply(this, a);
  };

  // '튜토리얼 건너뛰기' 자리 고정 (사용자 요청): 원래 단추(#tut-skip)는 화면마다 다른 곳으로 옮겨진다(mobile_ux.js·council_dialog.js).
  // 원래 단추는 숨겨 두고, body 바로 아래 같은 자리의 대리 단추를 보인다. 누르면 원래 단추를 누른 것과 똑같이 처리된다(tut_skip.js 두 번 누르기).
  let proxy = null; let skipAsk = false;
  // 확인 창이 떠 있는 동안: 튜토리얼 말풍선의 '화면 아무 데나 누르면 다음'이 창 단추 누르기를 가로채지 않게 하고, 전투 시간도 멈춘다
  if (UI.tutHeld) { const baseHeld = UI.tutHeld; UI.tutHeld = function (...a) { if (skipAsk) return false; return baseHeld.apply(this, a); }; }
  if (typeof Combat !== 'undefined') { const baseTick = Combat.prototype.tick; Combat.prototype.tick = function (...a) { if (skipAsk) return null; return baseTick.apply(this, a); }; }
  const syncSkip = () => {
    const real = document.getElementById('tut-skip');
    // 원래 단추는 화면을 다시 그릴 때마다 지워졌다 새로 붙는다. 그때마다 대리 단추를 지웠다 만들면 깜빡이며 자리가 흔들렸다(사용자 지적).
    // 원래 단추가 0.8초 넘게 없을 때만 대리 단추를 지운다.
    const now = Date.now();
    if (!real || !real.isConnected) { if (proxy && now - (syncSkip.seen || 0) > 800) { proxy.remove(); proxy = null; } return; }
    syncSkip.seen = now;
    real.classList.add('tsk-hide');
    if (!proxy) {
      proxy = document.createElement('button'); proxy.type = 'button'; proxy.className = 'tsk-proxy'; proxy.setAttribute('aria-label', '튜토리얼 건너뛰기');
      // 누르면 "한 번 더" 대신 가운데 확인 창으로 묻는다 (사용자 요청)
      // 손가락을 대는 순간 창을 띄운다. 손을 뗄 때 창이 닫히지 않게 하는 것은 confirmOver 가 맡는다(창 안에서 새로 누른 것만 받는다)
      proxy.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); });
      proxy.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const r = document.getElementById('tut-skip'); if (!r || r.disabled || skipAsk) return;
        skipAsk = true;
        UI.confirmOver('튜토리얼을 끝낼까요?', '자격 시험을 여기서 끝내고 바로 결과(등급 판정)로 넘어갑니다.', '튜토리얼 끝내기', () => { skipAsk = false; if (UI.tutSkipNow) UI.tutSkipNow(); }, 'primary');
        // 취소(또는 바깥 누름)로 창이 닫히면 묻는 중 표시를 푼다
        const watch = setInterval(() => { if (!document.getElementById('pl-confirm')) { skipAsk = false; clearInterval(watch); } }, 100);
      });
      document.body.appendChild(proxy);
    }
    proxy.classList.toggle('armed', real.classList.contains('armed'));
    proxy.disabled = !!real.disabled;
  };
  setInterval(() => { try { syncSkip(); } catch (e) { /* 무시 */ } }, 120);
  // 새로 붙은 원래 단추를 다음 확인(0.12초) 전에도 바로 숨긴다
  try { new MutationObserver(() => { const r = document.getElementById('tut-skip'); if (r && !r.classList.contains('tsk-hide')) { r.classList.add('tsk-hide'); syncSkip.seen = Date.now(); } }).observe(document.body, { childList: true, subtree: true }); } catch (e) { /* 무시 */ }
}

// 보스 표시: 아군 '리더' 꼬리표와 같은 자리(카드 왼쪽 위)에 '보스' (사용자 요청). 크기는 css/polish.css 에서 1.5배.
if (typeof UI !== 'undefined' && UI.unitEl) {
  const baseUnitEl = UI.unitEl;
  UI.unitEl = function (u, ...a) {
    const h = baseUnitEl.call(this, u, ...a);
    try { if (u && u.side === 'enemy' && u.boss && typeof h === 'string' && !h.includes('boss-tag')) { const i = h.indexOf('>'); if (i > 0) return h.slice(0, i + 1) + '<span class="boss-tag">보스</span>' + h.slice(i + 1); } } catch (e) { /* 무시 */ }
    return h;
  };
}

// 기술 상세 창(js/skill_hold.js): 방어·강화·회복처럼 피해를 주지 않는 기술에도 속성만 보고 '상태 이상'·'원소 반응' 줄이 붙었다(사용자 지적).
// 상태 이상은 맞혀서 피해를 줄 때만 걸리므로(js/status_fx.js dealDamage) 피해 기술에만 보여 준다.
// 또 자기 강화(방어·강화·회피·회복)는 내가 쓰면 나에게 걸리므로 '대상'을 '자신'으로. 동료에게 오더를 내릴 때만 '아군 하나'.
if (typeof UI !== 'undefined' && UI.skillHoldHtml) {
  const DMG_TYPES = ['dmg', 'crit', 'pierce', 'multi', 'dot', 'drain', 'stun', 'aoe'];
  const SELF_TYPES = ['heal', 'buff', 'shield', 'evade'];
  const baseHold = UI.skillHoldHtml;
  UI.skillHoldHtml = function (sk, u, ...a) {
    let h = baseHold.call(this, sk, u, ...a);
    try {
      if (sk && !DMG_TYPES.includes(sk.type)) h = h.replace(/<tr><th>상태 이상<\/th>[\s\S]*?<\/tr>/, '').replace(/<tr><th>원소 반응<\/th>[\s\S]*?<\/tr>/, '');
      const ordering = this.ctx && this.ctx.orderFor && u && u.id === this.ctx.orderFor;
      if (sk && SELF_TYPES.includes(sk.type) && !ordering) h = h.replace('<tr><th>대상</th><td>아군 하나</td></tr>', '<tr><th>대상</th><td>자신</td></tr>');
      if (sk && sk.type === 'heal_ally') h = h.replace('<tr><th>대상</th><td>아군 하나</td></tr>', '<tr><th>대상</th><td>아군 하나 (자신 포함)</td></tr>');
    } catch (e) { /* 무시 */ }
    return h;
  };
}

// 팝업 높이 다시 재기 (사용자 지적: 탐사 지점 팝업 아래가 잘림)
// js/popup_size.js 는 팝업을 여는 순간 내용 높이를 재서 고정하는데, 그때 위쪽 그림(img)이 아직 안 읽혀 높이 0으로 계산됐다.
// 그림이 다 읽히거나 팝업 안 내용이 늦게 붙으면 한 번 더 재게 한다(popup_size.js 의 resize 처리로 다시 잰다).
if (typeof UI !== 'undefined' && UI.modal) {
  const refit = () => { try { window.dispatchEvent(new Event('resize')); } catch (e) { /* 무시 */ } };
  let mo = null, moT = 0;
  const baseModalFit = UI.modal;
  UI.modal = function (...a) {
    const r = baseModalFit.apply(this, a);
    try {
      const box = document.getElementById('modal-box');
      if (box) {
        for (const img of box.querySelectorAll('img')) if (!img.complete) { img.addEventListener('load', refit, { once: true }); img.addEventListener('error', refit, { once: true }); }
        // 다른 파일이 팝업을 연 뒤에 그림·내용을 붙이는 경우: 잠깐 동안 바뀌면 다시 잰다
        if (mo) mo.disconnect(); clearTimeout(moT);
        mo = new MutationObserver((list) => {
          for (const m of list) for (const n of m.addedNodes) if (n.querySelectorAll) for (const img of [n, ...n.querySelectorAll('img')]) if (img.tagName === 'IMG' && !img.complete) img.addEventListener('load', refit, { once: true });
          refit();
        });
        mo.observe(box, { childList: true, subtree: true });
        moT = setTimeout(() => { if (mo) { mo.disconnect(); mo = null; } }, 1500);
      }
    } catch (e) { /* 무시 */ }
    return r;
  };
}

// 월드맵 게이트는 2×2 칸(게이트 칸 + 오른쪽·아래)으로 그린다(js/mapview.js). 네 칸 중 어디를 눌러도 게이트 칸을 누른 것으로.
if (typeof UI !== 'undefined' && UI.onTap) {
  const baseTap = UI.onTap;
  UI.onTap = function (x, y, ...a) {
    try {
      const has = (gx, gy) => G.gatesShown && G.gatesShown().find((g) => g.x === gx && g.y === gy && !g.gone);
      if (!has(x, y) && !(G.objAt && G.objAt(x, y))) {
        const g = has(x - 1, y) || has(x, y - 1) || has(x - 1, y - 1);
        if (g) return baseTap.call(this, g.x, g.y, ...a);
      }
    } catch (e) { /* 무시 */ }
    return baseTap.call(this, x, y, ...a);
  };
}

// 추적 경로(노란 선, js/quest_route.js) 끝에 깃발 (사용자 요청)
// - 목적지가 게이트면 게이트를 2×2로 그리므로(js/mapview.js) 선 끝·네모 표시·깃발을 2×2 한가운데로 맞춘다.
// - 깃발을 세우고, 목적지 이름표는 깃발 위로 올려 겹치지 않게 한다.
if (typeof MapView !== 'undefined' && MapView.prototype.drawQuestRouteMarker) {
  const MP = MapView.prototype;
  const gateAt = (x, y) => (G.mapGates || []).find((g) => g.x === x && g.y === y && !g.cleared);
  const endOf = (mv, dest) => (gateAt(dest.x, dest.y) ? { x: dest.x + 1, y: dest.y + 1, big: true } : { x: dest.x + 0.5, y: dest.y + 0.5, big: false });
  // 노란 선: 원래 그리기와 같되, 목적지가 게이트면 마지막 점을 2×2 한가운데로 옮긴다
  MP.drawQuestRoute = function () {
    if (typeof UI !== 'undefined' && UI.ctx) return;
    const route = this.questRouteData && this.questRouteData(); if (!route || !route.path) return;
    const { path, dest } = route; const c = this.ctx;
    const pts = path.map((i) => { const [x, y] = WORLD.xy(i); return this.toScreen(x + 0.5, y + 0.5); });
    if (this.token && this.token.walking) pts[0] = this.toScreen(this.token.x + 0.5, this.token.y + 0.5);
    const e = endOf(this, dest); if (e.big) pts[pts.length - 1] = this.toScreen(e.x, e.y);
    if (pts.length < 2) return;
    c.save(); c.setLineDash([]); c.lineJoin = 'round'; c.lineCap = 'round';
    for (const [w, col] of [[8, '#11170be8'], [4.5, '#ffe23b']]) { c.lineWidth = w; c.strokeStyle = col; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); }
    c.restore();
  };
  MP.drawQuestRouteMarker = function () {
    try {
      if (typeof UI !== 'undefined' && UI.ctx) return;
      const route = this.questRouteData && this.questRouteData(); if (!route || !route.path) return;
      const { dest, path, days } = route; const c = this.ctx, s = this.tile; const e = endOf(this, dest);
      const [x, y] = this.toScreen(e.x, e.y);
      if (x < -s * 2 || y < -s * 2 || x > this.w + s * 2 || y > this.hgt + s * 2) return;
      c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
      // 목적지 네모 (게이트면 2×2)
      const half = e.big ? s * 0.96 : s * 0.43;
      c.strokeStyle = 'rgba(17,23,11,.9)'; c.lineWidth = 5; c.strokeRect(x - half, y - half, half * 2, half * 2);
      c.strokeStyle = '#ffe23b'; c.lineWidth = 3; c.strokeRect(x - half, y - half, half * 2, half * 2);
      // 깃발
      const H = Math.max(28, s * (e.big ? 1.25 : 0.95)), W = Math.max(18, s * 0.62), wave = Math.sin((this.t || 0) / 9) * W * 0.08; const top = y - H;
      c.fillStyle = 'rgba(5,8,13,.55)'; c.beginPath(); c.ellipse(x, y, W * 0.32, W * 0.12, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(5,8,13,.95)'; c.lineWidth = 6; c.beginPath(); c.moveTo(x, y); c.lineTo(x, top); c.stroke();
      c.strokeStyle = '#f2f4f7'; c.lineWidth = 2.8; c.beginPath(); c.moveTo(x, y); c.lineTo(x, top); c.stroke();
      c.beginPath(); c.moveTo(x + 1, top + 1);
      c.quadraticCurveTo(x + W * 0.5, top - W * 0.08 + wave, x + W, top + W * 0.12);
      c.lineTo(x + W * 0.78, top + W * 0.36); c.lineTo(x + W, top + W * 0.6);
      c.quadraticCurveTo(x + W * 0.5, top + W * 0.48 - wave, x + 1, top + W * 0.62); c.closePath();
      c.shadowColor = '#ffe23b'; c.shadowBlur = 12; c.fillStyle = '#ffe23b'; c.fill(); c.shadowBlur = 0;
      c.strokeStyle = 'rgba(17,23,11,.95)'; c.lineWidth = 3; c.stroke(); c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1; c.stroke();
      c.fillStyle = '#f2f4f7'; c.beginPath(); c.arc(x, top, 3.4, 0, Math.PI * 2); c.fill();
      // 이름표: 깃발 위
      const text = `${dest.kind === 'main' ? '메인' : '추적'} · ${String(dest.title || '').slice(0, this.w < 600 ? 10 : 17)}${path.length === 1 ? ' · 도착' : ` · ${WORLD.formatTravelTime(days)}`}`;
      c.font = '700 12px "IBM Plex Sans KR", sans-serif'; const hw = Math.min(this.w / 2 - 8, c.measureText(text).width / 2 + 10);
      c.restore();
      this.chip(Math.max(hw + 4, Math.min(this.w - hw - 4, x + W * 0.3)), Math.max(16, top - 14), text, '#ffe23b', '#171b0bf2');
    } catch (e) { /* 표시 실패는 지도를 막지 않는다 */ }
  };
}

// 도시·거점 사건은 도시에 있을 때만 (사용자 지적: 들판에 있는데 도시 안 사건처럼 나옴)
// 사건은 달이 바뀔 때 뽑아 큐에 넣고, 이동이 멈춘 곳에서 보여 준다. 그래서 도시를 지나며 뽑힌 도시 사건(city)이
// 도시 밖에서 뜨기도 했다. 보여 주는 순간 다시 확인해서, 도시가 아니면 미뤄 두었다가 그 지역(지역 사건이면 그 지역) 도시에 들어갈 때 띄운다.
if (typeof UI !== 'undefined' && UI.showStory) {
  const evOf = (id) => (typeof STORY !== 'undefined' ? STORY.find((e) => e.id === id) : null);
  const fits = (ev) => !ev || !ev.city || (G.onCity() && (!ev.region || ev.region === G.player.region));
  const baseShow = UI.showStory;
  UI.showStory = function (q, ...a) {
    try {
      const ev = q && evOf(q.id);
      if (ev && !fits(ev)) {
        const p = G.player; p.cityStoryWait = (p.cityStoryWait || []).filter((x) => x.id !== q.id).concat([{ ...q }]).slice(-3);
        return this.processQueue();
      }
    } catch (e) { /* 무시 */ }
    return baseShow.call(this, q, ...a);
  };
  // 도시에 들어가면 미뤄 둔 사건을 띄운다
  const release = () => {
    try {
      const p = G.player; if (!p || !p.cityStoryWait || !p.cityStoryWait.length || !G.onCity()) return;
      const keep = [];
      for (const q of p.cityStoryWait) { const ev = evOf(q.id); if (fits(ev)) G.queue.push(q); else keep.push(q); }
      p.cityStoryWait = keep;
    } catch (e) { /* 무시 */ }
  };
  const baseEnd = UI.endWalk;
  if (baseEnd) UI.endWalk = function (...a) { release(); return baseEnd.apply(this, a); };
  const baseCity = UI.openCity;
  if (baseCity) UI.openCity = function (...a) { release(); return baseCity.apply(this, a); };
}

// 전투를 연 첫 화면부터 적 줄을 모아 붙이고(js/combat_ui.js) 그 상태로 괴수 크기를 잰다.
// 전에는 처음엔 넓은 칸으로 그렸다가 1~2초 뒤 칸을 모으며 크기를 다시 줄여, 처음 나올 때와 싸울 때 크기가 달랐다(사용자 지적).
if (typeof UI !== 'undefined' && UI.openCombat) {
  const baseOpenFit = UI.openCombat;
  UI.openCombat = function (...a) {
    const r = baseOpenFit.apply(this, a);
    try { if (this.refreshUnits) this.refreshUnits(); if (this.combatFit) this.combatFit(); } catch (e) { /* 무시 */ }
    return r;
  };
}

// 남을 치료하는 회복 기술은 동료에게도 쓸 수 있게 (사용자 지적: 사제의 '치유의 빛' 같은 회복 기술이 자기 자신에게만 걸림)
// 회복(heal)·강화(buff)·보호(shield) 기술 39개 중 대부분은 "몸을 키워", "제 피를 끓여", "자신의 공격을 올린다"처럼 자기에게 거는 기술이다.
// 설명에 자기 몸·자신 이야기가 없는 회복 기술만(치유의 빛·환생) '아군 하나 회복'(heal_ally)으로 바꾼다: 기술을 고른 뒤 동료나 나를 눌러 대상을 정한다.
// NPC 동료도 이 기술을 가지고 있으면 체력이 가장 낮은 동료를 치료한다(combat.js heal_ally).
if (typeof SKILLS !== 'undefined') {
  const SELF = /(몸|자신|스스로|제 |살갗|자세|호흡|숨|마음|맹세|변신|뿌리|분노|기를|의지|고요히|채찍|갑주|피를|살기|총|검에|괴수와|계율|혈관|빗장|땅에)/;
  for (const sk of SKILLS) if (sk.type === 'heal' && !SELF.test(`${sk.name} ${sk.desc || ''}`)) { sk.type = 'heal_ally'; sk.allyHeal = true; }
}

// 기술 접사(예리한·묵직한·절약의 등, js/bonds.js)는 이름 앞에 붙이지 않고 이름 옆 태그로 통일 (사용자 요청)
// 전에는 "예리한 치유의 빛"처럼 이름이 바뀌어 같은 기술이 화면마다 다른 이름으로 보였다. 이름은 원래 이름, 접사는 태그.
if (typeof Game !== 'undefined' && Game.prototype.skillEff && Game.prototype.affixLabel) {
  const baseEff = Game.prototype.skillEff;
  Game.prototype.skillEff = function (sk, ...a) {
    const r = baseEff.call(this, sk, ...a);
    try {
      if (r && sk && r.name !== sk.name) {
        // 접사는 태그로, 각성(·각성)은 레벨 태그 '각성'으로 보여 주므로 이름에서 뗀다
        const lb = this.affixLabel ? this.affixLabel(r.id) : '';
        let nm = r.name; if (lb && nm.startsWith(lb + ' ')) nm = nm.slice(lb.length + 1); nm = nm.replace(/·각성$/, '');
        if (nm !== r.name) return { ...r, name: nm, affix: lb || r.affix };
      }
    } catch (e) { /* 무시 */ }
    return r;
  };
}
if (typeof UI !== 'undefined') {
  // 접사마다 태그 하나 (숨은 접사 + 일반 접사면 둘)
  const affTags = (id, cls = '') => {
    const a = G.player && G.player.skillAffix && G.player.skillAffix[id]; if (!a || typeof affixById !== 'function') return '';
    return [a.h, a.a].map((x) => x && affixById(x)).filter((x) => x && x.name).map((x) => `<span class="tag sk-affix${cls}${x.id === a.h ? ' hid' : ''}" data-sk="${id}" data-af="${x.id}">${x.name}</span>`).join(' ');
  };
  UI.affTags = affTags;
  // 스킬 레벨·숙련 (hunter.js SKILL_LV_REQ: Lv2~5에 필요한 누적 사용 8·24·50·90회)
  const lvInfo = (id) => {
    if (!G.skillLv || typeof SKILL_LV_REQ === 'undefined' || !G.player) return null;
    const lv = G.skillLv(id); const xp = (G.player.skillXp || {})[id] || 0; const next = SKILL_LV_REQ[lv]; const prev = SKILL_LV_REQ[lv - 1] || 0;
    return { lv, xp, next, pct: next ? Math.max(0, Math.min(100, Math.round(((xp - prev) / (next - prev)) * 100))) : 100 };
  };
  const lvTag = (id, cls = '') => { const L = lvInfo(id); if (!L) return ''; return `<span class="tag sk-lv${cls}${L.lv >= 5 ? ' awake' : ''}">${L.lv >= 5 ? '각성' : `Lv${L.lv}`}</span>`; };
  // 숙련 막대: 레벨 태그를 막대 왼쪽에 두고, 숫자(숙련 n/n)는 뺀다 (사용자 요청)
  const xpBar = (id) => { const L = lvInfo(id); if (!L) return ''; return `${lvTag(id, ' xl')}<span class="sk-xp" title="${L.next ? `숙련 ${L.xp}/${L.next}` : '숙련 최대'}"><i style="width:${L.pct}%"></i></span>`; };
  UI.skLvTag = lvTag; UI.skXpBar = xpBar;
  const tagAffix = (root) => {
    if (!root || !G.player) return;
    for (const el of root.querySelectorAll('[data-act="c-skill"][data-v], [data-act="st-sk"][data-v]')) {
      const id = el.dataset.v; if (!id || id === 'strike' || el.querySelector('.sk-lv')) continue;
      const b = el.querySelector('b'); if (!b) continue;
      const inC = el.dataset.act === 'c-skill' ? ' in' : '';
      const html = `${lvTag(id, inC)}${affTags(id, inC) ? ' ' + affTags(id, inC) : ''}`;
      if (inC) b.insertAdjacentHTML('beforeend', ` ${html}`); else b.insertAdjacentHTML('afterend', html);
    }
  };
  const wrapR = (name) => { const base = UI[name]; if (!base) return; UI[name] = function (...a) { const r = base.apply(this, a); try { tagAffix(document.getElementById('modal-box')); tagAffix(document.getElementById('app')); } catch (e) { /* 무시 */ } return r; }; };
  ['renderControls', 'showStatusCheck', 'render'].forEach(wrapR);
  // 기술 상세 창 머리
  if (UI.skillHoldHtml) {
    const baseHold2 = UI.skillHoldHtml;
    UI.skillHoldHtml = function (sk, u, ...a) {
      let h = baseHold2.call(this, sk, u, ...a);
      try {
        const lb = sk && (sk.affix || (u && u.isPlayer !== false && G.affixLabel && G.player && (G.player.skills || []).includes(sk.id) ? G.affixLabel(sk.id) : ''));
        const mine = sk && G.player && (G.player.skills || []).includes(sk.id) && (!u || u.isPlayer !== false) && sk.id !== 'strike';
        if (lb && !/sk-affix/.test(h)) h = h.replace(/(<div class="sh-head">[\s\S]*?<b>[^<]*<\/b>(?:<span class="tag sk-lv[^>]*>[^<]*<\/span>)?)/, `$1${UI.affTags ? UI.affTags(sk.id) : ''}`);
        if (mine && UI.skXpBar && !/sk-xp/.test(h)) h = h.replace(/(<table class="sh-table">)/, `<div class="sh-xp">${UI.skXpBar(sk.id)}</div>$1`);
      } catch (e) { /* 무시 */ }
      return h;
    };
  }
}

// 접사 태그를 누르면 어디서든 그 접사의 효과를 작은 창으로 (사용자 요청)
// 태그는 기술 단추 안에 있으므로 단추가 눌리거나(기술 고르기) 길게 누르기(기술 상세)가 시작되지 않게 가장 먼저 가로챈다.
if (typeof UI !== 'undefined' && typeof affixById === 'function') {
  const pct = (v) => { const d = Math.round((v - 1) * 100); return d ? `${d > 0 ? '+' : ''}${d}%` : '변화 없음'; };
  UI.showAffixPop = function (id, af) {
    const a = G.player && G.player.skillAffix && G.player.skillAffix[id]; if (!a) return;
    const x = affixById(af || a.a); if (!x || !x.name) return;
    document.getElementById('affix-pop')?.remove();
    document.body.insertAdjacentHTML('beforeend', `<div id="affix-pop" role="dialog" aria-label="접사 효과"><div class="ap-box"><div class="ap-head">${x.name}${x.id === a.h ? ' <span class="small amber">숨은 접사</span>' : ''}</div><div>위력 ${pct(x.power)} · 정신력 소모 ${pct(x.mp)}</div></div></div>`);
  };
  const close = () => { const e = document.getElementById('affix-pop'); if (e) { e.remove(); return true; } return false; };
  const grab = (e) => {
    const pop = document.getElementById('affix-pop');
    if (pop) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); if (e.type === 'click') close(); return; }
    const t = e.target && e.target.closest && e.target.closest('.sk-affix[data-sk]'); if (!t) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    if (e.type === 'click') UI.showAffixPop(t.dataset.sk, t.dataset.af);
  };
  for (const ev of ['pointerdown', 'pointerup', 'touchstart', 'mousedown', 'click']) window.addEventListener(ev, grab, { capture: true, passive: false });
}

// 스킬 창: 접사(bonds.js)는 효과 글자까지 붙고, 레벨(hunter.js)은 "숙련 13/24" 글자뿐이었다 → 다른 화면과 같은 태그 + 숙련 막대
if (typeof UI !== 'undefined' && UI.skillsHtml) {
  const baseSk = UI.skillsHtml;
  UI.skillsHtml = function (...a) {
    let h = baseSk.apply(this, a);
    try {
      for (const id of (G.player && G.player.skills) || []) {
        if (id === 'strike') continue; const sk = skillById(id); if (!sk) continue;
        const nm = sk.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`<b>${nm}</b>((?:\\s*<span class="tag[^"]*"(?: title="[^"]*")?>[^<]*</span>\\s*<span class="small dim">[^<]*</span>)+)`);
        h = h.replace(re, `<b>${sk.name}</b>${UI.affTags && UI.affTags(id) ? ' ' + UI.affTags(id) : ''} <span class="sk-xp-wrap">${UI.skXpBar ? UI.skXpBar(id) : ''}</span>`);
      }
    } catch (e) { /* 무시 */ }
    return h;
  };
}

// 시험 탐색 첫 설명(사용자 요청): 리더가 "위로 올라가는 구조야, 맨 위에는 보스" 하고 말할 때, 모바일은 경로 지도가 "전체 경로 보기" 안에 숨어 있어
// 말하는 것을 볼 수 없었다. 그 말이 나오는 동안 전체 경로 지도를 펼치고, 대화창은 아래쪽에 작게(얼굴 그림 없이) 띄워 지도를 가리지 않는다.
if (typeof UI !== 'undefined' && UI.examLeadTalk) {
  const baseLeadTalk = UI.examLeadTalk;
  UI.examLeadTalk = function (...a) {
    const m = this.exam && this.exam.map;
    if (!m || m.step !== 'intro' || window.innerWidth >= 1100 || !this.talk) return baseLeadTalk.apply(this, a);
    const talk = this.talk;
    this.talk = function (lines, done) {
      UI.talk = talk;
      try { UI.handle('xr-map'); } catch (e) { /* 무시 */ }
      document.body.classList.add('dlg-mapview');
      return talk.call(UI, lines, (...r) => {
        document.body.classList.remove('dlg-mapview');
        try { UI.handle('xr-map-close'); } catch (e) { /* 무시 */ }
        if (done) return done(...r);
      });
    };
    try { return baseLeadTalk.apply(this, a); } finally { if (this.talk !== talk) this.talk = talk; }
  };
}
