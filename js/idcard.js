// 판정 결과를 정식 문건·헌터 ID 카드로 (영역 B, docs/구현_대기목록.md 4-13)
// ① 판정 통지서(종이 공문): 올라오는 문서 → 표 → 심사관 서명 → 빨간 직인 "쾅" → 등급 칸이 잉크처럼 드러남
// ② 헌터 ID 카드 발급: 회전하며 나오는 카드, 홀로그램 반짝임, 탭하면 뒷면(바코드·문구)
// 이후: 정보 탭에서 내 카드 보기, 관리국 등록 등급·소속이 바뀌면 재발급(짧은 연출). 카드 재질은 등급 따라(일반/은/금/검정 메탈).
{
  const hash = (s) => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const pad = (n, k) => String(n).padStart(k, '0');
  const offRank = (p) => (p.official ?? p.rankIdx);
  const guildName = (p) => (p.guild && GUILDS[p.guild] ? GUILDS[p.guild].name : '무소속');
  const material = (r) => (r >= 6 ? 'black' : r === 5 ? 'gold' : r >= 3 ? 'silver' : 'plain');

  // 카드 정보 만들기 (번호는 이름·각성 연도로 고정)
  Game.prototype.issueIdCard = function () {
    const p = this.player; if (!p) return null;
    const old = p.idCard;
    const no = old && old.no ? old.no : `KH-${this.year || 2087}-${pad(hash(p.name + (p.look || '')) % 10000, 4)}-${pad(hash(p.name) % 97, 2)}`;
    p.idCard = { no, rank: offRank(p), guild: p.guild || null, issued: this.dateStr(), year: this.year || 2087, gen: (old ? old.gen || 1 : 0) + 1 };
    return p.idCard;
  };
  if (Game.prototype.initSandbox) {
    const baseInit = Game.prototype.initSandbox;
    Game.prototype.initSandbox = function (...a) {
      const r = baseInit.apply(this, a); const p = this.player;
      if (p) { p.idCard ??= null; if (!p.idCard && p.examDone && p.lifeEvents && p.lifeEvents.length > 1) { try { this.issueIdCard(); } catch (e) { /* 무시 */ } } }
      return r;
    };
  }

  // ---------- ① 판정 통지서 ----------
  UI.noticeHtml = function () {
    const p = G.player; const k = classById(p.cls); const g = CLASS_GROUPS[k.g]; const R = RANKS[offRank(p)];
    const bg = BACKGROUNDS.find((b) => b.id === p.bg) || {}; const born = (G.year || 2087) - G.ageYears();
    const docNo = `관리국-판정-${G.year || 2087}-${pad(hash(p.name) % 1000000, 6)}`;
    const L = G.npcs.filter((n) => n.examLeader).pop();
    const judge = L ? L.name : '정은수';
    const traits = (p.traits || []).map((id) => traitById(id).name).join(', ') || '없음';
    return `<div class="gc-doc" id="gc-doc">
      <div class="doc-head"><svg class="doc-logo" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 6 30 20 20 34 10 20z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="20" cy="20" r="4" fill="currentColor"/></svg>
        <div><b>국가 각성자 관리국</b><div class="doc-meta">문서번호 ${docNo} · 발행 ${G.dateStr()}</div></div></div>
      <h3 class="doc-title">각성자 등급 판정 통지서</h3>
      <table class="doc-table">
        <tr><th>성명</th><td>${p.name}</td><th>생년</th><td>${born}년 (${G.ageYears()}세)</td></tr>
        <tr><th>출신</th><td colspan="3">${bg.name || '-'} · ${G.region().name}</td></tr>
        <tr><th>판정 등급</th><td class="doc-grade"><span class="ink" style="--c:${R.color}">${R.key}급</span></td><th>각성 속성</th><td>${FX.elemIcon(p.element, 13)} ${ELEMENTS[p.element].name}</td></tr>
        <tr><th>직업</th><td colspan="3">${g.name} · <b>${k.name}</b></td></tr>
        <tr><th>선천 특성</th><td colspan="3">${traits}</td></tr>
        <tr><th>비고</th><td colspan="3">협회 실기 시험 결과 반영</td></tr>
      </table>
      <div class="doc-sign"><span>담당 심사관</span><b>${judge}</b><i class="doc-sig">${judge}</i></div>
      <div class="doc-stamp" aria-hidden="true"><span>國家覺醒者<br>管理局</span></div>
    </div>
    <div class="row end doc-btns"><button class="ghost" data-act="id-skip">건너뛰기</button><button class="primary" data-act="id-card" id="doc-next" disabled>헌터 ID 카드 받기</button></div>`;
  };
  UI.showNotice = function () {
    this.modal(this.noticeHtml(), 'doc-box');
    const fast = FX.reduced ? 0.3 : 1;
    const ctx = this._docRun = {};
    setTimeout(() => {
      if (this._docRun !== ctx) return;
      const d = document.getElementById('gc-doc'); if (!d) return;
      d.classList.add('stamped');
      if (typeof SFX !== 'undefined') SFX.play('stamp');
      if (typeof SFX !== 'undefined') SFX.buzz(40);
      if (!FX.reduced) FX.pulse(document.getElementById('modal-box'), 'quake', 380);
      const b = document.getElementById('doc-next'); if (b) b.disabled = false;
    }, 1300 * fast);
  };

  // ---------- ② 헌터 ID 카드 ----------
  UI.idCardHtml = function (opts = {}) {
    const p = G.player; const c = p.idCard || G.issueIdCard(); const R = RANKS[c.rank]; const k = classById(p.cls);
    const bars = Array.from({ length: 46 }, (_, i) => ((hash(c.no + i) % 3) + 1)).map((w, i) => `<i style="width:${w}px;${i % 2 ? 'background:transparent' : ''}"></i>`).join('');
    return `<div class="idc-wrap ${opts.enter ? 'enter' : ''}"><div class="idc ${material(c.rank)}" id="idc" data-act="id-flip" style="--rc:${R.color}" role="button" aria-label="헌터 ID 카드 (눌러서 뒤집기)">
      <div class="idc-face idc-front">
        <div class="idc-top"><span>대한민국 헌터 자격증</span><span>HUNTER LICENSE</span></div>
        <div class="idc-body">
          <div class="idc-photo">${this.playerPortrait(84)}</div>
          <div class="idc-info">
            <div class="idc-name">${p.name}</div>
            <div class="idc-row">${FX.elemIcon(p.element, 13)} ${ELEMENTS[p.element].name} · ${className(p.cls, p.clsAdv || 0)}</div>
            <div class="idc-row dim">소속 ${c.guild && GUILDS[c.guild] ? GUILDS[c.guild].name : '무소속'}</div>
            <div class="idc-row num">${c.no}</div>
            <div class="idc-row dim small">발급 ${c.issued}</div><div class="idc-row dim small">유효 ${c.year + 10}년까지</div>
          </div>
          <div class="idc-rank">${R.key}</div>
        </div>
        <div class="idc-holo"></div>
      </div>
      <div class="idc-face idc-back">
        <div class="idc-strip"></div>
        <div class="idc-bar">${bars}</div>
        <div class="idc-no num">${c.no}</div>
        <p>본 카드는 국가 각성자 관리법에 따라 발급된 헌터 자격 증명이며, 게이트 출입·공략권 입찰·코어 거래 시 제시해야 한다. 타인에게 양도할 수 없다.</p>
        <div class="idc-sign"><span>서명</span><i>${p.name}</i></div>
        <div class="idc-call small">분실·브레이크 신고 국번 없이 1339 · 국가 각성자 관리국</div>
      </div>
    </div></div>
    <div class="small dim idc-tip">카드를 누르면 뒷면을 볼 수 있다.</div>`;
  };
  UI.showIdCard = function (mode) {
    const p = G.player;
    if (mode !== 'view') G.issueIdCard();
    const head = mode === 'reissue' ? `<div class="eyebrow">국가 각성자 관리국 · 재발급</div><h3>헌터 ID 카드가 새로 나왔다</h3>`
      : mode === 'view' ? '<h3>내 헌터 ID 카드</h3>' : '<div class="eyebrow">국가 각성자 관리국 · 발급</div><h3>헌터 ID 카드 발급</h3>';
    const tail = mode === 'first' ? (this._judgeTail || '') : '';
    const btn = mode === 'view' ? '<button data-act="sheet" data-v="char">정보로</button><button class="primary" data-act="modal-close">닫기</button>' : `<button class="primary" data-act="modal-close">${mode === 'first' ? '시작' : '확인'}</button>`;
    this.modal(`${head}${this.idCardHtml({ enter: mode !== 'view' })}${tail}<div class="row end">${btn}</div>`, 'idc-box');
    if (mode !== 'view' && typeof SFX !== 'undefined') SFX.play('fanfare');
    // 홀로그램: 손가락·마우스·기울기에 따라 빛 이동
    const card = document.getElementById('idc'); if (!card) return;
    const move = (x, y) => { card.style.setProperty('--hx', (x * 100).toFixed(1) + '%'); card.style.setProperty('--hy', (y * 100).toFixed(1) + '%'); card.style.setProperty('--rx', ((0.5 - y) * 10).toFixed(1) + 'deg'); card.style.setProperty('--ry', ((x - 0.5) * 14).toFixed(1) + 'deg'); };
    card.addEventListener('pointermove', (e) => { const r = card.getBoundingClientRect(); move((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); });
    card.addEventListener('pointerleave', () => move(0.5, 0.5));
    if (!this._tiltBound && window.DeviceOrientationEvent) {
      this._tiltBound = true;
      window.addEventListener('deviceorientation', (e) => { const c = document.getElementById('idc'); if (!c || e.gamma == null) return; const x = Math.max(0, Math.min(1, 0.5 + e.gamma / 60)); const y = Math.max(0, Math.min(1, 0.5 + (e.beta - 45) / 60)); c.style.setProperty('--hx', (x * 100) + '%'); c.style.setProperty('--hy', (y * 100) + '%'); });
    }
    void p;
  };

  // 시험이 끝난 뒤의 판정 결과 창(debut.js)을 통지서 → 카드 흐름으로 바꾼다
  const baseEnd = UI.endExam;
  if (baseEnd) UI.endExam = function (...a) {
    const r = baseEnd.apply(this, a);
    try {
      const box = document.getElementById('modal-box');
      if (box && box.classList.contains('pro-judge') && G.player) {
        // 판정 창 아래쪽 안내(동기·리더·시작 안내)는 카드 화면 아래에 이어 붙인다
        this._judgeTail = [...box.querySelectorAll(':scope > p:not(.judge-sum)')].map((x) => x.outerHTML).join('');
        this.showNotice();
      }
    } catch (e) { /* 실패하면 기존 판정 창 그대로 */ }
    return r;
  };

  // 정보 탭에 "내 헌터 ID 카드"
  const baseChar = UI.charHtml;
  UI.charHtml = function () {
    const html = baseChar.call(this);
    if (!G.player || !G.player.idCard) return html;
    const c = G.player.idCard; const R = RANKS[c.rank];
    const sec = `<div class="sec"><div class="sec-title">헌터 ID 카드</div><button class="item-row idc-mini" data-act="id-view"><span class="idc-chip ${material(c.rank)}" style="--rc:${R.color}">${R.key}</span><span class="grow"><b>${c.no}</b><span class="small dim"> · ${c.guild && GUILDS[c.guild] ? GUILDS[c.guild].name : '무소속'} · 발급 ${c.issued}</span></span><span class="small amber">보기</span></button></div>`;
    const i = html.indexOf('<div class="sec">');
    return i >= 0 ? html.slice(0, i) + sec + html.slice(i) : html + sec;
  };

  // 등록 등급·소속이 바뀌면 재발급 (지도로 돌아와 창이 없을 때)
  const baseRender = UI.renderGame;
  UI.renderGame = function (...a) {
    const r = baseRender.apply(this, a);
    try {
      const p = G.player; const c = p && p.idCard;
      if (c && !this.modalOpen() && !this.walking && !this.ctx && (c.rank !== offRank(p) || (c.guild || null) !== (p.guild || null))) {
        setTimeout(() => { if (!this.modalOpen() && !this.ctx) this.showIdCard('reissue'); }, 300);
      }
    } catch (e) { /* 무시 */ }
    return r;
  };

  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'id-card': this._docRun = null; return this.showIdCard('first');
      case 'id-skip': this._docRun = null; return this.showIdCard('first');
      case 'id-view': return this.showIdCard('view');
      case 'id-flip': { const c = document.getElementById('idc'); if (c) c.classList.toggle('flip'); return; }
    }
    return baseHandle.call(this, act, v);
  };

  // 직인 소리: 낮은 쿵 + 종이 소리
  if (typeof SFX !== 'undefined') SFX.SOUNDS.stamp = (s) => { s.tone(90, 0.18, { type: 'sine', vol: 0.35, to: 45 }); s.noise(0.09, { vol: 0.25, freq: 900, q: 0.7 }); s.noise(0.2, { vol: 0.08, freq: 3000, q: 0.5, at: 0.05 }); };
}
