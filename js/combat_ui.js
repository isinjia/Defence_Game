// ===== 게이트 크로니클: 전투 UI 시안 반영 (영역 B) =====
// 사용자 시안: 머리 도구(작전·배속·자동·도주) 글자 버튼,
// 적·아군 원형 초상 + 속성 배지, 전열·후열 2줄, 커맨드 2×2.
// 리더는 따로 줄을 만들지 않고 전열·후열 진형 칸에 그대로 둔다.
{
  // 이름 옆 속성 아이콘 (원형 글자 배지 대신) — 이름은 중앙, 아이콘은 CSS로 오른쪽에
  const ensureNameIcon = (nameEl, u) => {
    if (!nameEl) return;
    nameEl.querySelectorAll('.elem-badge').forEach((n) => n.remove());
    if (!nameEl.querySelector('.cu-elem')) {
      const ico = (typeof FX !== 'undefined' && FX.elemIcon) ? FX.elemIcon(u && u.elem, 14) : '';
      if (ico) nameEl.insertAdjacentHTML('beforeend', `<span class="cu-elem">${ico}</span>`);
    }
  };

  // 상반신 초상 (공통 UI.toBustHtml / playerBust / npcBust 사용)
  const allyBustHtml = (u) => {
    try {
      if (!u || u.summon) return null;
      if (u.isPlayer && UI.playerBust) return UI.playerBust(54);
      if (u.npcId && UI.npcBust) {
        const n = G.npcById(u.npcId); if (n) return UI.npcBust(n, 54);
      }
      if (u.portrait && typeof FX !== 'undefined' && FX.portrait) {
        const q = u.portrait;
        const opts = { ...(typeof Wardrobe !== 'undefined' && Wardrobe.appearance ? Wardrobe.appearance(u) : {}), ...q };
        if (!opts.outfit && typeof Wardrobe !== 'undefined' && Wardrobe.profession) opts.outfit = Wardrobe.profession(u.cls, u.bg);
        const raw = FX.portrait(q.seed, q.gender, q.elem, u.tier || 0, 120, opts);
        return UI.toBustHtml ? UI.toBustHtml(raw, 54) : raw;
      }
    } catch (e) { /* 실패 시 기존 아바타 유지 */ }
    return null;
  };

  const applyAllyBust = (u, host) => {
    const spr = host && host.querySelector('.sprite');
    if (!spr || spr.dataset.cuBust) return;
    const html = allyBustHtml(u);
    if (!html) return;
    spr.dataset.cuBust = '1';
    spr.innerHTML = html;
    const svg = spr.querySelector('svg');
    if (svg) svg.classList.add('cu-bust');
  };

  // 아군: 전열·후열 두 줄만 (리더 전용 줄은 만들지 않음)
  UI.ensureLeadLayout = function () {
    const a = document.getElementById('allies'); if (!a) return;
    a.classList.add('ally-rows', 'cu-rows');
    a.classList.remove('allies', 'lead-focus');
    // 예전에 넣었던 리더 전용 칸이 있으면 해체하고 전열·후열로 되돌린다
    const oldLead = document.getElementById('allies-lead');
    const party = document.getElementById('allies-party');
    if (oldLead || party) {
      const front = document.getElementById('allies-front') || (() => { const d = document.createElement('div'); d.className = 'allies'; d.id = 'allies-front'; return d; })();
      const back = document.getElementById('allies-back') || (() => { const d = document.createElement('div'); d.className = 'allies'; d.id = 'allies-back'; return d; })();
      for (const el of [...(oldLead ? oldLead.children : [])]) back.appendChild(el);
      a.innerHTML = '';
      a.appendChild(front);
      a.appendChild(back);
    }
    if (!document.getElementById('allies-front')) {
      a.innerHTML = '<div class="allies" id="allies-front"></div><div class="allies" id="allies-back"></div>';
    }
    for (const t of a.querySelectorAll(':scope > .row-tag')) t.remove();
  };

  // 리더 표시만 (자리는 전열·후열 유지)
  UI.placeLeadFocus = function () {
    const c = this.ctx; const cb = c && c.combat; if (!cb || !cb.units) return;
    this.ensureLeadLayout();
    const lid = cb.leaderId;
    for (const u of cb.units) {
      if (u.side !== 'ally') continue;
      const el = document.getElementById('u-' + u.id); if (!el) continue;
      const isLead = lid != null && u.id === lid;
      el.classList.toggle('lead-fig', isLead);
      const host = document.getElementById('allies-' + (u.row || 'back')) || document.getElementById('allies-back');
      if (host && el.parentNode !== host) host.appendChild(el);
    }
  };

  UI.decorateUnitCard = function (u, el) {
    if (!el || !u) return;
    const host = el.querySelector('.fx-host'); if (!host) return;
    // 원형 글자·무리형(무)·타겟 조준 표시는 쓰지 않는다
    host.querySelectorAll('.elem-badge, .mtype, .reticle').forEach((n) => n.remove());
    el.querySelectorAll('.elem-badge, .mtype').forEach((n) => n.remove());
    el.classList.remove('threatened');
    // 이름은 초상(.fx-host) 하단 테두리에 겹침, 속성 아이콘은 이름 옆
    if (el.classList.contains('ally')) {
      applyAllyBust(u, host);
      const name = el.querySelector('.fig-name');
      if (name && name.parentNode !== host) host.appendChild(name);
      ensureNameIcon(name, u);
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
      // 이름 옆 SVG 아이콘이 중앙 정렬을 밀지 않게 절대 배치용 클래스 유지
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

  // 대상 조준: 전열·후열
  const baseAim = UI.aimGlow;
  if (baseAim) UI.aimGlow = function (...a) {
    const r = baseAim.apply(this, a);
    try {
      const c = this.ctx; if (!c) return r;
      const cb = c.combat;
      const sel = c.sel && !cb.result ? (G.skillEff ? G.skillEff(skillById(c.sel)) : skillById(c.sel)) : null;
      const on = sel && cb.waiting && !c.playing && !cb.auto && sel.mp <= cb.player.mp;
      const aim = sel ? (SKILL_AIM[sel.type] || 'none') : null;
      const yes = !!(on && aim === 'ally');
      for (const id of ['allies', 'allies-front', 'allies-back']) {
        const el = document.getElementById(id); if (el) el.classList.toggle('aim', yes);
      }
    } catch (e) { /* 무시 */ }
    return r;
  };

  // 파티 시너지(정석/균형): 제목 옆 → 아군 영역 좌측 위
  const basePb = UI.drawPartyBonus;
  if (basePb) UI.drawPartyBonus = function (...a) {
    try {
      const box = document.getElementById('modal-box');
      if (!box || !box.classList.contains('cu-v2')) return basePb.apply(this, a);
      // 제목 옆 옛 태그는 제거
      box.querySelectorAll('.cb-head .pb-tag, .cb-head h3 .pb-tag').forEach((n) => n.remove());
      const c = this.ctx; const cb = c && c.combat;
      const allies = document.getElementById('allies');
      if (!cb || !cb.partyBonus || !allies) return;
      allies.classList.add('cu-pb-host');
      const pb = cb.partyBonus();
      let tag = allies.querySelector(':scope > .pb-tag');
      if (!pb.full || cb.result) { if (tag) tag.remove(); return; }
      const lab = pb.form ? '정석' : '균형';
      const title = this.partyBonusTitle(pb);
      if (!tag) {
        allies.insertAdjacentHTML('afterbegin', `<span class="pb-tag ${pb.form ? 'form' : ''}" title="${title}" aria-label="${title}">${lab}</span>`);
      } else {
        tag.className = 'pb-tag' + (pb.form ? ' form' : '');
        tag.title = title; tag.setAttribute('aria-label', title); tag.textContent = lab;
      }
    } catch (e) { try { return basePb.apply(this, a); } catch (e2) { /* 무시 */ } }
  };
}
