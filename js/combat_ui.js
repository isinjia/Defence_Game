// ===== 게이트 크로니클: 전투 UI 시안 반영 (영역 B) =====
// 사용자 시안: 머리 도구(작전·배속·자동·도주) 글자 버튼,
// 적·아군 원형 초상 + 속성 배지, 리더 대형 중앙 / 동료 소형 가로 줄, 커맨드 2×2.
// 기존 전투 로직·진형(전열·후열)·오더·커맨드는 유지하고 화면만 바꾼다.
{
  const ELEM_BADGE = (u) => {
    const e = u && u.elem; const E = e && ELEMENTS[e];
    const name = E ? E.name : '무';
    const c = E ? E.color : '#c9a84a';
    return `<i class="elem-badge" style="--ec:${c}" aria-hidden="true">${name}</i>`;
  };

  // 아군 영역: 리더 칸 + (전열·후열) 동료 줄
  UI.ensureLeadLayout = function () {
    const a = document.getElementById('allies'); if (!a) return;
    if (document.getElementById('allies-lead')) { a.classList.add('lead-focus'); return; }
    const front = document.getElementById('allies-front');
    const back = document.getElementById('allies-back');
    a.classList.add('ally-rows', 'lead-focus');
    a.classList.remove('allies');
    const party = document.createElement('div'); party.className = 'ally-party'; party.id = 'allies-party';
    const lead = document.createElement('div'); lead.className = 'allies'; lead.id = 'allies-lead';
    // 진형 줄이 이미 있으면 옮기고, 없으면 만든다
    if (front && back) {
      for (const t of a.querySelectorAll(':scope > .row-tag')) t.remove();
      party.appendChild(front); party.appendChild(back);
    } else {
      party.innerHTML = '<div class="allies" id="allies-front"></div><div class="allies" id="allies-back"></div>';
      // 옛 한 줄 배치의 카드를 후열로
      for (const el of [...a.querySelectorAll(':scope > .ally')]) party.querySelector('#allies-back').appendChild(el);
    }
    a.innerHTML = '';
    a.appendChild(lead);
    a.appendChild(party);
  };

  // 리더는 큰 칸, 나머지는 전열·후열 줄 (진형 판정은 그대로)
  UI.placeLeadFocus = function () {
    const c = this.ctx; const cb = c && c.combat; if (!cb || !cb.units) return;
    this.ensureLeadLayout();
    const leadHost = document.getElementById('allies-lead'); if (!leadHost) return;
    const lid = cb.leaderId;
    for (const u of cb.units) {
      if (u.side !== 'ally') continue;
      const el = document.getElementById('u-' + u.id); if (!el) continue;
      const isLead = lid != null && u.id === lid;
      el.classList.toggle('lead-fig', isLead);
      if (isLead) {
        if (el.parentNode !== leadHost) leadHost.appendChild(el);
      } else {
        const host = document.getElementById('allies-' + (u.row || 'back')) || document.getElementById('allies-back');
        if (host && el.parentNode !== host) host.appendChild(el);
      }
    }
    // 리더가 아직 DOM에 없으면(첫 프레임) 리더 칸만 비워 둔다
    for (const el of [...leadHost.querySelectorAll('.ally')]) {
      const id = el.id && el.id.slice(2);
      if (id !== lid) {
        const u = cb.units.find((x) => x.id === id);
        const host = document.getElementById('allies-' + ((u && u.row) || 'back')) || document.getElementById('allies-back');
        if (host) host.appendChild(el);
        el.classList.remove('lead-fig');
      }
    }
  };

  UI.decorateUnitCard = function (u, el) {
    if (!el || !u) return;
    const host = el.querySelector('.fx-host'); if (!host) return;
    if (!host.querySelector('.elem-badge')) host.insertAdjacentHTML('beforeend', ELEM_BADGE(u));
    // 이름은 초상(.fx-host) 안 하단에 겹침 → 막대가 원 바로 아래에 붙어 세로 공간 확보
    if (el.classList.contains('ally')) {
      const name = el.querySelector('.fig-name');
      if (name && name.parentNode !== host) host.appendChild(name);
      if (!el.classList.contains('cu-ord')) {
        const bars = [...el.querySelectorAll(':scope > .bar-row')];
        let at = host;
        for (const row of bars) { at.after(row); at = row; }
        el.classList.add('cu-ord');
      }
    }
    if (el.classList.contains('foe')) {
      const nm = el.querySelector('.foe-name');
      if (nm && nm.parentNode !== host) host.appendChild(nm);
      if (!el.classList.contains('cu-ord')) {
        const hp = el.querySelector(':scope > .bar.hp');
        const brk = el.querySelector(':scope > .brk');
        const fh = el.querySelector(':scope > .foe-hp');
        if (hp && host.nextElementSibling !== hp) host.after(hp);
        let at = hp || host;
        if (brk) { at.after(brk); at = brk; }
        if (fh) at.after(fh);
        el.classList.add('cu-ord', 'foe-card');
      }
    }
  };

  const baseOpen = UI.openCombat;
  UI.openCombat = function (...a) {
    const r = baseOpen.apply(this, a);
    try {
      const box = document.getElementById('modal-box');
      if (box && box.classList.contains('combat-box')) box.classList.add('cu-v2');
      this.ensureLeadLayout();
      this.placeLeadFocus();
      const c = this.ctx; const cb = c && c.combat;
      if (cb) for (const u of cb.units) {
        const el = document.getElementById('u-' + u.id);
        if (el) this.decorateUnitCard(u, el);
      }
    } catch (e) { if (window.console) console.error('전투 UI', e); }
    return r;
  };

  const baseRefresh = UI.refreshUnits;
  UI.refreshUnits = function (...a) {
    const r = baseRefresh.apply(this, a);
    try {
      this.placeLeadFocus();
      const c = this.ctx; const cb = c && c.combat;
      if (cb) for (const u of cb.units) {
        const el = document.getElementById('u-' + u.id);
        if (el) this.decorateUnitCard(u, el);
      }
    } catch (e) { /* 표시 실패는 전투를 막지 않는다 */ }
    return r;
  };

  // 머리 도구: 시안처럼 아이콘 + 글자
  const ICO = {
    speed: (x2) => `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 6l8 6-8 6z"/>${x2 ? '<path d="M12 6l8 6-8 6z"/>' : ''}</svg>`,
    auto: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v5h-5"/></svg>',
    flee: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h5v16h-5"/><path d="M10 8l-4 4 4 4M6 12h9"/></svg>',
  };

  const baseMenu = UI.commandMenu;
  if (baseMenu) UI.commandMenu = function (...a) {
    const r = baseMenu.apply(this, a);
    try {
      const c = this.ctx; const cb = c && c.combat;
      const tools = document.querySelector('#modal-box.cu-v2 .cb-head .cb-tools');
      if (!tools || !cb || cb.result) return r;
      const fl = tools.querySelector('[data-act=c-flee]');
      const canFlee = !!fl && !fl.disabled;
      const fleeDis = fl && fl.disabled ? 'disabled' : '';
      // 작전 버튼은 tactics.js 가 다시 채우므로 자리는 비워 두고 배속·자동·도주만 시안형으로
      const tac = tools.querySelector('[data-act=c-tactic]');
      const tacHtml = tac ? tac.outerHTML : '';
      tools.innerHTML = `${tacHtml}
        <button class="tool-btn ${(c.speed || 1) > 1 ? 'on' : ''}" data-act="c-speed" aria-label="전투 속도">${ICO.speed((c.speed || 1) > 1)}<span>배속 ${c.speed || 1}</span></button>
        <button class="tool-btn ${cb.auto ? 'on' : ''}" data-act="c-auto" aria-label="${cb.auto ? '자동 전투 끄기' : '자동 전투'}">${ICO.auto}<span>${cb.auto ? '자동중' : '자동'}</span></button>
        ${canFlee || fl ? `<button class="tool-btn danger" data-act="c-flee" aria-label="도주" ${fleeDis}>${ICO.flee}<span>도주</span></button>` : ''}`;
      // 작전 버튼 스타일을 시안형으로
      const tb = tools.querySelector('[data-act=c-tactic]');
      if (tb) { tb.classList.add('tool-btn', 'tactic-btn'); tb.classList.remove('icon-btn'); }
    } catch (e) { /* 무시 */ }
    return r;
  };

  // 작전 버튼 내용도 "작전 균형" 한 줄로
  const baseTac = UI.drawTacticBtn;
  if (baseTac) UI.drawTacticBtn = function (...a) {
    const r = baseTac.apply(this, a);
    try {
      const b = document.querySelector('#modal-box.cu-v2 .cb-tools [data-act=c-tactic]');
      if (!b || !this.ctx || !this.ctx.combat) return r;
      const t = this.ctx.combat.tactic || 'balance';
      const T = TACTICS[t] || TACTICS.balance;
      b.classList.add('tool-btn', 'tactic-btn'); b.classList.remove('icon-btn');
      b.innerHTML = `<span class="tac-k">작전</span><b>${T.short}</b>`;
    } catch (e) { /* 무시 */ }
    return r;
  };

  // 대상 조준 시 리더 칸·동료 줄도 같이
  const baseAim = UI.aimGlow;
  if (baseAim) UI.aimGlow = function (...a) {
    const r = baseAim.apply(this, a);
    try {
      const c = this.ctx; if (!c) return r;
      const cb = c.combat;
      const sel = c.sel && !cb.result ? (G.skillEff ? G.skillEff(skillById(c.sel)) : skillById(c.sel)) : null;
      const on = sel && cb.waiting && !c.playing && !cb.auto && sel.mp <= cb.player.mp;
      const aim = sel ? (SKILL_AIM[sel.type] || 'none') : null;
      const lead = document.getElementById('allies-lead');
      const party = document.getElementById('allies-party');
      if (lead) lead.classList.toggle('aim', !!(on && aim === 'ally'));
      if (party) party.classList.toggle('aim', !!(on && aim === 'ally'));
    } catch (e) { /* 무시 */ }
    return r;
  };
}
