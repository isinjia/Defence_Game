// 지도 화면 HUD 정리 (영역 B, 사용자 요청 — A 세션 경유)
// 1. 위쪽 아이콘 줄 → 메뉴 버튼 하나. 누르면 메뉴 팝업.
// 2. 현재 상황: 진행도 대신 현재 퀘스트(의뢰·기연 단서) 목록. 누르면 "목적지까지 자동 이동할까요?" → [예] 자동 이동.
// 3. 내 초상화를 누르면 캐릭터 정보 창을 연다.
// 4. 인물 카드 접기·펼치기는 체력·정신력 막대 쪽을 눌러서.
{
  const MENU_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';

  // ---------- 1. 메뉴 ----------
  UI.menuPopup = function () {
    const items = this.hudMenu();
    this.modal(`<div class="row between"><h3>메뉴</h3><button class="icon-btn" data-act="modal-close" aria-label="닫기">×</button></div>
      <div class="menu-grid">${items}</div>
      <div class="menu-sub"><button data-act="settings">설정 (소리·이펙트)</button></div>`, 'menu-pop');
  };

  // ---------- 2. 현재 퀘스트 목록 ----------
  UI.hudQuests = function () {
    const p = G.player; const rows = [];
    const t = this.travel;
    if (t && this.travelDaysLeft && this.travelDaysLeft()) rows.push(`<button class="obj-link travel-chip" data-act="travel-resume">▶ 이어서 이동 · ${t.label}까지 ${WORLD.formatTravelTime(this.travelDaysLeft())}</button>`);
    (p.quests || []).slice(0, 4).forEach((q, i) => {
      const reg = this.questTarget ? this.questTarget(q) : null; const R = reg && regionById(reg);
      rows.push(`<button class="obj-link hq" data-act="hq-go" data-v="q${i}"><span class="hq-mark ${q.status === 'done' ? 'done' : ''}">${q.status === 'done' ? '✔' : '▸'}</span><span class="hq-t">${q.title}</span>${R ? `<span class="hq-r">${R.name}</span>` : ''}</button>`);
    });
    const clues = G.clueList ? G.clueList() : [];
    clues.slice(0, 2).forEach((c, i) => {
      const R = c.region && regionById(c.region);
      rows.push(`<button class="obj-link hq clue" data-act="hq-go" data-v="c${i}"><span class="hq-mark">✦</span><span class="hq-t">${c.name}</span>${R ? `<span class="hq-r">${R.name}</span>` : ''}</button>`);
    });
    if (!rows.length) rows.push('<div class="obj-sub">진행 중인 의뢰가 없다. 도시 의뢰소에서 받을 수 있다.</div>');
    return `<div class="obj"><div class="obj-title">현재 퀘스트</div>${rows.join('')}</div>`;
  };
  UI.hqTarget = function (v) {
    const p = G.player;
    if (String(v)[0] === 'c') { const c = (G.clueList ? G.clueList() : [])[+String(v).slice(1)]; return c ? { region: c.region, name: c.name } : null; }
    const q = (p.quests || [])[+String(v).slice(1)]; if (!q) return null;
    return { region: this.questTarget ? this.questTarget(q) : null, name: q.title };
  };
  UI.hqAsk = function (v) {
    const t = this.hqTarget(v);
    if (!t) return;
    if (!t.region) return this.toast('목적지가 정해지지 않은 퀘스트다.');
    if (t.region === G.player.region && G.onCity()) return this.toast('이미 목적지에 와 있다.');
    if (t.region === 'jeju' && G.canJeju && !G.canJeju()) return this.toast('제주는 관리국 공인 S급만 들어갈 수 있다.');
    const R = regionById(t.region);
    this.modal(`<div class="eyebrow">퀘스트</div><h3>${t.name}</h3><p>퀘스트 목적지(<b>${R ? R.name : t.region}</b>)까지 자동 이동할까요?</p>
      <div class="row end"><button class="ghost" data-act="modal-close">아니오</button><button class="primary" data-act="hq-yes" data-v="${t.region}">예</button></div>`);
  };

  const baseRender = UI.renderGame;
  UI.renderGame = function (...a) {
    const r = baseRender.apply(this, a);
    try {
      const tl = document.getElementById('hud-tl');
      if (tl) tl.innerHTML = `<button class="menu-btn menu-one" data-act="hud-menu" aria-label="메뉴">${MENU_ICON}<span>메뉴</span></button>`;
      const tr = document.getElementById('hud-tr');
      if (tr) { const fold = tr.querySelector('.fold-obj-btn'); tr.innerHTML = fixJosa(this.hudQuests()); if (fold) tr.prepend(fold); }
      // 초상화 = 캐릭터 정보, 막대 = 카드 접기·펼치기
      const por = document.querySelector('#hud-card .card-portrait');
      if (por) { por.dataset.act = 'sheet'; por.dataset.v = 'char'; por.setAttribute('aria-label', '캐릭터 정보 열기'); }
      const bars = document.querySelector('#hud-card .card-bars');
      if (bars) { bars.dataset.act = 'fold-card'; bars.setAttribute('role', 'button'); bars.setAttribute('aria-label', '인물 카드 접기·펼치기'); }
    } catch (e) { /* 실패하면 기존 HUD 그대로 */ }
    return r;
  };

  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'hud-menu': return this.menuPopup();
      case 'hq-go': return this.hqAsk(v);
      case 'hq-yes': {
        this.closeModal();
        const pos = WORLD.cityPos && WORLD.cityPos[v]; const R = regionById(v);
        if (pos && this.travelStart) return this.travelStart(pos[0], pos[1], R ? R.name : v);
        if (this.travelRegion) return this.travelRegion(v);
        return;
      }
    }
    return baseHandle.call(this, act, v);
  };
}
