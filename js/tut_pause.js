// 튜토리얼 대사 멈춤 (영역 B, 사용자 제보 — 조사 세션 경유)
// 자격 시험(전투·탐색 지도)의 선임 대사와 첫 오더 설명이 휙 지나가지 않게:
//  - 말풍선이 뜨면 전투 시간(게이지)과 자동 전투, 시험 지도의 자동 진행을 멈춘다.
//  - 화면을 터치해야 다음으로. 말풍선 하나당 터치 한 번(문장은 한꺼번에 다 보인다). 말풍선 아래 "▼ 터치하여 계속".
//  - 터치하면 그 말풍선이 닫히고 멈춤이 풀린다.
//  - 시험이 끝난 뒤의 일반 대사는 건드리지 않는다.
// 자동 시험(tools/smoke_test.js)은 window.TUT_AUTO_TAP 을 켜서 멈춤 없이 지나간다.
{
  // 문장 단위로 자르기 (꾸밈 태그가 섞인 말은 자르지 않는다)
  // (사용자 정정: 문장마다가 아니라 말풍선 하나당 터치 한 번 → 지금은 통째로 한 번에 보여 준다. ONE_TOUCH 를 끄면 문장 단위)
  const ONE_TOUCH = true;
  const cut = (txt) => {
    if (ONE_TOUCH) return [txt];
    if (/</.test(txt)) return [txt];
    const quoted = /^\s*["“]/.test(txt);
    const body = txt.trim().replace(/^["“]|["”]$/g, '');
    const parts = (body.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g) || [body]).map((s) => s.trim()).filter(Boolean);
    if (quoted && parts.length) { parts[0] = '"' + parts[0]; parts[parts.length - 1] += '"'; } // 따옴표는 처음과 끝에만
    return parts;
  };
  // 이 말풍선에서 멈출 것인가
  UI.tutHoldWanted = function (key) {
    if (window.TUT_AUTO_TAP) return false;
    const c = this.ctx;
    if (key === 'order-tip') return true;
    if (c && c.combat && c.tutorial && !c.combat.result) return true;
    if (this.exam && /^lead:/.test(String(key || ''))) return true;
    return false;
  };
  const store = (ui) => { const o = ui.exam || ui.ctx || ui; return (o._tutRead = o._tutRead || new Set()); };

  // 말풍선 안을 "지금까지 읽은 문장"만 보이게 꾸민다 (자리는 미리 다 잡아 둬서 크기가 변하지 않는다)
  const paint = (ui, node) => {
    const h = ui._hold; if (!h || !node) return;
    for (const old of node.querySelectorAll('.tp-next')) old.remove();
    const body = node.querySelector(':scope > div') || node;
    const sys = body.querySelector('.coach-sys'); if (sys) sys.remove();
    body.innerHTML = h.lines.map((s, i) => `<span class="tp-line ${i > h.i ? 'tp-wait' : ''}">${s}</span>`).join(' ');
    const last = h.i >= h.lines.length - 1;
    if (sys) { sys.classList.toggle('tp-wait', !last); body.appendChild(sys); }
    node.insertAdjacentHTML('beforeend', '<div class="tp-next" aria-hidden="true">▼ 터치하여 계속</div>');
  };

  // 말풍선을 띄우기 직전에 말풍선 관리자(js/speech.js)가 부른다 (coachPop 을 따로 감싸지 않는다)
  UI.tutHoldBefore = function (node, target, key) {
    let id = null, lines = null;
    if (node && node._tp && this.tutHoldWanted(key)) { id = node._tp.id; lines = node._tp.lines; if (store(this).has(id)) id = null; } // 이미 꾸민 말풍선을 다시 띄우는 경우
    else if (node && this.tutHoldWanted(key)) {
      const body = node.querySelector(':scope > div') || node;
      const clone = body.cloneNode(true); const sys = clone.querySelector('.coach-sys'); if (sys) sys.remove();
      const txt = clone.innerHTML.trim();
      id = txt.replace(/<[^>]+>/g, '').slice(0, 80);
      lines = cut(txt); node._tp = { id, lines };
      if (store(this).has(id)) id = null;
    }
    if (id) {
      if (!this._hold || this._hold.id !== id) {
        const cb = this.ctx && this.ctx.combat;
        this._hold = { id, lines, i: 0, at: Date.now(), auto: !!(cb && cb.auto), cb };
        if (cb && cb.auto) cb.auto = false; // 자동 전투도 대사 동안은 멈춘다
        // 닫아 둔 안내와 같은 열쇠여도 새 대사는 보여 준다
        if (this._coachShut === key) this._coachShut = null;
      }
      paint(this, node);
    } else if (this._hold && (!node || !this.tutHoldWanted(key))) this.tutRelease(false);
  };

  // 멈춤 풀기 (read: 끝까지 읽었는가)
  UI.tutRelease = function (read) {
    const h = this._hold; if (!h) return;
    this._hold = null;
    if (read) store(this).add(h.id);
    if (h.auto && h.cb && !h.cb.result) h.cb.auto = true;
    document.body.classList.remove('tut-hold');
  };
  // 터치 한 번: 다음 문장, 마지막이면 풀기
  UI.tutNext = function () {
    const h = this._hold; if (!h) return;
    if (Date.now() - h.at < 250) return; // 연타로 건너뛰지 않게
    h.at = Date.now();
    const pop = document.getElementById('coach-pop'); const node = pop && pop.querySelector('.coach-card');
    if (h.i < h.lines.length - 1) {
      h.i++;
      if (node) { const ls = node.querySelectorAll('.tp-line'); if (ls[h.i]) ls[h.i].classList.remove('tp-wait'); if (h.i >= h.lines.length - 1) { const s = node.querySelector('.coach-sys'); if (s) s.classList.remove('tp-wait'); } }
      if (window.SFX && SFX.play) try { SFX.play('tap'); } catch (e) { /* 무시 */ }
      return;
    }
    this.tutRelease(true);
    const c = this.ctx; const cb = c && c.combat;
    // 터치 한 번에 말풍선을 닫는다 (같은 안내는 다시 뜨지 않게 닫힘 표시)
    if (pop) { this._coachShut = pop._key; pop.remove(); for (const el of document.querySelectorAll('.coach-spot')) el.classList.remove('coach-spot'); }
    if (cb && this.renderControls && document.getElementById('cb-ctrl')) try { this.renderControls(); } catch (e) { /* 무시 */ }
  };
  // 말풍선이 사라졌는데 멈춤만 남는 일이 없게
  UI.tutHeld = function () {
    if (!this._hold) return false;
    if (!document.getElementById('coach-pop')) { this.tutRelease(false); return false; }
    return true;
  };

  // 멈춘 동안에는 화면 어디를 눌러도 "다음"
  // (window 단계에서 잡는다: 문서 단계의 다른 잠금(tut_lock.js)보다 먼저 받아야 한다)
  window.addEventListener('click', (e) => {
    if (typeof ExploreCinema !== 'undefined' && ExploreCinema.active) return;
    if (!UI.tutHeld()) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    UI.tutNext();
  }, true);
  window.addEventListener('pointerdown', (e) => { if (typeof ExploreCinema !== 'undefined' && ExploreCinema.active) return; if (UI._hold) e.stopPropagation(); }, true); // 길게 누르기 등도 막는다

  // 전투 시간 정지
  const baseTick = Combat.prototype.tick;
  Combat.prototype.tick = function (dt) { if (UI._hold && UI.tutHeld()) return null; return baseTick.call(this, dt); };
  // 시험 지도의 자동 진행(리더가 칸을 고르고 움직임)도 읽은 뒤에
  const baseTimer = UI.examTimer;
  if (baseTimer) UI.examTimer = function (ms, ctx, fn) {
    const go = () => { if (this.tutHeld()) return setTimeout(go, 150); fn(); };
    return baseTimer.call(this, ms, ctx, go);
  };
}
