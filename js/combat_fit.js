// 전투 화면 한눈에 (영역 B, docs/구현_대기목록.md 4-0)
// 전투 상자를 화면 높이에 고정하고 머리말·전장(적·아군)·조작으로 나눈다.
// 그린 뒤 전장이 넘치면 적 그림을 단계적으로 줄이고(120→92→72→56→44), 그래도 넘치면 이름·체력 숫자를 숨긴다.
{
  const SIZES = [120, 92, 72, 56, 44];
  UI.combatFit = function () {
    const box = document.getElementById('modal-box'); const st = document.getElementById('stage');
    if (!box || !st || !box.classList.contains('combat-box')) return;
    const c = this.ctx; if (!c || !c.combat) return;
    box.classList.add('fit');
    // 가장 큰 단계부터 넣어 보고, 넘치면 한 단계씩 줄인다
    let lv = 0;
    const apply = (k) => {
      box.style.setProperty('--fs', SIZES[Math.min(k, SIZES.length - 1)] + 'px');
      box.classList.toggle('fit-tight', k >= SIZES.length);      // 이름 숨김
      box.classList.toggle('fit-tiny', k >= SIZES.length + 1);   // 체력 숫자·상태 숨김
    };
    // 적 줄은 가운데 정렬이라 위로도 넘친다: 자식들의 실제 위·아래 끝을 잰다
    const fz = document.getElementById('foes');
    const spill = (host) => { if (!host) return false; const r = host.getBoundingClientRect(); for (const ch of host.children) { const q = ch.getBoundingClientRect(); if (q.height && (q.top < r.top - 1 || q.bottom > r.bottom + 1)) return true; } return false; };
    const over = () => st.scrollHeight > st.clientHeight + 1 || box.scrollHeight > box.clientHeight + 1 || spill(fz);
    apply(lv);
    while (over() && lv < SIZES.length + 1) apply(++lv);
    c.fitLv = lv;
  };

  const later = () => { if (UI._fitRaf) return; UI._fitRaf = requestAnimationFrame(() => { UI._fitRaf = 0; try { UI.combatFit(); } catch (e) { /* 무시 */ } }); };
  const baseOpen = UI.openCombat;
  UI.openCombat = function (...a) { const r = baseOpen.apply(this, a); try { this.combatFit(); } catch (e) { /* 무시 */ } return r; };
  const baseControls = UI.renderControls;
  UI.renderControls = function (...a) {
    const r = baseControls.apply(this, a);
    try { this.commandMenu(); } catch (e) { if (window.console) console.error('커맨드 메뉴', e); }
    // 메뉴를 다시 짠 뒤 안내 말풍선 위치를 새 배치에 맞춘다
    try { const pop = document.getElementById('coach-pop'); const n = pop && pop.querySelector('.coach'); if (n && this._coachLabel) this.coachPop(n, this.coachTarget(this._coachLabel), pop._key); } catch (e) { /* 무시 */ }
    later(); return r;
  };

  // ---------- 파판식 커맨드: 공격 · 스킬 · 방어 · 아이템 (스킬·아이템은 오른쪽 목록, 개수 제한 없이 넘기며 고름) ----------
  // 자동·배속·도주는 머리말 오른쪽 위 아이콘으로.
  const ICON = {
    speed: (x2) => `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 6l8 6-8 6z"/>${x2 ? '<path d="M12 6l8 6-8 6z"/>' : ''}</svg>`,
    auto: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v5h-5"/><text x="12" y="15.5" font-size="8" text-anchor="middle" fill="currentColor" stroke="none" font-weight="700">A</text></svg>',
    flee: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h5v16h-5"/><path d="M10 8l-4 4 4 4M6 12h9"/></svg>',
  };
  UI.commandMenu = function () {
    const c = this.ctx; const box = document.getElementById('cb-ctrl'); if (!c || !c.combat || !box) return;
    const cb = c.combat;
    // 오른쪽 위 도구 아이콘 (결과 화면에서는 숨김)
    const head = document.querySelector('#modal-box .cb-head');
    let tools = head && head.querySelector('.cb-tools');
    if (head && !tools) { head.insertAdjacentHTML('beforeend', '<div class="cb-tools"></div>'); tools = head.querySelector('.cb-tools'); }
    const sp = box.querySelector('[data-act=c-speed]'), au = box.querySelector('[data-act=c-auto]'), fl = box.querySelector('[data-act=c-flee]');
    if (tools) {
      tools.innerHTML = cb.result ? '' : `<button class="icon-btn ${(c.speed || 1) > 1 ? 'on' : ''}" data-act="c-speed" aria-label="전투 속도 ${(c.speed || 1) > 1 ? '2배' : '1배'}" title="배속">${ICON.speed((c.speed || 1) > 1)}<i>${(c.speed || 1) > 1 ? '2' : '1'}</i></button>
        <button class="icon-btn ${cb.auto ? 'on' : ''}" data-act="c-auto" aria-label="${cb.auto ? '자동 전투 끄기' : '자동 전투'}" title="자동">${ICON.auto}</button>
        ${fl ? `<button class="icon-btn danger" data-act="c-flee" aria-label="도주" title="도주" ${fl.disabled ? 'disabled' : ''}>${ICON.flee}</button>` : ''}`;
    }
    if (cb.result && !c.playing) return; // 결과 화면은 그대로. 마무리 연출 중(result + playing)에는 메뉴 모양을 유지한 채 잠근다
    for (const b of [sp, au, fl]) if (b) b.remove();
    const skillBox = box.querySelector(':scope > .skill-btns');
    const row = box.querySelector(':scope > .ctrl-row');
    if (!skillBox) return;
    const ready = cb.waiting && !c.playing && !cb.auto;
    const p = cb.player;
    // 아이템 칸: 조작 줄에 있던 것들(회복제·마나·가방·부적·한계 돌파 등 다른 기능이 넣은 것 포함)
    const itemBtns = row ? [...row.querySelectorAll('button')] : [];
    const bagRow = box.querySelector(':scope > .bag-row');
    const skillBtns = [...skillBox.querySelectorAll('.skill-btn')];
    const strike = skillBtns.find((b) => b.dataset.v === 'strike');
    const others = skillBtns.filter((b) => b !== strike);
    const cmd = c.cmd || null;
    const list = document.createElement('div'); list.className = 'cmd-list';
    if (cmd === 'skill') { if (others.length) others.forEach((b) => list.appendChild(b)); else list.innerHTML = '<div class="dim small">쓸 수 있는 스킬이 없다.</div>'; }
    else if (cmd === 'item') { itemBtns.forEach((b) => { b.classList.remove('sm'); b.classList.add('cmd-item'); list.appendChild(b); }); if (bagRow) [...bagRow.querySelectorAll('button')].forEach((b) => { b.classList.remove('sm'); b.classList.add('cmd-item'); list.appendChild(b); }); if (!list.children.length) list.innerHTML = '<div class="dim small">쓸 아이템이 없다.</div>'; }
    if (cmd) list.insertAdjacentHTML('afterbegin', `<div class="cmd-pop-head"><b>${cmd === 'skill' ? '스킬' : '아이템'}</b><button class="sm ghost" data-act="c-cmd" data-v="${cmd}" aria-label="닫기">닫기</button></div>`);
    const dis = (x) => (x ? '' : 'disabled');
    const atkSel = c.sel === 'strike';
    const main = `<div class="cmd-main">
      <button class="cmd ${atkSel ? 'sel' : ''}" data-act="c-skill" data-v="strike" ${dis(!cb.auto && !c.playing)}>공격</button>
      <button class="cmd ${cmd === 'skill' ? 'sel' : ''}" data-act="c-cmd" data-v="skill" ${dis(!cb.auto && !c.playing)}>스킬</button>
      <button class="cmd ${cmd === 'item' ? 'sel' : ''}" data-act="c-cmd" data-v="item" ${dis(!cb.auto && !c.playing)}>아이템</button>
      <button class="cmd" data-act="c-defend" ${dis(ready)}>방어</button></div>`;
    const wrap = document.createElement('div'); wrap.className = 'cmd-wrap'; wrap.innerHTML = main;
    // 스킬·아이템 목록은 명령 줄 위에 뜨는 팝업
    if (cmd) { list.classList.add('cmd-pop'); wrap.appendChild(list); }
    if (others.some((b) => b.classList.contains('ordered'))) { const sb = wrap.querySelector('[data-v=skill]'); if (sb) sb.classList.add('ordered'); }
    skillBox.replaceWith(wrap);
    if (row) row.remove(); if (bagRow) bagRow.remove();
    // 커맨드 외의 것(오더 패널·리더 오더·스킬 설명·안내)은 조작 영역 위에 떠 있게 → 조작 영역 높이가 절대 바뀌지 않는다
    const extra = [...box.children].filter((ch) => ch !== wrap && !ch.classList.contains('cmd-float'));
    if (extra.length) { const fl = document.createElement('div'); fl.className = 'cmd-float'; extra.forEach((ch) => fl.appendChild(ch)); box.insertBefore(fl, wrap); }
    if (cb.result) for (const b of box.querySelectorAll('button')) b.disabled = true;
    void p;
  };
  // 명령을 실행하면 다음 차례에는 첫 메뉴로
  const baseFire = UI.fireSkill;
  UI.fireSkill = function (...a) { if (this.ctx) this.ctx.cmd = null; return baseFire.apply(this, a); };

  // 방어: 다음 내 차례까지 받는 피해를 크게 줄이고 정신력을 조금 회복
  if (typeof Combat !== 'undefined' && !Combat.prototype.playerDefend) {
    Combat.prototype.playerDefend = function () {
      if (!this.waiting || this.result) return;
      const p = this.player;
      p.buffs.def = Math.max(p.buffs.def, 0.8); p.buffs.defT = Math.max(p.buffs.defT, 1);
      p.mp = Math.min(p.maxMp, p.mp + Math.round(p.maxMp * 0.05));
      this.buffEvent(p, '방어 태세. 다음 차례까지 받는 피해가 줄어든다.');
      this.endPlayerTurn();
    };
  }
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    const c = this.ctx;
    if (act === 'c-cmd' && c && c.combat) { c.cmd = c.cmd === v ? null : v; if (c.cmd !== 'skill') c.sel = c.sel === 'strike' ? 'strike' : null; return this.renderControls(); }
    if (act === 'c-defend' && c && c.combat) { c.sel = null; c.cmd = null; return this.combatAction((x) => x.playerDefend()); }
    if ((act === 'c-skill' || act === 'c-target' || act === 'c-ally') && c && c.combat) c.cmd = null; // 고르면 팝업 닫기
    if (act === 'c-item' && c) c.cmd = null;
    return baseHandle.call(this, act, v);
  };

  // 전투는 팝업이 아니라 화면 전체를 쓴다
  const baseModal = UI.modal;
  UI.modal = function (html, cls = '', ...a) {
    const r = baseModal.call(this, html, cls, ...a);
    const m = document.getElementById('modal'); if (m) m.classList.toggle('full', String(cls).includes('combat-box'));
    return r;
  };
  const baseClose = UI.closeModal;
  UI.closeModal = function (...a) { const m = document.getElementById('modal'); if (m) m.classList.remove('full'); return baseClose.apply(this, a); };

  // 소환수 등 유닛 수가 바뀌면 다시 맞춘다
  const baseRefresh = UI.refreshUnits;
  UI.refreshUnits = function (...a) {
    const r = baseRefresh.apply(this, a);
    const n = document.querySelectorAll('#stage .foe, #stage .ally').length;
    if (n !== this._fitN) { this._fitN = n; later(); }
    return r;
  };
  window.addEventListener('resize', later);
}
